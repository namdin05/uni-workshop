class OrganizerProfile {
  const OrganizerProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.studentId,
  });

  final int id;
  final String email;
  final String fullName;
  final String role;
  final String? studentId;

  factory OrganizerProfile.fromJson(Map<String, dynamic> json) {
    return OrganizerProfile(
      id: (json['id'] as num).toInt(),
      email: json['email']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? '',
      role: json['role']?.toString() ?? 'student',
      studentId: json['student_id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role,
        'student_id': studentId,
      };
}

class AuthSession {
  const AuthSession({required this.token, required this.profile});

  final String token;
  final OrganizerProfile profile;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: json['token']?.toString() ?? '',
      profile: OrganizerProfile.fromJson(Map<String, dynamic>.from(json['profile'] as Map)),
    );
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'profile': profile.toJson(),
      };
}

class WorkshopSummary {
  const WorkshopSummary({
    required this.id,
    required this.title,
    required this.speakerName,
    required this.roomName,
    required this.startTime,
    required this.endTime,
    required this.availableSeats,
    required this.totalSeats,
    required this.isFree,
    required this.status,
    this.description,
    this.price = 0,
  });

  final int id;
  final String title;
  final String speakerName;
  final String roomName;
  final DateTime startTime;
  final DateTime endTime;
  final int availableSeats;
  final int totalSeats;
  final bool isFree;
  final String status;
  final String? description;
  final double price;

  String get dateLabel => '${startTime.day.toString().padLeft(2, '0')}/${startTime.month.toString().padLeft(2, '0')}/${startTime.year}';

  String get timeLabel => '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')} - ${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}';

  factory WorkshopSummary.fromJson(Map<String, dynamic> json) {
    final rooms = json['rooms'];
    final roomName = rooms is Map ? rooms['name']?.toString() : null;

    return WorkshopSummary(
      id: (json['id'] as num).toInt(),
      title: json['title']?.toString() ?? '',
      speakerName: json['speaker_name']?.toString() ?? 'TBA',
      roomName: roomName ?? 'Room TBA',
      startTime: DateTime.parse(json['start_time'].toString()),
      endTime: DateTime.parse(json['end_time'].toString()),
      availableSeats: (json['available_seats'] as num?)?.toInt() ?? 0,
      totalSeats: (json['total_seats'] as num?)?.toInt() ?? 0,
      isFree: json['is_free'] == true,
      status: json['status']?.toString() ?? 'draft',
      description: json['description']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'title': title,
        'speaker_name': speakerName,
        'room_name': roomName,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime.toIso8601String(),
        'available_seats': availableSeats,
        'total_seats': totalSeats,
        'is_free': isFree ? 1 : 0,
        'status': status,
        'description': description,
        'price': price,
      };
}

class ManifestRegistration {
  const ManifestRegistration({
    required this.registrationId,
    required this.workshopId,
    required this.workshopTitle,
    required this.qrCode,
    required this.studentName,
    required this.status,
    this.studentId,
    this.studentEmail,
    this.checkedInAt,
    this.offlineSynced = false,
  });

  final int registrationId;
  final int workshopId;
  final String workshopTitle;
  final String qrCode;
  final String studentName;
  final String status;
  final String? studentId;
  final String? studentEmail;
  final DateTime? checkedInAt;
  final bool offlineSynced;

  factory ManifestRegistration.fromJson(Map<String, dynamic> json) {
    final user = json['users'];
    final userMap = user is Map ? Map<String, dynamic>.from(user) : <String, dynamic>{};

    return ManifestRegistration(
      registrationId: (json['id'] as num).toInt(),
      workshopId: (json['workshop_id'] as num).toInt(),
      workshopTitle: json['workshop_title']?.toString() ?? 'Workshop #${(json['workshop_id'] as num).toInt()}',
      qrCode: json['qr_code']?.toString() ?? '',
      studentName: userMap['full_name']?.toString() ?? 'Student',
      studentId: userMap['student_id']?.toString(),
      studentEmail: userMap['email']?.toString(),
      status: json['status']?.toString() ?? 'confirmed',
      checkedInAt: json['checked_in_at'] == null ? null : DateTime.tryParse(json['checked_in_at'].toString()),
      offlineSynced: json['offline_synced'] == true || json['offline_synced'] == 1,
    );
  }

  ManifestRegistration copyWith({
    String? status,
    DateTime? checkedInAt,
    bool? offlineSynced,
  }) {
    return ManifestRegistration(
      registrationId: registrationId,
      workshopId: workshopId,
      workshopTitle: workshopTitle,
      qrCode: qrCode,
      studentName: studentName,
      studentId: studentId,
      studentEmail: studentEmail,
      status: status ?? this.status,
      checkedInAt: checkedInAt ?? this.checkedInAt,
      offlineSynced: offlineSynced ?? this.offlineSynced,
    );
  }
}

class PendingScanItem {
  const PendingScanItem({
    required this.id,
    required this.registrationId,
    required this.workshopId,
    required this.workshopTitle,
    required this.qrCode,
    required this.studentName,
    required this.scannedAt,
    required this.syncState,
    required this.retryCount,
    this.lastError,
  });

  final int id;
  final int registrationId;
  final int workshopId;
  final String workshopTitle;
  final String qrCode;
  final String studentName;
  final DateTime scannedAt;
  final String syncState;
  final int retryCount;
  final String? lastError;

  factory PendingScanItem.fromJson(Map<String, dynamic> json) {
    return PendingScanItem(
      id: (json['id'] as num).toInt(),
      registrationId: (json['registration_id'] as num).toInt(),
      workshopId: (json['workshop_id'] as num).toInt(),
      workshopTitle: json['workshop_title']?.toString() ?? 'Workshop #${(json['workshop_id'] as num).toInt()}',
      qrCode: json['qr_code']?.toString() ?? '',
      studentName: json['student_name']?.toString() ?? 'Student',
      scannedAt: DateTime.parse(json['scanned_at'].toString()),
      syncState: json['sync_state']?.toString() ?? 'pending',
      retryCount: (json['retry_count'] as num?)?.toInt() ?? 0,
      lastError: json['last_error']?.toString(),
    );
  }
}

class ScanOutcome {
  const ScanOutcome._(this.kind, this.message, this.registration);

  final String kind;
  final String message;
  final ManifestRegistration? registration;

  String get state => kind;

  bool get isSuccess => kind == 'success';
  bool get isDuplicate => kind == 'duplicate';

  factory ScanOutcome.success(ManifestRegistration registration) => ScanOutcome._('success', 'Đã ghi nhận check-in cục bộ', registration);
  factory ScanOutcome.duplicate(String message, [ManifestRegistration? registration]) => ScanOutcome._('duplicate', message, registration);
  factory ScanOutcome.invalid(String message) => ScanOutcome._('invalid', message, null);
}

typedef PendingScan = PendingScanItem;