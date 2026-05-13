import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchWorkshop, registerForWorkshop, loadSession, fetchPaymentGatewayStatus } from '../lib/auth';

export default function WorkshopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [status, setStatus] = useState(null);
  const [paymentGateway, setPaymentGateway] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchWorkshop(id);
        if (active) setWorkshop(res.workshop);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { active = false };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadGatewayStatus() {
      try {
        const res = await fetchPaymentGatewayStatus();
        if (active) {
          setPaymentGateway(res.gateway);
        }
      } catch {
        if (active) {
          setPaymentGateway(null);
        }
      }
    }

    loadGatewayStatus();
    const timer = window.setInterval(loadGatewayStatus, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!workshop) return <div className="px-8 py-12">Workshop not found</div>;

  function formatDateRange() {
    if (workshop.start_time) {
      const start = new Date(workshop.start_time);
      const end = workshop.end_time ? new Date(workshop.end_time) : null;
      const startDate = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (end && end.toDateString() !== start.toDateString()) {
        const endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startDate} - ${endDate}`;
      }
      return startDate;
    }
    return workshop.date || 'TBA';
  }

  function formatTimeRange() {
    if (workshop.start_time) {
      const start = new Date(workshop.start_time);
      const end = workshop.end_time ? new Date(workshop.end_time) : null;
      const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (end) {
        const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${startTime} - ${endTime}`;
      }
      return startTime;
    }
    return workshop.time || 'TBA';
  }

  function getSeatsRemaining() {
    if (typeof workshop.available_seats === 'number') return workshop.available_seats;
    if (typeof workshop.seatsRemaining === 'number') return workshop.seatsRemaining;
    if (typeof workshop.totalSeats === 'number') return workshop.totalSeats;
    return 0;
  }

  function getTotalSeats() {
    if (typeof workshop.total_seats === 'number') return workshop.total_seats;
    if (typeof workshop.totalSeats === 'number') return workshop.totalSeats;
    return 0;
  }

  async function handleRegister() {
    setStatus('loading');

    try {
      const session = loadSession();
      if (!session?.token || !session?.profile) {
        setStatus('not-authenticated');
        return;
      }

      // Call backend register API with correct format
      try {
        const response = await registerForWorkshop(
          { userId: session.profile.id, workshopId: workshop.id },
          session.token
        );

        if (!workshop.is_free && response.status === 'pending_payment') {
          navigate(`/payment/demo?registrationId=${response.registrationId}&workshopId=${workshop.id}`);
          return;
        }

        setStatus('registered');

        if (response.qrDataUrl) {
          console.log('Registration QR:', response.qrDataUrl);
        }
      } catch (err) {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  }

  const seatsRemaining = getSeatsRemaining();
  const totalSeats = getTotalSeats();
  const instructorName = workshop.speaker_name || workshop.speaker || 'Instructor TBA';
  const location = workshop.location || workshop.room || 'Location TBA';
  const priceLabel = workshop.is_free ? 'Free' : `$${workshop.price ?? '0.00'}`;
  const gatewayMode = paymentGateway?.mode ?? 'closed';
  const paymentLocked = !workshop.is_free && gatewayMode === 'open';

  return (
    <main className="max-w-container-max mx-auto px-8 py-12">
      <a className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md mb-8" href="/workshops">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </a>

      {/* Thông tin chính của Workshop */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-12 items-start">
        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm border border-primary-fixed-dim">
              {workshop.category || 'Workshop'}
            </span>
            {workshop.level && (
              <span className="inline-flex items-center px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm border border-secondary-fixed-dim">
                {workshop.level}
              </span>
            )}
          </div>

          <div>
            <h1 className="font-h1 text-h1 text-primary mb-4">{workshop.title}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-4xl">
              {workshop.summary || 'Details for this workshop will be updated soon.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-y border-outline-variant/30">
            <div className="flex items-center gap-3 text-on-surface">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Date</div>
                <div className="font-label-md text-label-md">{formatDateRange()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-on-surface">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Time</div>
                <div className="font-label-md text-label-md">{formatTimeRange()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-on-surface">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Location</div>
                <div className="font-label-md text-label-md">{location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-on-surface">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Capacity</div>
                <div className="font-label-md text-label-md">
                  {totalSeats ? `${seatsRemaining} Seats (${Math.max(totalSeats - seatsRemaining, 0)} Enrolled)` : 'Capacity TBA'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Syllabus */}
      <section className="border-l-[3px] border-primary-fixed rounded-xl p-8 mb-12 bg-gradient-to-r from-surface to-primary-fixed/5 shadow-[0_0_15px_rgba(0,51,102,0.08)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start gap-6 relative z-10">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-h3 text-h3 text-primary">AI Syllabus Summary</h3>
              <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant text-[10px] uppercase tracking-wider font-bold rounded">Auto-Generated</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4">
              {workshop.ai_summary || 'Upload a syllabus PDF to generate an AI summary with key objectives and prerequisites.'}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 font-body-md text-body-md text-on-surface">
              {(workshop.objectives || ['Build scalable workflows', 'Implement monitoring & CI/CD', 'Optimize inference latency', 'Handle concept drift']).map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Diễn giả & Sơ đồ phòng - Ngang hàng nhau */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-12">
        {/* Card Diễn giả */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center text-center h-full">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center border-4 border-surface-container mb-4 shrink-0">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <h3 className="font-h3 text-h3 text-primary mb-1">{instructorName}</h3>
          <p className="font-label-md text-label-md text-primary-container mb-4">Lead Instructor</p>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed mb-6 flex-1">
            This instructor specializes in guiding students through hands-on projects and applied research.
          </p>
        </div>

        {/* Card Sơ đồ phòng */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col h-full">
          <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">floor</span>
            Room Layout
          </h3>
          <div className="w-full aspect-video bg-surface-container-low rounded-lg border border-outline-variant/30 overflow-hidden relative flex items-center justify-center flex-1">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px]">map</span>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-2">Room layout removed</div>
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-4 text-center">
            {location} - Collaborative Setup
          </p>
        </div>
      </section>

      {/* Hành động (Đăng ký / Thanh toán) - Ở dưới cùng góc phải */}
      <section className="flex flex-col items-end gap-3 mt-8 pt-8 border-t border-outline-variant/30">
        <button
          onClick={handleRegister}
          disabled={!workshop.is_free && paymentLocked}
          className="ui-btn ui-btn-primary font-label-md text-label-md px-8 py-3.5 rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{workshop.is_free ? 'Register Now' : 'Thanh toán demo'}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        {/* Thông báo trạng thái đặt dưới nút */}
        <div className="text-right">
          {status === 'loading' && <p className="font-body-md text-body-md text-on-surface-variant">Registering...</p>}
          {status === 'registered' && <p className="font-body-md text-body-md text-emerald-700 font-semibold">Successfully registered.</p>}
          {status === 'error' && <p className="font-body-md text-body-md text-error">Registration failed. Try again.</p>}
          {!workshop.is_free && paymentLocked && <p className="font-body-md text-body-md text-rose-700 mt-2 max-w-md">{paymentGateway?.message || 'Hệ thống thanh toán đang bảo trì, vui lòng thử lại sau.'}</p>}
        </div>
      </section>
    </main>
  );
}