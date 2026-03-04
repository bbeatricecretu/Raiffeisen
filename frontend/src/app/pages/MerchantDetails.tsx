import { ArrowLeft, MessageSquare, MapPin, ReceiptText, ChevronRight, TrendingDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers in React
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

const merchantData = {
    emag: {
        name: 'Emag.ro',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/EMAG_logo.svg/1200px-EMAG_logo.svg.png',
        bg: '#ffffff',
        desc: 'Cel mai mare retailer online din Romania, oferind o gama variata de electronice, electrocasnice, auto si multe altele.',
        totalSpent: '2,100.00',
        transactions: 6,
        avgSpent: '350.00',
        recentTransactions: [
            { date: '28 feb. 2026', amount: '-450.00 RON', item: 'Apple AirPods Pro 2', online: true },
            { date: '15 feb. 2026', amount: '-1,250.00 RON', item: 'Samsung Monitor 27"', online: true },
            { date: '02 feb. 2026', amount: '-120.00 RON', item: 'Cablu HDMI, Mouse pad', online: true },
        ],
        locations: [
            { lat: 46.7712, lng: 23.6236, name: 'eMAG Showroom Cluj' },
            { lat: 46.7667, lng: 23.5833, name: 'eMAG Easybox P-ta Mihai Viteazu' }
        ]
    }
};

export function MerchantDetails() {
    const navigate = useNavigate();
    const { id } = useParams();

    const merchant = merchantData[id as keyof typeof merchantData] || merchantData.emag;

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

                {/* AI Chat Button */}
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
                {/* Left Column: Details & Transactions */}
                <div className="md:col-span-2 space-y-6">

                    {/* Merchant Header Card */}
                    <div className="bg-white rounded-2xl border border-border p-6 flex items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-border" style={{ background: merchant.bg }}>
                            {merchant.logo ? (
                                <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="font-bold text-[#1B2B4B] text-3xl">{merchant.name.charAt(0)}</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-[#1B2B4B] text-2xl">{merchant.name}</h2>
                            <p className="text-muted-foreground mt-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>{merchant.desc}</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-border p-4 text-center">
                            <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Total Spent</div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>RON {merchant.totalSpent}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-border p-4 text-center">
                            <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Transactions</div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>{merchant.transactions}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-border p-4 text-center">
                            <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-1" style={{ fontSize: '11px' }}>Avg. Transaction</div>
                            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>RON {merchant.avgSpent}</div>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <MapPin size={18} className="text-[#FFD100]" />
                            <h3 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '15px' }}>Transaction Locations</h3>
                        </div>
                        <div className="h-64 bg-slate-100 relative z-0">
                            {merchant.locations.length > 0 ? (
                                <MapContainer
                                    center={[merchant.locations[0].lat, merchant.locations[0].lng]}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {merchant.locations.map((loc, idx) => (
                                        <Marker key={idx} position={[loc.lat, loc.lng]}>
                                            <Popup>
                                                <div className="font-semibold text-[#1B2B4B]">{loc.name}</div>
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
                        <div className="divide-y divide-border">
                            {merchant.recentTransactions.map((trx, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors">
                                    <div>
                                        <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{trx.item}</div>
                                        <div className="text-muted-foreground flex items-center gap-1 mt-0.5" style={{ fontSize: '11px' }}>
                                            {trx.date} {trx.online ? '• Online' : ''}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{trx.amount}</div>
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
