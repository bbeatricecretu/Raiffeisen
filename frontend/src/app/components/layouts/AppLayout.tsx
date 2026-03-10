import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, CreditCard, MessageSquare, Map, CheckCircle2,
  Users, UserPlus, Search, Bell, ChevronDown, LogOut, Settings,
  User, Menu, X, TrendingUp, Building2
} from 'lucide-react';
import { currentUser as mockUser } from '../../services/mockData';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';

export function AppLayout() {
  const { t, language } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(mockUser);
  const [pendingCount, setPendingCount] = useState(0);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const userId = localStorage.getItem('userId') || 'me';
        const confs = await api.getUserConfirmations(userId, 'pending');
        setPendingCount(Array.isArray(confs) ? confs.length : 0);
      } catch {
        setPendingCount(0);
      }
    };
    fetchPendingCount();
    const onConfirmationsChanged = () => fetchPendingCount();
    window.addEventListener('confirmations-changed', onConfirmationsChanged);
    window.addEventListener('storage', onConfirmationsChanged);

    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUser({
          ...mockUser, // keep fields like avatar if missing
          name: u.name || mockUser.name,
          email: u.email || mockUser.email,
          id: u.id || mockUser.id
        });
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    return () => {
      window.removeEventListener('confirmations-changed', onConfirmationsChanged);
      window.removeEventListener('storage', onConfirmationsChanged);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const formattedNow = new Intl.DateTimeFormat(language === 'ro' ? 'ro-RO' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const navItems = {
    bank: [
      { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/chat', icon: MessageSquare, label: 'Smart Chat', badge: 'AI' },
      { to: '/app/map', icon: Map, label: 'Spending Map' },
      { to: '/app/confirm', icon: CheckCircle2, label: 'Confirmations', badge: pendingCount > 0 ? pendingCount.toString() : undefined },
    ],
    community: [
      { to: '/app/community', icon: Users, label: 'Community Feed' },
      { to: '/app/invite', icon: UserPlus, label: 'Invite Friends' },
      { to: '/app/join', icon: Search, label: 'Join Community' },
    ],
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return t('layout.title.dashboard');
    if (path.includes('chat')) return t('layout.title.chat');
    if (path.includes('map')) return t('layout.title.map');
    if (path.includes('confirm')) return t('layout.title.confirm');
    if (path.includes('invite')) return t('layout.title.invite');
    if (path.includes('join')) return t('layout.title.join');
    if (path.includes('community')) return t('layout.title.community');
    if (path.includes('notifications')) return t('layout.title.notifications');
    if (path.includes('settings')) return t('layout.title.settings');
    if (path.includes('analytics')) return t('layout.title.analytics');
    return t('layout.title.default');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 shrink-0"
        style={{
          width: sidebarOpen ? '256px' : '72px',
          background: 'var(--brand-navy)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-white/10 p-1">
            <img src="/logo.png" alt="Connect & Grow" className="w-full h-full object-contain rounded-lg" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-bold text-[15px] leading-tight">Connect & Grow</div>
              <div className="text-white/40 text-[11px] font-medium">Banking Platform</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-white/50 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Bank App Section */}
          <div className="mb-2">
            {sidebarOpen && (
              <div className="flex items-center gap-2 px-3 mb-2">
                <Building2 size={12} className="text-white/30" />
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Bank</span>
              </div>
            )}
            {navItems.bank.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 relative
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: 'var(--brand-yellow)' }} />
                    )}
                    <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-white' : ''} />
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badge === 'AI'
                            ? 'bg-[#FFD100]/20 text-[#FFD100]'
                            : 'bg-red-500/80 text-white'
                            }`}>{item.badge}</span>
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Community Section */}
          <div className="mt-4">
            {sidebarOpen && (
              <div className="flex items-center gap-2 px-3 mb-2">
                <Users size={12} className="text-white/30" />
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Community</span>
              </div>
            )}
            {navItems.community.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 relative
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: 'var(--brand-yellow)' }} />
                    )}
                    <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-[#FFD100]/30" />
              <div className="flex-1 min-w-0">
                <div className="text-white text-[13px] font-semibold truncate">{currentUser.name}</div>
                <div className="text-white/40 text-[11px] truncate">{currentUser.career}</div>
              </div>
              <Settings size={14} className="text-white/30 shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-border shrink-0">
          <div>
            <h2 className="text-[#1B2B4B]" style={{ fontSize: '16px', fontWeight: 600 }}>{getPageTitle()}</h2>
            <div className="text-muted-foreground" style={{ fontSize: '12px' }}>{formattedNow}</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick nav pills */}
            <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => navigate('/app/dashboard')}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-white transition-all"
              >
                {t('layout.quick.bank')}
              </button>
              <button
                onClick={() => navigate('/app/community')}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-white transition-all"
              >
                {t('layout.quick.community')}
              </button>
            </div>

            {/* Notification bell */}
            <button
              onClick={() => navigate('/app/notifications')}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <Bell size={17} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFD100]" />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted transition-colors"
              >
                <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover" />
                <span className="text-[13px] font-medium text-foreground hidden sm:block">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-border z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <div className="text-[13px] font-semibold text-foreground">{currentUser.name}</div>
                    <div className="text-[12px] text-muted-foreground">{currentUser.email}</div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        navigate('/app/details');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <User size={15} className="text-muted-foreground" />
                      {t('layout.profile')}
                    </button>
                    <button
                      onClick={() => {
                        navigate('/app/settings');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground" />
                      {t('layout.settings')}
                    </button>
                    <button
                      onClick={() => {
                        navigate('/app/analytics');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <TrendingUp size={15} className="text-muted-foreground" />
                      {t('layout.analytics')}
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={15} />
                      {t('layout.signout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}