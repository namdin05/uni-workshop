import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWorkshops, registerForWorkshop, loadSession, fetchMyRegistrations } from '../api/auth';
import WorkshopDetailDialog from '../components/WorkshopDetailDialog';
import { showTicketSuccessAlert } from '../utils/popup';

export default function WorkshopCatalog() {
  const navigate = useNavigate();
  const session = loadSession();
  
  const [workshops, setWorkshops] = useState([]);
  // Tách trạng thái loading thành 2 để chờ cả 2 API
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchWorkshops();
        if (active) setWorkshops(res.workshops || []);
      } catch (err) {
        // fallback to empty list
      } finally {
        if (active) setLoadingWorkshops(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRegistrations() {
      if (!session?.token || session?.profile?.role !== 'student') {
        if (active) {
          setRegisteredWorkshopIds([]);
          setLoadingRegistrations(false);
        }
        return;
      }

      try {
        const res = await fetchMyRegistrations(session.token);
        if (!active) return;

        const workshopIds = (res.registrations || [])
          .map((registration) => Number(registration.workshops?.id ?? registration.workshop_id))
          .filter((id) => Number.isFinite(id));

        setRegisteredWorkshopIds(Array.from(new Set(workshopIds)));
      } catch {
        if (active) setRegisteredWorkshopIds([]);
      } finally {
        if (active) setLoadingRegistrations(false);
      }
    }

    loadRegistrations();
    return () => {
      active = false;
    };
  }, [session?.token, session?.profile?.role]);

  function getWorkshopSeats(workshop) {
    const seats = workshop.available_seats ?? workshop.total_seats ?? 0;
    const totalSeats = workshop.total_seats ?? seats;
    const fill = totalSeats > 0 ? Math.min(100, Math.max(0, 100 - (seats / totalSeats) * 100)) : 0;

    return {
      seats,
      totalSeats,
      fill,
      isFull: seats <= 0,
    };
  }

  function formatWorkshopDate(value) {
    if (!value) return 'Date TBA';
    return new Date(value).toLocaleDateString();
  }

  function formatWorkshopTime(startTime, endTime) {
    if (!startTime) return 'Time TBA';

    const start = new Date(startTime);
    if (!endTime) {
      return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const end = new Date(endTime);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  async function handleRegister() {
    setRegistrationStatus('loading');
    setRegistrationMessage('');

    try {
      const session = loadSession();
      if (!session?.token || !session?.profile) {
        setRegistrationStatus('not-authenticated');
        setRegistrationMessage('Please sign in first.');
        return;
      }

      const response = await registerForWorkshop(
        { userId: session.profile.id, workshopId: selectedWorkshop.id },
        session.token
      );

      if (!selectedWorkshop.is_free && response.status === 'pending_payment') {
        navigate(`/payment/demo?registrationId=${response.registrationId}&workshopId=${selectedWorkshop.id}`);
        return;
      }

      setRegistrationStatus('registered');
      setRegistrationMessage('Registration successful!');
      setSelectedWorkshop(null);
      showTicketSuccessAlert(navigate);
    } catch (err) {
      setRegistrationStatus('error');
      setRegistrationMessage(err.message || 'Registration failed.');
    }
  }

  // Chờ cả 2 quá trình load xong mới render UI
  const isLoading = loadingWorkshops || loadingRegistrations;

  const visibleWorkshops = workshops.filter((workshop) => {
    const workshopId = Number(workshop.id);
    return !registeredWorkshopIds.includes(workshopId);
  });

  return (
    <main className="pb-24 overflow-x-hidden bg-background">
      <section className="relative overflow-hidden border-b border-outline-variant bg-surface-container-low">
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #003366 0%, transparent 40%)' }} />
        <div className="relative mx-auto max-w-container-max px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                Semester Registration Open
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-12 space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-h3 text-h3 text-on-surface">Featured Workshops</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Seats are filling up quickly for these sessions.</p>
              </div>
              <span className="hidden sm:inline-flex rounded-full bg-surface-container px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                Live catalog
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">Loading workshops…</div>
            ) : visibleWorkshops.length === 0 ? (
              <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest py-12 text-center text-sm text-on-surface-variant shadow-sm">
                No available workshops for you
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleWorkshops.slice(0, 5).map((workshop) => {
                  const { seats, totalSeats, fill, isFull } = getWorkshopSeats(workshop);
                  const roomName = workshop.rooms?.name || workshop.location || 'Room TBA';

                  return (
                    <article
                      key={workshop.id}
                      className="flex flex-col h-full overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all hover:border-primary-fixed-dim relative"
                    >
                      <div className="flex flex-col flex-1 p-5 md:p-6 space-y-4">
                        
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-h3 text-h3 text-on-surface line-clamp-2">{workshop.title}</h3>
                          <span 
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                              isFull 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isFull ? 'Full' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-2">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            {workshop.speaker_name || 'Instructor'}
                          </span>
                          <span className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-2">
                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                            {roomName}
                          </span>
                          <span className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-2">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            {formatWorkshopDate(workshop.start_time)}
                          </span>
                        </div>

                        <div className="flex-1"></div>

                        <div className="pt-2">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-on-surface-variant">Seats Remaining</span>
                            <span className="font-semibold text-primary">{seats} / {totalSeats}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${fill}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-auto border-t border-outline-variant/50">
                          <span className="font-h3 text-h3 text-on-surface">
                            {workshop.is_free ? 'Free' : `$${workshop.price}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedWorkshop(workshop)}
                            className="ui-btn ui-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                          >
                            View Details
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <WorkshopDetailDialog
        open={Boolean(selectedWorkshop)}
        workshop={selectedWorkshop}
        mode="register"
        registrationStatus={registrationStatus}
        registrationMessage={registrationMessage}
        onClose={() => {
          setSelectedWorkshop(null);
          setRegistrationStatus(null);
          setRegistrationMessage('');
        }}
        onRegister={handleRegister}
      />
    </main>
  );
}