# UniHub Mobile Run Guide

Tài liệu này hướng dẫn từ đầu đến cuối cách chạy phần mobile của UniHub trên máy thật Android sau khi clone project.

## 1. Yêu cầu trước khi bắt đầu

- Cài `Git`
- Cài `Node.js`
- Cài `Flutter`
- Cài `Android Studio` hoặc Android SDK
- Có điện thoại Android thật đã bật `USB debugging`
- Máy tính và điện thoại cùng mạng Wi-Fi nếu không dùng USB reverse

Kiểm tra nhanh:

```powershell
git --version
node --version
flutter --version
adb devices
```

Nếu `adb` không nhận lệnh trong PowerShell, có thể vẫn chạy được qua `flutter devices`, hoặc dùng `npm.cmd` thay vì `npm` ở bước backend.

## 2. Clone project

```powershell
git clone <REPO_URL>
cd uni-workshop
```

## 3. Chuẩn bị backend

Backend dùng Supabase nên cần tạo file `.env` trong thư mục `backend/`.

### 3.1 Tạo file `backend/.env`

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3.2 Cài dependency backend

```powershell
cd backend
npm.cmd install
```

### 3.3 Chạy backend

```powershell
npm.cmd run dev
```

Backend sẽ chạy ở:

```text
http://localhost:3000
```

## 4. Chuẩn bị mobile Flutter

### 4.1 Cài dependency Flutter

```powershell
cd ..\frontend\mobile\uni_hub_mobile
flutter pub get
```

### 4.2 Kiểm tra thiết bị Android

```powershell
flutter devices
```

Nếu điện thoại chưa hiện:

- cắm cáp USB
- bật `USB debugging`
- chấp nhận hộp thoại `Allow USB debugging` trên điện thoại

## 5. Chọn cách kết nối backend

Bạn có 2 cách.

### Cách A. Dùng USB và `adb reverse`

Cách này tiện nếu điện thoại cắm trực tiếp vào máy.

```powershell
adb reverse tcp:3000 tcp:3000
```

Sau đó app có thể gọi backend bằng:

```text
http://127.0.0.1:3000
```

Trong project hiện tại, nếu bạn muốn giữ cấu hình đơn giản, vẫn có thể dùng IP máy host thay vì reverse.

### Cách B. Dùng cùng Wi-Fi

Lấy IP máy tính:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object InterfaceAlias,IPAddress
```

Ví dụ nếu IP là `192.168.1.5`, thì dùng:

```text
http://192.168.1.5:3000
```

## 6. Chạy app trên điện thoại thật

Thay `R58M557JHPJ` bằng `deviceId` thực tế của bạn từ `flutter devices`.

### Nếu dùng Wi-Fi

```powershell
flutter run -d R58M557JHPJ --dart-define=API_BASE_URL=http://192.168.1.5:3000
```

### Nếu dùng `adb reverse`

```powershell
flutter run -d R58M557JHPJ --dart-define=API_BASE_URL=http://127.0.0.1:3000
```

## 7. Luồng kiểm tra sau khi app mở

1. Đăng nhập bằng tài khoản `staff`.
2. Mở màn hình workshop và tải manifest của workshop cần check-in.
3. Mở màn hình scan QR.
4. Quét QR của sinh viên đã có trong manifest.
5. Tắt mạng rồi quét tiếp để kiểm tra queue offline.
6. Bật mạng lại để app tự đồng bộ.

## 8. Lệnh hữu ích khi debug

```powershell
flutter analyze
flutter test
flutter logs
```

Nếu cần reload app đang chạy:

```text
r
```

Nếu cần restart nóng:

```text
R
```

## 9. Lỗi thường gặp

### `npm.ps1 cannot be loaded`

Do chính sách PowerShell trên Windows. Dùng `npm.cmd` thay vì `npm`.

### Không thấy thiết bị Android

- kiểm tra cáp USB
- bật USB debugging
- gõ lại `flutter devices`
- chấp nhận quyền debugging trên điện thoại

### App không gọi được backend

- kiểm tra backend đã chạy chưa
- kiểm tra đúng `API_BASE_URL`
- nếu dùng Wi-Fi, máy tính và điện thoại phải cùng mạng

### Scan QR không hoạt động

- cấp quyền camera cho app
- chắc chắn manifest workshop đã được tải xuống trước

## 10. Tóm tắt lệnh ngắn nhất

```powershell
git clone <REPO_URL>
cd uni-workshop\backend
npm.cmd install
npm.cmd run dev
```

Mở terminal khác:

```powershell
cd uni-workshop\frontend\mobile\uni_hub_mobile
flutter pub get
flutter devices
flutter run -d R58M557JHPJ --dart-define=API_BASE_URL=http://192.168.1.5:3000
```