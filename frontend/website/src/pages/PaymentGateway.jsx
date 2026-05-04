import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmDemoPayment, fetchPaymentGatewayStatus, loadSession, setPaymentGatewayState } from '../lib/auth';

const STATE_LABEL = {
  closed: 'Closed',
  open: 'Open',
  'half-open': 'Half-open',
};

export default function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = loadSession();
  const registrationId = Number(searchParams.get('registrationId'));
  const workshopId = Number(searchParams.get('workshopId'));
  const [gateway, setGateway] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadGateway() {
      try {
        const res = await fetchPaymentGatewayStatus();
        if (active) setGateway(res.gateway);
      } catch {
        if (active) setGateway(null);
      }
    }

    loadGateway();
    const timer = window.setInterval(loadGateway, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const canPay = useMemo(() => {
    if (!gateway) return false;
    return gateway.canAttempt;
  }, [gateway]);

  async function handlePay() {
    setSubmitting(true);
    setMessage('');

    try {
      if (!session?.token) {
        setMessage('Please sign in first.');
        return;
      }

      const response = await confirmDemoPayment({ registrationId, workshopId }, session.token);
      setGateway(response.gateway);
      setMessage('Thanh toán demo thành công.');
      window.setTimeout(() => navigate('/tickets'), 700);
    } catch (error) {
      setMessage(error.message || 'Payment failed.');
      try {
        const res = await fetchPaymentGatewayStatus();
        setGateway(res.gateway);
      } catch {
        // ignore
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetState(state) {
    try {
      const res = await setPaymentGatewayState(state);
      setGateway(res.gateway);
      setMessage(`Gateway set to ${STATE_LABEL[state] || state}.`);
    } catch (error) {
      setMessage(error.message || 'Unable to update gateway state.');
    }
  }

  return (
    <main className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 shadow-sm">
        <p className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary-container mb-2">Demo Payment Gateway</p>
        <h1 className="font-h1 text-h1 text-on-surface mb-4">Simulated checkout for workshop registration</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          This page emulates an external payment gateway. You can switch between closed, open, and half-open states to test the circuit breaker without affecting catalog, tickets, or other features.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant bg-surface p-4">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Gateway Mode</p>
            <p className="font-h2 text-h2 text-on-surface mt-2">{gateway ? STATE_LABEL[gateway.mode] : 'Loading...'}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface p-4">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Probe</p>
            <p className="font-h2 text-h2 text-on-surface mt-2">{gateway?.probeAvailable ? 'Available' : 'Used'}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface p-4">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Registration</p>
            <p className="font-h2 text-h2 text-on-surface mt-2">{Number.isFinite(registrationId) ? registrationId : 'TBA'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => handleSetState('closed')} className="ui-btn ui-btn-primary rounded-xl px-4 py-3">
            Set Closed
          </button>
          <button onClick={() => handleSetState('half-open')} className="ui-btn ui-btn-surface rounded-xl px-4 py-3 border border-outline-variant">
            Set Half-open
          </button>
          <button onClick={() => handleSetState('open')} className="ui-btn ui-btn-soft rounded-xl px-4 py-3 border border-rose-200 text-rose-700">
            Set Open
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-outline-variant bg-gradient-to-br from-primary-fixed/10 to-surface p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Checkout status</p>
              <h2 className="font-h2 text-h2 text-on-surface mt-2">{gateway?.message || 'Loading gateway status...'}</h2>
            </div>
            <div className={`rounded-full px-4 py-2 font-label-md text-label-md border ${canPay ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {canPay ? 'Payment enabled' : 'Payment disabled'}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={handlePay}
              disabled={!canPay || submitting}
              className="ui-btn ui-btn-primary rounded-xl px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Complete Demo Payment'}
            </button>
            <button
              onClick={() => navigate(`/workshops/${workshopId}`)}
              className="ui-btn ui-btn-surface rounded-xl px-5 py-3 border border-outline-variant"
            >
              Back to Workshop
            </button>
          </div>

          {message && <p className="mt-4 font-body-md text-body-md text-on-surface-variant">{message}</p>}
          {!canPay && <p className="mt-3 font-body-md text-body-md text-rose-700">{gateway?.message || 'Payment currently unavailable.'}</p>}
        </div>
      </div>
    </main>
  );
}
