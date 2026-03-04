import { useNavigate } from 'react-router';
import { Shield, TrendingUp, Users, Globe, Lock, BarChart3 } from 'lucide-react';

const features = [
    { icon: BarChart3, title: 'AI Spending Analysis', desc: 'Ask plain English questions about your finances. Get instant insights powered by machine learning.' },
    { icon: Globe, title: 'Romania Spending Map', desc: 'Interactive heatmap showing exactly where your money goes across every county and city.' },
    { icon: Users, title: 'Community Banking', desc: 'Connect with professionals, join investment circles and grow your financial network.' },
    { icon: Shield, title: 'Bank-Grade Security', desc: 'End-to-end encryption, transaction confirmations and full audit trail on every operation.' },
    { icon: TrendingUp, title: 'Smart Budgeting', desc: 'Automated categorization, spending limits, and predictive cash flow forecasting.' },
    { icon: Lock, title: 'PSD2 Compliant', desc: 'Fully compliant with EU open banking regulations. Your data stays yours.' },
];

export function AboutUs() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen" style={{ background: '#F5F7FA' }}>
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.png" alt="Connect & Grow" className="w-10 h-10 object-contain" />
                        <span className="font-bold text-[#1B2B4B]" style={{ fontSize: '16px' }}>Connect & Grow</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => navigate('/')} className="text-[13px] font-medium text-muted-foreground hover:text-[#1B2B4B] transition-colors">Home</button>
                        <button onClick={() => navigate('/about')} className="text-[13px] font-medium text-[#1B2B4B] transition-colors">About Us</button>
                    </div>
                    <div className="w-[1px]"></div>
                </div>
            </nav>

            {/* Features grid */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-14">
                    <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#1B2B4B' }}>
                        Everything you need to<br />manage and grow your finances
                    </h2>
                    <p className="text-muted-foreground mt-4" style={{ fontSize: '16px' }}>
                        Built for modern professionals who demand clarity, control, and community.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <div key={feature.title} className="bg-white rounded-2xl p-6 border border-border hover:shadow-md transition-all group">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                                style={{ background: i === 0 ? '#FFD100' : i === 1 ? '#1B2B4B' : '#F0F4FF' }}
                            >
                                <feature.icon size={20} className={i === 0 ? 'text-[#1B2B4B]' : i === 1 ? 'text-white' : 'text-[#1B2B4B]'} />
                            </div>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1B2B4B' }} className="mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground" style={{ fontSize: '13px', lineHeight: '1.6' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
