import { useState, useEffect } from 'react';
import { Search, UserPlus, Check, Copy, Share2, MessageCircle, Link2, Users } from 'lucide-react';
import { api } from '../services/api';
import { platformUsers } from '../services/mockData';

export function Invite() {
  const currentUserId = localStorage.getItem('userId') || 'me';
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const envBaseUrl = (import.meta as any)?.env?.VITE_PUBLIC_APP_URL as string | undefined;
  const appBaseUrl = envBaseUrl
    ? envBaseUrl.replace(/\/$/, '')
    : (runtimeOrigin || 'http://localhost:5173');
  const defaultReferralLink = `${appBaseUrl}/auth?mode=signup&ref=${encodeURIComponent(currentUserId)}`;
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState<any[]>(platformUsers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [referralLink, setReferralLink] = useState(defaultReferralLink);
  const [stats, setStats] = useState({ invites_sent: 0, joined: 0, pending: 0 });

  const loadReferralStats = async () => {
    try {
      const data = await api.getReferralStats(currentUserId);
      setStats({
        invites_sent: Number(data?.invites_sent || 0),
        joined: Number(data?.joined || 0),
        pending: Number(data?.pending || 0),
      });
    } catch (e) {
      console.error('Failed to load referral stats', e);
      setStats({ invites_sent: 0, joined: 0, pending: 0 });
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      api.searchUsers(searchQuery).then(res => {
        setUsers(res
          .filter((u: any) => u.id !== currentUserId)
          .map((u: any) => ({
            ...u,
            mutual: Math.floor(Math.random() * 10),
            avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
            isOnline: true,
          }))
        );
      });
    } else {
      api.getSuggestedConnections(currentUserId, 24)
        .then((res) => {
          setUsers(res.map((u: any) => ({
            ...u,
            mutual: Math.floor(Math.random() * 10),
            avatar: `https://ui-avatars.com/api/?name=${u.name}&background=random`,
            isOnline: true,
          })));
        })
        .catch(() => {
          setUsers(platformUsers);
        });
    }
  }, [searchQuery, currentUserId]);

  useEffect(() => {
    const loadConnections = async () => {
      setConnectionsLoading(true);
      try {
        const data = await api.getUserConnections(currentUserId);
        setConnections(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load connections', e);
        setConnections([]);
      } finally {
        setConnectionsLoading(false);
      }
    };

    loadConnections();
  }, [currentUserId]);

  useEffect(() => {
    loadReferralStats();
    const interval = window.setInterval(loadReferralStats, 10000);
    return () => window.clearInterval(interval);
  }, [currentUserId]);

  const sendRequest = async (user: any) => {
    try {
      await api.sendConnectionInvite(currentUserId, user.id);
      setSentRequests(prev => new Set([...prev, user.id]));
    } catch (e) {
      console.error('Failed to connect with user', e);
    }
  };

  const createTrackedReferralLink = async (channel: 'link' | 'email', email?: string) => {
    const invite = await api.createReferralInvite(currentUserId, channel, email);
    const rid = invite?.id;
    const url = `${appBaseUrl}/auth?mode=signup&ref=${encodeURIComponent(currentUserId)}${rid ? `&rid=${encodeURIComponent(rid)}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
    setReferralLink(url);
    await loadReferralStats();
    return url;
  };

  const copyLink = async () => {
    try {
      const link = await createTrackedReferralLink('link');
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to create/copy referral link', e);
    }
  };

  const shareWhatsApp = async () => {
    try {
      const link = await createTrackedReferralLink('link');
      window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Connect & Grow! Create your account here: ${link}`)}`, '_blank');
    } catch (e) {
      console.error('Failed to create WhatsApp referral invite', e);
    }
  };

  const sendEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const link = await createTrackedReferralLink('email', inviteEmail.trim());
      const subject = encodeURIComponent('Join me on Connect & Grow');
      const body = encodeURIComponent(`Hi,\n\nI invited you to Connect & Grow. Use this signup link: ${link}\n\nSee you there!`);
      window.open(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`, '_blank');
      setInviteEmail('');
    } catch (e) {
      console.error('Failed to create email referral invite', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Referral card */}
        <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: '#1B2B4B' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,209,0,0.15) 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Share2 size={18} className="text-[#FFD100]" />
              <h3 className="text-white font-semibold" style={{ fontSize: '15px' }}>Your Referral Link</h3>
            </div>
            <p className="text-white/60 mb-4" style={{ fontSize: '13px' }}>Invite friends to join Connect &amp; Grow with your personal signup link.</p>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 mb-4">
              <Link2 size={13} className="text-[#FFD100] shrink-0" />
              <span className="flex-1 text-white/80 font-mono truncate" style={{ fontSize: '12px' }}>{referralLink}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105"
                style={{ background: '#FFD100', fontSize: '13px' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white bg-[#25D366] hover:brightness-105 transition-all"
                style={{ fontSize: '13px' }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Invites Sent', value: String(stats.invites_sent), icon: UserPlus, color: '#FFD100' },
            { label: 'Signed Up', value: String(stats.joined), icon: Users, color: '#10B981' },
            { label: 'Pending', value: String(stats.pending), icon: Share2, color: '#FFD100' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-border">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: stat.color + '20' }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px' }}>{stat.value}</div>
              <div className="text-muted-foreground" style={{ fontSize: '11px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>Find People on the Platform</h3>
        </div>
        <div className="p-5">
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, career or location..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border text-[13px] text-[#1B2B4B] placeholder:text-muted-foreground focus:outline-none focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20 bg-white transition-all"
            />
          </div>

          {/* User cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users
              .filter(user => user.role !== 'admin' && user.career !== 'Administrator' && user.email !== 'admin@example.com')
              .map(user => (
              <div key={user.id} className="rounded-2xl border border-border p-4 hover:shadow-md transition-all group">
                {/* Avatar + online indicator */}
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <button
                    onClick={() => sendRequest(user)}
                    disabled={sentRequests.has(user.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-[11px] ${sentRequests.has(user.id)
                      ? 'bg-green-100 text-green-600 cursor-not-allowed'
                      : 'hover:brightness-105'
                      }`}
                    style={sentRequests.has(user.id) ? {} : { background: '#FFD100', color: '#1B2B4B' }}
                  >
                    {sentRequests.has(user.id) ? (
                      <><Check size={11} /> Sent</>
                    ) : (
                      <><UserPlus size={11} /> Connect</>
                    )}
                  </button>
                </div>
                <div>
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '13px' }}>{user.name}</div>
                  <div className="text-muted-foreground truncate mt-0.5" style={{ fontSize: '11px' }}>{user.career}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFD100' }} />
                    <span className="text-muted-foreground" style={{ fontSize: '10px' }}>{user.location}</span>
                  </div>
                  <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${user.isOnline ? 'bg-green-100' : 'bg-muted'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className={`${user.isOnline ? 'text-green-600' : 'text-muted-foreground'}`} style={{ fontSize: '10px', fontWeight: 600 }}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users size={36} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No users found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite by email section */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: '15px', color: '#1B2B4B' }}>Invite Someone New</h3>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Enter email address..."
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-[13px] text-[#1B2B4B] placeholder:text-muted-foreground focus:outline-none focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20 bg-white transition-all"
          />
          <button
            onClick={sendEmailInvite}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[#1B2B4B] hover:brightness-105 transition-all whitespace-nowrap"
            style={{ background: '#FFD100', fontSize: '13px' }}
          >
            <UserPlus size={15} />
            Send Invite
          </button>
        </div>
      </div>

      {/* My Connections section */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>My Connections</h3>
          <span className="text-muted-foreground" style={{ fontSize: '12px' }}>
            {connections.length}
          </span>
        </div>
        <div className="p-5">
          {connectionsLoading ? (
            <div className="text-muted-foreground" style={{ fontSize: '13px' }}>Loading connections...</div>
          ) : connections.length === 0 ? (
            <div className="text-muted-foreground" style={{ fontSize: '13px' }}>
              No accepted connections yet. Send a connect invite and ask them to accept from Notifications.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {connections.map((c) => (
                <div key={c.id} className="rounded-xl border border-border px-3 py-2.5">
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '13px' }}>{c.name}</div>
                  <div className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{c.phone || c.iban || 'Connected user'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
