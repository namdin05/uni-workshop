# Đặc tả: Xác thực và Phân quyền (Auth & RBAC)
## Mô tả
Tính năng này quản lý việc định danh người dùng và kiểm soát quyền truy cập vào các tài nguyên hệ thống dựa trên vai trò (Role-Based Access Control). Hệ thống phân tách rõ rệt quyền hạn giữa Sinh viên, Ban tổ chức và Nhân sự check-in để đảm bảo tính bảo mật và toàn vẹn dữ liệu.

## Luồng chính
Đăng nhập: Người dùng đăng nhập qua Email/Password thông qua Supabase Auth. Hệ thống trả về một JSON Web Token (JWT) chứa thông tin định danh và vai trò (role) của người dùng.

Phân cấp quyền:

- Sinh viên: Sau khi xác thực, JWT cho phép truy cập các API xem danh sách và đăng ký workshop.

- Ban tổ chức (Organizer): Truy cập trang Admin để quản lý workshop và xem thống kê.

- Nhân sự check-in (Staff): Chỉ được phép truy cập tính năng quét mã QR trên Mobile App.

Kiểm soát tại Database: Sử dụng PostgreSQL Row Level Security (RLS) để kiểm tra JWT trên mỗi câu lệnh SQL. Ví dụ: Sinh viên chỉ có thể xem (SELECT) các bản ghi đăng ký của chính mình.

## Kịch bản lỗi
Sai thông tin đăng nhập: Hệ thống trả về lỗi 401 Unauthorized.

Token hết hạn: Client nhận lỗi 401, tự động dùng refresh_token để lấy JWT mới mà không làm phiền người dùng.

Truy cập trái phép: Nếu Sinh viên cố tình gọi API xóa workshop của Admin, RLS tại Database sẽ chặn đứng và trả về lỗi 403 Forbidden.

## Ràng buộc
Bảo mật: Toàn bộ mật khẩu phải được mã hóa bởi Supabase (Bcrypt).

Tính nhất quán: Vai trò người dùng phải được đồng bộ giữa bảng auth.users của Supabase và bảng users trong hệ thống để quản lý metadata.

## Tiêu chí chấp nhận
Người dùng đăng nhập thành công và nhận đúng quyền hạn tương ứng.

Người dùng không thể thực hiện các hành động vượt quá vai trò đã được thiết lập (ví dụ: Nhân viên check-in không thể sửa thông tin workshop).