import { useState, useEffect, useMemo } from 'react';
import { loadSession, fetchMyRegistrations } from '../api/auth';
import { Link } from 'react-router-dom';
import WorkshopDetailDialog from '../components/WorkshopDetailDialog';
import QRCode from 'qrcode.react';

export default function MyTickets() {
  const session = loadSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // State quản lý Tab hiện tại
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'cancelled' | 'attended' | 'missed'

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

  // Lọc vé dựa trên trạng thái (status) đã được đồng bộ bởi Trigger từ database
  const filteredTickets = useMemo(() => {
    const now = new Date();

    return tickets.filter(ticket => {
      const workshop = ticket.workshops;
      if (!workshop) return false;

      // Nhờ Trigger, ticket.status sẽ là 'cancelled' nếu workshop bị hủy
      const isTicketCancelled = ticket.status === 'cancelled';
      const isCheckedIn = ticket.status === 'checked_in' || !!ticket.checked_in_at;
      
      const endTime = workshop.end_time ? new Date(workshop.end_time) : new Date(now.getTime() + 86400000); 
      const isExpired = now > endTime;

      if (activeTab === 'cancelled') {
        return isTicketCancelled;
      }

      // Nếu vé đã bị hủy, không hiện ở các tab khác
      if (isTicketCancelled) return false;

      if (activeTab === 'attended') {
        return isCheckedIn;
      }

      if (activeTab === 'active') {
        // Active: Chưa điểm danh VÀ chưa hết thời gian (và không bị hủy)
        return !isCheckedIn && !isExpired;
      }

      if (activeTab === 'missed') {
        // Missed: Chưa điểm danh VÀ đã quá thời gian (và không bị hủy)
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
      {/* Profile Summary Header */}
      <section className="rounded-3xl border border-outline-variant bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/20 p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-5 md:items-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-primary-fixed bg-surface-container flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[36px]">person</span>
          </div>
          <div className="space-y-2">
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary-container">My Learning Hub</p>
            <h1 className="font-h1 text-h1 text-on-surface">{session.profile?.full_name || 'Student'}</h1>
            <div className="flex flex-wrap gap-4 text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-sm"><span className="material-symbols-outlined text-[18px]">badge</span>{session.profile?.student_id}</span>
              <span className="flex items-center gap-1.5 text-sm"><span className="material-symbols-outlined text-[18px]">email</span>{session.profile?.email}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant w-fit overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button onClick={() => setActiveTab('active')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>Active Tickets</button>
        <button onClick={() => setActiveTab('cancelled')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cancelled' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:bg-slate-100'}`}>Đã hủy</button>
        <button onClick={() => setActiveTab('attended')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'attended' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}>Đã tham gia</button>
        <button onClick={() => setActiveTab('missed')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'missed' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:bg-slate-100'}`}>Đã bỏ lỡ</button>
      </div>

      {/* List content */}
      <section>
        {loading ? (
          <div className="py-12 text-center animate-pulse text-slate-400">Loading registrations...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
              {activeTab === 'active' ? 'confirmation_number' : activeTab === 'cancelled' ? 'event_busy' : 'history_edu'}
            </span>
            <p className="text-slate-500 font-medium text-lg">
              {activeTab === 'active' ? 'Bạn không có vé nào sắp tới.' : activeTab === 'cancelled' ? 'Không có workshop nào bị hủy.' : 'Danh sách trống.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTickets.map((ticket) => {
              const ws = ticket.workshops;
              const dateStr = new Date(ws.start_time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = new Date(ws.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

              return (
                <article key={ticket.id} className={`overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-sm transition-all hover:shadow-md ${activeTab === 'cancelled' || activeTab === 'missed' ? 'opacity-75 grayscale-[0.4]' : ''}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
                    
                    {/* Info Side */}
                    <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-dashed border-slate-200">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-slate-900">{ws.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          activeTab === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          activeTab === 'cancelled' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          activeTab === 'attended' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {activeTab === 'active' ? (ticket.status === 'pending_payment' ? 'Pending' : 'Ready') : activeTab}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-600">calendar_month</span>
                          <div><p className="text-[10px] text-slate-500 font-bold uppercase">Ngày</p><p className="text-sm font-semibold">{dateStr}</p></div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-600">schedule</span>
                          <div><p className="text-[10px] text-slate-500 font-bold uppercase">Bắt đầu</p><p className="text-sm font-semibold">{timeStr}</p></div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-600">location_on</span>
                          <div><p className="text-[10px] text-slate-500 font-bold uppercase">Phòng</p><p className="text-sm font-semibold truncate max-w-[120px]">{ws.rooms?.name || 'TBA'}</p></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Side */}
                    <div className="bg-slate-50/80 p-6 flex flex-col items-center justify-center text-center">
                      {activeTab === 'active' && (
                        <>
                          <div className={`bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3 ${ticket.status === 'pending_payment' ? 'blur-[2px] opacity-40' : ''}`}>
                            <QRCode value={ticket.qr_code || ticket.id} size={110} level="M" includeMargin={true} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-tighter">Quét để điểm danh</p>
                        </>
                      )}

                      {activeTab === 'cancelled' && (
                        <div className="mb-4">
                          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-outlined">event_busy</span>
                          </div>
                          <p className="text-xs font-medium text-slate-600 px-4">Buổi học này đã được ban tổ chức hủy bỏ.</p>
                        </div>
                      )}

                      <button onClick={() => setSelectedTicket(ticket)} className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors shadow-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Dialog reuse logic */}
      <WorkshopDetailDialog
        open={Boolean(selectedTicket)}
        workshop={selectedTicket?.workshops}
        mode="ticket"
        qrValue={selectedTicket?.qr_code || selectedTicket?.id}
        statusLabel={selectedTicket?.status?.toUpperCase()}
        statusTone={selectedTicket?.status === 'cancelled' ? 'danger' : selectedTicket?.status === 'checked_in' ? 'success' : 'neutral'}
        onClose={() => setSelectedTicket(null)}
      />
    </main>
  );
}