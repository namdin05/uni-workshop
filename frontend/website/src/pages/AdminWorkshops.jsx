import { useState, useEffect } from 'react';
import { fetchWorkshops, loadSession } from '../lib/auth';
import AddWorkshopModal from '../components/AddWorkshopModal';

export default function AdminWorkshops() {
  const session = loadSession();
  const role = (session?.profile?.role || 'student').toLowerCase();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchWorkshops();
        if (active) setWorkshops(res.workshops || []);
      } catch (err) {
        //
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false };
  }, []);

  if (role !== 'organizer' && role !== 'admin') {
    return <div className="text-sm text-rose-600 p-6">Access denied: Organizer role required.</div>;
  }

  function handleSuccess(newWorkshop) {
    setWorkshops((cur) => [...cur, newWorkshop]);
  }

  function getEnrolledCount(workshop) {
    const totalSeats = typeof workshop.total_seats === 'number'
      ? workshop.total_seats
      : typeof workshop.available_seats === 'number'
      ? workshop.available_seats
      : 0;
    const availableSeats = typeof workshop.available_seats === 'number'
      ? workshop.available_seats
      : totalSeats;
    return Math.max(0, totalSeats - availableSeats);
  }

  // Calculate stats
  const totalRegistrations = workshops.reduce((sum, w) => sum + getEnrolledCount(w), 0);
  const totalRevenue = workshops
    .filter(w => !w.is_free)
    .reduce((sum, w) => sum + ((w.price || 0) * getEnrolledCount(w)), 0);
  const activeWorkshops = workshops.length;

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface-container-low overflow-x-hidden">
      {/* Page Header */}
      <div className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 md:py-8 lg:py-10 bg-surface border-b border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-h1 text-on-surface">Dashboard Overview</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Welcome back. Here is what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="ui-btn ui-btn-surface px-4 py-2 rounded-lg font-label-md border border-outline-variant flex items-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Last 30 Days
          </button>
          <button className="ui-btn ui-btn-primary px-4 py-2 rounded-lg font-label-md shadow-sm flex items-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 w-full max-w-container-max mx-auto space-y-6">
        {/* Quick Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat Card 1 */}
          <div className="bg-surface rounded-xl border border-secondary-fixed p-6 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-8xl text-primary-container">group_add</span>
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider">Total Registrations</p>
              <span className="material-symbols-outlined text-primary-container bg-primary-fixed-dim/20 p-2 rounded-lg">group</span>
            </div>
            <div className="relative z-10">
              <h2 className="font-h2 text-on-surface">{totalRegistrations}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
                  +12.5%
                </span>
                <span className="font-label-sm text-on-surface-variant">vs last month</span>
              </div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-surface rounded-xl border border-secondary-fixed p-6 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-8xl text-tertiary-container">payments</span>
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider">Total Revenue</p>
              <span className="material-symbols-outlined text-tertiary-container bg-tertiary-fixed/30 p-2 rounded-lg">account_balance_wallet</span>
            </div>
            <div className="relative z-10">
              <h2 className="font-h2 text-on-surface">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
                  +8.2%
                </span>
                <span className="font-label-sm text-on-surface-variant">vs last month</span>
              </div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-primary-container rounded-xl border border-primary-container p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-primary opacity-90"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute top-10 -left-10 w-20 h-20 bg-primary-fixed opacity-10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="font-label-md text-white/85 uppercase tracking-wider">Active Workshops</p>
              <span className="material-symbols-outlined text-on-primary bg-white/10 p-2 rounded-lg backdrop-blur-sm">model_training</span>
            </div>
            <div className="relative z-10">
              <h2 className="font-h2 text-on-primary">{activeWorkshops}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-label-sm text-white/85">{Math.min(activeWorkshops, 12)} starting this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Workshops List (Spans 2 columns) */}
          <div className="xl:col-span-2 bg-surface rounded-xl border border-secondary-fixed shadow-sm flex flex-col">
            <div className="p-6 border-b border-surface-variant flex justify-between items-center">
              <div>
                <h3 className="font-h3 text-on-surface">Your Workshops</h3>
                <p className="font-label-sm text-on-surface-variant mt-1">Manage and track all sessions</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="ui-btn ui-btn-primary font-label-md py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Workshop
              </button>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-on-surface-variant">Loading workshops…</div>
              ) : workshops.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant">No workshops yet. Create one to get started!</div>
              ) : (
                workshops.map((w) => (
                  <div key={w.id} className="p-4 border-b border-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-primary-container">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-label-md text-on-surface truncate">{w.title}</h4>
                      <p className="font-label-sm text-on-surface-variant truncate">{w.speaker_name || 'Instructor TBA'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-label-md text-on-surface">{getEnrolledCount(w)} enrolled</p>
                      <p className="font-label-sm text-green-600 text-[10px]">Active</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-surface rounded-xl border border-secondary-fixed shadow-sm flex flex-col p-6">
            <h3 className="font-h3 text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-3 flex-1">
              <button
                onClick={() => setShowModal(true)}
                className="ui-btn ui-btn-primary w-full font-label-md py-3 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Create Workshop
              </button>
              <button className="ui-btn ui-btn-surface w-full font-label-md py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">group</span>
                Manage Students
              </button>
            </div>

            {/* AI Summary */}
            <div className="mt-6 rounded-xl border-l-2 border-primary-container p-4 bg-gradient-to-r from-surface to-primary-fixed/5 border border-y-secondary-fixed border-r-secondary-fixed">
              <h4 className="font-label-md text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined filled animate-pulse">auto_awesome</span>
                AI Summary
              </h4>
              <p className="font-label-sm text-on-surface-variant text-xs">All systems operational. {activeWorkshops} active workshops with {totalRegistrations} total registrations.</p>
            </div>
          </div>
        </div>
      </div>

      {showModal && <AddWorkshopModal onClose={() => setShowModal(false)} onSave={() => { handleSuccess({}); setShowModal(false); }} />}
    </main>
  );
}
