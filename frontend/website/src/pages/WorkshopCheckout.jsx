import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { PrimaryButton } from '../components/Button';
import { Badge } from '../components/Badge';
import InputField from '../components/InputField';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBox from '../components/ErrorBox';
import SuccessBox from '../components/SuccessBox';
import { workshopService } from '../services/api';
import { formatVND, formatDate } from '../utils/formatters';

export default function WorkshopCheckout() {
  const { workshopId } = useParams();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState('confirm'); // 'confirm' -> 'payment' -> 'success'

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchWorkshopDetails();
  }, [workshopId]);

  const fetchWorkshopDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workshopService.getWorkshopById(workshopId);
      setWorkshop(data);
    } catch (err) {
      setError('Không thể tải thông tin workshop. Vui lòng thử lại.');
      console.error('Error fetching workshop:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRegisterClick = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Register for workshop
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };

      const response = await workshopService.registerWorkshop(workshopId, registrationData);

      if (response.success) {
        // Store registration ID for payment flow
        sessionStorage.setItem('registrationId', response.registrationId);
        setStep('payment');
        setSuccess('Đã giữ chỗ thành công! Tiến hành thanh toán.');
      } else {
        setError(response.message || 'Lỗi khi đăng ký. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đăng ký. Vui lòng thử lại.');
      console.error('Error registering workshop:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentClick = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const registrationId = sessionStorage.getItem('registrationId');
      const paymentData = {
        amount: workshop.price,
        workshopId: workshopId,
        redirectUrl: `${window.location.origin}/workshop/${workshopId}/success`,
      };

      const response = await workshopService.initiatePayment(registrationId, paymentData);

      if (response.paymentUrl) {
        // Redirect to payment gateway
        //window.location.href = response.paymentUrl; 
        window.location.href = paymentData.redirectUrl; // For testing, redirect to success page directly
      } else {
        setError('Không thể khởi tạo thanh toán. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thanh toán. Vui lòng thử lại.');
      console.error('Error initiating payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center py-16">
            <p className="text-gray-600 text-lg">Workshop không tồn tại</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/workshops')}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-3 text-white font-medium shadow-lg shadow-slate-900/10 mb-6 transition-all duration-200 hover:from-slate-800 hover:to-slate-700"
          >
            ← Quay lại
          </button>
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-white text-sm font-semibold mb-5 shadow-[0_16px_40px_rgb(15,23,42,0.08)]">
            Bước 1 / 2: Xác nhận thông tin
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Đăng ký Workshop</h1>
          <p className="text-gray-600 text-lg">Hoàn tất đăng ký và thanh toán cho workshop của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6">
                <ErrorBox
                  message={error}
                  onClose={() => setError(null)}
                />
              </div>
            )}

            {success && (
              <div className="mb-6">
                <SuccessBox
                  message={success}
                  onClose={() => setSuccess(null)}
                />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
              {step === 'confirm' && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">Thông tin cá nhân</h2>

                  <div className="space-y-6 mb-8">
                    <InputField
                      label="Họ và tên"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nhập họ và tên"
                      error={formErrors.fullName}
                    />

                    <InputField
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Nhập email"
                      error={formErrors.email}
                    />

                    <InputField
                      label="Số điện thoại"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại"
                      error={formErrors.phone}
                    />
                  </div>

                  <PrimaryButton
                    onClick={handleRegisterClick}
                    loading={submitting}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl font-medium transition-all duration-200"
                  >
                    Tiếp tục thanh toán
                  </PrimaryButton>
                </>
              )}

              {step === 'payment' && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">Xác nhận thanh toán</h2>

                  <div className="bg-slate-50 rounded-xl p-6 mb-8 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Tên workshop:</span>
                      <span className="font-medium text-slate-900">{workshop.title}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Giá:</span>
                      <span className="font-bold text-slate-900">{formatVND(workshop.price)}</span>
                    </div>
                    <div className="pt-3 flex justify-between items-center">
                      <span className="font-medium text-slate-900 text-lg">Tổng cộng:</span>
                      <span className="font-bold text-2xl text-slate-900">{formatVND(workshop.price)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Bấm nút dưới để chuyển đến cổng thanh toán an toàn
                  </p>

                  <PrimaryButton
                    onClick={handlePaymentClick}
                    loading={submitting}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl font-medium transition-all duration-200"
                  >
                    Thanh toán
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div>
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 sticky top-4">
              <div className="w-full h-40 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl mb-6 flex items-center justify-center">
                <span className="text-white text-6xl">📚</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">{workshop.title}</h3>

              <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-gray-600 text-sm mb-1">Giảng viên</p>
                  <p className="font-medium text-slate-900">{workshop.speaker_name || workshop.instructor || 'Chưa xác định'}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-gray-600 text-sm mb-1">Ngày giờ</p>
                  <p className="font-medium text-slate-900">{formatDate(workshop.start_time || workshop.date || new Date())}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-gray-600 text-sm mb-1">Địa điểm</p>
                  <p className="font-medium text-slate-900">{workshop.location || 'Chưa xác định'}</p>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Giá:</span>
                  <span className="text-3xl font-bold text-slate-900">{formatVND(workshop.price)}</span>
                </div>
              </div>

              <Badge variant="success" className="w-full text-center justify-center rounded-full px-4 py-2 text-xs tracking-wide font-bold uppercase">
                {workshop.availableSeats} chỗ còn lại
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
