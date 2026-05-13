# UniHub Mobile

Staff-only Flutter app for QR check-in and offline synchronization.

## Features
- Staff login only.
- Camera QR scanning and manual QR entry.
- SQLite cache for offline check-in.
- Automatic sync when connectivity returns.

## Run
```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

For a physical Android device, replace `10.0.2.2` with your host machine IP.
