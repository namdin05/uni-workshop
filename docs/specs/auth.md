# Đặc tả: Xác thực và Phân quyền (Auth & RBAC)

## Mô tả
Tính năng này quản lý việc định danh người dùng và kiểm soát quyền truy cập vào các tài nguyên hệ thống dựa trên vai trò (Role-Based Access Control). Hệ thống dùng Supabase Auth cho xác thực, còn vai trò người dùng được lưu trong bảng `users` của hệ thống và liên kết với tài khoản Supabase bằng `auth_id`.

## Luồng chính

### 1. Kích hoạt tài khoản
Trước khi đăng nhập lần đầu, sinh viên phải đi qua luồng kích hoạt tài khoản:

- Nhân sự hoặc sinh viên cung cấp `studentId` và `email`.
- Client gọi API kiểm tra kích hoạt.
- Backend tra cứu bản ghi trong bảng `users` bằng `student_id` và `email`.
- Nếu tài khoản chưa được liên kết với Supabase Auth, backend tạo user mới bằng service role key, sau đó cập nhật `auth_id` vào bảng `users`.

Luồng này đảm bảo tài khoản Supabase Auth được ghép đúng với hồ sơ sinh viên đã có trong hệ thống.

### 2. Đăng nhập
Người dùng đăng nhập bằng Email/Password thông qua Supabase Auth.

- Backend gọi `signInWithPassword`.
- Supabase Auth trả về `access_token` và thông tin user.
- Backend lấy thêm `profile` từ bảng `users` dựa trên `auth_id`.
- API trả về token, user và profile cho client.

Lưu ý: role không được lấy trực tiếp từ JWT trong backend hiện tại. Role được truy vấn từ bảng `users` sau khi xác thực thành công.

### 3. Phân quyền theo vai trò
Sau khi có token hợp lệ, middleware `verifyToken` kiểm tra JWT bằng Supabase Auth.

- `verifyToken` lấy token từ header `Authorization: Bearer <token>`.
- Middleware gọi `supabase.auth.getUser(token)` để xác minh phiên đăng nhập.
- Nếu hợp lệ, user được gắn vào `req.user`.
- `authorizeRole` truy vấn bảng `users` theo `auth_id` để đọc `role`.
- Nếu role không nằm trong danh sách cho phép, backend trả về lỗi 403.

Phân cấp quyền đang dùng trong hệ thống:

- Sinh viên: truy cập API xem hồ sơ, xem workshop và đăng ký workshop.
- Ban tổ chức (organizer/admin): truy cập các API quản trị workshop, phòng và thanh toán.
- Nhân sự check-in (staff): truy cập các API check-in trên mobile.

### 4. Kiểm soát dữ liệu
Hệ thống dùng cả middleware ứng dụng và chính sách RLS của Supabase/PostgreSQL tùy theo client và client key đang dùng:

- Backend thường dùng `supabase` với anon key cho các truy vấn cần tuân thủ RLS.
- Các tác vụ quản trị hoặc tác vụ hệ thống dùng `supabaseAdmin` với service role key để vượt qua RLS.
- Với các route backend đã được bảo vệ bằng middleware, quyền truy cập được chặn ở tầng ứng dụng trước khi tới thao tác dữ liệu.

## Kịch bản lỗi

- Sai thông tin đăng nhập: Hệ thống trả về lỗi 401 Unauthorized.
- Token hết hạn hoặc không hợp lệ: `supabase.auth.getUser(token)` thất bại và backend trả về lỗi 401.
- Truy cập trái phép: Nếu người dùng gọi API ngoài vai trò được cấp, middleware trả về lỗi 403 Forbidden.
- Tài khoản chưa được kích hoạt: Hệ thống yêu cầu đi qua luồng validate/activate trước khi đăng nhập.

## Ràng buộc

- Bảo mật: Mật khẩu được quản lý bởi Supabase Auth.
- Tính nhất quán: Vai trò người dùng phải được đồng bộ giữa bảng `auth.users` của Supabase và bảng `users` trong hệ thống thông qua `auth_id`.
- Khả năng quản trị: Các tác vụ hệ thống có thể dùng service role key khi cần bỏ qua RLS.

## Tiêu chí chấp nhận

- Người dùng có thể kích hoạt tài khoản nếu email và mã số sinh viên hợp lệ.
- Người dùng đăng nhập thành công và nhận đúng `profile` tương ứng.
- Hệ thống chặn các hành động vượt quá vai trò đã được thiết lập.
- Nhân sự check-in chỉ truy cập được các API dành cho staff, còn ban tổ chức chỉ truy cập được các API quản trị.