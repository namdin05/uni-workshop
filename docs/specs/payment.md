# Đặc tả: Thanh toán và Xử lý sự cố Cổng thanh toán (Payment & Circuit Breaker)

## Mô tả
Tính năng xử lý giao dịch mua vé cho các hội thảo có thu phí (`Paid Workshops`). Module này tập trung giải quyết bài toán giao dịch tài chính an toàn, bảo vệ dữ liệu toàn vẹn và đảm bảo khả năng "sinh tồn" của hệ thống khi tích hợp với bên thứ ba (Cổng thanh toán giả lập). Hệ thống áp dụng triệt để mẫu thiết kế **Circuit Breaker** (thông qua `opossum`) để ngăn chặn việc nghẽn luồng xử lý do hệ thống bên ngoài phản hồi chậm, kết hợp cơ chế kiểm tra **Idempotency** để chống trừ tiền hai lần và tách biệt tầng xử lý I/O nặng bằng **Message Queue** (BullMQ + Redis).

## Luồng chính
- **Thăm dò Trạng thái (Realtime Polling):** Tại giao diện `PaymentGateway.jsx`, một cơ chế Polling chạy ngầm (`setInterval`) liên tục gọi API Backend `/gateway/status` mỗi 5 giây/lần nhằm kiểm tra sức khỏe và chế độ hoạt động của cổng thanh toán (`gatewayState`). Nếu cổng ổn định (`canAttempt = true`), nút "Confirm Payment" trên giao diện sẽ được kích hoạt.
- **Xác thực Thông tin & Gửi Đơn hàng:** Sinh viên thực hiện chọn phương thức thanh toán (`card` hoặc `momo`) và nhấn "Confirm Payment". Frontend sẽ gửi yêu cầu POST đến endpoint `/demo/confirm` kèm theo các tham số: `registrationId`, `workshopId`, và `paymentMethod`.
- **Chống Trùng lặp & Khóa Đơn hàng (Idempotency Check):**
  + Tại `confirmDemoPayment` (`payment.api.js`), hệ thống thực hiện truy vấn bảng `payments` dựa trên `registration_id` để kiểm tra xem đã tồn tại yêu cầu giao dịch nào cho vé này chưa.
  + Nếu giao dịch đã tồn tại và có trạng thái `success`, hệ thống lập tức trả về phản hồi thành công mà không chạy tiếp logic thanh toán. Nếu trạng thái là `pending`, hệ thống sẽ tái sử dụng thông tin bản ghi cũ nhằm tránh tình trạng spam click tạo nhiều hóa đơn ảo.
  + Nếu chưa có giao dịch nào, hệ thống lập tức chèn (`INSERT`) một bản ghi mới vào bảng `payments` với trạng thái ban đầu là `pending` cùng mã tham chiếu nội bộ.
- **Kích hoạt Mạch ngắt (Circuit Breaker Processing):**
  + Trước khi gửi lệnh gọi HTTP (qua `axios`) sang cổng thanh toán giả lập tại `/mock-gateway/pay`, Backend gọi hàm kiểm tra `reserveGatewayAttempt()` (`utils/paymentGateway.js`). Hàm này sẽ xác định trạng thái mạch hiện tại và khóa lượt thử nghiệm nếu mạch đang ở trạng thái `half-open`.
  + Giao dịch được bọc bên trong một thực thể `CircuitBreaker` của thư viện `opossum`. Khi gọi thành công đến `/mock-gateway/pay` với thời gian phản hồi bình thường (~500ms), cổng thanh toán trả về mã `transactionId`.
- **Cập nhật Trạng thái & Đồng bộ Hàng đợi:**
  + Hệ thống cập nhật cột `status` trong bảng `payments` sang `success`. Tiếp tục cập nhật cột `status` của bảng `registrations` sang `confirmed`.
  + Hàm `completeGatewayAttemptSuccess()` được gọi để đưa trạng thái mạch ngắt nội bộ về chế độ an toàn ổn định (`closed`).
- **Gửi Email Vé Điện tử Bất đồng bộ:** Sau khi cập nhật DB thành công, Backend truy vấn thông tin email sinh viên từ bảng `users`, sau đó gọi hàm `enqueueTicketEmail` từ `utils/queueHelper.js` để đẩy một tác vụ (`Job`) có tên `send-notification` vào hàng đợi `workshop-notifications` (BullMQ + Redis). Công việc gửi email (bao gồm cả chuỗi mã hóa ảnh QR) được giao hoàn toàn cho Worker xử lý ngầm, giải phóng tài nguyên I/O cho luồng API chính.
- **Phản hồi Client:** API trả về mã `200` kèm thông tin transaction thành công. Frontend nhận kết quả, tắt trạng thái loading (`submitting = false`), kích hoạt pop-up thông báo từ trợ thủ `showTicketSuccessAlert(navigate)` (`utils/popup.js`), hiển thị thông điệp thành công và điều hướng sinh viên về trang vé cá nhân `/tickets`.

