import { useEffect, useState } from 'react';
import { fetchPaymentGatewayStatus, togglePaymentGateway, loadSession } from '../api/auth';

export default function Settings() {
  const session = loadSession();
  const role = (session?.profile?.role || 'student').toLowerCase();

  const [gateway, setGateway] = useState(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [gatewayUpdating, setGatewayUpdating] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState('');
  const [gatewayError, setGatewayError] = useState('');

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
    return () => { active = false; };
  }, []);

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

  if (role !== 'organizer' && role !== 'admin') {
    return <div className="text-sm text-rose-600 p-6">Access denied: Organizer/Admin required.</div>;
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface-container-low overflow-x-hidden">
      <div className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 md:py-8 lg:py-10 bg-surface border-b border-surface-variant flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-on-surface">System Settings</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Administrative controls for platform features.</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1 w-full max-w-container-max mx-auto space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-surface rounded-xl border border-secondary-fixed shadow-sm flex flex-col p-6">
            <h3 className="font-h3 text-on-surface mb-4">Payment Gateway</h3>
            <div className="mt-2 rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-label-md text-on-surface">Gateway Status</h4>
                  <p className="font-label-sm text-on-surface-variant mt-1">{gatewayLoading ? 'Loading...' : 'Manage payment gateway mode'}</p>
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

              {gatewayMessage && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{gatewayMessage}</div>}
              {gatewayError && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{gatewayError}</div>}
            </div>
          </div>

          <div className="xl:col-span-2 bg-surface rounded-xl border border-secondary-fixed shadow-sm p-6">
            <h3 className="font-h3 text-on-surface mb-4">Other Settings</h3>
            <p className="text-sm text-on-surface-variant">Reserved for future system controls.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
