import { useNavigate } from 'react-router';
import { ArrowRight, Shield, TrendingUp, Users, Zap, CheckCircle, Star, Globe, Lock, BarChart3 } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'AI Spending Analysis', desc: 'Ask plain English questions about your finances. Get instant insights powered by machine learning.' },
  { icon: Globe, title: 'Romania Spending Map', desc: 'Interactive heatmap showing exactly where your money goes across every county and city.' },
  { icon: Users, title: 'Community Banking', desc: 'Connect with professionals, join investment circles and grow your financial network.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: 'End-to-end encryption, transaction confirmations and full audit trail on every operation.' },
  { icon: TrendingUp, title: 'Smart Budgeting', desc: 'Automated categorization, spending limits, and predictive cash flow forecasting.' },
  { icon: Lock, title: 'PSD2 Compliant', desc: 'Fully compliant with EU open banking regulations. Your data stays yours.' },
];

const stats = [
  { value: '2.4M+', label: 'Active Users' },
  { value: '€840M', label: 'Transactions Tracked' },
  { value: '41', label: 'Romanian Counties' },
  { value: '4.9★', label: 'App Store Rating' },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFD100' }}>
              <Zap size={16} className="text-[#1B2B4B]" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#1B2B4B]" style={{ fontSize: '16px' }}>Connect & Grow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Security', 'Community', 'Pricing'].map(item => (
              <button key={item} className="text-[13px] font-medium text-muted-foreground hover:text-[#1B2B4B] transition-colors">{item}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-[13px] font-semibold text-[#1B2B4B] border border-[#1B2B4B]/20 rounded-lg hover:bg-[#1B2B4B]/5 transition-all"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-[13px] font-semibold text-[#1B2B4B] rounded-lg transition-all hover:brightness-105"
              style={{ background: '#FFD100' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD100]/15 border border-[#FFD100]/30 mb-6">
              <Star size={13} className="text-[#B8960C]" fill="#B8960C" />
              <span className="text-[12px] font-semibold text-[#B8960C]">Raiffeisen-Inspired Banking Platform</span>
            </div>
            <h1 style={{ fontSize: '52px', lineHeight: '1.1', fontWeight: 700, color: '#1B2B4B' }}>
              Banking that<br />
              <span style={{ color: '#FFD100' }}>connects</span> and<br />
              <span style={{ color: '#FFD100' }}>grows</span> with you.
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
                Create Free Account
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[#1B2B4B] font-semibold border-2 border-[#1B2B4B]/20 hover:border-[#1B2B4B]/40 transition-all"
                style={{ fontSize: '15px' }}
              >
                View Demo
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8">
              {[
                'No monthly fees',
                'Instant setup',
                'GDPR Compliant',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-[12px] font-medium text-muted-foreground">{item}</span>
                </div>
              ))}
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

      {/* Stats bar */}
      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '28px' }}>{stat.value}</div>
                <div className="text-[13px] text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* Community preview */}
      <section className="bg-[#1B2B4B] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD100]/20 mb-5">
                <Users size={13} className="text-[#FFD100]" />
                <span className="text-[12px] font-semibold text-[#FFD100]">Community Banking Module</span>
              </div>
              <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white', lineHeight: '1.2' }}>
                Connect with Romania's best financial minds
              </h2>
              <p className="text-white/60 mt-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                Join industry communities, share insights, invite colleagues and grow your professional network — all within a trusted banking environment.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {['Tech Founders Romania', 'Investment Circle', 'Cluj Startup Hub', 'SME Banking Network'].map(c => (
                  <div key={c} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2.5">
                    <Users size={14} className="text-[#FFD100]" />
                    <span className="text-white text-[12px] font-medium">{c}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105"
                style={{ background: '#FFD100', fontSize: '14px' }}
              >
                Join the Community
                <ArrowRight size={15} />
              </button>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1759752394757-323a0adc0d62?w=600&h=400&fit=crop"
                alt="Community"
                className="rounded-2xl shadow-2xl w-full object-cover"
                style={{ height: '360px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 style={{ fontSize: '40px', fontWeight: 700, color: '#1B2B4B', lineHeight: '1.2' }}>
          Ready to take control of<br />your finances?
        </h2>
        <p className="text-muted-foreground mt-4" style={{ fontSize: '16px' }}>
          Join 2.4 million users already growing with Connect & Grow.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#1B2B4B] shadow-xl shadow-[#FFD100]/30 hover:brightness-105 transition-all"
            style={{ background: '#FFD100', fontSize: '15px' }}
          >
            Sign Up — It's Free
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="px-8 py-4 rounded-xl font-semibold text-[#1B2B4B] border-2 border-[#1B2B4B]/20 hover:border-[#1B2B4B]/40 transition-all"
            style={{ fontSize: '15px' }}
          >
            Explore Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFD100' }}>
              <Zap size={13} className="text-[#1B2B4B]" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#1B2B4B]" style={{ fontSize: '14px' }}>Connect & Grow</span>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
            © 2026 Connect & Grow. Raiffeisen-Inspired Banking Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
