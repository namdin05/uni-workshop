import { useEffect, useState } from 'react';
import { fetchWorkshops } from '../api/auth';

export default function WorkshopCatalog() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('any');
  const [topicFilter, setTopicFilter] = useState('all');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchWorkshops();
        if (active) setWorkshops(res.workshops || []);
      } catch (err) {
        // fallback to empty list
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

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

            {loading ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">Loading workshops…</div>
            ) : workshops.length === 0 ? (
              <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest py-12 text-center text-sm text-on-surface-variant shadow-sm">
                No workshops available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workshops.slice(0, 5).map((workshop) => {
                  const { seats, totalSeats, fill, isFull } = getWorkshopSeats(workshop);
                  const roomName = workshop.rooms?.name || workshop.location || 'Room TBA';

                  return (
                    <article
                      key={workshop.id}
                      className="flex flex-col h-full overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all hover:border-primary-fixed-dim relative"
                    >
                      <div className="flex flex-col flex-1 p-5 md:p-6 space-y-4">
                        
                        {/* Tiêu đề và Trạng thái ở góc trên bên phải */}
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
                        
                        {/* Thông tin Workshop */}
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

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Thanh Tiến Trình Số Ghế (Progress Bar) */}
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

                        {/* Footer Card */}
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

      {selectedWorkshop ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          role="presentation"
          onClick={() => setSelectedWorkshop(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="workshop-catalog-dialog-title"
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-outline-variant bg-surface shadow-2xl ring-1 ring-black/5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed via-secondary-fixed to-tertiary-fixed" />

            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5 sm:px-8">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-on-primary-fixed-variant">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  Workshop Preview
                </span>
                <h3 id="workshop-catalog-dialog-title" className="font-h2 text-h2 text-on-surface">
                  {selectedWorkshop.title}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Quick look at the session details without leaving the catalog.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkshop(null)}
                className="ui-btn ui-btn-ghost rounded-full p-2 text-on-surface-variant hover:text-on-surface"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.35fr_0.95fr] lg:gap-8">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-on-surface-variant">
                    {selectedWorkshop.category || 'Workshop'}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${selectedWorkshop.is_free ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-primary-fixed/10 text-primary border-primary-fixed/30'}`}>
                    {selectedWorkshop.is_free ? 'Free access' : `Paid: $${selectedWorkshop.price ?? 0}`}
                  </span>
                  {selectedWorkshop.level ? (
                    <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
                      {selectedWorkshop.level}
                    </span>
                  ) : null}
                </div>

                <p className="text-base leading-7 text-on-surface-variant">
                  {selectedWorkshop.summary || selectedWorkshop.description || 'Details for this workshop are being updated.'}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Speaker
                    </div>
                    <div className="mt-2 font-semibold text-on-surface">{selectedWorkshop.speaker_name || 'Instructor TBA'}</div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      Room
                    </div>
                    <div className="mt-2 font-semibold text-on-surface">{selectedWorkshop.rooms?.name || selectedWorkshop.location || 'Room TBA'}</div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      Date
                    </div>
                    <div className="mt-2 font-semibold text-on-surface">{formatWorkshopDate(selectedWorkshop.start_time)}</div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      Time
                    </div>
                    <div className="mt-2 font-semibold text-on-surface">{formatWorkshopTime(selectedWorkshop.start_time, selectedWorkshop.end_time)}</div>
                  </div>
                </div>
              </div>

              <aside className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-on-surface-variant">Seats Remaining</p>
                    <p className="mt-1 text-xl font-semibold text-on-surface">
                      {getWorkshopSeats(selectedWorkshop).seats} / {getWorkshopSeats(selectedWorkshop).totalSeats}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getWorkshopSeats(selectedWorkshop).isFull ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {getWorkshopSeats(selectedWorkshop).isFull ? 'Full' : 'Active'}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${getWorkshopSeats(selectedWorkshop).fill}%` }}
                  />
                </div>

                <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                  <p className="text-sm text-on-surface-variant">Price</p>
                  <p className="mt-2 text-2xl font-semibold text-on-surface">
                    {selectedWorkshop.is_free ? 'Free' : `$${selectedWorkshop.price ?? 0}`}
                  </p>
                </div>

                {selectedWorkshop.ai_summary ? (
                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
                      AI Summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {selectedWorkshop.ai_summary}
                    </p>
                  </div>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWorkshop(null)}
                    className="ui-btn ui-btn-surface flex-1 rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWorkshop(null)}
                    className="ui-btn ui-btn-primary flex-1 rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Keep Browsing
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}