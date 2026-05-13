4. Hướng dẫn Code cho AI (Implementation Guide)
Hệ thống sử dụng ES Modules (type: "module"). AI cần triển khai các file sau:

File 1: src/config/redis.js
Khởi tạo kết nối đến Upstash Redis sử dụng package @upstash/redis.

File 2: src/middlewares/rateLimit.js
Sử dụng express-rate-limit.

Tạo một middleware registrationLimiter: Giới hạn tối đa 5 requests / 1 phút cho route /register. Trả về JSON lỗi 429 nếu vượt ngưỡng.

File 3: src/api/workshop.api.js
Triển khai 2 hàm chính:

Hàm 1: prewarmWorkshopCache(req, res) (Dành cho Admin)

Lấy danh sách workshop (id, available_seats) đang active bằng supabaseAdmin.

Dùng redis.pipeline() đẩy toàn bộ data lên Redis với key format: workshop:{id}:seats.

Hàm 2: registerWorkshop(req, res) (Dành cho Sinh viên)

Bước 1: Đọc số ghế từ Redis (redis.get('workshop:{id}:seats')). Nếu seats <= 0, return 400 ngay lập tức.

Bước 2: Gọi hàm supabase.rpc('register_workshop', { p_user_id, p_workshop_id, p_qr_code }) để PostgreSQL xử lý khóa dòng và chốt ghế.

Bước 3: - Nếu thành công: Cập nhật lại số ghế mới vào Redis từ kết quả RPC trả về, trả về 200.

Nếu lỗi (Database báo hết chỗ/trùng): Cập nhật key Redis = 0 và trả về 400.

File 4: src/routes/
Gắn registrationLimiter vào endpoint POST /register.

Gắn middleware xác thực (Auth) bảo vệ các route (ví dụ: chỉ Role Organizer mới gọi được prewarmWorkshopCache).4. Hướng dẫn Code cho AI (Implementation Guide)
Hệ thống sử dụng ES Modules (type: "module"). AI cần triển khai các file sau:

File 1: src/utils/redis.js
Khởi tạo kết nối đến Upstash Redis sử dụng package @upstash/redis.

File 2: src/middlewares/rateLimit.js
Sử dụng express-rate-limit.

Tạo một middleware registrationLimiter: Giới hạn tối đa 5 requests / 1 phút cho route /register. Trả về JSON lỗi 429 nếu vượt ngưỡng.

File 3: src/controllers/workshopController.js
Triển khai 2 hàm chính:

Hàm 1: prewarmWorkshopCache(req, res) (Dành cho Admin)

Lấy danh sách workshop (id, available_seats) đang active bằng supabaseAdmin.

Dùng redis.pipeline() đẩy toàn bộ data lên Redis với key format: workshop:{id}:seats.

Hàm 2: registerWorkshop(req, res) (Dành cho Sinh viên)

Bước 1: Đọc số ghế từ Redis (redis.get('workshop:{id}:seats')). Nếu seats <= 0, return 400 ngay lập tức.

Bước 2: Gọi hàm supabase.rpc('register_workshop', { p_user_id, p_workshop_id, p_qr_code }) để PostgreSQL xử lý khóa dòng và chốt ghế.

Bước 3: - Nếu thành công: Cập nhật lại số ghế mới vào Redis từ kết quả RPC trả về, trả về 200.

Nếu lỗi (Database báo hết chỗ/trùng): Cập nhật key Redis = 0 và trả về 400.

File 4: src/routes/workshopRoutes.js
Gắn registrationLimiter vào endpoint POST /register.

Gắn middleware xác thực (Auth) bảo vệ các route (ví dụ: chỉ Role Organizer mới gọi được prewarmWorkshopCache).