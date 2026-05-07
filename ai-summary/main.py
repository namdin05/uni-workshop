import asyncio
import os
from dotenv import load_dotenv
from bullmq import Worker

# Load biến môi trường từ file .env
load_dotenv()

# Lấy URL Redis (Đổi rediss:// thành redis:// nếu thư viện yêu cầu bóc tách url, 
# nhưng với Upstash dùng rediss:// trong biến môi trường là chuẩn nhất)
redis_url = os.getenv("REDIS_URL")

async def process_pdf_job(job, job_token):
    """
    Hàm này sẽ tự động chạy mỗi khi có 1 job mới được đẩy vào Queue
    """
    print(f"\n[AI WORKER] 🚀 Nhận được yêu cầu mới! Job ID: {job.id}")
    
    try:
        # Lấy data do Express gửi sang
        workshop_id = job.data.get('workshopId')
        file_path = job.data.get('filePath')
        
        print(f"[-] Đang xử lý workshop ID: {workshopId}")
        print(f"[-] Đường dẫn file PDF: {file_path}")
        
        # TODO: Sẽ viết code đọc PDF bằng PyMuPDF ở đây
        await asyncio.sleep(2) # Giả lập thời gian AI đang suy nghĩ...
        
        # TODO: Sẽ viết code gọi API tóm tắt ở đây
        
        print(f"[AI WORKER] ✅ Xử lý xong Job {job.id}!\n")
        return "Hoàn thành tóm tắt"
        
    except Exception as e:
        print(f"[AI WORKER] ❌ Lỗi xử lý Job {job.id}: {str(e)}")
        raise e

async def main():
    print("=========================================")
    print("🤖 AI Summary Worker đang khởi động...")
    print("=========================================")
    
    # Thêm dòng này để kiểm tra xem .env đã load thành công chưa
    if not redis_url:
        print("❌ LỖI: Không tìm thấy REDIS_URL! Hãy kiểm tra lại file .env")
        return
    
    # Cấu hình kết nối CHUẨN của BullMQ Python (Sử dụng key "connection")
    redis_opts = {
        "connection": redis_url
    }
    
    # Khởi tạo Worker
    worker = Worker("pdf-summary-queue", process_pdf_job, redis_opts)
    
    print("✅ Đã kết nối Redis Upstash! Đang chờ việc (Bấm Ctrl+C để thoát)...")
    
    # Vòng lặp vô hạn để giữ script luôn chạy
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Worker đã tắt an toàn.")