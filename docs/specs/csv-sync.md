# Đặc tả: Đồng bộ dữ liệu Sinh viên (CSV Sync)
## Mô tả
Tính năng cho phép hệ thống UniHub Workshop nạp và cập nhật danh sách hàng chục ngàn sinh viên (VD: 12.000 bản ghi) từ hệ thống quản lý cũ của trường thông qua định dạng tệp CSV. Do hệ thống cũ không cung cấp API mở mà chỉ xuất file dữ liệu định kỳ, giải pháp này áp dụng kiến trúc xử lý bất đồng bộ kết hợp lưu trữ đám mây để đảm bảo quá trình đồng bộ diễn ra an toàn, chính xác và không gây nghẽn (bottleneck) cho ứng dụng chính đang phục vụ sinh viên.

## Luồng chính
- Tải tệp tin lên lưu trữ (Admin Upload): Ban tổ chức tải file CSV (dữ liệu sinh viên) thông qua giao diện Admin. Backend (Node.js) tiếp nhận, làm sạch tên file và đẩy thẳng luồng dữ liệu (file stream) lên Supabase Storage (bucket `csv_student`) thay vì xử lý trực tiếp, giúp phản hồi API ngay lập tức.
- Kích hoạt tiến trình ngầm (Nightly Cron Job): Một tiến trình chạy ngầm (Cron Job) được lập lịch tự động kích hoạt vào một khung giờ vắng vẻ (VD: 2:00 AM mỗi ngày).
- Trích xuất và Phân tích (Stream Processing): 
  + Tiến trình tải file CSV từ Storage về dưới dạng luồng dữ liệu (Readable Stream).
  + Đọc và bóc tách từng dòng dữ liệu, gom nhóm các thông tin hợp lệ (`student_id`, `email`, `full_name`) và gắn mặc định `role: 'student'`.
- Cập nhật cơ sở dữ liệu (Atomic Upsert):
  + Hệ thống gọi lệnh `upsert` (Update or Insert) vào bảng `users` với mỏ neo (conflict key) là `student_id`.
  + Nếu `student_id` chưa tồn tại: Tạo mới tài khoản sinh viên.
  + Nếu `student_id` đã tồn tại: Cập nhật đè các thông tin mới (VD: sinh viên đổi email hoặc cập nhật họ tên) lên bản ghi cũ.
- Dọn dẹp (Cleanup): Sau khi lưu Database thành công, tiến trình tự động xóa file CSV gốc trên Supabase Storage để giải phóng tài nguyên.

## Kịch bản lỗi
- Không tìm thấy file chờ xử lý: Cron Job đến giờ kích hoạt nhưng bucket `csv_student` trống. Tiến trình chỉ ghi log thông báo "Không tìm thấy file" và tự động kết thúc vòng đời mà không gây lỗi (crash) hệ thống.
- Vi phạm ràng buộc dữ liệu (Unique Email): Nếu trong file CSV có một sinh viên cập nhật email mới, nhưng email này đã bị một tài khoản khác trong hệ thống chiếm dụng, Database sẽ chặn lệnh bằng lỗi `23505 Unique Violation`. Tiến trình catch lỗi, ghi nhận vào log để Admin rà soát và vẫn giữ nguyên dữ liệu hợp lệ của các sinh viên khác.
- File đầu vào không hợp lệ: Nếu Admin tải lên file không đúng định dạng (.csv), Backend từ chối ngay từ vòng kiểm duyệt tên file, trả về mã lỗi 400 Bad Request cho Frontend.

## Ràng buộc
- Tối ưu I/O và Bộ nhớ: Bắt buộc phải sử dụng cơ chế xử lý luồng (Stream/Buffer) khi thao tác với file CSV lớn để tránh tình trạng tràn bộ nhớ (Out of Memory - OOM) và không làm nghẽn Event Loop của Node.js.
- Tính toàn vẹn dữ liệu: Việc ghi dữ liệu phải dùng thao tác `upsert` dựa trên `student_id` để tránh việc tạo ra các tài khoản rác/trùng lặp ID sinh viên sau nhiều lần đồng bộ.

## Tiêu chí chấp nhận
- Admin có thể tải file CSV 12.000 dòng lên giao diện mượt mà và nhận thông báo thành công mà trình duyệt không bị treo.
- Khi tiến trình đồng bộ chạy, hệ thống nhận diện đúng tài khoản mới để thêm vào và tài khoản cũ để cập nhật thông tin (như Email/Họ tên).
- Dữ liệu rác (file CSV sau khi xử lý xong) tự động biến mất khỏi Supabase Storage.
- Trong suốt quá trình hệ thống đang phân tích file và chèn Database ở background, các sinh viên khác vẫn có thể duyệt web và giật vé đăng ký bình thường, không bị gián đoạn.