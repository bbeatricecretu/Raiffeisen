import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Store, RefreshCw, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/api';

interface MerchantSummary {
  merchant_name: string;
  tx_count: number;
  total_spent: number;
  last_visit: string | null;
  first_visit: string | null;
  avg_spend: number;
}

export function Merchants() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'me';
    api.getUserMerchants(userId)
      .then(setMerchants)
      .catch(() => setMerchants([]))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d.slice(0, 10);
    }
  };

  const filtered = search
    ? merchants.filter(m => m.merchant_name.toLowerCase().includes(search.toLowerCase()))
    : merchants;

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <RefreshCw size={28} className="animate-spin text-[#1B2B4B]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-black/5 transition-colors"
        >
          <ArrowLeft size={20} className="text-[#1B2B4B]" />
        </button>
        <div>
          <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>All Merchants</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{merchants.length} merchants found</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search merchants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]"
        />
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Total Merchants</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px' }}>{merchants.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Total Spent</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px' }}>RON {merchants.reduce((s, m) => s + m.total_spent, 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Total Transactions</div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px' }}>{merchants.reduce((s, m) => s + m.tx_count, 0)}</div>
        </div>
      </div>

      {/* Merchants List */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No merchants found.</div>
          )}
          {filtered.map(m => {
            const maxTotal = merchants[0]?.total_spent || 1;
            const pct = Math.min((m.total_spent / maxTotal) * 100, 100);
            return (
              <div
                key={m.merchant_name}
                className="flex items-center gap-4 p-4 hover:bg-black/[0.02] transition-colors cursor-pointer"
                onClick={() => navigate(`/app/merchant/${encodeURIComponent(m.merchant_name)}`)}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border bg-[#FFD100]/10">
                  <span className="font-bold text-[#1B2B4B] text-lg">{m.merchant_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '14px' }}>{m.merchant_name}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '12px' }}>
                    {m.tx_count} transaction{m.tx_count !== 1 ? 's' : ''} · Last: {fmtDate(m.last_visit)}
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#FFD100' }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '14px' }}>RON {m.total_spent.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '11px' }}>avg {m.avg_spend.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
