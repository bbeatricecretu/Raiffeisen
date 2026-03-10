import { useState } from 'react';
import { useEffect } from 'react';
import { Search, Users, CheckCircle2, Hash, ChevronRight, Briefcase, Building2, AlertCircle, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { communities, currentUser } from '../services/mockData';
import { api } from '../services/api';

const categories = ['All', 'Technology', 'Finance', 'Startup', 'Banking', 'Fintech'];

export function JoinCommunity() {
  const navigate = useNavigate();
  const [teamMap, setTeamMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCareer, setSearchCareer] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [codeStatus, setCodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCommunityId, setCopiedCommunityId] = useState<string | null>(null);

  useEffect(() => {
    const realUserId = localStorage.getItem('userId') || currentUser.id;
    const localMapRaw = localStorage.getItem(`community-team-map:${realUserId}`);
    const localMap = localMapRaw ? (JSON.parse(localMapRaw) as Record<string, string>) : {};
    setTeamMap(localMap);

    const knownJoined = new Set<string>(Object.keys(localMap));
    setJoinedIds(knownJoined);

    api.getUserTeams(realUserId)
      .then((teams) => {
        if (!Array.isArray(teams)) return;
        const mergedMap = { ...localMap };
        communities.forEach((c) => {
          const found = teams.find((t: any) => t.name === c.name);
          if (found) {
            mergedMap[c.id] = found.id;
            knownJoined.add(c.id);
          }
        });
        setTeamMap(mergedMap);
        setJoinedIds(new Set(knownJoined));
        localStorage.setItem(`community-team-map:${realUserId}`, JSON.stringify(mergedMap));
      })
      .catch(() => {});
  }, []);

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoin = async (id: string, code?: string) => {
    const realUserId = localStorage.getItem('userId') || currentUser.id;
    const existingTeamId = teamMap[id];
    if (existingTeamId) {
      setJoinedIds(prev => new Set([...prev, id]));
      navigate(`/app/community/${existingTeamId}`);
      return;
    }

    const community = communities.find((c) => c.id === id);
    if (!community) return;

    try {
      let joinedTeamId = '';
      const sharedCode = (code || community.teamCode || '').toUpperCase();

      if (sharedCode) {
        let joined;
        try {
          joined = await api.joinTeam(realUserId, sharedCode);
        } catch {
          // First user in this community creates it with the canonical code.
          joined = await api.createTeam(community.name, realUserId, community.cover, sharedCode);
        }
        joinedTeamId = joined.id;
      } else {
        const created = await api.createTeam(community.name, realUserId, community.cover);
        joinedTeamId = created.id;
      }

      const nextMap = { ...teamMap, [id]: joinedTeamId };
      setTeamMap(nextMap);
      setJoinedIds(prev => new Set([...prev, id]));
      localStorage.setItem(`community-team-map:${realUserId}`, JSON.stringify(nextMap));
      navigate(`/app/community/${joinedTeamId}`);
    } catch (e) {
      console.error(e);
      setCodeStatus('error');
    }
  };

  const handleCodeJoin = async () => {
    if (!teamCode.trim()) return;
    setIsLoading(true);
    setCodeStatus('idle');

    try {
      const realUserId = localStorage.getItem('userId') || currentUser.id;
      const joined = await api.joinTeam(realUserId, teamCode.toUpperCase());
      setCodeStatus('success');
      // If successful, maybe find the community by code in our mock list to update UI
      const found = communities.find(c => c.teamCode === teamCode.toUpperCase());
      if (found) {
         const nextMap = { ...teamMap, [found.id]: joined.id };
         setTeamMap(nextMap);
         setJoinedIds(prev => new Set([...prev, found.id]));
         localStorage.setItem(`community-team-map:${realUserId}`, JSON.stringify(nextMap));
      }
      navigate(`/app/community/${joined.id}`);
    } catch (e) {
      console.error(e);
      setCodeStatus('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setCodeStatus('idle'), 3000);
    }
  };

  const copyCommunityCode = async (communityId: string, code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCommunityId(communityId);
      window.setTimeout(() => setCopiedCommunityId(null), 1500);
    } catch {
      // no-op
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Search + Team Code row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Search by name */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-[#1B2B4B]" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1B2B4B' }}>Search by Name</h3>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Community name..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-[13px] bg-white focus:outline-none focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20 transition-all"
            />
          </div>
        </div>

        {/* Search by career */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={14} className="text-[#1B2B4B]" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1B2B4B' }}>Search by Career</h3>
          </div>
          <div className="relative">
            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchCareer}
              onChange={e => setSearchCareer(e.target.value)}
              placeholder="e.g. Engineer, Analyst..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border text-[13px] bg-white focus:outline-none focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20 transition-all"
            />
          </div>
        </div>

        {/* Team code */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash size={14} className="text-[#1B2B4B]" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1B2B4B' }}>Join by Team Code</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={teamCode}
                onChange={e => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g. TECH2024"
                disabled={isLoading}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-[13px] font-mono bg-white focus:outline-none focus:ring-2 transition-all uppercase ${
                  codeStatus === 'error' ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' :
                  codeStatus === 'success' ? 'border-green-400 focus:border-green-400 focus:ring-green-400/20' :
                  'border-border focus:border-[#FFD100] focus:ring-[#FFD100]/20'
                }`}
              />
            </div>
            <button
              onClick={handleCodeJoin}
              disabled={isLoading || !teamCode}
              className="px-3 py-2.5 rounded-xl font-semibold text-[#1B2B4B] hover:brightness-105 transition-all disabled:opacity-50"
              style={{ background: '#FFD100', fontSize: '12px' }}
            >
              {isLoading ? '...' : 'Join'}
            </button>
          </div>
          {codeStatus === 'success' && (
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-green-600" style={{ fontSize: '11px', fontWeight: 600 }}>Community joined!</span>
            </div>
          )}
          {codeStatus === 'error' && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle size={12} className="text-red-500" />
              <p className="text-red-500" style={{ fontSize: '11px' }}>Invalid code or already joined.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'text-[#1B2B4B] shadow-sm'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground'
            }`}
            style={activeCategory === cat ? { background: '#FFD100' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Community cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>{filtered.length} {activeCategory !== 'All' ? activeCategory : ''} Communities</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(community => {
            const isJoined = joinedIds.has(community.id);
            return (
              <div key={community.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all group">
                {/* Cover image */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={community.cover}
                    alt={community.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27,43,75,0.7) 0%, transparent 60%)' }} />
                  <div className="absolute bottom-3 left-3">
                    <span
                      className="px-2 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'rgba(255,209,0,0.9)', color: '#1B2B4B' }}
                    >
                      {community.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1B2B4B' }} className="mb-1.5">{community.name}</h4>
                  <p className="text-muted-foreground mb-3" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                    {community.description.slice(0, 90)}...
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-muted-foreground" />
                      <span className="text-muted-foreground" style={{ fontSize: '12px' }}>
                        {community.members.toLocaleString()} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isJoined ? (
                        <button
                          onClick={() => navigate(`/app/community/${teamMap[community.id]}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all hover:brightness-95"
                          style={{ background: '#1B2B4B' }}
                        >
                          <Building2 size={11} />
                          Enter
                          <ChevronRight size={11} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(community.id, community.teamCode)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#1B2B4B] hover:brightness-105 transition-all"
                          style={{ background: '#FFD100' }}
                        >
                          <Users size={11} />
                          Join
                        </button>
                      )}
                    </div>
                  </div>

                  {community.teamCode && (
                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="text-muted-foreground" style={{ fontSize: '11px' }}>
                        Code: <span className="font-mono text-[#1B2B4B] font-semibold">{community.teamCode}</span>
                      </div>
                      <button
                        onClick={() => copyCommunityCode(community.id, community.teamCode)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[10px] font-semibold text-[#1B2B4B] hover:bg-muted"
                      >
                        {copiedCommunityId === community.id ? <Check size={11} /> : <Copy size={11} />}
                        {copiedCommunityId === community.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-border">
            <Building2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No communities found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
