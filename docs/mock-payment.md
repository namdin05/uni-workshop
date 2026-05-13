# Bản thiết kế Triển khai: Hệ thống Thanh toán UniHub tích hợp Circuit Breaker & Chaos Toggle

**Mục tiêu:** Xây dựng luồng thanh toán giả lập (Mock Payment Gateway) với Circuit Breaker. Tích hợp tính năng Chaos Toggle (Bật/Tắt cổng thanh toán) dành riêng cho Admin trên UI để phục vụ Demo kiểm thử sự cố Timeout.

---

# 1. Yêu cầu Hệ thống & Thư viện

AI cần cài đặt và sử dụng các thư viện sau:

- `opossum`: Triển khai Circuit Breaker pattern.

```
npm install opossum
```

Lưu ý: Sử dụng axios

---

# 2. Tầng 1: Mock Gateway & Chaos Toggle (Admin Feature)

## Mục đích

Tạo cổng thanh toán giả lập trong Backend. Có một biến state để Admin đóng/mở cổng này thông qua UI (Toggle Switch).

---

## File cần tạo/sửa

```
api/mockGateway.api.js
```

---

## Logic cần triển khai

### State Variable

Tạo một biến global:

```
letisGatewayActive=true;
```

(Mặc định là cổng đang mở/NORMAL)

---

## Hàm 1: `toggleGatewayStatus(req, res)`

*(Dành cho Admin UI)*

### Chức năng

- Nhận boolean `isActive` từ `req.body`
- Cập nhật biến:

```
isGatewayActive=isActive;
```

### Response

Trả về HTTP `200`

```
{
  "success":true,
  "message":"Cổng thanh toán ĐÃ MỞ (NORMAL)"
}
```

Hoặc:

```
{
  "success":true,
  "message":"Cổng thanh toán ĐÃ TẮT (TIMEOUT)"
}
```

---

## Hàm 2: `processMockPayment(req, res)`

*(Dành cho System gọi nội bộ)*

### Logic

Đọc biến `isGatewayActive`.

---

### Nếu cổng TẮT (`false`)

Giả lập hệ thống treo:

```
awaitnewPromise(resolve =>setTimeout(resolve,5000));
```

Sau đó trả về lỗi:

```
408 Request Timeout
```

Ví dụ:

```
{
  "success":false,
  "message":"Payment Gateway Timeout"
}
```

---

### Nếu cổng MỞ (`true`)

Giả lập thanh toán thành công:

```
awaitnewPromise(resolve =>setTimeout(resolve,500));
```

Trả về HTTP `200` kèm `transaction_id` ngẫu nhiên.

Ví dụ:

```
{
  "success":true,
  "transaction_id":"TXN_123456789"
}
```

---

# 3. Tầng 2: Circuit Breaker & Xử lý Thanh toán

## Mục đích

Bảo vệ hệ thống đăng ký khi cổng thanh toán giả lập bị Admin TẮT (gây Timeout).

---

## File cần tạo/sửa

```
src/controllers/paymentController.js
```

---

## Logic cần triển khai

# Setup Circuit Breaker

Dùng `opossum` bao bọc hàm gọi:

```
axios.post(...)
```

tới API:

```
http://localhost:<PORT>/api/mock-gateway/pay
```

---

## Cấu hình Circuit Breaker

```
{
timeout:3000,
errorThresholdPercentage:50,
resetTimeout:10000
}
```

### Ý nghĩa

- `timeout: 3000`
    - Nếu request quá 3 giây → tính là Timeout Error
- `errorThresholdPercentage: 50`
    - Nếu hơn 50% request lỗi → breaker OPEN
- `resetTimeout: 10000`
    - Sau 10 giây breaker thử HALF-OPEN

---

## Fallback

Khai báo:

```
breaker.fallback(() => {
return {
        status:'error',
        message:'Cổng thanh toán đang bảo trì. Vui lòng thử lại sau.'
    };
});
```

---

## Hàm 3: `createPaymentOrder(req, res)`

*(Dành cho Sinh viên bấm Đăng ký)*

### Yêu cầu quan trọng

Luôn insert thông tin vé vào DB với trạng thái:

```
pending
```

trước khi gọi thanh toán để đảm bảo:

```
Idempotency
```

---

## Luồng xử lý

### Bước 1

Insert order vào DB:

```
status:'pending'
```

---

### Bước 2

Gọi:

```
paymentBreaker.fire(req.body)
```

---

### Bước 3

Nếu breaker trả về fallback error:

Phản hồi:

```
503 Service Unavailable
```

Ví dụ:

```
{
  "success":false,
  "message":"Cổng thanh toán đang bảo trì. Vui lòng thử lại sau."
}
```

---

### Bước 4

Nếu thanh toán thành công:

Phản hồi:

```
200 OK
```

Ví dụ:

```
{
  "success":true,
  "message":"Thanh toán thành công"
}
```

---

# 4. Tầng 3: Định tuyến & Phân quyền (Routes)

## Mục đích

Khai báo Endpoint. Route của Admin bắt buộc phải được bảo vệ bởi Token.

---

## File cần tạo/sửa

```
src/routes/paymentRoutes.js
```

---

# Logic cần triển khai

## Route Gateway nội bộ (Internal)

```
POST /api/mock-gateway/pay
```

→ gọi:

```
processMockPayment
```

---

## Route Sinh viên (Public / Token Student)

```
POST /api/payment/create
```

→ gọi:

```
createPaymentOrder
```

---

## Route Admin (Protected)

*(Gọi từ nút Toggle trên giao diện)*

```
POST /api/admin/payment-gateway/toggle
```

→ gọi:

```
toggleGatewayStatus
```

---

## Middleware bắt buộc

Bọc qua middleware xác thực hiện có của dự án:

```
verifyToken
authorizeRole(['organizer'])
```

---

# 5. Yêu cầu Coding Standards

- Viết bằng **ES Modules** (`import/export`)
- Chia code rõ ràng thành:
    - Controllers (Mock Gateway)
    - Controllers (Payment)
    - Routes
- Sử dụng:

```
awaitnewPromise(resolve =>setTimeout(resolve,ms));
```

để delay bất đồng bộ, tránh block Event Loop của Node.js.