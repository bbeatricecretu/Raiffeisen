import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../services/api';

// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    'Galati': { lat: 45.43, lon: 28.05 },
    'Ploiești': { lat: 44.94, lon: 26.03 },
    'Ploiesti': { lat: 44.94, lon: 26.03 },
    'Pitești': { lat: 44.86, lon: 24.87 },
    'Pitesti': { lat: 44.86, lon: 24.87 },
    'Arad': { lat: 46.17, lon: 21.32 },
    'Târgu Mureș': { lat: 46.55, lon: 24.56 },
    'Baia Mare': { lat: 47.66, lon: 23.58 },
    'Buzău': { lat: 45.15, lon: 26.83 },
    'Buzau': { lat: 45.15, lon: 26.83 },
    'Satu Mare': { lat: 47.79, lon: 22.89 },
    'Online': { lat: 46.77, lon: 23.60 },
};

interface MerchantTx {
    id: string;
    merchant_name: string;
    amount: number;
    currency: string;
    category: string;
    city: string;
    county: string;
    date: string;
}

interface MerchantDetail {
    visit_count: number;
    total_spent: number;
    first_visit: string | null;
    last_visit: string | null;
    avg_spend: number;
    common_locations: string[];
    weekday_distribution: Record<string, number>;
    transactions: MerchantTx[];
}

export function MerchantDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const merchantName = decodeURIComponent(id || '');

    const [data, setData] = useState<MerchantDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!merchantName) return;
        const userId = localStorage.getItem('userId') || 'me';
        api.getMerchantDetail(userId, merchantName)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [merchantName]);

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
                <RefreshCw size={28} className="animate-spin text-[#1B2B4B]" />
            </div>
        );
    }

    if (!data || data.visit_count === 0) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
                <h2 className="text-xl font-bold text-[#1B2B4B]">No data found</h2>
                <p className="text-muted-foreground">No transactions found for "{merchantName}".</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl font-semibold" style={{ background: '#FFD100' }}>Go Back</button>
            </div>
        );
    }

    // Build unique map locations from transactions
    const locationMap = new Map<string, { lat: number; lng: number; name: string; count: number }>();
    data.transactions.forEach(tx => {
        const city = tx.city || 'Online';
        const coords = CITY_COORDS[city];
        if (coords && !locationMap.has(city)) {
            locationMap.set(city, { lat: coords.lat, lng: coords.lon, name: city, count: 0 });
        }
        if (locationMap.has(city)) {
            locationMap.get(city)!.count++;
        }
    });
    const locations = Array.from(locationMap.values());

    // Format date helper
    const fmtDate = (d: string) => {
        try {
            const dt = new Date(d);
            return dt.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return d?.slice(0, 10) || '-';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-black/5 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-[#1B2B4B]" />
                    </button>
                    <div>
                        <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>Merchant Details</h1>
                        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Transaction history and info</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/app/chat')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all hover:brightness-105 shadow-sm"
                    style={{ background: '#FFD100', color: '#1B2B4B', fontSize: '14px' }}
                >
                    <MessageSquare size={18} />
                    Ask AI Assistant
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Merchant Header Card */}
                    <div className="bg-white rounded-2xl border border-border p-6 flex items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-border bg-white">
                            <div className="font-bold text-[#1B2B4B] text-3xl">{merchantName.charAt(0).toUpperCase()}</div>
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-[#1B2B4B] text-2xl">{merchantName}</h2>
                            <p className="text-muted-foreground mt-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                {data.visit_count} transactions since {data.first_visit ? fmtDate(data.first_visit) : 'N/A'}
                                {data.common_locations.length > 0 && <> &middot; Common locations: {data.common_locations.join(', ')}</>}
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-border p-4 text-center">
                            <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Total Spent</div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>RON {data.total_spent.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-border p-4 text-center">
                            <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Transactions</div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>{data.visit_count}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-border p-4 text-center">
                            <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Avg. Transaction</div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>RON {data.avg_spend.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <MapPin size={18} className="text-[#FFD100]" />
                            <h3 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '15px' }}>Transaction Locations</h3>
                        </div>
                        <div className="h-64 bg-slate-100 relative z-0">
                            {locations.length > 0 ? (
                                <MapContainer
                                    center={[locations[0].lat, locations[0].lng]}
                                    zoom={locations.length === 1 ? 13 : 7}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {locations.map((loc, idx) => (
                                        <Marker key={idx} position={[loc.lat, loc.lng]}>
                                            <Popup>
                                                <div className="font-semibold text-[#1B2B4B]">{loc.name}</div>
                                                <div className="text-xs text-gray-500">{loc.count} transaction{loc.count !== 1 ? 's' : ''}</div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No location data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Transactions */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '16px' }}>Recent Activity</h2>
                        </div>
                        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                            {data.transactions.slice(0, 20).map(tx => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer"
                                     onClick={() => navigate(`/app/transaction/${tx.id}`)}>
                                    <div>
                                        <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{tx.merchant_name}</div>
                                        <div className="text-muted-foreground flex items-center gap-1 mt-0.5" style={{ fontSize: '11px' }}>
                                            {fmtDate(tx.date)} {tx.city ? `• ${tx.city}` : ''}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '14px' }}>-{tx.amount.toFixed(2)} {tx.currency || 'RON'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
