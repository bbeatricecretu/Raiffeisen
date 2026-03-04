import { useState, useMemo } from 'react';
import { X, Filter, TrendingUp, ChevronDown, MapPin } from 'lucide-react';
import { counties, transactions } from '../services/mockData';

// Romania bounding box for coordinate conversion
const MAP_W = 560;
const MAP_H = 400;
const LON_MIN = 20.2, LON_MAX = 29.7;
const LAT_MIN = 43.6, LAT_MAX = 48.3;

function lonToX(lon: number) { return ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_W; }
function latToY(lat: number) { return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H; }

// Spending heat color scale
function heatColor(spending: number, max: number) {
  const ratio = spending / max;
  if (ratio > 0.7) return '#E53935';
  if (ratio > 0.4) return '#FFD100';
  if (ratio > 0.2) return '#FFD100';
  if (ratio > 0.1) return '#FFF176';
  return '#E8F5E9';
}

const categoryIcons: Record<string, string> = {
  Groceries: '🛒', Fuel: '⛽', Food: '🍔', Subscriptions: '📱',
  Shopping: '🛍️', Transport: '🚗', Health: '💊', Utilities: '💡', Entertainment: '🎬'
};

type FilterState = {
  category: string;
  dateRange: string;
  minAmount: number;
  maxAmount: number;
};

