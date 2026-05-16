# UniHub Workshop — Project Proposal

## Vấn đề
Hiện tại, Ban tổ chức (BTC) "Tuần lễ kỹ năng và nghề nghiệp" tại trường Đại học đang quản lý toàn bộ quy trình đăng ký tham gia hội thảo (workshop) bằng các công cụ thủ công như Google Form và gửi email xác nhận bằng tay. Quy trình này đã bộc lộ những hạn chế chí mạng khi quy mô sự kiện ngày càng mở rộng (diễn ra liên tục trong 5 ngày, mỗi ngày có từ 8–12 workshop song song tại nhiều hội trường khác nhau):

- **Tắc nghẽn dữ liệu và Overbooking:** Google Form không có cơ chế chặn giới hạn chỗ ngồi theo thời gian thực (realtime synchronization). Đối với các workshop giới hạn 60 chỗ nhưng có hàng trăm sinh viên truy cập cùng lúc, hệ thống cũ hoàn toàn bất lực trong việc ngăn chặn tình trạng "vỡ trận" số lượng đăng ký, dẫn đến tranh chấp chỗ ngồi trên thực tế.
- **Quá tải và sập luồng xử lý:** Quy trình gửi email thủ công tạo ra độ trễ cực kỳ lớn. Ban tổ chức không thể phát hành vé điện tử kịp thời, dẫn đến việc sinh viên không có thông tin phòng học hoặc mã kiểm duyệt khi đến cửa phòng.
- **Kiểm soát check-in thủ công lạc hậu:** Việc đối chiếu danh sách sinh viên bằng giấy hoặc file Excel tại cửa phòng thi đấu/hội trường gây ra hiện tượng ùn ứ nghiêm trọng trước giờ G, đặc biệt là tại các khu vực có sóng Wi-Fi hoặc mạng di động không ổn định trong khuôn viên trường.

## Mục tiêu
Dự án **UniHub Workshop** được xây dựng nhằm số hóa toàn diện chuỗi quy trình từ khâu thiết lập sự kiện, phân phối vé (Miễn phí & Trả phí), phát hành vé điện tử tự động đến khâu quét mã check-in tại lớp học. Hệ thống được thiết kế hướng tới các mục tiêu định lượng và kỹ thuật cốt lõi sau:

- **Khả năng chịu tải cực hạn (High-Availability):** Hệ thống phải sống sót và phản hồi mượt mà trước tải trọng đột biến ước tính khoảng **12.000 sinh viên truy cập trong 10 phút đầu tiên** khi mở cổng đăng ký, trong đó áp lực đỉnh điểm chiếm **60% lưu lượng (~7.200 request) dồn dập đổ về chỉ trong 3 phút đầu tiên**.
- **Tính nhất quán dữ liệu tuyệt đối:** Đảm bảo thời gian xử lý giữ chỗ (seat reservation) diễn ra trong vài mili-giây, tuyệt đối không để xảy ra hiện tượng hai sinh viên cùng đặt thành công chỗ cuối cùng của một workshop.
- **Tự động hóa vận hành:** Cắt giảm 100% các tác vụ thủ công bằng cách tự động hóa luồng trích xuất dữ liệu, xử lý tóm tắt nội dung hội thảo bằng trí tuệ nhân tạo (AI), và phát hành vé QR Code độc lập qua hàng đợi ngầm.

## Người dùng và nhu cầu
Hệ thống UniHub Workshop tập trung giải quyết triệt để nhu cầu của 3 nhóm đối tượng mục tiêu:

- **Sinh viên:**
  - *Nhu cầu:* Tra cứu lịch trình trực quan, theo dõi số lượng chỗ trống realtime, đăng ký và thanh toán an toàn, lưu trữ vé điện tử tập trung.
  - *Điều quan trọng nhất:* Giao diện mượt mà, phản hồi ngay lập tức khi giật vé (booking), không bị trừ tiền hai lần và dễ dàng xuất trình mã QR để vào phòng.
- **Ban tổ chức (Organizer / Admin):**
  - *Nhu cầu:* Khởi tạo, điều chỉnh (đổi phòng, đổi giờ, hủy) workshop nhanh chóng; upload tài liệu PDF giới thiệu để hệ thống tự động tóm tắt nội dung; theo dõi báo cáo thống kê số lượng đăng ký.
  - *Điều quan trọng nhất:* Tiết kiệm thời gian soạn thảo nội dung nhờ AI, dữ liệu hiển thị chính xác và hệ thống quản trị nội bộ bảo mật, phân quyền nghiêm ngặt.