## Kịch bản lỗi
- **Lỗi Sai lệch Quyền sở hữu (Giao dịch bất hợp pháp):** Nếu `registration.user_id` không trùng khớp với ID của người dùng đang đăng nhập hệ thống, Backend lập tức chặn và trả về lỗi `403 Forbidden` kèm thông báo *"Registration does not belong to user"*. Giao dịch bị hủy bỏ ngay lập tức trước khi chạm tới cổng thanh toán.
- **Lỗi Cổng thanh toán bị Chậm/Sập (Timeout & Circuit OPEN):**
  + Khi cổng thanh toán giả lập gặp lỗi hoặc bị cấu hình tắt (`isActive = false` qua API Admin), endpoint `/mock-gateway/pay` sẽ kích hoạt hàm `delay(5000)` (trễ 5 giây) và trả về lỗi `408 Payment Gateway Timeout`.
  + Thư viện `opossum` được cấu hình với ngưỡng thời gian chờ nghiêm ngặt (`timeout: 3000` - 3 giây). Vì thời gian trễ của cổng (5 giây) vượt quá giới hạn, `opossum` lập tức ngắt kết nối và kích hoạt khối lệnh `catch(error)`.
  + Backend thực hiện cập nhật cột `status` của bảng `payments` sang `failed`, đồng thời kích hoạt hàm `completeGatewayAttemptFailure()` để ghi nhận lỗi hệ thống ngoài.
- **Suy giảm có kiểm soát và Khóa Giao diện (Graceful Degradation):**
  + Nếu tỷ lệ lỗi vượt quá ngưỡng cấu hình (`errorThresholdPercentage: 50`), trạng thái cổng nội bộ chuyển dịch sang `open`.
  + Lúc này, luồng Polling ngầm (5 giây) từ Frontend nhận diện được biến trạng thái trả về có thuộc tính `canAttempt = false`. Giao diện `PaymentGateway.jsx` lập tức chuyển đổi trạng thái: Vô hiệu hóa (`disabled`) nút bấm thanh toán, ẩn form nhập liệu và hiển thị biểu ngữ cảnh báo màu đỏ: *"Payment gateway error. Please try again later."*. Hành động này bảo vệ Backend khỏi việc gánh chịu hàng ngàn request rác từ người dùng khi cổng thanh toán đã sập.
- **Thử nghiệm và Tự phục hồi Mạch (Half-Open Probe Scenario):**
  + Sau khoảng thời gian nghỉ cấu hình là 30 giây (`OPEN_TO_HALF_OPEN_MS = 30_000`), hàm kiểm tra trạng thái ngầm `syncState()` tự động chuyển mạch sang trạng thái `half-open` và đặt cờ `probeAvailable = true`.
  + Lúc này, hệ thống chỉ cho phép duy nhất một request đầu tiên lọt qua tầng kiểm duyệt (`probeAvailable` chuyển về `false` ngay khi có request chạm vào).
    * **Nếu request thử nghiệm thành công:** Hệ thống tự động đóng mạch ngắt (`closed`), khôi phục toàn bộ chức năng thanh toán cho 12.000 sinh viên trên hệ thống.
    * **Nếu request thử nghiệm thất bại:** Hệ thống lập tức mở toang mạch ngắt trở lại (`open`), tiếp tục khóa chặt tính năng thanh toán trên giao diện và reset bộ đếm thời gian chờ thêm 30 giây.

## Ràng buộc
- **Ràng buộc Định danh Giao dịch (Idempotency Identifier):** Request gửi từ Frontend lên Backend bắt buộc phải sinh chuỗi khóa định danh duy nhất theo cấu trúc `PAY-{registrationId}` hoặc thực hiện ánh xạ trực tiếp tỷ lệ `1:1` với trường `registration_id` trong Database để ngăn ngừa xung đột dữ liệu dòng thanh toán đồng thời.
- **Cấu hình Ngưỡng Chịu lỗi của Thư viện Opossum:** + `timeout`: Giới hạn cứng 3000ms (3 giây).
  * `errorThresholdPercentage`: Khống chế ở mức 50%. Mạch ngắt sẽ bung ra nếu một nửa số lượng request gửi đi liên tiếp gặp sự cố phản hồi hoặc lỗi kết nối.
- **Bắt buộc Xử lý Bất đồng bộ với các Tác vụ nặng:** Tuyệt đối không nhúng trực tiếp tiến trình khởi tạo transport hay gửi mail của thư viện `nodemailer` vào bên trong Controller xử lý giao dịch. Tiến trình tạo và phát hành email chứa ảnh mã QR (được cấu hình mức sửa lỗi `errorCorrectionLevel: 'H'`) bắt buộc phải thông qua hàm trung gian `enqueueTicketEmail` để chuyển giao công việc vào Redis Queue.

## Tiêu chí chấp nhận
- Nút bấm thanh toán trên giao diện Frontend phải tự động ẩn/hiện hoặc chuyển sang trạng thái vô hiệu hóa dựa trên kết quả Polling thời gian thực của API Backend mà không yêu cầu người dùng phải tải lại trang (`F5`).
- Khi tiến hành kiểm thử stress-test mô phỏng hành vi bấm liên tục hoặc gửi nhiều request đồng thời cho cùng một mã đăng ký vé (`registrationId`), Database chỉ được phép ghi nhận một dòng dữ liệu duy nhất trong bảng `payments` ở trạng thái thành công.
- Pop-up thông báo thành công của SweetAlert2 phải đảm bảo chỉ hiển thị sau khi tiến trình Backend đã xác nhận cập nhật thành công trạng thái vé sang `confirmed` trong Database và tác vụ email đã nằm an toàn trong hàng đợi Redis.
- Quản trị viên (Organizer) có thể can thiệp thủ công để kiểm thử chức năng đóng/mở mạch ngắt và giả lập kịch bản sập cổng thanh toán thông qua API Admin quản trị `/admin/payment-gateway/toggle`.
