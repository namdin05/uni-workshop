# Đặc tả: Thanh toán (Payment)

## Mô tả
Tính năng này quản lý quy trình thanh toán cho đăng ký workshop có phí. Hệ thống hỗ trợ hai phương thức thanh toán: thanh toán demo (tư mô phỏng) và thanh toán thực tế thông qua cổng thanh toán (Payment Gateway). Tất cả các giao dịch thanh toán phải đảm bảo tính toàn vẹn dữ liệu, tránh trùng lặp, và hỗ trợ khôi phục trong trường hợp lỗi.

## Luồng chính

### Luồng 1: Đăng ký Workshop Miễn phí
1. Người dùng gửi yêu cầu đăng ký workshop miễn phí (is_free = true)
2. Hệ thống xác thực người dùng thông qua JWT
3. Khóa hàng (FOR UPDATE) để ngăn chặn race condition
4. Kiểm tra số ghế còn lại của workshop
5. Tạo bản ghi đăng ký (registration) với trạng thái "confirmed"
6. Giảm số ghế khả dụng (available_seats -= 1)
7. Cập nhật bộ nhớ cache Redis (best-effort)
8. Gửi email thông báo (asynchronous)
9. Trả về mã QR code cho người dùng

### Luồng 2: Đăng ký Workshop Có phí (Pending Payment)
1. Người dùng gửi yêu cầu đăng ký workshop có phí
2. Hệ thống xác thực người dùng thông qua JWT
3. Khóa hàng (FOR UPDATE) để ngăn chặn race condition
4. Kiểm tra số ghế còn lại của workshop
5. Tạo bản ghi đăng ký với trạng thái "pending_payment"
6. Giảm số ghế khả dụng (available_seats -= 1)
7. Cập nhật bộ nhớ cache Redis (best-effort)
8. Gửi liên kết thanh toán cho người dùng
9. Trả về URL cổng thanh toán

### Luồng 3: Xác nhận Thanh toán Demo (Demo Payment Confirmation)
1. Người dùng gửi yêu cầu xác nhận thanh toán demo kèm idempotency key
2. Hệ thống xác thực người dùng thông qua JWT
3. Khởi động giao dịch PostgreSQL (BEGIN)
4. Khóa hàng bản ghi đăng ký (FOR UPDATE)
5. Kiểm tra xem thanh toán này đã tồn tại hay chưa (idempotency key)
   - Nếu tồn tại: Trả về kết quả thanh toán trước đó (không xử lý lại)
   - Nếu chưa tồn tại: Tiếp tục
6. Xác thực người dùng sở hữu đăng ký
7. Tạo bản ghi thanh toán mới với idempotency key
8. Cập nhật trạng thái đăng ký thành "confirmed"
9. Cam kết giao dịch (COMMIT)
10. Gửi email xác nhận thanh toán (asynchronous)
11. Trả về mã QR code cho người dùng

### Luồng 4: Xác nhận Thanh toán Thực tế (Real Payment via Gateway)
1. Cổng thanh toán gọi webhook để thông báo kết quả thanh toán
2. Hệ thống xác thực yêu cầu webhook từ cổng thanh toán
3. Kiểm tra mã giao dịch (transaction ID) và trạng thái thanh toán
4. Khởi động giao dịch PostgreSQL (BEGIN)
5. Khóa hàng bản ghi đăng ký (FOR UPDATE)
6. Kiểm tra xem thanh toán này đã được xử lý hay chưa (idempotency via transaction ID)
7. Tạo bản ghi thanh toán với chi tiết từ cổng thanh toán
8. Cập nhật trạng thái đăng ký thành "confirmed"
9. Cam kết giao dịch (COMMIT)
10. Gửi email xác nhận thanh toán (asynchronous)
11. Trả về phản hồi 200 OK cho webhook

## Kịch bản lỗi

### Thanh toán Trùng lặp (Duplicate Payment)
- **Nguyên nhân**: Người dùng hoặc hệ thống gửi yêu cầu thanh toán hai lần với idempotency key giống nhau
- **Xử lý**: Hệ thống kiểm tra bảng payments theo idempotency_key, nếu đã tồn tại thì trả về kết quả cũ mà không xử lý lại
- **Phản hồi**: 200 OK với dữ liệu thanh toán hiện có

### Số Ghế Không Đủ (Insufficient Seats)
- **Nguyên nhân**: Nhiều người dùng đăng ký cùng lúc và hết ghế trước khi người dùng hoàn thành thanh toán
- **Xử lý**: Khóa hàng workshop (FOR UPDATE) trong giao dịch để phát hiện tình trạng này
- **Phản hồi**: 400 Bad Request - "Workshop is fully booked"

### Thanh toán Bất thành (Payment Failed)
- **Nguyên nhân**: Cổng thanh toán từ chối giao dịch (không đủ tiền, thẻ bị khóa, v.v.)
- **Xử lý**: 
  1. Không tạo bản ghi thanh toán
  2. Cập nhật trạng thái đăng ký thành "payment_failed"
  3. Tăng lại số ghế khả dụng (available_seats += 1)
