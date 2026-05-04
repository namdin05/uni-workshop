import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/app_controller.dart';
import 'src/services.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final controller = AppController(
    apiClient: ApiClient(),
    sessionStore: SessionStore(),
    localDatabase: LocalDatabase(),
  );

  await controller.bootstrap();
  runApp(UniHubMobileApp(controller: controller));
}
