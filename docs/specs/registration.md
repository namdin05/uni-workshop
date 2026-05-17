# Đặc tả: Luồng đăng ký Workshop có phí

## Mô tả
Tính năng này cho phép sinh viên chọn và đăng ký một workshop có thu phí. Luồng xử lý bao gồm việc kiểm tra tình trạng chỗ ngồi theo thời gian thực, giữ chỗ (lock seat), thanh toán và sinh mã QR check-in. Hệ thống phải đảm bảo xử lý được lượng truy cập lớn (12.000 user/10 phút), không xảy ra tình trạng overbooking (đăng ký vượt quá số chỗ) và tuyệt đối không trừ tiền hai lần nếu mạng chập chờn.

## Luồng chính

1. Sinh viên truy cập vào chi tiết workshop và bấm nút "Đăng ký".
2. Ứng dụng client (Web/Mobile) sinh ra một `Idempotency-Key` (ví dụ: UUID) và gửi request kèm khóa này lên Backend API.
3. API Gateway tiếp nhận request và đưa qua màng lọc Rate Limiting. Nếu sinh viên gửi quá nhiều request trong thời gian ngắn (spam click), hệ thống trả về lỗi 429 Too Many Requests.
4. Backend kiểm tra `Idempotency-Key` trong Redis. Nếu key này đã tồn tại và đang ở trạng thái "đang xử lý" hoặc "thành công", backend sẽ trả về kết quả cũ mà không thực hiện lại giao dịch.
5. Backend kiểm tra số chỗ trống hiện tại trong Redis (sử dụng Redis INCR/DECR để đảm bảo tính nguyên tử - Atomic). Nếu hết chỗ, báo lỗi và dừng luồng.
6. Nếu còn chỗ, hệ thống tạm thời "giữ chỗ" (Lock Seat) cho sinh viên trong vòng 10 phút.
7. Backend gọi API sang Cổng thanh toán (Payment Gateway). 
8. Cổng thanh toán trả về URL thanh toán. Sinh viên tiến hành thanh toán.
9. Sau khi thanh toán thành công, Cổng thanh toán gọi Webhook báo lại cho Backend.
10. Backend cập nhật trạng thái vé thành "Đã thanh toán", chốt chỗ ngồi (trừ vĩnh viễn vào Database chính), và sinh ra Mã QR.
11. Hệ thống gửi thông báo (Push Notification/Email) chứa Mã QR cho sinh viên.

## Kịch bản lỗi

* Cổng thanh toán bị sập / Timeout: Hệ thống áp dụng Circuit Breaker. Nếu cổng thanh toán lỗi liên tục, ngắt kết nối tạm thời. Chuyển sang luồng "Graceful Degradation": Cho phép sinh viên đăng ký giữ chỗ và thanh toán sau trong vòng 24h, hiển thị thông báo "Hệ thống thanh toán đang bảo trì, chỗ của bạn đã được giữ".
* Hết thời gian giữ chỗ (1 phút) nhưng chưa thanh toán: Cronjob/Background Worker tự động hủy vé tạm thời, nhả chỗ (nhấn số lượng chỗ trống lên +1 vào lại Redis) để người khác có thể đăng ký.
* Sinh viên bấm "Thanh toán" nhiều lần do mạng lag: Cơ chế Idempotency Key sẽ chặn các request trùng lặp ở bước 4, đảm bảo Cổng thanh toán chỉ nhận được 1 yêu cầu duy nhất, chống trừ tiền 2 lần.

## Ràng buộc

* Hiệu năng: API check chỗ và tạo luồng thanh toán phải phản hồi dưới 500ms để đảm bảo trải nghiệm trong đợt tải cao điểm.
* Tính nhất quán: Số lượng chỗ trống phải được đồng bộ chính xác giữa Cache (Redis) và Database (PostgreSQL/MySQL). Không được phép có hai sinh viên cùng giành được vé cuối cùng.
* Bảo mật: API đăng ký phải yêu cầu Token xác thực hợp lệ (chỉ Sinh viên mới được gọi).

## Tiêu chí chấp nhận (Acceptance Criteria)

* Sinh viên có thể đăng ký thành công và nhận được QR Code khi thanh toán hợp lệ.
* Khi workshop chỉ còn 1 chỗ, nếu 100 sinh viên bấm đăng ký cùng lúc (Concurrent Requests), chỉ có đúng 1 người thành công, 99 người còn lại nhận thông báo "Đã hết chỗ".
* Sinh viên cố tình spam request (ví dụ dùng tool) sẽ bị chặn lại bởi Rate Limiter.
* Khi cổng thanh toán mô phỏng trả về lỗi Timeout, hệ thống không bị sập và trả về thông báo lỗi thân thiện cho người dùng.