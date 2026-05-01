import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { PrimaryButton } from '../components/Button';
import { Badge } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBox from '../components/ErrorBox';
import { workshopService } from '../services/api';
import { formatVND, formatDate, isRegistrationOpen, hasAvailableSeats } from '../utils/formatters';

export default function WorkshopList() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workshopService.getWorkshops();
      setWorkshops(data);
    } catch (err) {
      setError('Không thể tải danh sách workshop. Vui lòng thử lại.');
      console.error('Error fetching workshops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (workshop) => {
    if (isRegistrationOpen(workshop) && hasAvailableSeats(workshop.availableSeats)) {
      setSelectedWorkshop(workshop);
      // In a real app, navigate to checkout page
      window.location.href = `/workshop/${workshop.id}/checkout`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Workshop</h1>
          <p className="text-gray-600 text-lg">Khám phá và đăng ký các workshop chất lượng cao</p>
        </div>

        {error && (
          <div className="mb-8">
            <ErrorBox
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* Workshop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workshops.map((workshop) => {
            const isOpen = isRegistrationOpen(workshop);
            const hasSeats = hasAvailableSeats(workshop.availableSeats);
            const canRegister = isOpen && hasSeats;

            return (
              <div
                key={workshop.id}
                className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-200"
              >
                {/* Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-slate-900 to-slate-700 rounded-t-2xl flex items-center justify-center">
                  <span className="text-white text-5xl">📚</span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{workshop.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow line-clamp-3">{workshop.description}</p>

                  {/* Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Giảng viên:</span>
                      <span className="font-medium text-slate-900 text-sm">{workshop.speaker_name || workshop.instructor || 'Chưa xác định'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Ngày:</span>
                      <span className="font-medium text-slate-900 text-sm">{formatDate(workshop.start_time || workshop.date)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Giá:</span>
                      <span className="font-bold text-slate-900 text-sm">{formatVND(workshop.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Chỗ trống:</span>
                      <Badge variant={hasSeats ? 'success' : 'error'} className="rounded-full px-3 py-1 text-xs tracking-wide font-bold uppercase">
                        {hasSeats ? `${workshop.availableSeats ?? workshop.available_seats} chỗ` : 'Hết chỗ'}
                      </Badge>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-6">
                    {!isOpen && (
                      <Badge variant="warning" className="w-full text-center justify-center rounded-full px-4 py-2 text-xs tracking-wide font-bold uppercase">
                        Chưa mở đăng ký
                      </Badge>
                    )}
                    {isOpen && !hasSeats && (
                      <Badge variant="error" className="w-full text-center justify-center rounded-full px-4 py-2 text-xs tracking-wide font-bold uppercase">
                        Đã hết chỗ
                      </Badge>
                    )}
                  </div>

                  {/* Register Button */}
                  <PrimaryButton
                    onClick={() => handleRegisterClick(workshop)}
                    disabled={!canRegister}
                    className="w-full py-3.5 rounded-xl font-medium transition-all duration-200"
                  >
                    {!isOpen && 'Chưa mở đăng ký'}
                    {isOpen && !hasSeats && 'Đã hết chỗ'}
                    {canRegister && 'Đăng ký'}
                  </PrimaryButton>
                </div>
              </div>
            );
          })}
        </div>

        {workshops.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center py-16">
            <p className="text-gray-600 text-lg">Chưa có workshop nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
