import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import 'models.dart';

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => 'Exception: $message';
}

String resolveApiBaseUrl() {
  const dartDefineBase = String.fromEnvironment('API_BASE_URL');
  if (dartDefineBase.isNotEmpty) {
    return dartDefineBase;
  }

  if (Platform.isAndroid) {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

class ApiClient {
  ApiClient({String? baseUrl}) : baseUrl = baseUrl ?? resolveApiBaseUrl();

  final String baseUrl;

  Future<Map<String, dynamic>> _request(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    String? token,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http
        .post(
          uri,
          headers: {
            if (token != null) 'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode(body ?? <String, dynamic>{}),
        )
        .timeout(const Duration(seconds: 15));

    http.Response effectiveResponse = response;

    if (method == 'GET') {
      effectiveResponse = await http
          .get(
            uri,
            headers: {
              if (token != null) 'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 15));
    }

    final decoded = jsonDecode(effectiveResponse.body);
    if (effectiveResponse.statusCode >= 400) {
      throw Exception(decoded is Map && decoded['message'] != null ? decoded['message'].toString() : 'Yêu cầu không thành công');
    }

    return Map<String, dynamic>.from(decoded as Map);
  }

  Future<AuthSession> login(String email, String password) async {
    final data = await _request(
      '/api/auth/login',
      method: 'POST',
      body: {'email': email, 'password': password},
    );
    return AuthSession.fromJson(data);
  }

  Future<OrganizerProfile> fetchProfile(String token) async {
    final data = await _request('/api/user/profile', method: 'GET', token: token);
    return OrganizerProfile.fromJson(Map<String, dynamic>.from(data['profile'] as Map));
  }

  Future<List<WorkshopSummary>> fetchWorkshops() async {
    final data = await _request('/api/workshops', method: 'GET');
    final workshops = (data['workshops'] as List? ?? const []).cast<dynamic>();
    return workshops.map((item) => WorkshopSummary.fromJson(Map<String, dynamic>.from(item as Map))).toList();
  }

  Future<Map<String, dynamic>> fetchWorkshopManifest(String token, int workshopId) async {
    return _request('/api/checkin/workshops/$workshopId/manifest', method: 'GET', token: token);
  }

  Future<Map<String, dynamic>> syncCheckins(String token, int workshopId, List<Map<String, dynamic>> scans) async {
    return _request(
      '/api/checkin/sync',
      method: 'POST',
      token: token,
      body: {'workshopId': workshopId, 'scans': scans},
    );
  }
}

class SessionStore {
  static const _storageKey = 'unihub-mobile-session';

  Future<AuthSession?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    return AuthSession.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
  }

  Future<void> save(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(session.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
}

class LocalDatabase {
  static const _databaseName = 'uni_hub_mobile.db';

  Database? _database;

  Future<Database> get database async {
    if (_database != null) {
      return _database!;
    }

    final documentsDirectory = await getApplicationDocumentsDirectory();
    final dbPath = path.join(documentsDirectory.path, _databaseName);

    _database = await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE workshops_cache (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            speaker_name TEXT NOT NULL,
            room_name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            available_seats INTEGER NOT NULL,
            total_seats INTEGER NOT NULL,
            is_free INTEGER NOT NULL,
            status TEXT NOT NULL,
            price REAL NOT NULL,
            downloaded_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE registrations_cache (
            registration_id INTEGER PRIMARY KEY,
            workshop_id INTEGER NOT NULL,
            workshop_title TEXT NOT NULL,
            qr_code TEXT NOT NULL UNIQUE,
            student_name TEXT NOT NULL,
            student_id TEXT,
            student_email TEXT,
            status TEXT NOT NULL,
            checked_in_at TEXT,
            offline_synced INTEGER NOT NULL DEFAULT 0,
            scanned_at TEXT,
            sync_state TEXT NOT NULL DEFAULT 'pending',
            retry_count INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            created_at TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE pending_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registration_id INTEGER NOT NULL UNIQUE,
            workshop_id INTEGER NOT NULL,
            workshop_title TEXT NOT NULL,
            qr_code TEXT NOT NULL,
            student_name TEXT NOT NULL,
            scanned_at TEXT NOT NULL,
            sync_state TEXT NOT NULL DEFAULT 'pending',
            retry_count INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            created_at TEXT NOT NULL
          )
        ''');
      },
    );

    return _database!;
  }

  Future<void> saveManifest(WorkshopSummary workshop, List<ManifestRegistration> registrations) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.insert(
        'workshops_cache',
        {
          ...workshop.toCacheJson(),
          'downloaded_at': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      for (final registration in registrations) {
        await txn.insert(
          'registrations_cache',
          {
            'registration_id': registration.registrationId,
            'workshop_id': registration.workshopId,
            'workshop_title': workshop.title,
            'qr_code': registration.qrCode,
            'student_name': registration.studentName,
            'student_id': registration.studentId,
            'student_email': registration.studentEmail,
            'status': registration.status,
            'checked_in_at': registration.checkedInAt?.toIso8601String(),
            'offline_synced': registration.offlineSynced ? 1 : 0,
            'scanned_at': null,
            'sync_state': registration.offlineSynced ? 'synced' : 'pending',
            'retry_count': 0,
            'last_error': null,
            'created_at': DateTime.now().toIso8601String(),
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<List<WorkshopSummary>> getWorkshops() async {
    final db = await database;
    final rows = await db.query('workshops_cache', orderBy: 'downloaded_at DESC');
    return rows
        .map(
          (row) => WorkshopSummary(
            id: (row['id'] as num).toInt(),
            title: row['title'].toString(),
            description: row['description']?.toString(),
            speakerName: row['speaker_name'].toString(),
            roomName: row['room_name'].toString(),
            startTime: DateTime.parse(row['start_time'].toString()),
            endTime: DateTime.parse(row['end_time'].toString()),
            availableSeats: (row['available_seats'] as num).toInt(),
            totalSeats: (row['total_seats'] as num).toInt(),
            isFree: row['is_free'] == 1,
            status: row['status'].toString(),
            price: (row['price'] as num).toDouble(),
          ),
        )
        .toList();
  }

  Future<int> workshopRegistrationCount(int workshopId) async {
    final db = await database;
    final result = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM registrations_cache WHERE workshop_id = ?', [workshopId]));
    return result ?? 0;
  }

  Future<void> deleteManifest(int workshopId) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete('workshops_cache', where: 'id = ?', whereArgs: [workshopId]);
      await txn.delete('registrations_cache', where: 'workshop_id = ?', whereArgs: [workshopId]);
      await txn.delete('pending_scans', where: 'workshop_id = ?', whereArgs: [workshopId]);
    });
  }

  Future<ManifestRegistration?> findRegistrationByQr(String qrCode) async {
    final db = await database;
    final rows = await db.query('registrations_cache', where: 'qr_code = ?', whereArgs: [qrCode], limit: 1);
    if (rows.isEmpty) {
      return null;
    }

    final row = rows.first;
    return ManifestRegistration(
      registrationId: (row['registration_id'] as num).toInt(),
      workshopId: (row['workshop_id'] as num).toInt(),
      workshopTitle: row['workshop_title'].toString(),
      qrCode: row['qr_code'].toString(),
      studentName: row['student_name'].toString(),
      studentId: row['student_id']?.toString(),
      studentEmail: row['student_email']?.toString(),
      status: row['status'].toString(),
      checkedInAt: row['checked_in_at'] == null ? null : DateTime.parse(row['checked_in_at'].toString()),
      offlineSynced: row['offline_synced'] == 1,
    );
  }

  Future<ScanOutcome> recordLocalScan(String qrCode) async {
    final registration = await findRegistrationByQr(qrCode);
    if (registration == null) {
      return ScanOutcome.invalid('QR code không tồn tại trong danh sách đã tải về');
    }

    if (registration.status == 'checked_in') {
      return ScanOutcome.duplicate('Sinh viên này đã được check-in trên thiết bị này', registration);
    }

    final db = await database;
    final scannedAt = DateTime.now().toUtc();
    await db.transaction((txn) async {
      await txn.update(
        'registrations_cache',
        {
          'status': 'checked_in',
          'checked_in_at': scannedAt.toIso8601String(),
          'offline_synced': 0,
          'scanned_at': scannedAt.toIso8601String(),
          'sync_state': 'pending',
          'retry_count': 0,
          'last_error': null,
        },
        where: 'registration_id = ?',
        whereArgs: [registration.registrationId],
      );

      await txn.insert(
        'pending_scans',
        {
          'registration_id': registration.registrationId,
          'workshop_id': registration.workshopId,
          'workshop_title': registration.workshopTitle,
          'qr_code': registration.qrCode,
          'student_name': registration.studentName,
          'scanned_at': scannedAt.toIso8601String(),
          'sync_state': 'pending',
          'retry_count': 0,
          'last_error': null,
          'created_at': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    });

    return ScanOutcome.success(registration.copyWith(status: 'checked_in', checkedInAt: scannedAt, offlineSynced: false));
  }

  Future<List<PendingScanItem>> pendingScans() async {
    final db = await database;
    final rows = await db.query(
      'pending_scans',
      where: "sync_state IN ('pending', 'retrying')",
      orderBy: 'scanned_at ASC',
    );
    return rows.map((row) => PendingScanItem.fromJson(row)).toList();
  }

  Future<List<PendingScanItem>> failedScans() async {
    final db = await database;
    final rows = await db.query(
      'pending_scans',
      where: "sync_state = 'failed'",
      orderBy: 'scanned_at ASC',
    );
    return rows.map((row) => PendingScanItem.fromJson(row)).toList();
  }

  Future<void> deletePendingScan(int registrationId) async {
    final db = await database;
    await db.delete('pending_scans', where: 'registration_id = ?', whereArgs: [registrationId]);
  }

  Future<void> markPendingScanFailed(int registrationId, String errorMessage) async {
    final db = await database;
    await db.update(
      'pending_scans',
      {
        'sync_state': 'failed',
        'last_error': errorMessage,
        'retry_count': (await _retryCount(registrationId)) + 1,
      },
      where: 'registration_id = ?',
      whereArgs: [registrationId],
    );
  }

  Future<int> _retryCount(int registrationId) async {
    final db = await database;
    final rows = await db.query('pending_scans', columns: ['retry_count'], where: 'registration_id = ?', whereArgs: [registrationId], limit: 1);
    if (rows.isEmpty) {
      return 0;
    }

    return (rows.first['retry_count'] as num).toInt();
  }

  Future<void> markSynced({
    required PendingScanItem item,
    required DateTime? checkedInAt,
  }) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.update(
        'registrations_cache',
        {
          'status': 'checked_in',
          'checked_in_at': checkedInAt?.toIso8601String() ?? item.scannedAt.toIso8601String(),
          'offline_synced': 1,
          'sync_state': 'synced',
          'last_error': null,
        },
        where: 'registration_id = ?',
        whereArgs: [item.registrationId],
      );

      await txn.delete('pending_scans', where: 'registration_id = ?', whereArgs: [item.registrationId]);
    });
  }

  Future<void> markPermanentFailure(PendingScanItem item, String errorMessage) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.update(
        'registrations_cache',
        {
          'sync_state': 'failed',
          'last_error': errorMessage,
          'retry_count': item.retryCount + 1,
        },
        where: 'registration_id = ?',
        whereArgs: [item.registrationId],
      );

      await txn.update(
        'pending_scans',
        {
          'sync_state': 'failed',
          'last_error': errorMessage,
          'retry_count': item.retryCount + 1,
        },
        where: 'registration_id = ?',
        whereArgs: [item.registrationId],
      );
    });
  }

  Future<void> resetFailedScans() async {
    final db = await database;
    await db.update(
      'pending_scans',
      {
        'sync_state': 'pending',
        'last_error': null,
      },
      where: "sync_state = 'failed'",
    );
  }
}

class CheckinRepository {
  CheckinRepository({
    required this.apiClient,
    required this.localDatabase,
    required this.sessionStore,
  });

  final ApiClient apiClient;
  final LocalDatabase localDatabase;
  final SessionStore sessionStore;
  final _uuid = const Uuid();

  Future<AuthSession> login(String email, String password) async {
    final session = await apiClient.login(email, password);
    if (session.profile.role != 'staff') {
      throw Exception('Chỉ staff mới được phép vào ứng dụng này');
    }

    await sessionStore.save(session);
    return session;
  }

  Future<AuthSession?> restoreSession() => sessionStore.load();

  Future<void> clearSession() => sessionStore.clear();

  Future<List<WorkshopSummary>> fetchWorkshops() => apiClient.fetchWorkshops();

  Future<int> workshopRegistrationCount(int workshopId) => localDatabase.workshopRegistrationCount(workshopId);

  Future<void> deleteManifest(int workshopId) => localDatabase.deleteManifest(workshopId);

  Future<WorkshopSummary> downloadWorkshop(AuthSession session, WorkshopSummary workshop) async {
    final payload = await apiClient.fetchWorkshopManifest(session.token, workshop.id);
    final workshopJson = Map<String, dynamic>.from(payload['workshop'] as Map);
    final registrationsJson = (payload['registrations'] as List? ?? const []).cast<dynamic>();

    final savedWorkshop = WorkshopSummary.fromJson(workshopJson);
    final registrations = registrationsJson.map((item) => ManifestRegistration.fromJson(Map<String, dynamic>.from(item as Map))).toList();
    await localDatabase.saveManifest(savedWorkshop, registrations);
    return savedWorkshop;
  }

  Future<ScanOutcome> scanQr(String qrCode) => localDatabase.recordLocalScan(qrCode);

  Future<List<PendingScanItem>> pendingScans() => localDatabase.pendingScans();

  Future<List<PendingScanItem>> failedScans() => localDatabase.failedScans();

  Future<void> resetFailedScans() => localDatabase.resetFailedScans();

  Future<void> syncPendingScans(AuthSession session) async {
    final scans = await localDatabase.pendingScans();
    if (scans.isEmpty) {
      return;
    }

    final grouped = <int, List<PendingScanItem>>{};
    for (final scan in scans) {
      grouped.putIfAbsent(scan.workshopId, () => <PendingScanItem>[]).add(scan);
    }

    for (final entry in grouped.entries) {
      final workshopId = entry.key;
      final items = entry.value..sort((left, right) => left.scannedAt.compareTo(right.scannedAt));
      final response = await apiClient.syncCheckins(
        session.token,
        workshopId,
        items
            .map(
              (item) => {
                'registrationId': item.registrationId,
                'qrCode': item.qrCode,
                'scannedAt': item.scannedAt.toIso8601String(),
                'deviceId': _uuid.v4(),
              },
            )
            .toList(),
      );

      final results = (response['results'] as List? ?? const []).cast<dynamic>();
      final byRegistrationId = {
        for (final item in items) item.registrationId: item,
      };

      for (final itemJson in results) {
        final itemMap = Map<String, dynamic>.from(itemJson as Map);
        final registrationId = (itemMap['registrationId'] as num?)?.toInt();
        final status = itemMap['status']?.toString() ?? 'error';
        final checkedInAt = itemMap['checkedInAt'] == null ? null : DateTime.tryParse(itemMap['checkedInAt'].toString());
        final item = registrationId == null ? null : byRegistrationId[registrationId];
        if (item == null) {
          continue;
        }

        if (status == 'checked_in' || status == 'duplicate' || status == 'synced_with_warning') {
          await localDatabase.markSynced(item: item, checkedInAt: checkedInAt);
        } else {
          await localDatabase.markPermanentFailure(item, itemMap['message']?.toString() ?? 'Đồng bộ thất bại');
        }
      }
    }
  }

  Future<bool> hasInternetConnection() async {
    final results = await Connectivity().checkConnectivity();
    return results.any((result) => result != ConnectivityResult.none);
  }
}