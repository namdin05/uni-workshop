import { useState, useEffect } from 'react';
import { fetchAdminWorkshops, fetchPaymentGatewayStatus, loadSession, togglePaymentGateway, warmUpWorkshopCache } from '../api/auth';
import AddWorkshopModal from '../components/AddWorkshopModal';

export default function AdminWorkshops() {
  const session = loadSession();
  const role = (session?.profile?.role || 'student').toLowerCase();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [warmUpMessage, setWarmUpMessage] = useState('');
  const [warmUpError, setWarmUpError] = useState('');
  const [gateway, setGateway] = useState(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [gatewayUpdating, setGatewayUpdating] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState('');
  const [gatewayError, setGatewayError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchAdminWorkshops(session?.token);
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

  useEffect(() => {
    let active = true;

    async function loadGateway() {
      try {
        const res = await fetchPaymentGatewayStatus();
        if (active) setGateway(res.gateway || null);
      } catch {
        if (active) setGateway(null);
      } finally {
        if (active) setGatewayLoading(false);
      }
    }

    loadGateway();
    return () => {
      active = false;
    };
  }, []);

  if (role !== 'organizer' && role !== 'admin') {
    return <div className="text-sm text-rose-600 p-6">Access denied: Organizer role required.</div>;
  }

  function handleSuccess(newWorkshop) {
    setWorkshops((cur) => [...cur, newWorkshop]);
  }

  async function handleWarmUp() {
    if (!session?.token) {
      setWarmUpError('Missing admin session. Please sign in again.');
      return;
    }

    setWarmingUp(true);
    setWarmUpMessage('');
    setWarmUpError('');

    try {
      const result = await warmUpWorkshopCache(session.token);
      setWarmUpMessage(result.message || 'Warm up completed successfully.');
    } catch (err) {
      setWarmUpError(err.message || 'Failed to warm up workshop cache');
    } finally {
      setWarmingUp(false);
    }
  }

  async function handleToggleGateway() {
    setGatewayUpdating(true);
    setGatewayMessage('');
    setGatewayError('');

    try {
      if (!session?.token) {
        setGatewayError('Missing admin session. Please sign in again.');
        return;
      }
      const isNormalMode = gateway?.mode === 'closed';
      const result = await togglePaymentGateway(!isNormalMode, session.token);
      setGateway(result.gateway || null);
      setGatewayMessage(result.message || 'Trạng thái cổng đã được cập nhật.');
    } catch (err) {
      setGatewayError(err.message || 'Unable to update gateway state.');
    } finally {
      setGatewayUpdating(false);
    }
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
          <button
            type="button"
            onClick={handleWarmUp}
            disabled={warmingUp}
            className="ui-btn ui-btn-surface px-4 py-2 rounded-lg font-label-md border border-outline-variant flex items-center gap-2 whitespace-nowrap disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-sm">local_fire_department</span>
            {warmingUp ? 'Warming up...' : 'Warm up cache'}
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
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-label-md text-on-surface">{getEnrolledCount(w)} enrolled</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold border ${w.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : w.status === 'draft' ? 'bg-surface-container text-on-surface-variant border-outline-variant' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {w.status || 'draft'}
                        </span>
                        <a href={`/admin/workshops/${w.id}/edit`} className="ui-btn ui-btn-ghost text-xs px-3 py-1 rounded">Edit</a>
                      </div>
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
              <button
                type="button"
                onClick={handleWarmUp}
                disabled={warmingUp}
                className="ui-btn ui-btn-surface w-full font-label-md py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span className="material-symbols-outlined">local_fire_department</span>
                {warmingUp ? 'Warming up...' : 'Warm up cache'}
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-label-md text-on-surface">Payment Gateway</h4>
                  <p className="font-label-sm text-on-surface-variant mt-1">
                    {gatewayLoading ? 'Loading...' : 'Quản lý trạng thái cổng'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-outline-variant">
                <span className={`font-label-md text-label-md px-3 py-1 rounded-full ${gateway?.mode === 'closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {gateway?.mode === 'closed' ? '✓ NORMAL' : '⚠ TIMEOUT'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleGateway}
                  disabled={gatewayUpdating}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    gateway?.mode === 'closed' ? 'bg-emerald-500' : 'bg-rose-500'
                  } ${gatewayUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                      gateway?.mode === 'closed' ? 'translate-x-1' : 'translate-x-7'
                    }`}
                  />
                </button>
              </div>

              {gatewayMessage ? (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {gatewayMessage}
                </div>
              ) : null}

              {gatewayError ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {gatewayError}
                </div>
              ) : null}
            </div>

            {warmUpMessage ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {warmUpMessage}
              </div>
            ) : null}

            {warmUpError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {warmUpError}
              </div>
            ) : null}

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
