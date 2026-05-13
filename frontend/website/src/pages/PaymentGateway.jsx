import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmDemoPayment, fetchPaymentGatewayStatus, fetchWorkshop, loadSession } from '../lib/auth';

function formatVnd(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = loadSession();
  const registrationId = Number(searchParams.get('registrationId'));
  const workshopId = Number(searchParams.get('workshopId'));
  const [gateway, setGateway] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [workshop, setWorkshop] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadWorkshop() {
      try {
        const res = await fetchWorkshop(workshopId);
        if (active) setWorkshop(res.workshop || null);
      } catch {
        if (active) setWorkshop(null);
      }
    }

    async function loadGateway() {
      try {
        const res = await fetchPaymentGatewayStatus();
        if (active) setGateway(res.gateway);
      } catch {
        if (active) setGateway(null);
      }
    }

    loadWorkshop();
    loadGateway();
    const timer = window.setInterval(loadGateway, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const subtotal = Number(workshop?.price ?? 0);
  const vatRate = 0.1;
  const vatAmount = subtotal * vatRate;
  const totalAmount = subtotal + vatAmount;

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
      setMessage('Demo payment completed successfully.');
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

  return (
    <main className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary-container mb-2">Payment Gateway</p>
        <h1 className="font-h1 text-h1 text-on-surface mb-2">Secure Checkout</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          Review your order, choose a payment method, and complete the transaction in VND.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: payer information and payment method */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          
          {/* Payer information */}
          <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <h2 className="font-h2 text-h2 text-on-surface flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">person</span>
              Payer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface">Full Name</label>
                <input 
                  type="text" 
                  readOnly
                  defaultValue={session?.profile?.full_name || ''}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface">Student ID</label>
                <input 
                  type="text" 
                  readOnly
                  defaultValue={session?.profile?.student_id || ''}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface">Email</label>
                <input 
                  type="text" 
                  readOnly
                  defaultValue={session?.profile?.email || ''}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <h2 className="font-h2 text-h2 text-on-surface flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Payment Method
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => setPaymentMethod('card')}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant bg-surface hover:border-primary/50'}`}
              >
                <span className="material-symbols-outlined text-3xl mb-2 text-on-surface">credit_card</span>
                <h3 className="font-label-md text-label-md text-on-surface font-semibold">Credit Card</h3>
                <p className="text-xs text-on-surface-variant mt-1">Visa, Mastercard, JCB</p>
              </div>

              <div 
                onClick={() => setPaymentMethod('ewallet')}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${paymentMethod === 'ewallet' ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant bg-surface hover:border-primary/50'}`}
              >
                <span className="material-symbols-outlined text-3xl mb-2 text-on-surface">phone_iphone</span>
                <h3 className="font-label-md text-label-md text-on-surface font-semibold">E-Wallet</h3>
                <p className="text-xs text-on-surface-variant mt-1">MoMo, ZaloPay, VNPay</p>
              </div>

              <div 
                onClick={() => setPaymentMethod('bank')}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${paymentMethod === 'bank' ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant bg-surface hover:border-primary/50'}`}
              >
                <span className="material-symbols-outlined text-3xl mb-2 text-on-surface">account_balance</span>
                <h3 className="font-label-md text-label-md text-on-surface font-semibold">Bank Transfer</h3>
                <p className="text-xs text-on-surface-variant mt-1">Scan a VietQR code</p>
              </div>
            </div>

            {/* Mock card details shown only when card is selected */}
            {paymentMethod === 'card' && (
              <div className="mt-6 space-y-4 pt-6 border-t border-outline-variant/50">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface">Card Number</label>
                  <div className="relative">
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">credit_card</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface">Expiry Date</label>
                    <input type="text" placeholder="MM/YY" className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface">CVV</label>
                    <input type="text" placeholder="123" className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column: order summary and payment action */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-8 space-y-6">
          <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <h2 className="font-h2 text-h2 text-on-surface mb-6">Order Summary</h2>
            
            {/* Order details */}
            <div className="space-y-4 mb-6 pb-6 border-b border-outline-variant/50 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant">Registration ID</span>
                <span className="font-semibold text-on-surface">#{registrationId || '---'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant">Workshop ID</span>
                <span className="font-semibold text-on-surface">#{workshopId || '---'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant">Ticket Price</span>
                <span className="font-semibold text-on-surface">{formatVnd(subtotal)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant">VAT (10%)</span>
                <span className="font-semibold text-on-surface">{formatVnd(vatAmount)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-8">
              <span className="font-h3 text-h3 text-on-surface">Total</span>
              <span className="font-h2 text-h2 text-primary">{formatVnd(totalAmount)}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePay}
                disabled={!canPay || submitting}
                className="ui-btn ui-btn-primary rounded-xl w-full py-4 font-semibold text-base flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <span className="material-symbols-outlined">{submitting ? 'hourglass_empty' : 'lock'}</span>
                {submitting ? 'Processing...' : 'Confirm Payment'}
              </button>
              
              <button
                onClick={() => navigate(`/workshops/${workshopId}`)}
                className="ui-btn ui-btn-surface rounded-xl w-full py-3 border border-outline-variant font-medium hover:bg-surface-container transition-colors"
              >
                Cancel and Go Back
              </button>
            </div>

            {/* Feedback */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${message.toLowerCase().includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {message}
              </div>
            )}
            {!canPay && !message && (
              <div className="mt-4 p-3 rounded-lg text-sm text-center font-medium bg-rose-50 text-rose-700">
                Payment gateway error. Please try again later.
              </div>
            )}
          </section>
          
          <div className="text-center">
            <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Secure payment protected by 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}