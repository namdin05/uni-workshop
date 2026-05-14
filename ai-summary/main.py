import os
import asyncio
import requests
import fitz
from groq import Groq
from io import BytesIO
from bullmq import Worker
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

async def process_pdf_job(job, job_token): 
    workshop_id = job.data.get('workshopId') 
    file_url = job.data.get('fileUrl')
    
    print(f"[*] Đang xử lý tài liệu cho Workshop ID: {workshop_id}")
    
    try:
        # 1. Tải file PDF từ Supabase Storage 
        response = requests.get(file_url)
        response.raise_for_status()
        
        # 2. Trích xuất text 
        pdf_data = BytesIO(response.content)
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        text_content = "".join([page.get_text() for page in doc])
        doc.close()

        # 3. Gọi Groq AI tóm tắt 
        print("[-] Đang gọi Groq AI tóm tắt nội dung...")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Hãy tóm tắt nội dung hội thảo sau đây một cách chuyên nghiệp để hiển thị trên website. Trình bày súc tích dưới dạng đoạn văn hoặc 3 gạch đầu dòng không quá 200 từ"
                },
                {
                    "role": "user",
                    "content": f"Tài liệu hội thảo:\n\n{text_content[:20000]}"
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )
        
        summary_result = chat_completion.choices[0].message.content

        # 4. CẬP NHẬT TRỰC TIẾP VÀO CỘT DESCRIPTION 
        if workshop_id:
            print(f"[-] Đang cập nhật database cho workshop {workshop_id}...")
            supabase.table("workshops").update({"description": summary_result}).eq("id", workshop_id).execute()
        else:
            print(f"[-] Đang tạo mới workshop.")
            
        print(f"[+] Hoàn thành quá trình tóm tắt!")
        
        return {"summary": summary_result}

    except Exception as e:
        print(f"[!] Lỗi Worker: {str(e)}")
        raise e

async def main():
    redis_url = os.getenv("REDIS_URL")
    print("🚀 Python AI Worker đang trực chờ (Update description mode)...")
    
    worker = Worker(
        "pdf-summary-queue", 
        process_pdf_job, 
        {"connection": redis_url}
    )
    
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())