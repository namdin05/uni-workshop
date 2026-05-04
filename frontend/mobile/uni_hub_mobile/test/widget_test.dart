import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:uni_hub_mobile/main.dart';
import 'package:uni_hub_mobile/src/app.dart';
import 'package:uni_hub_mobile/src/app_controller.dart';
import 'package:uni_hub_mobile/src/services.dart';

void main() {
  testWidgets('shows login screen for a fresh install', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    final controller = AppController(
      apiClient: ApiClient(baseUrl: 'http://localhost:3000'),
      sessionStore: SessionStore(),
      localDatabase: LocalDatabase(),
    );

    await controller.bootstrap();
    await tester.pumpWidget(UniHubMobileApp(controller: controller));
    await tester.pumpAndSettle();

    expect(find.text('UniHub Organizer Check-in'), findsOneWidget);
    expect(find.text('Đăng nhập'), findsOneWidget);
  });
}
