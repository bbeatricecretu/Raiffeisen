import { useNavigate } from 'react-router';
import { ArrowRight, TrendingUp, Users } from 'lucide-react';

export function Landing() {
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
            <button onClick={() => navigate('/')} className="text-[13px] font-medium text-[#1B2B4B] transition-colors">Home</button>
            <button onClick={() => navigate('/about')} className="text-[13px] font-medium text-muted-foreground hover:text-[#1B2B4B] transition-colors">About Us</button>
          </div>
          <div className="w-[1px]"></div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 flex items-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>

            <h1
              style={{
                fontSize: 'clamp(48px, 5vw, 72px)',
                lineHeight: 1.05,
                fontWeight: 700,
                color: '#1B2B4B',
                letterSpacing: '-0.03em',
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Connect & Grow.
            </h1>
            <p className="mt-6 text-muted-foreground" style={{ fontSize: '17px', lineHeight: '1.7', maxWidth: '480px' }}>
              A next-generation fintech platform combining intelligent spending analytics, an interactive Romania map, and a powerful professional community network.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[#1B2B4B] font-semibold transition-all hover:brightness-105 shadow-lg shadow-[#FFD100]/30"
                style={{ background: '#FFD100', fontSize: '15px' }}
              >
                Log In
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[#1B2B4B] font-semibold border-2 border-[#1B2B4B]/20 hover:border-[#1B2B4B]/40 transition-all"
                style={{ fontSize: '15px' }}
              >
                Sign Up
              </button>
            </div>

          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img
                src="https://images.unsplash.com/photo-1642055509518-adafcad1d22e?w=700&h=460&fit=crop"
                alt="Platform preview"
                className="w-full object-cover"
                style={{ height: '380px' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1B2B4B88 0%, transparent 60%)' }} />

              {/* Floating card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Balance</div>
                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '24px' }}>RON 24,851.20</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFD100' }}>
                    <TrendingUp size={18} className="text-[#1B2B4B]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-green-600">↑ +8.3%</span>
                  <span className="text-[12px] text-muted-foreground">vs last month</span>
                </div>
              </div>
            </div>

            {/* Floating stat card */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3.5 shadow-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1B2B4B' }}>
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>4,800+</div>
                  <div className="text-[11px] text-muted-foreground">Community Members</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