export function SpendingMap() {
  const [selectedPin, setSelectedPin] = useState<typeof transactions[0] | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: 'All', dateRange: 'All time', minAmount: 0, maxAmount: 10000 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const maxSpending = Math.max(...counties.map(c => c.spending));

  const filteredTx = useMemo(() => transactions.filter(tx => {
    if (filters.category !== 'All' && tx.category !== filters.category) return false;
    if (tx.amount < filters.minAmount || tx.amount > filters.maxAmount) return false;
    return true;
  }), [filters]);

  // Deterministic pin offsets based on tx id
  const pinOffsets = useMemo(() => {
    return transactions.reduce<Record<string, { dx: number; dy: number }>>((acc, tx) => {
      const hash = tx.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      acc[tx.id] = { dx: ((hash * 7) % 16) - 8, dy: ((hash * 13) % 16) - 8 };
      return acc;
    }, {});
  }, []);

  const topCounties = [...counties].sort((a, b) => b.spending - a.spending).slice(0, 5);

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Map area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div>
            <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>Romania Spending Heatmap</h3>
            <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{filteredTx.length} transactions shown</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-3 mr-2">
              <span className="text-[11px] text-muted-foreground">Low</span>
              {['#E8F5E9', '#FFF176', '#FFD100', '#FFD100', '#E53935'].map((c, i) => (
                <div key={i} className="w-5 h-3 rounded" style={{ background: c }} />
              ))}
              <span className="text-[11px] text-muted-foreground">High</span>
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[12px] font-medium hover:bg-muted transition-colors"
            >
              <Filter size={13} />
              Filters
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        {/* Map container */}
        <div className="flex-1 relative overflow-hidden bg-[#EEF4FF] flex items-center justify-center p-4">
          <div className="relative" style={{ width: MAP_W, height: MAP_H }}>
            <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0">
              {/* Romania outline */}
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1B2B4B" floodOpacity="0.15" />
                </filter>
              </defs>
              <path
                d="M 95,26 L 226,30 L 332,9 L 421,26 L 421,170 L 437,238 L 500,246 L 500,263 L 447,357 L 442,383 L 384,383 L 300,383 L 116,332 L 0,281 L 0,111 Z"
                fill="#DBEAFE"
                stroke="#93C5FD"
                strokeWidth="2"
                filter="url(#shadow)"
              />

              {/* Heatmap blobs for counties */}
              {counties.map(county => {
                const cx = lonToX(county.lon);
                const cy = latToY(county.lat);
                const r = Math.sqrt(county.spending / maxSpending) * 60 + 20;
                const color = heatColor(county.spending, maxSpending);
                return (
                  <circle
                    key={county.id}
                    cx={cx} cy={cy} r={r}
                    fill={color}
                    opacity={0.55}
                    style={{ filter: 'blur(18px)' }}
                  />
                );
              })}

              {/* County label dots */}
              {counties.map(county => {
                const cx = lonToX(county.lon);
                const cy = latToY(county.lat);
                return (
                  <g key={`label-${county.id}`}>
                    <circle cx={cx} cy={cy} r={4} fill={heatColor(county.spending, maxSpending)} stroke="white" strokeWidth={1.5} opacity={0.9} />
                    <text x={cx} y={cy - 8} textAnchor="middle" fill="#1B2B4B" style={{ fontSize: '9px', fontWeight: 600 }} opacity={0.8}>
                      {county.id === 'B' ? 'BUC' : county.id}
                    </text>
                  </g>
                );
              })}

              {/* Transaction pins */}
              {filteredTx.map(tx => {
                const offset = pinOffsets[tx.id] || { dx: 0, dy: 0 };
                const cx = lonToX(tx.lon) + offset.dx;
                const cy = latToY(tx.lat) + offset.dy;
                const isSelected = selectedPin?.id === tx.id;
                return (
                  <g
                    key={tx.id}
                    onClick={() => setSelectedPin(isSelected ? null : tx)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={cx} cy={cy} r={isSelected ? 10 : 7}
                      fill={isSelected ? '#1B2B4B' : '#FFD100'}
                      stroke={isSelected ? '#FFD100' : '#1B2B4B'}
                      strokeWidth={isSelected ? 2 : 1.5}
                      style={{ transition: 'all 0.15s', filter: isSelected ? 'drop-shadow(0 2px 4px rgba(27,43,75,0.4))' : 'none' }}
                    />
                    <text x={cx} y={cy + 4} textAnchor="middle" fill={isSelected ? '#FFD100' : '#1B2B4B'} style={{ fontSize: '8px', fontWeight: 700, pointerEvents: 'none' }}>
                      {categoryIcons[tx.category] ? '' : '•'}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Pin popup */}
            {selectedPin && (() => {
              const cx = lonToX(selectedPin.lon);
              const cy = latToY(selectedPin.lat);
              const popX = cx > MAP_W * 0.6 ? cx - 230 : cx + 15;
              const popY = Math.max(10, Math.min(cy - 60, MAP_H - 200));
              return (
                <div
                  className="absolute bg-white rounded-2xl shadow-2xl border border-border p-4 z-10"
                  style={{ left: popX, top: popY, width: 220 }}
                >
                  <button onClick={() => setSelectedPin(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px]" style={{ background: '#F0F4FF' }}>
                      {categoryIcons[selectedPin.category] || '💳'}
                    </div>
                    <div>
                      <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{selectedPin.merchant}</div>
                      <div className="text-muted-foreground" style={{ fontSize: '10px' }}>{selectedPin.category} · {selectedPin.county}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Amount', value: `RON ${selectedPin.amount.toFixed(2)}` },
                      { label: 'Date', value: selectedPin.date },
                      { label: 'Total Spent', value: `RON ${selectedPin.totalAtMerchant.toLocaleString()}` },
                      { label: 'Visits', value: `${selectedPin.visitCount}x` },
                    ].map(item => (
                      <div key={item.label} className="bg-muted/60 rounded-lg p-2">
                        <div className="text-muted-foreground" style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                        <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '12px' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: '10px' }}>
                    IBAN: <span className="font-mono text-[#1B2B4B]">{selectedPin.iban.slice(0, 14)}...</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 bg-white border-l border-border overflow-y-auto shrink-0">
        {/* Filters */}
        <div className="p-4 border-b border-border">
          <div className="font-semibold text-[#1B2B4B] mb-3" style={{ fontSize: '13px' }}>Filters</div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Category</label>
              <select
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border text-[12px] text-[#1B2B4B] bg-white focus:outline-none focus:border-[#FFD100]"
              >
                {['All', 'Groceries', 'Food', 'Fuel', 'Shopping', 'Subscriptions', 'Transport', 'Health', 'Utilities'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={e => setFilters(f => ({ ...f, dateRange: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border text-[12px] text-[#1B2B4B] bg-white focus:outline-none focus:border-[#FFD100]"
              >
                {['All time', 'This month', 'Last 3 months', 'This year'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Amount Range (RON)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount || ''}
                  onChange={e => setFilters(f => ({ ...f, minAmount: Number(e.target.value) || 0 }))}
                  className="w-full px-2.5 py-2 rounded-lg border border-border text-[12px] text-[#1B2B4B] bg-white focus:outline-none focus:border-[#FFD100]"
                />
                <span className="text-muted-foreground text-[11px]">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount === 10000 ? '' : filters.maxAmount}
                  onChange={e => setFilters(f => ({ ...f, maxAmount: Number(e.target.value) || 10000 }))}
                  className="w-full px-2.5 py-2 rounded-lg border border-border text-[12px] text-[#1B2B4B] bg-white focus:outline-none focus:border-[#FFD100]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top spending by county */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-[#1B2B4B]" />
            <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>Top Counties</div>
          </div>
          <div className="space-y-2.5">
            {topCounties.map((county, i) => (
              <div key={county.id} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: i === 0 ? '#FFD100' : i === 1 ? '#1B2B4B' : '#F0F4FF' }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 700, color: i === 1 ? 'white' : '#1B2B4B' }}>{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] font-semibold text-[#1B2B4B]">{county.name}</span>
                    <span className="text-[11px] font-bold text-[#1B2B4B]">RON {county.spending.toLocaleString()}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(county.spending / maxSpending) * 100}%`, background: heatColor(county.spending, maxSpending) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions list */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-[#1B2B4B]" />
            <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>Transaction Pins</div>
          </div>
          <div className="space-y-2">
            {filteredTx.map(tx => (
              <button
                key={tx.id}
                onClick={() => setSelectedPin(tx)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${selectedPin?.id === tx.id ? 'border-[#FFD100] bg-[#FFD100]/10' : 'border-border hover:bg-muted/50'
                  }`}
              >
                <div className="text-[16px] shrink-0">{categoryIcons[tx.category] || '💳'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '12px' }}>{tx.merchant}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '10px' }}>{tx.date} · {tx.county}</div>
                </div>
                <div className="font-bold text-[#1B2B4B] shrink-0" style={{ fontSize: '12px' }}>RON {tx.amount.toFixed(0)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}