import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Heart, MessageCircle, Share2, Plus, X, Image, Send, Users, Globe, Shield, ChevronDown, MoreHorizontal, Bookmark, Copy, Check } from 'lucide-react';
import { currentUser, type FeedPost } from '../services/mockData';
import { api } from '../services/api';

function deriveCategoryFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('tech') || n.includes('software') || n.includes('engineer') || n.includes('founder')) return 'Technology';
  if (n.includes('invest') || n.includes('finance') || n.includes('investor') || n.includes('banking')) return 'Finance';
  if (n.includes('startup') || n.includes('hub') || n.includes('ecosystem') || n.includes('cluj')) return 'Startup';
  if (n.includes('bank')) return 'Banking';
  if (n.includes('payment') || n.includes('fintech') || n.includes('digital')) return 'Fintech';
  return 'Technology';
}

function PostCard({
  post,
  onLike,
  onComment,
  currentUser,
  userId,
}: {
  post: FeedPost;
  onLike: (id: string, currentlyLiked: boolean) => Promise<void>;
  onComment: (id: string, text: string) => Promise<void>;
  currentUser: any;
  userId: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]); // Should fetch comments
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reactionsList, setReactionsList] = useState<any[]>([]);
  const [reactionsLoading, setReactionsLoading] = useState(false);

  const refreshComments = useCallback(async () => {
    if (!showComments) return;
    setCommentsLoading(true);
    try {
      const res = await api.getPostComments(post.id, userId);
      setCommentsList(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  }, [showComments, post.id, userId]);

  const refreshReactions = useCallback(async () => {
    if (!showComments) return;
    setReactionsLoading(true);
    try {
      const res = await api.getPostReactions(post.id, userId);
      setReactionsList(res);
    } catch (e) {
      console.error(e);
    } finally {
      setReactionsLoading(false);
    }
  }, [showComments, post.id, userId]);

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = `${post.title}\n\n${post.content}`.trim();

    try {
      const nav: any = navigator;
      if (nav?.share) {
        await nav.share({ title: post.title, text: shareText, url });
        return;
      }
    } catch {
      // fall through to clipboard/WhatsApp
    }

    const fullText = `${shareText}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(fullText);
    } catch {
      // ignore clipboard failures
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (showComments) {
      void refreshComments();
      void refreshReactions();
    }
  }, [showComments, refreshComments, refreshReactions]);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Post header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
            {post.author.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          <div>
            <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{post.author.name}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.author.career}</span>
              <span className="text-muted-foreground" style={{ fontSize: '10px' }}>·</span>
              <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.time}</span>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
          <MoreHorizontal size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Post content */}
      <div className="px-5 pb-3">
        <h4 className="text-[#1B2B4B] mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>{post.title}</h4>
        <p className="text-muted-foreground" style={{ fontSize: '13px', lineHeight: '1.6' }}>
          {post.content.slice(0, 180)}{post.content.length > 180 ? '...' : ''}
        </p>
      </div>

      {/* Post image */}
      {post.image && (
        <div className="mx-5 mb-3 rounded-xl overflow-hidden">
          <img src={post.image} alt="Post" className="w-full object-cover" style={{ height: 200 }} />
        </div>
      )}

      {/* Engagement counts */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#FFD100', fontSize: '8px' }}>❤️</div>
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-[#1B2B4B]" style={{ fontSize: '8px' }}>👍</div>
            </div>
            <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.likes} likes</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.comments} comments</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center border-t border-border">
        {[
          { icon: Heart, label: 'Like', active: post.isLiked, onClick: () => onLike(post.id, post.isLiked) },
          { icon: MessageCircle, label: 'Comment', active: showComments, onClick: () => setShowComments(!showComments) },
          { icon: Share2, label: 'Share', active: false, onClick: () => { void handleShare(); } },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-semibold transition-colors hover:bg-muted/50 ${action.active ? 'text-red-500' : 'text-muted-foreground'
              }`}
          >
            <action.icon size={14} fill={action.active ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border px-5 py-4 bg-muted/30">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-border px-3 py-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 text-[12px] outline-none bg-transparent text-[#1B2B4B] placeholder:text-muted-foreground"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && comment.trim()) {
                      e.preventDefault();
                      await onComment(post.id, comment);
                      setComment('');
                      await refreshComments();
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (comment.trim()) {
                      await onComment(post.id, comment);
                      setComment('');
                      await refreshComments();
                    }
                  }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: comment ? '#FFD100' : '#F0F4FF' }}
                >
                  <Send size={11} className={comment ? 'text-[#1B2B4B]' : 'text-muted-foreground'} />
                </button>
              </div>
            </div>

            {true && (
              <div className="pt-3 border-t border-border/60">
                <div className="text-[12px] font-semibold text-[#1B2B4B] mb-2">
                  Reactions
                </div>
                {reactionsLoading ? (
                  <div className="text-[12px] text-muted-foreground">Loading reactions...</div>
                ) : reactionsList.length === 0 ? (
                  <div className="text-[12px] text-muted-foreground">No reactions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {reactionsList.map((r: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]" style={{ background: '#FFD100' }}>
                          {r.emoji || '❤️'}
                        </div>
                        <div className="text-[12px] text-muted-foreground leading-snug">
                          <span className="text-[#1B2B4B] font-semibold">{r.author_name || 'Unknown'}</span>
                          {post.author && post.author.id === userId
                            ? ' reacted to your post'
                            : ' reacted to this post'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              {commentsLoading ? (
                <div className="text-[12px] text-muted-foreground">Loading comments...</div>
              ) : commentsList.length === 0 ? (
                <div className="text-[12px] text-muted-foreground">No comments yet.</div>
              ) : (
                <div className="space-y-3">
                  {commentsList.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-[#1B2B4B]">
                        {String(c.author_name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold text-[#1B2B4B]">
                          {c.author_name || 'Unknown'}
                        </div>
                        <div className="text-[12px] text-muted-foreground leading-snug">
                          {c.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunityFeed() {
  const { id: teamIdFromRoute } = useParams();
  const navigate = useNavigate();
  const [currentCommunity, setCurrentCommunity] = useState<any>({
    id: '',
    name: '',
    description: '',
    members: 0,
    category: '',
    cover: '',
    teamCode: '',
  });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(currentUser);
  const [activeTeamId, setActiveTeamId] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const realUserId = localStorage.getItem('userId') || currentUserData.id;

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUserData(prev => ({ ...prev, name: u.name, id: u.id, email: u.email, avatar: prev.avatar }));
      } catch {}
    }
  }, []);

  // Fetch user's teams + posts from first team
  useEffect(() => {
    async function loadData() {
      const realId = realUserId;

      try {
        const userTeams = await api.getUserTeams(realId);
        if (userTeams && userTeams.length > 0) {
          const selectedTeam = userTeams.find((t: any) => t.id === teamIdFromRoute) || userTeams[0];
          setActiveTeamId(selectedTeam.id);
          // Remember last opened team so /app/community can redirect correctly.
          localStorage.setItem('lastCommunityTeamId', selectedTeam.id);
          const communityData = {
            id: selectedTeam.id,
            name: selectedTeam.name,
            teamCode: selectedTeam.code,
            cover: selectedTeam.image_url || '',
            description: '',
            members: 0,
            category: selectedTeam.category || deriveCategoryFromName(selectedTeam.name),
          };
          setCurrentCommunity(communityData);

          try {
            const membersRes = await api.getTeamMembersCount(selectedTeam.id, realId);
            setCurrentCommunity(prev => ({
              ...prev,
              members: Number(membersRes?.members_count || 0),
            }));
          } catch (e) {
            console.error(e);
          }
          
          const teamPosts = await api.getTeamPosts(selectedTeam.id, realId);
          // Transform backend posts to FeedPost
          const mappedPosts: FeedPost[] = teamPosts.map((p: any) => ({
            id: p.id,
            author: {
              id: p.user_id, // always the post creator's ID
              name: p.author_name || 'Unknown',
              avatar: p.author_avatar || currentUser.avatar,
            },
            title: p.title || 'Untitled',
            content: p.text || '',
            image: p.image_url,
            likes: Array.isArray(p.reactions)
              ? p.reactions.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0)
              : 0,
            comments: Number(p.comments_count || 0),
            shares: 0,
            time: new Date(p.created_at).toLocaleDateString(),
            isLiked: Boolean(p.is_liked)
          }));
          setPosts(mappedPosts);
        } else {
          // No teams? Use mock default posts or empty
          setActiveTeamId('');
          setPosts([]);
        }
      } catch (e) {
        console.error("Failed to load community feed", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [teamIdFromRoute, currentUserData.id]);

  const reloadPosts = async () => {
    if (!activeTeamId) return;
    try {
      const teamPosts = await api.getTeamPosts(activeTeamId, realUserId);
      const mappedPosts: FeedPost[] = teamPosts.map((p: any) => ({
        id: p.id,
            author: {
              id: p.user_id, // post creator's ID from backend
              name: p.author_name || 'Unknown',
              avatar: p.author_avatar || currentUser.avatar,
            },
        title: p.title || 'Untitled',
        content: p.text || '',
        image: p.image_url,
        likes: Array.isArray(p.reactions)
          ? p.reactions.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0)
          : 0,
        comments: Number(p.comments_count || 0),
        shares: 0,
        time: new Date(p.created_at).toLocaleDateString(),
        isLiked: Boolean(p.is_liked),
      }));
      setPosts(mappedPosts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (id: string, currentlyLiked: boolean) => {
    try {
      await api.reactToPost(id, realUserId, '❤️');
      await reloadPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (id: string, text: string) => {
    try {
      await api.commentOnPost(id, realUserId, text);
      await reloadPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !activeTeamId) return;
    try {
      await api.createPost({
        team_id: activeTeamId,
        user_id: realUserId,
        title: newPost.title,
        text: newPost.content
      });
      setNewPost({ title: '', content: '' });
      setShowCreatePost(false);
      await reloadPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const copyTeamCode = async () => {
    if (!currentCommunity?.teamCode) return;
    try {
      await navigator.clipboard.writeText(currentCommunity.teamCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1600);
    } catch {
      // no-op
    }
  };

  if (loading) return <div className="p-6">Loading feed...</div>;

  if (!activeTeamId) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <h3 className="text-[#1B2B4B] font-semibold mb-2">No community joined yet</h3>
          <p className="text-muted-foreground mb-4" style={{ fontSize: '13px' }}>
            Join a community first to access the feed and post updates.
          </p>
          <button
            onClick={() => navigate('/app/join')}
            className="px-5 py-2.5 rounded-xl font-semibold"
            style={{ background: '#FFD100', color: '#1B2B4B' }}
          >
            Go to Join Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left: Community info */}
      <div className="w-64 bg-white border-r border-border overflow-y-auto shrink-0 hidden lg:block">
        {/* Cover */}
        <div className="relative h-28">
          <img src={currentCommunity.cover} alt={currentCommunity.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27,43,75,0.8) 0%, transparent 60%)' }} />
        </div>

        {/* Community info */}
        <div className="p-4">
          <h3 className="text-[#1B2B4B] mb-1" style={{ fontSize: '14px', fontWeight: 700 }}>{currentCommunity.name}</h3>
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mb-2" style={{ background: '#FFD100', color: '#1B2B4B' }}>
            {currentCommunity.category}
          </span>
          <p className="text-muted-foreground mb-4" style={{ fontSize: '11px', lineHeight: '1.5' }}>{currentCommunity.description}</p>

          <div className="space-y-2.5 mb-4">
            {[
              { icon: Users, label: `${currentCommunity.members || 1} Members` },
              { icon: Globe, label: 'Public Community' },
              { icon: Shield, label: 'Verified Community' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon size={13} className="text-muted-foreground" />
                <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {currentCommunity.teamCode && (
            <div className="rounded-xl border border-border p-2.5 bg-muted/30">
              <div className="text-muted-foreground mb-1" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Team Code
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[#1B2B4B] font-mono" style={{ fontSize: '12px', fontWeight: 700 }}>
                  {currentCommunity.teamCode}
                </code>
                <button
                  onClick={copyTeamCode}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
                  style={{ background: '#FFD100', color: '#1B2B4B' }}
                >
                  {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Create post trigger */}
          <div className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={currentUserData.avatar} alt={currentUserData.name} className="w-9 h-9 rounded-full object-cover" />
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex-1 text-left px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                style={{ fontSize: '13px' }}
              >
                Share something with the community...
              </button>
            </div>
          </div>
          
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              currentUser={currentUserData}
              userId={realUserId}
            />
          ))}

          {posts.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
                <p>No posts yet. Be the first to share something!</p>
             </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-[#1B2B4B]">Create Post</h3>
              <button onClick={() => setShowCreatePost(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <img src={currentUserData.avatar} alt={currentUserData.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-[#1B2B4B] text-sm">{currentUserData.name}</div>
                  <div className="text-xs text-muted-foreground">Posting to {currentCommunity.name}</div>
                </div>
              </div>

              <input
                value={newPost.title}
                onChange={e => setNewPost({...newPost, title: e.target.value})}
                placeholder="Title"
                className="w-full text-lg font-bold placeholder:text-muted-foreground/50 border-none outline-none"
              />
              
              <textarea
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                placeholder="What do you want to talk about?"
                className="w-full h-32 resize-none text-sm placeholder:text-muted-foreground/50 border-none outline-none"
              />
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.title || !newPost.content}
                  className="px-6 py-2 rounded-xl bg-[#FFD100] text-[#1B2B4B] font-semibold text-sm hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
