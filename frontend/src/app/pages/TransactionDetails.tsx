import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, ReceiptText, Store, Calendar, CreditCard, TrendingUp, Hash, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { transactions } from '../services/mockData';
import { api } from '../services/api';

// Fix leaflet default icon
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORY_COLORS: Record<string, string> = {
    'Groceries': '#FFD100',
    'Shopping': '#1B2B4B',
    'Fuel': '#2A3C5F',
    'Subscriptions': '#94A3B8',
    'Food': '#22C55E',
    'Transport': '#000000',
    'Health': '#22C55E',
    'Utilities': '#64748B',
    'Entertainment': '#F97316',
    'Exchange': '#1B2B4B',
};

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
    'Cluj-Napoca': { lat: 46.77, lon: 23.60 },
    'Cluj': { lat: 46.77, lon: 23.60 },
    'Bucharest': { lat: 44.43, lon: 26.10 },
    'București': { lat: 44.43, lon: 26.10 },
    'Timișoara': { lat: 45.75, lon: 21.23 },
    'Timisoara': { lat: 45.75, lon: 21.23 },
    'Iași': { lat: 47.16, lon: 27.58 },
    'Iasi': { lat: 47.16, lon: 27.58 },
    'Brașov': { lat: 45.65, lon: 25.60 },
    'Brasov': { lat: 45.65, lon: 25.60 },
    'Constanța': { lat: 44.17, lon: 28.63 },
    'Constanta': { lat: 44.17, lon: 28.63 },
    'Craiova': { lat: 44.32, lon: 23.80 },
    'Oradea': { lat: 47.05, lon: 21.92 },
    'Sibiu': { lat: 45.80, lon: 24.15 },
    'Suceava': { lat: 47.63, lon: 26.26 },
    'Galați': { lat: 45.43, lon: 28.05 },
    'Ploiești': { lat: 44.94, lon: 26.03 },
    'Pitești': { lat: 44.86, lon: 24.87 },
    'Arad': { lat: 46.17, lon: 21.32 },
    'Buzău': { lat: 45.15, lon: 26.83 },
    'Online': { lat: 46.77, lon: 23.60 },
};

// Normalized tx shape used by the component
interface NormalizedTx {
    id: string;
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    category: string;
    county: string;
    city: string;
    lat: number;
    lon: number;
    status: string;
}

