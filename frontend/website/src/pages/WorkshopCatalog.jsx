import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWorkshops } from '../lib/auth';

export default function WorkshopCatalog() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('any');
  const [topicFilter, setTopicFilter] = useState('all');

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
                  // Kiểm tra số ghế dựa trên available_seats và total_seats
                  const seats = workshop.available_seats ?? workshop.total_seats ?? 0;
                  const totalSeats = workshop.total_seats ?? seats;
                  const fill = totalSeats > 0 ? 100 - (seats / totalSeats) * 100 : 0;
                  const isFull = seats <= 0;
                  
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
                            {workshop.rooms.name || 'Room TBA'}
                          </span>
                          <span className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-2">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            {workshop.start_time ? new Date(workshop.start_time).toLocaleDateString() : 'Date TBA'}
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
                        </div>

                        {/* Footer Card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-auto border-t border-outline-variant/50">
                          <span className="font-h3 text-h3 text-on-surface">
                            {workshop.is_free ? 'Free' : `$${workshop.price}`}
                          </span>
                          <Link
                            to={`/workshops/${workshop.id}`}
                            className="ui-btn ui-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                          >
                            View Details
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </Link>
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
    </main>
  );
}