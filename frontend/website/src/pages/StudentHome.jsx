import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchWorkshops, loadSession } from '../lib/auth';

const QUICK_ACTIONS = [
  { label: 'Browse Workshops', to: '/workshops', icon: 'calendar_today', description: 'Discover and register for sessions.' },
  { label: 'My Learning', to: '/tickets', icon: 'school', description: 'Track tickets and QR check-ins.' },
  { label: 'Profile', to: '/profile', icon: 'person', description: 'Update your student profile.' },
];

const PROGRESS = [
  { label: 'Workshops Attended', value: '14' },
  { label: 'Learning Records', value: '3' },
  { label: 'Upcoming Tickets', value: '2' },
];

const SUPPORT = [
  'Use the workshops catalog to search by topic, date, and category.',
  'Open My Learning for QR tickets, attendance status, and saved PDFs.',
  'Open My Learning to review issued certificates and learning history.',
];

const UPCOMING = [
  {
    id: 'TKT-8921',
    title: 'Advanced Data Structures & Algorithms',
    type: 'Workshop',
    date: 'Oct 24, 2024',
    time: '10:00 AM - 1:00 PM',
    location: 'Tech Hub, Room 4B',
  },
  {
    id: 'TKT-9044',
    title: 'AI Ethics in Modern Practice',
    type: 'Seminar',
    date: 'Nov 02, 2024',
    time: '2:00 PM - 4:30 PM',
    location: 'Main Auditorium',
  },
];

export default function StudentHome() {
  const session = loadSession();
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetchWorkshops();
        if (active) {
          setWorkshops((response.workshops || []).slice(0, 3));
        }
      } catch {
        if (active) {
          setWorkshops([]);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const profileName = session?.profile?.full_name || 'Student';
  const studentId = session?.profile?.student_id || 'ID pending';

  return (
    <main className="pb-20 md:pb-0 overflow-x-hidden">
      <section className="relative w-full bg-surface-container-low border-b border-outline-variant overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #003366 0%, transparent 40%)' }} />
        <div className="relative max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                Student Portal Home
              </span>
              <h1 className="font-h1 text-h1 text-on-surface max-w-3xl">
                Welcome back, {profileName}. Your workshops, tickets, and progress are all in one place.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Stay on top of registration, check-ins, certificates, and support without leaving the student workspace.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                <span className="rounded-full bg-surface-container-lowest px-3 py-1 ring-1 ring-outline-variant">{studentId}</span>
                <span className="rounded-full bg-surface-container-lowest px-3 py-1 ring-1 ring-outline-variant">Role: Student</span>
                <span className="rounded-full bg-surface-container-lowest px-3 py-1 ring-1 ring-outline-variant">Spring Semester</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/workshops" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-primary/90">
                <span className="material-symbols-outlined text-[18px]">search</span>
                Find Workshops
              </Link>
              <Link to="/tickets" className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                View Tickets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Upcoming Tickets', value: '2', icon: 'event_available' },
            { label: 'Certificates Ready', value: '3', icon: 'workspace_premium' },
            { label: 'Saved Workshops', value: '6', icon: 'bookmark' },
            { label: 'Completion Progress', value: '78%', icon: 'progress_activity' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-on-surface-variant">{item.label}</p>
                  <h2 className="mt-2 font-h2 text-h2 text-on-surface">{item.value}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary-container">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-h2 text-h2 text-on-surface">Quick Access</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Direct links to the main student flows.</p>
                </div>
                <Link to="/tickets" className="text-sm font-semibold text-primary hover:underline">Open My Learning</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <Link key={action.label} to={action.to} className="group rounded-2xl border border-outline-variant bg-surface hover:border-primary-fixed-dim hover:bg-surface-container-low transition-all p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-fixed text-primary-container transition group-hover:scale-105">
                      <span className="material-symbols-outlined">{action.icon}</span>
                    </div>
                    <h3 className="mt-4 font-label-md text-label-md text-on-surface">{action.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{action.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-h2 text-h2 text-on-surface">Upcoming Tickets</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Your saved registrations and check-in QR access.</p>
                </div>
                <Link to="/tickets" className="text-sm font-semibold text-primary hover:underline">View all</Link>
              </div>

              <div className="grid gap-4">
                {UPCOMING.map((ticket, index) => (
                  <div key={ticket.id} className={`rounded-2xl border border-outline-variant p-5 ${index === 0 ? 'bg-gradient-to-r from-surface to-primary-fixed/10' : 'bg-surface'}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-on-primary-fixed-variant">{ticket.type}</span>
                          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">{ticket.id}</span>
                        </div>
                        <h3 className="font-h3 text-h3 text-on-surface">{ticket.title}</h3>
                        <div className="grid gap-2 text-sm text-on-surface-variant sm:grid-cols-3">
                          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">calendar_today</span>{ticket.date}</span>
                          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schedule</span>{ticket.time}</span>
                          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">location_on</span>{ticket.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 md:items-end">
                        <Link to="/workshops" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90">
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          Open Workshop
                        </Link>
                        <span className="text-xs uppercase tracking-[0.24em] text-on-surface-variant">QR available in My Learning</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="font-h3 text-h3 text-on-surface mb-4">Academic Progress</h3>
              <div className="space-y-3">
                {PROGRESS.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
                    <span className="text-sm text-on-surface">{item.label}</span>
                    <span className="font-h2 text-h2 text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
              <Link to="/tickets" className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90">
                View Full Transcript
              </Link>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="font-h3 text-h3 text-on-surface mb-4">Recommended Workshops</h3>
              <div className="space-y-3">
                {workshops.length > 0 ? workshops.map((workshop) => (
                  <div key={workshop.id} className="rounded-xl border border-outline-variant bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Featured</p>
                    <h4 className="mt-2 font-label-md text-label-md text-on-surface line-clamp-2">{workshop.title}</h4>
                    <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">{workshop.summary || 'Explore this workshop to continue learning.'}</p>
                    <Link to={`/workshops/${workshop.id}`} className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                      View details
                    </Link>
                  </div>
                )) : (
                  <div className="rounded-xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
                    Workshops will appear here once the catalog is loaded.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-secondary-container p-6 text-center shadow-sm">
              <span className="material-symbols-outlined text-[32px] text-on-secondary-container mb-3">help_center</span>
              <h3 className="font-label-md text-label-md text-on-secondary-container mb-2">Need help with registration?</h3>
              <p className="text-sm text-on-surface-variant mb-4">Use the student support flow for catalog, tickets, or certificate issues.</p>
              <Link to="/tickets" className="inline-flex w-full items-center justify-center rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low">
                Contact Support
              </Link>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="font-h3 text-h3 text-on-surface mb-4">Student Checklist</h3>
              <div className="space-y-3 text-sm text-on-surface-variant">
                {SUPPORT.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl bg-surface p-4">
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <p className="leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}