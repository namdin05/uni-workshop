import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { PrimaryButton } from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { workshopService } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function PaymentSuccess() {
  const { workshopId } = useParams();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegistrationAndQR();
  }, [workshopId]);

  const fetchRegistrationAndQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const registrationId = sessionStorage.getItem('registrationId');
      if (!registrationId) {
        setError('Không tìm thấy thông tin đăng ký');
        return;
      }

      // Fetch registration details
      const regData = await workshopService.getRegistration(registrationId);
      setRegistration(regData);

      // Fetch QR code
      const qrData = await workshopService.getQRCode(registrationId);
      setQrCode(qrData);

      // Clear session storage
      sessionStorage.removeItem('registrationId');
    } catch (err) {
      setError('Lỗi khi tải thông tin. Vui lòng liên hệ hỗ trợ.');
      console.error('Error fetching registration:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center py-16">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Có lỗi xảy ra</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <PrimaryButton
              onClick={() => navigate('/workshops')}
              className="py-3.5 rounded-xl font-medium transition-all duration-200"
            >
              Quay lại danh sách workshop
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 text-center">
          {/* Success Icon */}
          <div className="text-7xl mb-6">✅</div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">Đăng ký thành công!</h1>
          <p className="text-gray-600 text-lg mb-12">Vé của bạn đã được xác nhận. Mã QR dưới đây là vé vào cửa.</p>

          {/* QR Code */}
          {qrCode && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-12 inline-block shadow-[0_4px_20px_rgb(0,0,0,0.08)]">
              <img
                src={qrCode.imageUrl}
                alt="QR Code"
                className="w-56 h-56"
              />
              <p className="text-sm text-gray-600 mt-6 font-medium">ID: {qrCode.code}</p>
            </div>
          )}

          {/* Registration Details */}
          {registration && (
            <div className="bg-slate-50 rounded-2xl p-8 mb-8 text-left">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Thông tin vé</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Họ và tên:</span>
                  <span className="font-medium text-slate-900">{registration.fullName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-slate-900">{registration.email}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Số điện thoại:</span>
                  <span className="font-medium text-slate-900">{registration.phone}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Workshop:</span>
                  <span className="font-medium text-slate-900">{registration.workshopTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ngày:</span>
                  <span className="font-medium text-slate-900">{formatDate(registration.workshopDate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8 mb-12 text-left">
            <h3 className="font-bold text-blue-900 mb-4 text-lg">📋 Hướng dẫn</h3>
            <ul className="text-sm text-blue-900 space-y-2 list-disc list-inside">
              <li>Chuẩn bị mã QR trước khi tham dự workshop</li>
              <li>Đến sớm 10 phút để check-in</li>
              <li>Mang theo CCCD hoặc thẻ sinh viên</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <PrimaryButton
              onClick={() => navigate('/workshops')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-lg shadow-slate-900/10 font-medium transition-all duration-200 hover:from-slate-800 hover:to-slate-700"
            >
              Quay lại danh sách workshop
            </PrimaryButton>
            {qrCode && (
              <button
                onClick={() => window.print()}
                className="w-full px-6 py-3.5 rounded-xl border-2 border-gray-300 text-gray-900 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                In vé
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