- **Nhân sự check-in tại cửa phòng (Staff):**
  - *Nhu cầu:* Sử dụng ứng dụng di động để quét mã QR Code trên vé của sinh viên một cách nhanh chóng tại cửa phòng.
  - *Điều quan trọng nhất:* Tốc độ quét dưới 1 giây, ứng dụng phải hoạt động ổn định ngay cả khi đi vào các vùng mất sóng, rớt mạng (Offline-first) mà không làm mất dữ liệu kiểm duyệt.

## Phạm vi
### Những gì THUỘC phạm vi đồ án:
- **Hệ thống Web Fullstack hoàn chỉnh:** Xây dựng ứng dụng Frontend bằng React và hệ thống RESTful API bằng Node.js kết hợp với cơ sở dữ liệu Supabase (PostgreSQL).
- **Kiến trúc chịu tải và xử lý bất đồng bộ:** Hiện thực hóa tầng Caching số ghế bằng Redis, điều phối tác vụ nặng (gửi email, Telegram) bằng Message Queue (BullMQ).
- **Module xử lý sự cố & Mạch ngắt:** Cài đặt các cơ chế phòng vệ hệ thống bao gồm Rate Limiting để chặn spam request, Idempotency Key bảo vệ giao dịch, và Circuit Breaker (`opossum`) bọc cổng thanh toán.
- **Tích hợp mô hình AI và Đồng bộ một chiều:** Xử lý file PDF bất đồng bộ thông qua mô hình ngôn ngữ lớn (LLM) và nạp dữ liệu sinh viên định kỳ thông qua cơ chế đọc/xử lý file CSV từ hệ thống cũ.

### Những gì KHÔNG thuộc phạm vi đồ án:
- **Tích hợp cổng thanh toán thật:** Hệ thống chỉ tích hợp cổng thanh toán giả lập (`Mock Payment Gateway`) để mô phỏng chính xác các kịch bản lỗi hệ thống (Timeout, sập mạng) nhằm kiểm thử Circuit Breaker, không kết nối với ngân hàng hoặc ví điện tử thật ở môi trường Production.
- **Hạ tầng Production quy mô lớn:** Không bao gồm việc cấu hình hạ tầng phân tán đa vùng trên AWS/Azure hoặc cấu hình CI/CD tự động lên các cụm Kubernetes phức tạp trên thực tế.

## Rủi ro và ràng buộc
Đồ án nhận diện và chủ động đưa ra các giải pháp kiến trúc để đối đầu với 5 rủi ro công nghệ lớn sau:

1. **Tranh chấp chỗ ngồi (Race Condition):** Khi hàng ngàn sinh viên cùng nhấn nút đăng ký một workshop sắp hết chỗ. Hệ thống không sử dụng cơ chế khóa bi quan (Pessimistic Locking `FOR UPDATE`) gây nghẽn Database, mà ràng buộc áp dụng cơ chế điều khiển kiểm tra đồng thời (Optimistic Concurrency Control) thông qua các câu lệnh cập nhật nguyên tử (Atomic Update) kết hợp với việc kiểm tra và trừ số ghế realtime trên bộ nhớ đệm Redis (`workshopSeatKey`). Điều này đảm bảo tốc độ xử lý ở mức mili-giây và tính nhất quán dữ liệu tuyệt đối mà không làm treo hệ thống.
2. **Tải trọng đột biến (Spike Load):** Lượng truy cập khổng lồ trong những phút đầu có thể làm nghẽn Event Loop của Node.js. Ràng buộc hệ thống phải áp dụng middleware Rate Limiting để giới hạn tần suất gửi request từ phía Client và bảo vệ tài nguyên Database.
3. **Cổng thanh toán không ổn định:** Hệ thống bên thứ ba có thể bị chậm hoặc sập kéo dài. Hệ thống áp dụng mẫu thiết kế Circuit Breaker để cô lập lỗi, thực hiện suy giảm tính năng có kiểm soát (Graceful Degradation) - khóa chức năng thanh toán trên giao diện UI để tránh làm sập lây lan sang các tính năng xem lịch workshop khác.
4. **Check-in Offline:** Nhân sự quét mã tại các phòng hầm hoặc khu vực mất mạng di động. Ứng dụng phải ràng buộc thiết kế lưu trữ dữ liệu tạm thời tại Local Storage của thiết bị và có cơ chế tự động đồng bộ (Sync) lên Server ngay khi phát hiện có kết nối mạng trở lại.
5. **Tích hợp một chiều với hệ thống cũ (CSV Integration):** Do hệ thống cũ không cung cấp API công khai, UniHub Workshop phải ràng buộc thiết kế một luồng xử lý file CSV được nạp định kỳ vào ban đêm. Luồng này phải có khả năng bóc tách dữ liệu lỗi, loại bỏ trùng lặp và ghi nhận log rõ ràng mà không gây ảnh hưởng đến hiệu năng hay làm gián đoạn các dịch vụ đang chạy của hệ thống.