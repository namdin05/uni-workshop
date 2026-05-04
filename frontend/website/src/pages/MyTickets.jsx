import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { loadSession, fetchMyRegistrations } from '../lib/auth';

const QUICK_ACTIONS = [
  { label: 'Open Workshops', href: '/workshops', icon: 'calendar_today' },
  { label: 'Back to Home', href: '/', icon: 'home' },
  { label: 'Profile', href: '/profile', icon: 'person' },
];

export default function MyTickets() {
  const session = loadSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!session) {
    return <div className="px-8 py-12 text-on-surface-variant">Please sign in to view your tickets.</div>;
  }

  const upcomingCount = tickets.filter((ticket) => ticket.status === 'confirmed' || ticket.status === 'checked_in').length;

  return (
    <main className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-24 space-y-6 md:space-y-8">
      <section className="rounded-3xl border border-outline-variant bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/20 p-6 md:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary-fixed/50 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-primary-fixed bg-surface-container shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">person</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary-container mb-2">My Tickets</p>
                <h1 className="font-h1 text-h1 text-on-surface">{session.profile?.full_name || 'Student'}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
      
                <span className="inline-flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  ID: {session.profile?.student_id || '2024-8910'}
                </span>
                <span className="inline-flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[18px]">email</span>
                  Email: {session.profile?.email || '2024-8910'}
                </span>
              </div>
            </div>
          </div>

      
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-4 md:space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-h3 text-h3 text-on-surface">Upcoming Tickets</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Each ticket follows the same QR-first style as the student dashboard.</p>
            </div>
            <span className="hidden sm:inline-flex rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant border border-outline-variant">
              {tickets.length} total
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-on-surface-variant">Loading your tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-12 text-center text-on-surface-variant shadow-sm">
              No tickets yet. <a href="/workshops" className="text-primary hover:underline">Register for a workshop</a> to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const workshop = ticket.workshops;
                const startDate = new Date(workshop.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const startTime = new Date(workshop.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(workshop.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const isLocked = ticket.status === 'pending_payment';

                return (
                  <article
                    key={ticket.id}
                    className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-colors hover:border-primary-fixed-dim"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="p-6 md:p-7 border-b md:border-b-0 md:border-r border-dashed border-outline-variant">
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div>
                          
                            <h3 className="font-h3 text-h3 text-on-surface mt-4 pr-6">{workshop.title}</h3>
            
                          </div>

                          <span
                            className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 font-label-sm text-label-sm border ${
                              ticket.status === 'checked_in'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ticket.status === 'confirmed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-surface-container text-on-surface-variant border-outline-variant'
                            }`}
                          >
                            {ticket.checked_in_at ? 'Checked In' : ticket.status === 'confirmed' ? 'Ready' : 'Pending'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
                            <p className="font-label-sm text-label-sm text-on-surface-variant">Date</p>
                            <p className="font-label-md text-label-md text-on-surface mt-1 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                              {startDate}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
                            <p className="font-label-sm text-label-sm text-on-surface-variant">Time</p>
                            <p className="font-label-md text-label-md text-on-surface mt-1 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                              {startTime} - {endTime}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
                            <p className="font-label-sm text-label-sm text-on-surface-variant">Location</p>
                            <p className="font-label-md text-label-md text-on-surface mt-1 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                              {workshop.rooms?.name || workshop.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-b from-surface-container-lowest to-surface-container-low p-6 flex flex-col items-center justify-center gap-4">
                        <div className={`relative rounded-2xl border border-outline-variant bg-white p-4 shadow-sm ${isLocked ? 'opacity-55' : ''}`}>
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[1px]">
                              <span className="material-symbols-outlined text-on-surface">lock</span>
                            </div>
                          )}
                          <QRCode
                            value={ticket.qr_code || `TKT-${ticket.id}`}
                            size={144}
                            level="H"
                            includeMargin={true}
                            className="grayscale contrast-150"
                          />
                        </div>

                   
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="xl:col-span-4 space-y-4 md:space-y-5">

          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="font-h3 text-h3 text-on-surface mb-4">Workshops You've Joined</h3>
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-outline-variant bg-surface p-4 text-on-surface-variant">
                  No joined workshops yet.
                </div>
              ) : (
                tickets
                  .filter((ticket) => ticket.status === 'confirmed' || ticket.status === 'checked_in')
                  .map((ticket) => {
                    const workshop = ticket.workshops;
                    const joinedDate = new Date(ticket.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={ticket.id} className="rounded-2xl border border-outline-variant bg-surface p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full px-3 py-1 font-label-sm text-label-sm border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {ticket.checked_in_at ? 'Attended' : 'Joined'}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{joinedDate}</span>
                        </div>
                        <h4 className="font-label-md text-label-md text-on-surface mt-3">{workshop.title}</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
                          {workshop.rooms?.name || 'Room TBA'}
                        </p>
                        <button className="ui-btn ui-btn-ghost mt-3 inline-flex items-center gap-2 px-0 py-0 text-sm font-semibold text-primary hover:bg-transparent hover:underline">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          View Workshop
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

      
        </aside>
      </section>
    </main>
  );
}
