import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import 'app_controller.dart';
import 'models.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Đang khởi tạo UniHub Mobile'),
          ],
        ),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _error = null);

    try {
      await context.read<AppController>().login(
            _emailController.text.trim(),
            _passwordController.text,
          );
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF003366), Color(0xFFF3F7FB)],
            stops: [0.0, 1.0],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Card(
                  elevation: 16,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Icon(Icons.qr_code_scanner, size: 64, color: Color(0xFF003366)),
                          const SizedBox(height: 16),
                          const Text(
                            'UniHub Staff Check-in',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Chỉ staff được phép đăng nhập. Dữ liệu check-in được lưu cục bộ rồi đồng bộ khi có mạng.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey.shade700),
                          ),
                          const SizedBox(height: 24),
                          if (controller.message != null) ...[
                            _InfoBanner(message: controller.message!),
                            const SizedBox(height: 12),
                          ],
                          if (_error != null) ...[
                            _ErrorBanner(message: _error!),
                            const SizedBox(height: 12),
                          ],
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email staff',
                              prefixIcon: Icon(Icons.alternate_email),
                            ),
                            validator: (value) => value == null || value.trim().isEmpty ? 'Nhập email' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Mật khẩu',
                              prefixIcon: Icon(Icons.lock_outline),
                            ),
                            validator: (value) => value == null || value.isEmpty ? 'Nhập mật khẩu' : null,
                          ),
                          const SizedBox(height: 24),
                          FilledButton(
                            onPressed: controller.loading ? null : _submit,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              child: controller.loading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2.5),
                                    )
                                  : const Text('Đăng nhập'),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _StatusChip(label: controller.online ? 'Online' : 'Offline', color: controller.online ? Colors.green : Colors.orange),
                              const _StatusChip(label: 'SQLite local', color: Colors.blue),
                              const _StatusChip(label: 'Auto sync', color: Colors.indigo),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = const [
      WorkshopsScreen(),
      ScannerScreen(),
      QueueScreen(),
      ProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('UniHub Mobile'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Consumer<AppController>(
                builder: (context, controller, _) => _StatusChip(
                  label: controller.online ? 'Online' : 'Offline',
                  color: controller.online ? Colors.green : Colors.orange,
                ),
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.view_list_outlined), selectedIcon: Icon(Icons.view_list), label: 'Workshops'),
          NavigationDestination(icon: Icon(Icons.qr_code_scanner_outlined), selectedIcon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
          NavigationDestination(icon: Icon(Icons.sync_outlined), selectedIcon: Icon(Icons.sync), label: 'Queue'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class WorkshopsScreen extends StatelessWidget {
  const WorkshopsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();

    return RefreshIndicator(
      onRefresh: controller.refreshRemoteWorkshops,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _HeaderCard(
            title: 'Download workshop roster',
            subtitle: 'Tải danh sách sinh viên đã đăng ký về SQLite để quét offline tức thì.',
            icon: Icons.cloud_download_outlined,
            accentColor: const Color(0xFF003366),
          ),
          const SizedBox(height: 16),
          if (controller.workshops.isEmpty)
            const Card(child: Padding(padding: EdgeInsets.all(24), child: Text('Không có workshop nào.')))
          else
            ...controller.workshops.map((workshop) {
              final downloaded = controller.downloadedWorkshops.any((item) => item.id == workshop.id);
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(workshop.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 6),
                                  Text('${workshop.speakerName} • ${workshop.roomName}'),
                                  Text('${workshop.dateLabel} • ${workshop.timeLabel}'),
                                ],
                              ),
                            ),
                            _StatusChip(label: downloaded ? 'Downloaded' : '${workshop.availableSeats} seats', color: downloaded ? Colors.green : Colors.blue),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(workshop.description ?? 'No description', maxLines: 2, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Text(workshop.isFree ? 'Free' : '\$${workshop.price.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                            const Spacer(),
                            FilledButton.icon(
                              onPressed: downloaded
                                  ? null
                                  : () async {
                                      final messenger = ScaffoldMessenger.of(context);
                                      try {
                                          final message = await context.read<AppController>().downloadWorkshop(workshop);
                                          messenger.showSnackBar(SnackBar(content: Text(message)));
                                      } catch (error) {
                                        messenger.showSnackBar(SnackBar(content: Text(error.toString())));
                                      }
                                    },
                              icon: const Icon(Icons.download),
                              label: Text(downloaded ? 'Đã tải' : 'Tải manifest'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);
  final TextEditingController _manualController = TextEditingController();
  bool _handlingScan = false;
  ScanOutcome? _lastOutcome;

  @override
  void dispose() {
    _manualController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _handleQr(String value) async {
    if (_handlingScan) {
      return;
    }

    setState(() => _handlingScan = true);
    try {
      final outcome = await context.read<AppController>().scanQr(value);
      if (mounted) {
        setState(() => _lastOutcome = outcome);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _lastOutcome = ScanOutcome.invalid(error.toString()));
      }
    } finally {
      if (mounted) {
        setState(() => _handlingScan = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _HeaderCard(
          title: 'Scan QR check-in',
          subtitle: 'Quét trực tiếp bằng camera hoặc nhập tay để test. QR được đối chiếu với SQLite local trước, rồi đồng bộ khi có mạng.',
          icon: Icons.qr_code_scanner,
          accentColor: const Color(0xFF5B4A00),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Camera scanner', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                AspectRatio(
                  aspectRatio: 1,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: MobileScanner(
                      controller: _scannerController,
                      onDetect: (capture) {
                        if (capture.barcodes.isEmpty) return;
                        final raw = capture.barcodes.first.rawValue;
                        if (raw != null && raw.isNotEmpty) {
                          unawaited(_handleQr(raw));
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _manualController,
                        decoration: const InputDecoration(
                          labelText: 'Nhập QR thủ công',
                          prefixIcon: Icon(Icons.edit_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    FilledButton(
                      onPressed: () => _handleQr(_manualController.text),
                      child: const Text('Check-in'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_lastOutcome != null) _OutcomeCard(outcome: _lastOutcome!),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Local queue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text('Pending: ${controller.pendingScans.length} • Failed: ${controller.failedScans.length}'),
                const SizedBox(height: 8),
                Text(controller.online ? 'Mạng đang sẵn sàng để đồng bộ tự động.' : 'Đang offline, dữ liệu sẽ chờ đồng bộ.'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class QueueScreen extends StatelessWidget {
  const QueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _HeaderCard(
          title: 'Offline sync queue',
          subtitle: 'Dữ liệu quét chưa đồng bộ được giữ trong SQLite và tự thử lại khi có mạng.',
          icon: Icons.sync,
          accentColor: const Color(0xFF0B6B3A),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _MetricCard(label: 'Pending', value: controller.pendingScans.length.toString(), color: Colors.orange)),
            const SizedBox(width: 12),
            Expanded(child: _MetricCard(label: 'Failed', value: controller.failedScans.length.toString(), color: Colors.red)),
            const SizedBox(width: 12),
            Expanded(child: _MetricCard(label: 'Downloaded', value: controller.downloadedWorkshops.length.toString(), color: Colors.blue)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: controller.syncing
                    ? null
                    : () async {
                        final messenger = ScaffoldMessenger.of(context);
                        try {
                          await context.read<AppController>().syncPending();
                          messenger.showSnackBar(const SnackBar(content: Text('Đồng bộ hàng chờ hoàn tất.')));
                        } catch (error) {
                          messenger.showSnackBar(SnackBar(content: Text(error.toString())));
                        }
                      },
                icon: controller.syncing
                    ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.sync),
                label: const Text('Sync now'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: controller.failedScans.isEmpty
                    ? null
                    : () async {
                        await context.read<AppController>().retryFailedScans();
                      },
                icon: const Icon(Icons.refresh),
                label: const Text('Retry failed'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text('Pending scans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        if (controller.pendingScans.isEmpty)
          const Card(child: Padding(padding: EdgeInsets.all(24), child: Text('Chưa có dữ liệu chờ đồng bộ.')))
        else
          ...controller.pendingScans.map((scan) => _PendingScanTile(scan: scan, color: Colors.orange)),
        const SizedBox(height: 16),
        const Text('Failed scans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        if (controller.failedScans.isEmpty)
          const Card(child: Padding(padding: EdgeInsets.all(24), child: Text('Không có lỗi đồng bộ.')))
        else
          ...controller.failedScans.map((scan) => _PendingScanTile(scan: scan, color: Colors.red)),
      ],
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();
    final profile = controller.session!.profile;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _HeaderCard(
          title: 'Staff profile',
          subtitle: 'Ứng dụng chỉ dành cho role staff. Mọi check-in đều được lưu cục bộ trước khi đồng bộ.',
          icon: Icons.badge_outlined,
          accentColor: const Color(0xFF003366),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.fullName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(profile.email),
                if (profile.studentId != null) Text('ID: ${profile.studentId}'),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _StatusChip(label: 'Role: ${profile.role}', color: Colors.indigo),
                    _StatusChip(label: controller.online ? 'Connected' : 'Disconnected', color: controller.online ? Colors.green : Colors.orange),
                    _StatusChip(label: 'Device queue: ${controller.pendingScans.length}', color: Colors.blue),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Build info', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text('API base: ${context.read<AppController>().apiClient.baseUrl}'),
                const SizedBox(height: 4),
                Text('Downloaded workshops: ${controller.downloadedWorkshops.length}'),
                const SizedBox(height: 4),
                Text('Pending sync: ${controller.pendingScans.length}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () => context.read<AppController>().logout(),
          icon: const Icon(Icons.logout),
          label: const Text('Logout'),
        ),
      ],
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.title, required this.subtitle, required this.icon, required this.accentColor});

  final String title;
  final String subtitle;
  final IconData icon;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [accentColor, accentColor.withOpacity(0.85)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white.withOpacity(0.15),
            child: Icon(icon, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(subtitle, style: TextStyle(color: Colors.white.withOpacity(0.85), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
      backgroundColor: color,
      side: BorderSide.none,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 4),
          Text(label),
        ],
      ),
    );
  }
}

class _PendingScanTile extends StatelessWidget {
  const _PendingScanTile({required this.scan, required this.color});

  final PendingScan scan;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Card(
        child: ListTile(
          leading: CircleAvatar(backgroundColor: color.withOpacity(0.15), child: Icon(Icons.qr_code, color: color)),
          title: Text(scan.studentName),
          subtitle: Text('${scan.workshopTitle}\n${DateFormat('HH:mm:ss').format(scan.scannedAt)} • ${scan.qrCode}'),
          isThreeLine: true,
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(scan.syncState.toUpperCase(), style: TextStyle(color: color, fontWeight: FontWeight.w700)),
              if (scan.lastError != null)
                SizedBox(
                  width: 120,
                  child: Text(scan.lastError!, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.right),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OutcomeCard extends StatelessWidget {
  const _OutcomeCard({required this.outcome});

  final ScanOutcome outcome;

  @override
  Widget build(BuildContext context) {
    final isSuccess = outcome.isSuccess;
    final color = isSuccess ? Colors.green : outcome.isDuplicate ? Colors.orange : Colors.red;

    return Card(
      color: color.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: color,
              child: Icon(isSuccess ? Icons.check : outcome.isDuplicate ? Icons.info_outline : Icons.error_outline, color: Colors.white),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(outcome.message, style: const TextStyle(fontWeight: FontWeight.w700)),
                  if (outcome.registration != null) ...[
                    const SizedBox(height: 4),
                    Text('${outcome.registration!.studentName} • ${outcome.registration!.workshopTitle}'),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.withOpacity(0.18)),
      ),
      child: Text(message, style: const TextStyle(color: Color(0xFF0F172A))),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.withOpacity(0.18)),
      ),
      child: Text(message, style: const TextStyle(color: Color(0xFFB42318))),
    );
  }
}