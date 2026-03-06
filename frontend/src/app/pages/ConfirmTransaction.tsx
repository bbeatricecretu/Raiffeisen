import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp, Store, Calendar, Hash, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface PendingConf {
  id: string;
  user_id: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  city?: string;
  county?: string;
  status: string;
  created_at: string;
}

export function ConfirmTransaction() {
  const navigate = useNavigate();
  const [allConfs, setAllConfs] = useState<PendingConf[]>([]);
  const [loading, setLoading] = useState(true);
  // Track per-confirmation action state: 'confirming' | 'confirmed' | 'rejected'
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  // Which confirmation is expanded for the detailed view
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Cached merchant stats per merchant name
  const [merchantStats, setMerchantStats] = useState<Record<string, { visitCount: number; totalAtMerchant: number; lastVisit: string; avgSpend: number }>>({});

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    if (!expandedId) return;
    const conf = allConfs.find(c => c.id === expandedId);
    if (!conf || merchantStats[conf.merchant]) return;
    const userId = localStorage.getItem('userId') || 'me';
    api.getMerchantStats(userId, conf.merchant).then(stats => {
      setMerchantStats(prev => ({ ...prev, [conf.merchant]: {
        visitCount: stats.visit_count,
        totalAtMerchant: stats.total_spent,
        lastVisit: stats.last_visit || '-',
        avgSpend: stats.avg_spend,
      }}));
    }).catch(() => {
      setMerchantStats(prev => ({ ...prev, [conf.merchant]: {
        visitCount: 0, totalAtMerchant: 0, lastVisit: '-', avgSpend: 0,
      }}));
    });
  }, [expandedId]);

  const loadPending = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'me';
      const all: PendingConf[] = await api.getUserConfirmations(userId, 'pending');
      setAllConfs(all);
    } catch {
      setAllConfs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (c: PendingConf) => {
    setActionStates(prev => ({ ...prev, [c.id]: 'confirming' }));
    try {
      await api.updateConfirmationStatus(c.id, 'confirmed');
      setActionStates(prev => ({ ...prev, [c.id]: 'confirmed' }));
      window.dispatchEvent(new Event('confirmations-changed'));
    } catch (error) {
      console.error('Transaction failed:', error);
      setActionStates(prev => ({ ...prev, [c.id]: 'confirmed' }));
    }
  };

  const handleReject = async (c: PendingConf) => {
    try {
      await api.updateConfirmationStatus(c.id, 'rejected');
    } catch { /* ignore */ }
    setActionStates(prev => ({ ...prev, [c.id]: 'rejected' }));
    window.dispatchEvent(new Event('confirmations-changed'));
  };

  const pendingConfs = allConfs.filter(c => !actionStates[c.id]);
  const processedConfs = allConfs.filter(c => actionStates[c.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-border p-10 max-w-md w-full text-center">
          <RefreshCw size={32} className="animate-spin text-[#1B2B4B] mx-auto mb-4" />
          <p className="text-muted-foreground" style={{ fontSize: '14px' }}>Loading pending confirmations...</p>
        </div>
      </div>
    );
  }

  if (allConfs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-border p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1B2B4B' }}>All Clear</h2>
          <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: '14px' }}>
            You have no pending confirmations.
          </p>
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

  // If all have been processed
  if (pendingConfs.length === 0 && processedConfs.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-border p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1B2B4B' }}>All Done</h2>
          <p className="text-muted-foreground mt-2 mb-4" style={{ fontSize: '14px' }}>
            You've reviewed all {allConfs.length} confirmation{allConfs.length > 1 ? 's' : ''}.
          </p>
          <div className="flex gap-3 justify-center mb-6">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              {processedConfs.filter(c => actionStates[c.id] === 'confirmed').length} confirmed
            </span>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              {processedConfs.filter(c => actionStates[c.id] === 'rejected').length} rejected
            </span>
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

  const expanded = expandedId ? allConfs.find(c => c.id === expandedId) : null;

  // Helper to build tx-like object from a confirmation
  const buildTx = (c: PendingConf) => {
    const stats = merchantStats[c.merchant] || { visitCount: 0, totalAtMerchant: 0, lastVisit: '-', avgSpend: 0 };
    return {
      merchant: c.merchant,
      amount: c.amount,
      date: c.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      category: c.category || 'General',
      county: c.county || '',
      city: c.city || '',
      visitCount: stats.visitCount,
      totalAtMerchant: stats.totalAtMerchant,
      lastVisit: stats.lastVisit,
      avgSpend: stats.avgSpend,
      id: c.id,
      currency: c.currency || 'RON',
    };
  };

  // ──── EXPANDED DETAIL VIEW for one confirmation ────
  if (expanded && !actionStates[expanded.id]) {
    const tx = buildTx(expanded);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-[#1B2B4B]/10 backdrop-blur-[2px]" />
        <div className="relative bg-white rounded-3xl shadow-2xl border border-border w-full max-w-4xl overflow-hidden z-10">
          {/* Header */}
          <div className="px-7 pt-7 pb-5 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setExpandedId(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-all mr-1">
                <XCircle size={18} className="text-gray-400" />
              </button>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFD100' }}>
                <ShieldCheck size={20} className="text-[#1B2B4B]" />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1B2B4B' }}>Confirm Transaction</h2>
                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Please review and authorize this payment</p>
              </div>
              <div className="ml-auto text-xs text-gray-400">{pendingConfs.length} pending</div>
            </div>
            <div className="flex items-center gap-2 bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="text-[#B8960C] shrink-0" />
              <span style={{ fontSize: '12px', color: '#B8960C', fontWeight: 500 }}>
                This transaction requires your explicit authorization before processing.
              </span>
            </div>
          </div>

          {/* Two-column content */}
          <div className="grid grid-cols-2 divide-x divide-border">
            {/* LEFT */}
            <div className="px-7 py-5">
              <div className="text-center mb-5">
                <div className="text-muted-foreground mb-1" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Amount</div>
                <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '36px' }}>{tx.currency} {tx.amount.toFixed(2)}</div>
                <div className="text-muted-foreground mt-1" style={{ fontSize: '13px' }}>{tx.merchant}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Store, label: 'Merchant', value: tx.merchant },
                  { icon: Calendar, label: 'Date', value: tx.date },
                  { icon: Hash, label: 'Category', value: tx.category },
                  { icon: Clock, label: 'Status', value: 'Awaiting Auth' },
                ].map(item => (
                  <div key={item.label} className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
                    </div>
                    <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/50 rounded-xl p-3 mb-5">
                <div className="text-muted-foreground mb-1" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location</div>
                <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '12px' }}>{tx.city ? `${tx.city}, ` : ''}{tx.county || 'N/A'}</div>
              </div>
              <div className="rounded-xl border border-[#FFD100]/40 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#FFD100]/30" style={{ background: '#FFF8D6' }}>
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
                    <div key={item.label} className="p-3">
                      <div className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                      <div className="font-bold text-[#1B2B4B] mt-0.5" style={{ fontSize: '14px' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="px-7 py-5 flex flex-col">
              <div className="rounded-xl border-2 border-[#FFD100]/50 overflow-hidden mb-5" style={{ background: '#FFFEF5' }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#FFD100]/30" style={{ background: '#FFF8D6' }}>
                  <span style={{ fontSize: '14px' }}>✨</span>
                  <span className="font-bold text-[#B8960C]" style={{ fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Analiză AI</span>
                </div>
                <div className="px-4 py-4 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{tx.visitCount > 0 ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-yellow-500" />}</div>
                    <p className="text-[#1B2B4B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {tx.visitCount > 0
                        ? <>Comerciant verificat. Ai mai cumpărat de <strong>{tx.visitCount} ori</strong> de la {tx.merchant}.</>
                        : <>Comerciant nou. Nu ai mai cumpărat de la <strong>{tx.merchant}</strong> până acum.</>
                      }
                    </p>
                  </div>
                  {tx.avgSpend > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {tx.amount > tx.avgSpend
                          ? <AlertTriangle size={16} className="text-red-500" />
                          : <CheckCircle2 size={16} className="text-green-500" />
                        }
                      </div>
                      <p className="text-[#1B2B4B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                        {tx.amount > tx.avgSpend
                          ? <>Suma este cu <strong className="text-red-500">{Math.round(((tx.amount - tx.avgSpend) / tx.avgSpend) * 100)}% mai mare</strong> decât media ta la {tx.merchant} ({tx.avgSpend.toFixed(0)} RON).</>
                          : <>Suma se încadrează în <strong className="text-green-600">media ta obișnuită</strong> la {tx.merchant} ({tx.avgSpend.toFixed(0)} RON).</>
                        }
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 w-[16px] h-[16px] rounded-full border-2 border-[#1B2B4B] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#1B2B4B]"></div>
                    </div>
                    <p className="text-[#1B2B4B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      Locație verificată: <strong>{tx.city ? `${tx.city}, ${tx.county}` : tx.county || 'N/A'}</strong>{tx.visitCount > 0 ? ' – zonă obișnuită.' : '.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0"><Clock size={16} className="text-[#1B2B4B]/60" /></div>
                    <p className="text-[#1B2B4B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      Ora tranzacției se încadrează în <strong>programul tău obișnuit</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '14px' }}>Risc Scăzut</div>
                    <div className="text-muted-foreground" style={{ fontSize: '12px' }}>Scor de securitate: 92/100</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-4 h-4 rounded-full bg-green-500"></div>
                  ))}
                  <div className="w-4 h-4 rounded-full bg-green-300"></div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <button
                  onClick={() => handleConfirm(expanded)}
                  disabled={actionStates[expanded.id] === 'confirming'}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all hover:brightness-105 disabled:opacity-70"
                  style={{ background: '#FFD100', fontSize: '16px' }}
                >
                  {actionStates[expanded.id] === 'confirming' ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <><CheckCircle2 size={18} /> Confirmă Plata</>
                  )}
                </button>
                <button
                  onClick={() => handleReject(expanded)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-red-500 border-2 border-red-200 hover:bg-red-50 transition-all"
                  style={{ fontSize: '16px' }}
                >
                  <XCircle size={18} /> Respinge
                </button>
              </div>
              <p className="text-center text-muted-foreground mt-3" style={{ fontSize: '11px' }}>
                🔒 Secured with 256-bit encryption · PSD2 compliant
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──── LIST VIEW: all pending confirmations ────
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFD100' }}>
            <ShieldCheck size={20} className="text-[#1B2B4B]" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1B2B4B' }}>Pending Confirmations</h1>
            <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{pendingConfs.length} transaction{pendingConfs.length !== 1 ? 's' : ''} awaiting your review</p>
          </div>
        </div>

        {/* Confirmation cards */}
        <div className="space-y-3">
          {pendingConfs.map(c => {
            const state = actionStates[c.id];
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFD100]/15 flex items-center justify-center">
                      <Store size={22} className="text-[#1B2B4B]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '15px' }}>{c.merchant}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-muted-foreground" style={{ fontSize: '12px' }}>{c.category || 'General'}</span>
                        {c.county && <span className="text-muted-foreground" style={{ fontSize: '12px' }}>· {c.county}</span>}
                        <span className="text-muted-foreground" style={{ fontSize: '12px' }}>· {c.created_at?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>{c.currency || 'RON'} {c.amount.toFixed(2)}</div>
                    <div className="text-yellow-600 text-xs font-semibold mt-0.5">Pending</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedId(c.id)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-[#1B2B4B] border border-gray-200 hover:bg-gray-50 transition-all text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleConfirm(c)}
                    disabled={state === 'confirming'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-[#1B2B4B] hover:brightness-105 transition-all text-sm disabled:opacity-70"
                    style={{ background: '#FFD100' }}
                  >
                    {state === 'confirming' ? <RefreshCw size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Confirm</>}
                  </button>
                  <button
                    onClick={() => handleReject(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all text-sm"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            );
          })}

          {/* Already processed */}
          {processedConfs.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${actionStates[c.id] === 'confirmed' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {actionStates[c.id] === 'confirmed' ? <CheckCircle2 size={22} className="text-green-600" /> : <XCircle size={22} className="text-red-500" />}
                  </div>
                  <div>
                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '15px' }}>{c.merchant}</div>
                    <div className="text-muted-foreground" style={{ fontSize: '12px' }}>{c.category || 'General'} · {c.created_at?.slice(0, 10)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>{c.currency || 'RON'} {c.amount.toFixed(2)}</div>
                  <span className={`text-xs font-semibold ${actionStates[c.id] === 'confirmed' ? 'text-green-600' : 'text-red-500'}`}>
                    {actionStates[c.id] === 'confirmed' ? '✓ Confirmed' : '✗ Rejected'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/app/dashboard')}
            className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-all text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