- **Phản hồi**: 402 Payment Required - "Payment declined by gateway"

### Người dùng Chưa Xác thực (Unauthenticated User)
- **Nguyên nhân**: JWT không hợp lệ hoặc hết hạn
- **Xử lý**: Middleware xác thực từ chối yêu cầu
- **Phản hồi**: 401 Unauthorized

### Giao dịch Xung đột (Transaction Conflict/Deadlock)
- **Nguyên nhân**: Nhiều giao dịch cùng khóa hàng worksheet hoặc registration
- **Xử lý**: PostgreSQL rollback tự động, ứng dụng thử lại (retry logic)
- **Phản hồi**: 503 Service Unavailable - "Transaction failed, please try again"

### Vượt quá Giới hạn Rate Limit
- **Nguyên nhân**: Người dùng gửi quá nhiều yêu cầu thanh toán trong thời gian ngắn
- **Xử lý**: Redis rate limiting middleware chặn yêu cầu
- **Phản hồi**: 429 Too Many Requests - "Rate limit exceeded"

## Ràng buộc

### Tính Toàn vẹn Dữ liệu
- Tất cả các giao dịch thanh toán phải sử dụng PostgreSQL transactions (BEGIN/COMMIT/ROLLBACK) để đảm bảo ACID properties
- Sử dụng row-level locking (FOR UPDATE) trên workshop và registration để ngăn chặn race condition

### Tính Idempotency
- Mỗi yêu cầu thanh toán phải kèm theo idempotency_key duy nhất
- Bảng payments phải có unique constraint trên idempotency_key để đảm bảo không có thanh toán trùng lặp
- Hệ thống phải kiểm tra bất kì idempotency key nào trước khi tạo thanh toán mới

### Kết nối Cơ sở dữ liệu
- Sử dụng pgPool (connection pool) với tối đa 20 kết nối để xử lý tải cao
- Timeout kết nối: 2 giây
- Timeout nhàn rỗi: 30 giây
- Bộ đệm PgBouncer quản lý tất cả các kết nối

### Bộ Nhớ cache
- Sử dụng Redis (Upstash) để cache số ghế khả dụng của workshop (TTL: 5 phút)
- Khi cập nhật số ghế, phải invalidate cache để đảm bảo tính nhất quán (best-effort)
- Nếu cache không khả dụng, hệ thống phải vẫn hoạt động được (fallback to database)

### Rate Limiting
- Giới hạn 10 yêu cầu thanh toán trên mỗi người dùng trong 60 giây
- Sử dụng Redis key "payment:user:{userId}" với TTL 60 giây

### Bảo mật
- Tất cả các yêu cầu phải đi qua xác thực JWT
- Người dùng chỉ có thể thanh toán cho đăng ký của chính mình
- Webhook từ cổng thanh toán phải được xác thực qua chữ ký (signature verification)

## Tiêu chí chấp nhận

1. **Đăng ký Workshop Miễn phí**
   - Người dùng có thể đăng ký workshop miễn phí
   - Trạng thái đăng ký ngay lập tức chuyển thành "confirmed"
   - Người dùng nhận được mã QR code

2. **Đăng ký Workshop Có phí (Pending)**
   - Người dùng có thể đăng ký workshop có phí
   - Trạng thái đăng ký ban đầu là "pending_payment"
   - Số ghế giảm ngay lập tức (nhưng có thể được hoàn lại nếu thanh toán thất bại)

3. **Thanh toán Demo Thành công**
   - Yêu cầu thanh toán demo được xác nhận
   - Trạng thái đăng ký chuyển thành "confirmed"
   - Mã QR code được tạo và trả về
   - Email xác nhận được gửi

4. **Tránh Thanh toán Trùng lặp**
   - Nếu gửi cùng idempotency key hai lần, chỉ xử lý thanh toán lần đầu
   - Lần thứ hai trả về kết quả thanh toán hiện có mà không xử lý lại

5. **Xử lý Hết Ghế**
   - Nếu workshop hết ghế, yêu cầu đăng ký mới bị từ chối
   - Trạng thái đăng ký vẫn là "pending_payment"
   - Số ghế được hoàn lại (restored)

6. **Thanh toán Bất thành**
   - Nếu cổng thanh toán từ chối, trạng thái đặt thành "payment_failed"
   - Số ghế được hoàn lại cho workshop
   - Người dùng được thông báy lỗi rõ ràng

7. **Xác thực Webhook**
   - Webhook từ cổng thanh toán phải được xác thực qua chữ ký
   - Chỉ xử lý webhook từ cổng thanh toán đáng tin cậy

8. **Performance dưới Tải Cao**
   - Hệ thống phải xử lý 12,000 người dùng/10 phút (20 TPS)
   - Độ trễ phản hồi < 500ms cho 95% yêu cầu
   - Không có transaction deadlock do row locking