export function TransactionDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [tx, setTx] = useState<NormalizedTx | null>(null);
    const [merchantStats, setMerchantStats] = useState<{ totalAtMerchant: number; visitCount: number; avgSpend: number; lastVisit: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { setLoading(false); return; }

        // Try mock first
        const mockTx = transactions.find(t => t.id === id);
        if (mockTx) {
            setTx({
                id: mockTx.id, merchant: mockTx.merchant, amount: mockTx.amount, currency: 'RON',
                date: mockTx.date, category: mockTx.category, county: mockTx.county,
                city: '', lat: mockTx.lat, lon: mockTx.lon, status: mockTx.status,
            });
            setMerchantStats({ totalAtMerchant: mockTx.totalAtMerchant, visitCount: mockTx.visitCount, avgSpend: mockTx.avgSpend, lastVisit: mockTx.lastVisit });
            setLoading(false);
            return;
        }

        // Fetch from API
        api.getTransaction(id).then(apiTx => {
            const city = apiTx.city || 'Online';
            const coords = CITY_COORDS[city] || CITY_COORDS['Online'] || { lat: 46.77, lon: 23.60 };
            setTx({
                id: apiTx.id, merchant: apiTx.merchant_name, amount: apiTx.amount,
                currency: apiTx.currency || 'RON', date: apiTx.date,
                category: apiTx.category || 'General', county: apiTx.county || '',
                city: apiTx.city || '', lat: coords.lat, lon: coords.lon,
                status: 'completed',
            });
            // Fetch merchant stats
            const userId = localStorage.getItem('userId') || apiTx.user_id;
            return api.getMerchantStats(userId, apiTx.merchant_name);
        }).then(stats => {
            setMerchantStats({ totalAtMerchant: stats.total_spent, visitCount: stats.visit_count, avgSpend: stats.avg_spend, lastVisit: stats.last_visit || '-' });
        }).catch(() => {
            setMerchantStats(null);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
                <RefreshCw size={28} className="animate-spin text-[#1B2B4B]" />
            </div>
        );
    }

    if (!tx) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#1B2B4B]/60 hover:text-[#1B2B4B] mb-6">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="text-center py-20 text-muted-foreground">Transaction not found.</div>
            </div>
        );
    }

    const isPositive = tx.amount < 0;
    const formattedAmount = `${isPositive ? '+' : '-'} ${tx.currency} ${Math.abs(tx.amount).toFixed(2)}`;
    const formattedDate = new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const catColor = CATEGORY_COLORS[tx.category] || '#94A3B8';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-black/5 transition-colors shrink-0"
                >
                    <ArrowLeft size={20} className="text-[#1B2B4B]" />
                </button>
                <div>
                    <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>Transaction Details</h1>
                    <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Full breakdown &amp; location</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left: main info + map */}
                <div className="md:col-span-2 space-y-6">

                    {/* Hero card */}
                    <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: `${catColor}18` }}
                                >
                                    <ReceiptText size={26} style={{ color: catColor }} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px' }}>{tx.merchant}</h2>
                                    <span
                                        className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-white font-semibold"
                                        style={{ background: catColor, fontSize: '11px' }}
                                    >
                                        {tx.category}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div
                                    className="font-bold"
                                    style={{ fontSize: '26px', color: isPositive ? '#22C55E' : '#1B2B4B' }}
                                >
                                    {formattedAmount}
                                </div>
                                <div className={`flex items-center justify-end gap-1 mt-1 text-[12px] font-semibold ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-500'}`}>
                                    {tx.status === 'completed'
                                        ? <><CheckCircle size={13} /> Completed</>
                                        : <><Clock size={13} /> Pending</>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5F7FF' }}>
                                    <Calendar size={16} className="text-[#1B2B4B]" />
                                </div>
                                <div>
                                    <div className="text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontSize: '10px' }}>Date</div>
                                    <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{formattedDate}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5F7FF' }}>
                                    <Hash size={16} className="text-[#1B2B4B]" />
                                </div>
                                <div>
                                    <div className="text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontSize: '10px' }}>Transaction ID</div>
                                    <div className="font-semibold text-[#1B2B4B] font-mono" style={{ fontSize: '12px' }}>{tx.id.toUpperCase()}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5F7FF' }}>
                                    <CreditCard size={16} className="text-[#1B2B4B]" />
                                </div>
                                <div>
                                    <div className="text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontSize: '10px' }}>Location</div>
                                    <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{tx.city}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5F7FF' }}>
                                    <MapPin size={16} className="text-[#1B2B4B]" />
                                </div>
                                <div>
                                    <div className="text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontSize: '10px' }}>County</div>
                                    <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{tx.county}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <MapPin size={18} className="text-[#FFD100]" />
                            <h3 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '15px' }}>Transaction Location</h3>
                        </div>
                        <div className="h-64 relative z-0">
                            <MapContainer
                                center={[tx.lat, tx.lon]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[tx.lat, tx.lon]}>
                                    <Popup>
                                        <div className="font-semibold text-[#1B2B4B]">{tx.merchant}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{formattedDate}</div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* Right: merchant stats + CTA */}
                <div className="md:col-span-1 space-y-5">

                    {/* Merchant stats */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <TrendingUp size={16} className="text-[#FFD100]" />
                            <h3 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '15px' }}>With this Merchant</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {merchantStats ? [
                                { label: 'Total Spent', value: `RON ${merchantStats.totalAtMerchant.toLocaleString()}` },
                                { label: 'Visits', value: `${merchantStats.visitCount} transactions` },
                                { label: 'Avg. Spent', value: `RON ${merchantStats.avgSpend}` },
                                { label: 'Last Visit', value: new Date(merchantStats.lastVisit).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                            ].map(row => (
                                <div key={row.label} className="px-5 py-3.5 flex items-center justify-between">
                                    <span className="text-muted-foreground" style={{ fontSize: '13px' }}>{row.label}</span>
                                    <span className="font-bold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{row.value}</span>
                                </div>
                            )) : (
                                <div className="px-5 py-6 text-center text-muted-foreground text-sm">Loading stats…</div>
                            )}
                        </div>
                    </div>

                    {/* Go to merchant page */}
                    <button
                        onClick={() => navigate(`/app/merchant/${encodeURIComponent(tx.merchant)}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-semibold transition-all hover:brightness-105 shadow-sm"
                        style={{ background: '#FFD100', color: '#1B2B4B', fontSize: '14px' }}
                    >
                        <Store size={18} />
                        View Merchant Page
                    </button>

                    {/* Ask AI */}
                    <button
                        onClick={() => navigate('/app/chat')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-semibold border border-border bg-white transition-all hover:bg-black/5"
                        style={{ color: '#1B2B4B', fontSize: '14px' }}
                    >
                        Ask AI about this transaction
                    </button>
                </div>

            </div>
        </div>
    );
}
