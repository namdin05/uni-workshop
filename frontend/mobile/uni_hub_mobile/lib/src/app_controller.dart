import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

import 'models.dart';
import 'services.dart';

class AppController extends ChangeNotifier {
  AppController({
    required this.apiClient,
    required this.sessionStore,
    required this.localDatabase,
  }) : repository = CheckinRepository(
          apiClient: apiClient,
          localDatabase: localDatabase,
          sessionStore: sessionStore,
        );

  final ApiClient apiClient;
  final SessionStore sessionStore;
  final LocalDatabase localDatabase;
  final CheckinRepository repository;

  AuthSession? session;
  List<WorkshopSummary> workshops = [];
  List<WorkshopSummary> downloadedWorkshops = [];
  List<PendingScanItem> pendingScans = [];
  List<PendingScanItem> failedScans = [];
  bool loading = true;
  bool syncing = false;
  bool online = true;
  String? message;
  ScanOutcome? lastScan;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  bool get bootstrapping => loading;
  bool get isOrganizer => session?.profile.role == 'organizer';

  Future<void> bootstrap() async {
    loading = true;
    notifyListeners();

    online = await repository.hasInternetConnection();
    session = await repository.restoreSession();

    if (session != null && session!.profile.role != 'organizer') {
      message = 'Chỉ organizer mới được phép truy cập';
      await logout();
      loading = false;
      notifyListeners();
      return;
    }

    if (session != null) {
      try {
        await refreshRemoteWorkshops();
      } catch (_) {
        message = 'Không tải được workshop từ server, đang dùng dữ liệu cục bộ.';
      }

      await _loadLocalState();
      _watchConnectivity();
    }

    loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    message = null;
    loading = true;
    notifyListeners();

    try {
      final loggedInSession = await repository.login(email, password);
      session = loggedInSession;
      try {
        await refreshRemoteWorkshops();
      } catch (_) {
        message = 'Đăng nhập thành công nhưng chưa tải được danh sách workshop.';
      }
      await _loadLocalState();
      _watchConnectivity();
    } catch (error) {
      message = error.toString().replaceFirst('Exception: ', '');
      throw ApiException(message!);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _connectivitySubscription?.cancel();
    _connectivitySubscription = null;
    await repository.clearSession();
    session = null;
    workshops = [];
    downloadedWorkshops = [];
    pendingScans = [];
    failedScans = [];
    lastScan = null;
    notifyListeners();
  }

  Future<void> refreshData() async {
    await refreshRemoteWorkshops();
    await _loadLocalState();
  }

  Future<void> refreshRemoteWorkshops() async {
    try {
      workshops = await repository.fetchWorkshops();
      message = null;
      notifyListeners();
    } catch (error) {
      message = error.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    }
  }

  Future<String> downloadWorkshop(WorkshopSummary workshop) async {
    if (session == null) {
      throw ApiException('Vui lòng đăng nhập lại.');
    }
    message = null;
    notifyListeners();

    try {
      await repository.downloadWorkshop(session!, workshop);
      await _loadLocalState();
      return 'Đã tải ${workshop.title} xuống thiết bị.';
    } catch (error) {
      message = error.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      throw ApiException(message!);
    }
  }

  Future<ScanOutcome> scanQr(String qrCode) async {
    message = null;
    final outcome = await repository.scanQr(qrCode.trim());
    lastScan = outcome;
    await _loadLocalState();
    notifyListeners();

    if (outcome.isSuccess) {
      unawaited(syncPending());
    }

    return outcome;
  }

  Future<void> syncPending() async {
    if (session == null || syncing) {
      return;
    }

    final internet = await repository.hasInternetConnection();
    if (!internet) {
      return;
    }

    syncing = true;
    message = null;
    notifyListeners();

    try {
      for (var attempt = 0; attempt < 5; attempt++) {
        try {
          await repository.syncPendingScans(session!);
          break;
        } catch (error) {
          if (attempt == 4) {
            rethrow;
          }

          await Future<void>.delayed(Duration(seconds: 1 << attempt));
        }
      }
      await _loadLocalState();
    } catch (error) {
      message = error.toString().replaceFirst('Exception: ', '');
    } finally {
      syncing = false;
      notifyListeners();
    }
  }

  Future<void> retryFailedScans() async {
    if (session == null) {
      return;
    }

    await repository.resetFailedScans();
    await syncPending();
    await _loadLocalState();
    notifyListeners();
  }

  Future<void> _loadLocalState() async {
    downloadedWorkshops = await localDatabase.getWorkshops();
    pendingScans = await repository.pendingScans();
    failedScans = await repository.failedScans();
  }

  void _watchConnectivity() {
    _connectivitySubscription?.cancel();
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((results) {
      online = results.any((result) => result != ConnectivityResult.none);
      if (online) {
        unawaited(syncPending());
      }
      notifyListeners();
    });
  }
}