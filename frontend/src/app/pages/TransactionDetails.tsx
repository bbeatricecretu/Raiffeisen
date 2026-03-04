import { ArrowLeft, MapPin, ReceiptText, Store, Calendar, CreditCard, TrendingUp, Hash, CheckCircle, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { transactions } from '../services/mockData';

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
};

function merchantSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function TransactionDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const tx = transactions.find(t => t.id === id);

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

    const isPositive = tx.amount < 0 === false;
    const formattedAmount = `${isPositive ? '+' : '-'} RON ${Math.abs(tx.amount).toFixed(2)}`;
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
                                    <div className="text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontSize: '10px' }}>IBAN</div>
                                    <div className="font-semibold text-[#1B2B4B] font-mono" style={{ fontSize: '12px' }}>{tx.iban.slice(0, 12)}…</div>
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
                            {[
                                { label: 'Total Spent', value: `RON ${tx.totalAtMerchant.toLocaleString()}` },
                                { label: 'Visits', value: `${tx.visitCount} transactions` },
                                { label: 'Avg. Spent', value: `RON ${tx.avgSpend}` },
                                { label: 'Last Visit', value: new Date(tx.lastVisit).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                            ].map(row => (
                                <div key={row.label} className="px-5 py-3.5 flex items-center justify-between">
                                    <span className="text-muted-foreground" style={{ fontSize: '13px' }}>{row.label}</span>
                                    <span className="font-bold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Go to merchant page */}
                    <button
                        onClick={() => navigate(`/app/merchant/${merchantSlug(tx.merchant)}`)}
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
