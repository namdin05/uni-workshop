# Đặc tả: Check-in Offline và Đồng bộ dữ liệu
## Mô tả
Cho phép nhân sự check-in thực hiện quét mã QR tại các khu vực mất mạng bằng ứng dụng Android. Dữ liệu sẽ được lưu tạm thời trên thiết bị Android và tự động đồng bộ lên server khi kết nối internet được khôi phục.

## Luồng chính
Chuẩn bị (Online): Trước khi sự kiện bắt đầu, nhân sự mở App Android để tải danh sách mã QR (registration_id và qr_code) của workshop đó về cơ sở dữ liệu cục bộ (Local SQLite trên thiết bị).

Quét mã (Offline):

- Nhân sự quét mã QR của sinh viên.

- App đối chiếu mã QR với dữ liệu trong Local DB trên Android.

- Nếu hợp lệ, App ghi nhận trạng thái "Đã tham dự" và lưu kèm timestamp quét thực tế vào bảng offline_sync_logs tại thiết bị Android.

Đồng bộ (Khi có mạng):

- App phát hiện có kết nối internet trở lại.

- App đẩy toàn bộ các bản ghi check-in chưa đồng bộ lên Supabase thông qua một Edge Function.

- Server cập nhật bảng registrations và đánh dấu offline_synced = TRUE để quản lý vết.

Kịch bản lỗi
- Mất mạng giữa chừng khi đang đồng bộ: App phải sử dụng cơ chế Retry với Exponential Backoff (thử lại sau các khoảng thời gian tăng dần) để đảm bảo không mất dữ liệu.

- Xung đột dữ liệu: Nếu một mã QR đã được check-in trên thiết bị A và sau đó lại được quét trên thiết bị B (khi cả hai cùng offline), server sẽ ưu tiên bản ghi có timestamp quét sớm nhất và báo lỗi trùng lặp cho các bản ghi sau.

- Bộ nhớ thiết bị đầy: App cảnh báo nhân sự không thể lưu thêm bản ghi check-in mới và yêu cầu giải phóng bộ nhớ hoặc kết nối mạng để đẩy dữ liệu lên.

## Ràng buộc
Tính nhất quán: Dữ liệu check-in trên server phải trùng khớp với dữ liệu đã quét trên thiết bị (dựa vào scanned_at).

Hiệu năng: Việc đối chiếu mã QR dưới local phải diễn ra tức thì (< 200ms) để tránh gây ùn tắc tại cửa phòng workshop.

## Tiêu chí chấp nhận
Nhân sự có thể thực hiện quét mã và nhận kết quả "Hợp lệ/Không hợp lệ" ngay cả khi tắt Wi-Fi/4G.

Dữ liệu quét offline được hiển thị chính xác trên trang Admin sau khi thiết bị có mạng trở lại.
