import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode.react';
import { loadSession, fetchMyRegistrations } from '../api/auth';
import { Link } from 'react-router-dom';

export default function MyTickets() {
  const session = loadSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Tab hiện tại
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'attended' | 'missed'

  // Load registrations on mount
  useEffect(() => {
    if (!session?.token) {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadRegistrations() {
      try {
        const data = await fetchMyRegistrations(session.token);
        if (active) {
          setTickets(data.registrations || []);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load registrations:', err);
          setTickets([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRegistrations();
    return () => { active = false; };
  }, [session]);

  // Logic phân loại vé dựa trên thời gian thực tế và trạng thái điểm danh
  const filteredTickets = useMemo(() => {
    const now = new Date(); // Lấy thời gian hiện tại để so sánh

    return tickets.filter(ticket => {
      const workshop = ticket.workshops;
      if (!workshop) return false;

      // Giả sử nếu không có end_time, cho mặc định một thời gian ở tương lai để không bị lỗi
      const endTime = workshop.end_time ? new Date(workshop.end_time) : new Date(now.getTime() + 86400000); 
      
      const isCheckedIn = ticket.status === 'checked_in' || ticket.checked_in_at;
      const isExpired = now > endTime; // Nếu thời gian hiện tại vượt qua thời gian kết thúc

      if (activeTab === 'active') {
        // Active: Chưa điểm danh VÀ chưa hết thời gian
        return !isCheckedIn && !isExpired;
      }
      if (activeTab === 'attended') {
        // Attended: Đã điểm danh thành công
        return isCheckedIn;
      }
      if (activeTab === 'missed') {
        // Missed: Chưa điểm danh VÀ đã quá thời gian kết thúc
        return !isCheckedIn && isExpired;
      }
      return false;
    });
  }, [tickets, activeTab]);

  if (!session) {
    return <div className="px-8 py-12 text-on-surface-variant text-center mt-10">Please sign in to view your tickets.</div>;
  }

  return (
    <main className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-24 space-y-6 md:space-y-8">
      {/* Header Profile Section */}
      <section className="rounded-3xl border border-outline-variant bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/20 p-6 md:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary-fixed/50 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-primary-fixed bg-surface-container shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[36px]">person</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary-container mb-2">My Learning</p>
                <h1 className="font-h1 text-h1 text-on-surface">{session.profile?.full_name || 'Student'}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  ID: {session.profile?.student_id || 'Pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[18px]">email</span>
                  {session.profile?.email || 'No email provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Tabs & Ticket List */}
      <section className="space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-2xl w-fit border border-outline-variant">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-xl font-label-md text-label-md transition-all ${activeTab === 'active' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
          >
            Active Tickets
          </button>
          <button 
            onClick={() => setActiveTab('attended')}
            className={`px-5 py-2.5 rounded-xl font-label-md text-label-md transition-all ${activeTab === 'attended' ? 'bg-surface shadow-sm text-emerald-700' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
          >
            Đã tham gia
          </button>
          <button 
            onClick={() => setActiveTab('missed')}
            className={`px-5 py-2.5 rounded-xl font-label-md text-label-md transition-all ${activeTab === 'missed' ? 'bg-surface shadow-sm text-rose-700' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
          >
            Đã bỏ lỡ
          </button>
        </div>

        {/* Ticket List Render */}
        {loading ? (
          <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading your tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          /* Empty States tùy chỉnh theo Tab */
          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-16 text-center shadow-sm flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">
              {activeTab === 'active' ? 'local_activity' : activeTab === 'attended' ? 'school' : 'event_busy'}
            </span>
            <p className="text-on-surface-variant font-medium text-lg mb-2">
              {activeTab === 'active' ? 'Bạn không có vé nào sắp diễn ra.' 
                : activeTab === 'attended' ? 'Bạn chưa hoàn thành workshop nào.' 
                : 'Thật tuyệt, bạn chưa bỏ lỡ buổi học nào!'}
            </p>
            {activeTab !== 'missed' && (
              <Link to="/workshops" className="text-primary font-semibold hover:underline mt-2">Tìm kiếm Workshop mới</Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredTickets.map((ticket) => {
              const workshop = ticket.workshops;
              const startDate = new Date(workshop.start_time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const startTime = new Date(workshop.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const isLocked = ticket.status === 'pending_payment';

              return (
                <article
                  key={ticket.id}
                  className={`overflow-hidden rounded-3xl border shadow-sm transition-colors 
                    ${activeTab === 'missed' ? 'border-outline-variant bg-surface opacity-80 grayscale-[30%]' : 'border-outline-variant bg-surface-container-lowest hover:border-primary-fixed-dim'}
                  `}
                >
                  <div className={`grid grid-cols-1 ${activeTab === 'active' ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : 'lg:grid-cols-[minmax(0,1fr)_auto]'}`}>
                    
                    {/* Phần thông tin Workshop */}
                    <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-dashed border-outline-variant">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="font-h3 text-h3 text-on-surface">{workshop.title}</h3>
                        
                        {/* Status Badges */}
                        <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 font-label-sm text-label-sm border 
                          ${activeTab === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : activeTab === 'attended' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'}
                        `}>
                          {activeTab === 'active' ? (isLocked ? 'Pending Payment' : 'Ready') 
                            : activeTab === 'attended' ? 'Attended' 
                            : 'Missed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Ngày tổ chức</p>
                          <p className="font-label-md text-label-md text-on-surface mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                            {startDate}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Giờ bắt đầu</p>
                          <p className="font-label-md text-label-md text-on-surface mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                            {startTime}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Phòng</p>
                          <p className="font-label-md text-label-md text-on-surface mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                            {workshop.rooms?.name || workshop.location || 'TBA'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phần Action tùy biến theo từng Tab bên phải */}
                    <div className="bg-surface-container-low p-6 flex flex-col items-center justify-center">
                      
                      {/* TAB 1: ACTIVE -> Hiện QR Code */}
                      {activeTab === 'active' && (
                        <div className="flex flex-col items-center gap-3">
                          <div className={`relative rounded-2xl border border-outline-variant bg-white p-4 shadow-sm ${isLocked ? 'opacity-40' : ''}`}>
                            {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[1px]">
                                <span className="material-symbols-outlined text-on-surface text-3xl">lock</span>
                              </div>
                            )}
                            <QRCode
                              value={ticket.qr_code || `TKT-${ticket.id}`}
                              size={130}
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                          <p className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant">
                            {isLocked ? 'Cần thanh toán' : 'Quét QR để điểm danh'}
                          </p>
                        </div>
                      )}

                      {/* TAB 2: ATTENDED -> Hiện Nút lấy chứng chỉ */}
                      {activeTab === 'attended' && (
                        <div className="flex flex-col items-center gap-4 w-full min-w-[200px]">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                            <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                          </div>
                          <button className="ui-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Tải chứng chỉ
                          </button>
                          <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                            Xem tài liệu buổi học
                          </button>
                        </div>
                      )}

                      {/* TAB 3: MISSED -> Hiện Call to action khác */}
                      {activeTab === 'missed' && (
                        <div className="flex flex-col items-center text-center gap-4 w-full min-w-[220px]">
                          <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant mb-2">
                            <span className="material-symbols-outlined text-2xl">event_busy</span>
                          </div>
                          <p className="text-sm text-on-surface-variant px-4">
                            Sự kiện này đã kết thúc và bạn chưa check-in.
                          </p>
                          <Link to="/workshops" className="ui-btn w-full bg-surface text-on-surface border border-outline-variant hover:bg-surface-container font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                            Tìm khóa khác
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </Link>
                        </div>
                      )}

                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}