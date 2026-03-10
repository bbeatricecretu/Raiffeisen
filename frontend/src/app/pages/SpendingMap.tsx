import { useState, useMemo, useEffect } from 'react';
import { X, Filter, TrendingUp, ChevronDown, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { getHideSmallAmountsPreference, shouldHideAmount } from '../services/userPreferences';


// County Coordinates (approximate centroids)
const COUNTY_COORDS: Record<string, { lat: number, lon: number, name: string }> = {
    'B': { lat: 44.43, lon: 26.10, name: 'Bucharest' },
    'CJ': { lat: 46.77, lon: 23.60, name: 'Cluj' },
    'TM': { lat: 45.75, lon: 21.23, name: 'Timis' },
    'IS': { lat: 47.16, lon: 27.58, name: 'Iasi' },
    'BV': { lat: 45.65, lon: 25.60, name: 'Brasov' },
    'CT': { lat: 44.17, lon: 28.63, name: 'Constanta' },
    'DJ': { lat: 44.32, lon: 23.80, name: 'Dolj' },
    'BH': { lat: 47.05, lon: 21.92, name: 'Bihor' },
    'SB': { lat: 45.80, lon: 24.15, name: 'Sibiu' },
    'MS': { lat: 46.54, lon: 24.56, name: 'Mures' },
    'BC': { lat: 46.57, lon: 26.91, name: 'Bacau' },
    'AG': { lat: 44.86, lon: 24.87, name: 'Arges' },
    'PH': { lat: 44.93, lon: 26.02, name: 'Prahova' }, // Tweaked slightly
    'VS': { lat: 46.63, lon: 27.73, name: 'Vaslui' },
    'GL': { lat: 45.43, lon: 28.03, name: 'Galati' },
    'TL': { lat: 45.17, lon: 28.80, name: 'Tulcea' },
    'MM': { lat: 47.66, lon: 23.57, name: 'Maramures' },
    'SV': { lat: 47.64, lon: 26.25, name: 'Suceava' },
    'HD': { lat: 45.88, lon: 22.90, name: 'Hunedoara' },
    'AB': { lat: 46.07, lon: 23.58, name: 'Alba' },
    'AR': { lat: 46.18, lon: 21.31, name: 'Arad' },
    'CS': { lat: 45.30, lon: 21.88, name: 'Caras-Severin' },
    'GJ': { lat: 45.04, lon: 23.27, name: 'Gorj' },
    'MH': { lat: 44.63, lon: 22.65, name: 'Mehedinti' },
    'OT': { lat: 44.43, lon: 24.36, name: 'Olt' },
    'TR': { lat: 43.97, lon: 25.33, name: 'Teleorman' },
    'GR': { lat: 43.90, lon: 25.96, name: 'Giurgiu' },
    'CL': { lat: 44.20, lon: 27.33, name: 'Calarasi' },
    'IL': { lat: 44.56, lon: 27.36, name: 'Ialomita' },
    'BR': { lat: 45.27, lon: 27.97, name: 'Braila' },
    'BZ': { lat: 45.15, lon: 26.82, name: 'Buzau' },
    'VN': { lat: 45.70, lon: 27.18, name: 'Vrancea' },
    'CV': { lat: 45.87, lon: 26.13, name: 'Covasna' },
    'HR': { lat: 46.36, lon: 25.30, name: 'Harghita' },
    'NT': { lat: 46.93, lon: 26.37, name: 'Neamt' },
    'BT': { lat: 47.75, lon: 26.66, name: 'Botosani' },
    'SJ': { lat: 47.18, lon: 23.06, name: 'Salaj' },
    'BN': { lat: 47.13, lon: 24.50, name: 'Bistrita-Nasaud' },
    'SM': { lat: 47.78, lon: 22.88, name: 'Satu Mare' },
    'VL': { lat: 45.10, lon: 24.37, name: 'Valcea' },
    'DB': { lat: 44.93, lon: 25.45, name: 'Dambovita' },
    'IF': { lat: 44.60, lon: 26.18, name: 'Ilfov' },
};

// City coordinates for transactions that have city but no county
const CITY_COORDS: Record<string, { lat: number; lon: number; county: string }> = {
    'Cluj-Napoca': { lat: 46.77, lon: 23.60, county: 'CJ' },
    'Cluj': { lat: 46.77, lon: 23.60, county: 'CJ' },
    'Bucharest': { lat: 44.43, lon: 26.10, county: 'B' },
    'București': { lat: 44.43, lon: 26.10, county: 'B' },
    'Timișoara': { lat: 45.75, lon: 21.23, county: 'TM' },
    'Timisoara': { lat: 45.75, lon: 21.23, county: 'TM' },
    'Iași': { lat: 47.16, lon: 27.58, county: 'IS' },
    'Iasi': { lat: 47.16, lon: 27.58, county: 'IS' },
    'Brașov': { lat: 45.65, lon: 25.60, county: 'BV' },
    'Brasov': { lat: 45.65, lon: 25.60, county: 'BV' },
    'Constanța': { lat: 44.17, lon: 28.63, county: 'CT' },
    'Constanta': { lat: 44.17, lon: 28.63, county: 'CT' },
    'Craiova': { lat: 44.32, lon: 23.80, county: 'DJ' },
    'Oradea': { lat: 47.05, lon: 21.92, county: 'BH' },
    'Sibiu': { lat: 45.80, lon: 24.15, county: 'SB' },
    'Online': { lat: 46.77, lon: 23.60, county: 'CJ' }, // Default online purchases to user's city
};

// Spending heat color scale
function heatColor(spending: number, max: number) {
  const ratio = max > 0 ? spending / max : 0;
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
  const [transactions, setTransactions] = useState<any[]>([]);
  // counties array is now purely derived from filtered transactions
  // const [counties, setCounties] = useState<any[]>([]); // Removed: derived instead
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: 'All', dateRange: 'All time', minAmount: 0, maxAmount: 10000 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hideSmallAmounts, setHideSmallAmounts] = useState<boolean>(() => getHideSmallAmountsPreference());

  useEffect(() => {
    const uid = localStorage.getItem('userId') || 'me';
    
    // Fetch MORE transactions for better filtering
    api.getTransactions(uid, 1000).then(txs => {
      // Enrich with simulated coordinates if missing
      const enriched = txs.map((t: any) => {
        // Resolve coordinates: county → city → random fallback
        const countyCoord = t.county && COUNTY_COORDS[t.county] ? COUNTY_COORDS[t.county] : null;
        const cityCoord = t.city && CITY_COORDS[t.city] ? CITY_COORDS[t.city] : null;
        const base = countyCoord || cityCoord;
        return {
          ...t,
          lat: base ? (base.lat + (Math.random() - 0.5) * 0.08) : (44.5 + (Math.random() - 0.5) * 4),
          lon: base ? (base.lon + (Math.random() - 0.5) * 0.08) : (25.0 + (Math.random() - 0.5) * 5),
          merchant: t.merchant_name || t.merchant
        };
      });
      setTransactions(enriched);
    }).catch(() => setTransactions([]));
  }, []);

  useEffect(() => {
    const syncPreference = () => setHideSmallAmounts(getHideSmallAmountsPreference());
    window.addEventListener('settings-changed', syncPreference);
    window.addEventListener('storage', syncPreference);
    return () => {
      window.removeEventListener('settings-changed', syncPreference);
      window.removeEventListener('storage', syncPreference);
    };
  }, []);

  const filteredTx = useMemo(() => transactions.filter(tx => {
    if (shouldHideAmount(Number(tx.amount) || 0, hideSmallAmounts)) return false;

    // 1. Amount
    if (tx.amount < filters.minAmount || tx.amount > filters.maxAmount) return false;
    
    // 2. Category
    if (filters.category !== 'All' && tx.category !== filters.category) return false;
    
    // 3. Date Range
    if (filters.dateRange !== 'All time') {
      const date = new Date(tx.date);
      const now = new Date();
      if (filters.dateRange === 'This month') {
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
      } else if (filters.dateRange === 'Last 3 months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        if (date < threeMonthsAgo) return false;
      } else if (filters.dateRange === 'This year') {
        if (date.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  }), [filters, transactions, hideSmallAmounts]);

    // Aggregate by county
    const countyData = useMemo(() => {
        const aggs: Record<string, { id: string, spending: number, txCount: number }> = {};
        
        filteredTx.forEach(tx => {
            if (tx.county) {
                if (!aggs[tx.county]) aggs[tx.county] = { id: tx.county, spending: 0, txCount: 0 };
                aggs[tx.county].spending += tx.amount;
                aggs[tx.county].txCount += 1;
            }
        });

        // Convert to array and match with coordinates
        return Object.values(aggs).map(c => ({
            ...c,
            // Attach coordinates from static dict
            ...COUNTY_COORDS[c.id] || { lat: 46, lon: 25, name: c.id }
        }));

    }, [filteredTx]);

  const maxSpending = countyData.length > 0 ? Math.max(...countyData.map(c => c.spending)) : 1000;


  const topCounties = [...countyData].sort((a, b) => b.spending - a.spending).slice(0, 5);

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
        <div className="flex-1 relative overflow-hidden bg-[#EEF4FF] z-0">
          <MapContainer center={[46.0, 25.0]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Heatmap circles */}
            {countyData.map(county => {
              const r = Math.sqrt(county.spending / maxSpending) * 30000 + 10000;
              const color = heatColor(county.spending, maxSpending);
              return (
                <Circle
                  key={county.id}
                  center={[county.lat, county.lon]}
                  radius={r}
                  pathOptions={{ fillColor: color, color: color, fillOpacity: 0.4, stroke: false }}
                >
                  <Tooltip direction="center" offset={[0, 0]} opacity={0.7} permanent>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#333' }}>{Math.round(county.spending)} RON</span>
                  </Tooltip>
                </Circle>
              );
            })}

            {/* Transaction markers */}
            {filteredTx.map(tx => {
              const isSelected = selectedPin?.id === tx.id;
              return (
                <CircleMarker
                  key={tx.id}
                  center={[tx.lat, tx.lon]}
                  radius={isSelected ? 8 : 5}
                  pathOptions={{
                    fillColor: isSelected ? '#1B2B4B' : '#FFD100',
                    color: isSelected ? '#FFD100' : '#1B2B4B',
                    weight: isSelected ? 2 : 1,
                    fillOpacity: 1
                  }}
                  eventHandlers={{
                    click: () => setSelectedPin(isSelected ? null : tx),
                  }}
                >
                  {isSelected && (
                    <Popup eventHandlers={{ remove: () => setSelectedPin(null) }}>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px]" style={{ background: '#F0F4FF' }}>
                            {categoryIcons[tx.category] || '💳'}
                          </div>
                          <div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{tx.merchant}</div>
                            <div className="text-muted-foreground" style={{ fontSize: '10px' }}>{tx.category} · {tx.county}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[
                            { label: 'Amount', value: `RON ${tx.amount.toFixed(2)}` },
                            { label: 'Date', value: tx.date },
                            { label: 'Total Spent', value: `RON ${(tx.totalAtMerchant || 0).toLocaleString()}` },
                            { label: 'Visits', value: `${tx.visitCount || 1}x` },
                          ].map(item => (
                            <div key={item.label} className="bg-muted/60 rounded-lg p-2">
                              <div className="text-muted-foreground" style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                              <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '12px' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-muted-foreground" style={{ fontSize: '10px' }}>
                          IBAN: <span className="font-mono text-[#1B2B4B]">{tx.iban?.slice(0, 14)}...</span>
                        </div>
                      </div>
                    </Popup>
                  )}
                </CircleMarker>
              );
            })}
          </MapContainer>
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