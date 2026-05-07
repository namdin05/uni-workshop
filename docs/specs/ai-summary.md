# Đặc tả: Tóm tắt tài liệu tự động (AI Summary)
## Mô tả
Tự động hóa việc trích xuất và tóm tắt nội dung cốt lõi từ tài liệu hội thảo (định dạng PDF) sử dụng Trí tuệ nhân tạo (AI). Chức năng giúp Ban tổ chức (Organizer/Admin) tiết kiệm thời gian soạn thảo nội dung, tự động tạo ra bản tóm tắt ngắn gọn, chuyên nghiệp để sinh viên dễ dàng nắm bắt thông tin trước khi đăng ký.

## Luồng chính
- Tải tệp tin (Frontend): Ban tổ chức chọn file PDF tài liệu (syllabus/slide) trên giao diện Modal Create New Workshop. Giao diện chuyển sang trạng thái chờ ("AI đang đọc và tóm tắt tài liệu...").
- Tiếp nhận & Xếp hàng (Node.js Backend): Server nhận file, tiến hành tạo một tác vụ (Job) bất đồng bộ và đẩy vào hệ thống Message Queue (Redis/BullMQ). Server lập tức trả về mã Job ID cho Frontend mà không cần đợi AI xử lý xong.
- Xử lý ngầm (Python AI Worker):
  + Worker độc lập nhận Job từ hàng đợi và tiến hành trích xuất văn bản từ file PDF.
  + Gửi dữ liệu kèm Prompt yêu cầu tóm tắt đến API của Groq (Model: llama-3.1-8b-instant).
  + Nhận kết quả trả về, Worker cập nhật trạng thái Job thành "completed" kèm theo nội dung tóm tắt lên Redis.
- Cập nhật giao diện (Polling): Giao diện liên tục gọi API (mỗi 2 giây) để hỏi thăm trạng thái của Job ID. Khi nhận được trạng thái "completed", Frontend lấy dữ liệu và tự động điền vào ô textbox AI Summary trên form.

## Kịch bản lỗi
- AI Worker ngưng hoạt động: Tác vụ bị kẹt ở trạng thái "waiting" trong hàng đợi. Trình duyệt vẫn tiếp tục Polling và hiển thị "AI đang đọc và tóm tắt tài liệu...". Tác vụ sẽ tự động được xử lý ngay khi Worker được khởi động lại mà không bị mất dữ liệu.
- Lỗi từ dịch vụ AI (Groq API): Nếu API bị lỗi (do quá hạn mức - rate limit, hoặc model ngưng hỗ trợ), Worker sẽ bắt lỗi (catch exception), đánh dấu Job là "failed". Frontend nhận được phản hồi này sẽ dừng Polling và hiển thị Alert thông báo: "Có lỗi xảy ra khi AI xử lý tài liệu!".
- File không hợp lệ: Backend từ chối ngay lập tức nếu định dạng file không đúng (.pdf) hoặc vượt quá giới hạn dung lượng (VD: 10MB), gửi mã lỗi 400 về cho Frontend.

## Ràng buộc
- Giới hạn đầu ra: Kết quả tóm tắt bắt buộc phải ngắn gọn, súc tích (dưới dạng gạch đầu dòng). Cấu hình giới hạn cứng bằng tham số max_tokens để tránh AI sinh ra văn bản quá dài làm vỡ giao diện (UI) hoặc tốn kém chi phí.
- Kiến trúc hệ thống: Bắt buộc áp dụng cơ chế hàng đợi bất đồng bộ (Message Queue) để tách rời luồng xử lý AI nặng nề ra khỏi luồng xử lý chính của Node.js, đảm bảo Backend không bị nghẽn (block) khi có nhiều Admin cùng tải file lên một lúc.
- Lưu trữ dữ liệu: Dữ liệu tóm tắt AI phải được lưu độc lập vào trường ai_summary trong Database, không ghi đè lên nội dung do Admin tự nhập tay ở trường description.

## Tiêu chí chấp nhận
- Nút bấm và ô nhập liệu chuyển sang trạng thái Loading (vô hiệu hóa tương tác) với thông báo rõ ràng trong suốt quá trình AI xử lý.
- Văn bản tóm tắt tự động hiển thị mượt mà vào đúng ô AI Summary ngay khi xử lý thành công mà không cần người dùng tải lại trang web.
- Có thể lưu thành công toàn bộ dữ liệu Workshop (bao gồm cả bản tóm tắt AI) vào cơ sở dữ liệu khi nhấn nút "Create Workshop".