import { mailTransport, mailFrom } from '../utils/mailer.js';
import QRCode from 'qrcode';

export class EmailStrategy {

    async send(user, workshopData) {
        try {
            const qrImageBuffer = await QRCode.toBuffer(String(workshopData.qrCode || 'TICKET_ERROR'));
            
            const mailOptions = {
                from: mailFrom,
                to: user.email,
                subject: `[Xác nhận] Đăng ký thành công workshop: ${workshopData.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #2c3e50;">Chào ${user.full_name},</h2>
                        <p>Bạn đã đăng ký và thanh toán thành công Workshop: <b>${workshopData.title}</b>.</p>
                        <ul>
                            <li><b>Thời gian:</b> ${workshopData.time}</li>
                            <li><b>Địa điểm:</b> ${workshopData.location}</li>
                        </ul>
                        <p>Mã QR vé điện tử của bạn có thể xem trên mục Hồ sơ của ứng dụng Web.</p>
                        <hr>
                        <p style="color: #7f8c8d; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: 'ticket-qr.png',
                        content: qrImageBuffer,
                        cid: 'ticket_qr_code' // CID này phải khớp với dòng src="cid:..." ở trên
                    }
                ]
            };

            await mailTransport.sendMail(mailOptions);
            console.log(`✅ [Email Strategy] Đã gửi email vé cho: ${user.email}`);
        } catch (error) {
            console.error(`❌ [Email Strategy] Lỗi khi gửi mail:`, error.message);
        }
    }
}