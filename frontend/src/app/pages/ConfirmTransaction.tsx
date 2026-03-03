import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp, Store, Calendar, Hash, RefreshCw } from 'lucide-react';
import { pendingTransaction } from '../services/mockData';

export function ConfirmTransaction() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'rejected'>('pending');
  const tx = pendingTransaction;

  const handleConfirm = () => {
    setStatus('confirming');
    setTimeout(() => setStatus('confirmed'), 1800);
  };

  const handleReject = () => {
    setStatus('rejected');
  };

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-border p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1B2B4B' }}>Transaction Confirmed</h2>
          <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: '14px' }}>
            Your payment to <strong>{tx.merchant}</strong> of <strong>RON {tx.amount.toFixed(2)}</strong> has been authorized.
          </p>
          <div className="bg-green-50 rounded-xl p-3 mb-6">
            <div className="text-green-700 font-mono" style={{ fontSize: '12px' }}>REF: {tx.iban.slice(-8)}-{Date.now().toString().slice(-6)}</div>
          </div>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="w-full py-3 rounded-xl font-semibold text-[#1B2B4B] hover:brightness-105 transition-all"
            style={{ background: '#FFD100', fontSize: '14px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-border p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1B2B4B' }}>Transaction Rejected</h2>
          <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: '14px' }}>
            The transaction to <strong>{tx.merchant}</strong> has been blocked and cancelled.
          </p>
          <button
            onClick={() => { setStatus('pending'); }}
            className="w-full py-3 rounded-xl font-semibold text-[#1B2B4B] border-2 border-[#1B2B4B]/20 hover:border-[#1B2B4B]/40 transition-all mb-3"
            style={{ fontSize: '14px' }}
          >
            Review Again
          </button>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="w-full py-3 rounded-xl font-semibold text-[#1B2B4B] hover:brightness-105 transition-all"
            style={{ background: '#FFD100', fontSize: '14px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Dark backdrop */}
      <div className="fixed inset-0 bg-[#1B2B4B]/10 backdrop-blur-[2px]" />

      {/* Modal card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-border w-full max-w-lg overflow-hidden z-10">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFD100' }}>
              <ShieldCheck size={20} className="text-[#1B2B4B]" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1B2B4B' }}>Confirm Transaction</h2>
              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Please review and authorize this payment</p>
            </div>
          </div>

          {/* Alert */}
          <div className="flex items-center gap-2 bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-[#B8960C] shrink-0" />
            <span style={{ fontSize: '12px', color: '#B8960C', fontWeight: 500 }}>
              This transaction requires your explicit authorization before processing.
            </span>
          </div>
        </div>

        {/* Transaction details */}
        <div className="px-7 py-5">
          {/* Main amount */}
          <div className="text-center mb-5">
            <div className="text-muted-foreground mb-1" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Amount</div>
            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '40px' }}>RON {tx.amount.toFixed(2)}</div>
            <div className="text-muted-foreground mt-1" style={{ fontSize: '13px' }}>{tx.merchant}</div>
          </div>

          {/* Standard info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: Store, label: 'Merchant', value: tx.merchant },
              { icon: Calendar, label: 'Date', value: tx.date },
              { icon: Hash, label: 'Category', value: tx.category },
              { icon: Clock, label: 'Status', value: 'Awaiting Auth' },
            ].map(item => (
              <div key={item.label} className="bg-muted/50 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <item.icon size={12} className="text-muted-foreground" />
                  <span className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
                </div>
                <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* IBAN */}
          <div className="bg-muted/50 rounded-xl p-3.5 mb-5">
            <div className="text-muted-foreground mb-1" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recipient IBAN</div>
            <div className="font-mono text-[#1B2B4B] break-all" style={{ fontSize: '12px' }}>{tx.iban}</div>
          </div>

          {/* Relationship data */}
          <div className="rounded-xl border border-[#FFD100]/40 overflow-hidden mb-5">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#FFD100]/30" style={{ background: '#FFF8D6' }}>
              <TrendingUp size={14} className="text-[#B8960C]" />
              <span className="font-semibold text-[#1B2B4B]" style={{ fontSize: '12px' }}>Merchant Relationship</span>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border">
              {[
                { label: 'Previous Transactions', value: `${tx.visitCount}` },
                { label: 'Total Spent', value: `RON ${tx.totalAtMerchant.toLocaleString()}` },
                { label: 'Last Visit', value: tx.lastVisit },
                { label: 'Avg. Spend', value: `RON ${tx.avgSpend.toFixed(0)}` },
              ].map(item => (
                <div key={item.label} className="p-3.5">
                  <div className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                  <div className="font-bold text-[#1B2B4B] mt-0.5" style={{ fontSize: '15px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all"
              style={{ fontSize: '14px' }}
            >
              <XCircle size={16} />
              Reject
            </button>
            <button
              onClick={handleConfirm}
              disabled={status === 'confirming'}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 disabled:opacity-70"
              style={{ background: '#FFD100', fontSize: '14px' }}
            >
              {status === 'confirming' ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirm
                </>
              )}
            </button>
          </div>

          <p className="text-center text-muted-foreground mt-3" style={{ fontSize: '11px' }}>
            🔒 Secured with 256-bit encryption · PSD2 compliant
          </p>
        </div>
      </div>
    </div>
  );
}
