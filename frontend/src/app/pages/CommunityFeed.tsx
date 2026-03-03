import { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, X, Image, Send, Users, Globe, Shield, ChevronDown, MoreHorizontal, Bookmark } from 'lucide-react';
import { communities, feedPosts, platformUsers, currentUser, type FeedPost } from '../services/mockData';

function PostCard({ post, onLike }: { post: FeedPost; onLike: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

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
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-blue-500" style={{ fontSize: '8px' }}>👍</div>
            </div>
            <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.likes + (post.isLiked ? 0 : 0)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.comments} comments</span>
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>·</span>
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{post.shares} shares</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center border-t border-border">
        {[
          { icon: Heart, label: 'Like', active: post.isLiked, onClick: () => onLike(post.id) },
          { icon: MessageCircle, label: 'Comment', active: false, onClick: () => setShowComments(!showComments) },
          { icon: Share2, label: 'Share', active: false, onClick: () => {} },
          { icon: Bookmark, label: 'Save', active: false, onClick: () => {} },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-semibold transition-colors hover:bg-muted/50 ${
              action.active ? 'text-red-500' : 'text-muted-foreground'
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
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-border px-3 py-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 text-[12px] outline-none bg-transparent text-[#1B2B4B] placeholder:text-muted-foreground"
              />
              <button
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: comment ? '#FFD100' : '#F0F4FF' }}
              >
                <Send size={11} className={comment ? 'text-[#1B2B4B]' : 'text-muted-foreground'} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunityFeed() {
  const community = communities[0];
  const [posts, setPosts] = useState<FeedPost[]>(feedPosts);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    const post: FeedPost = {
      id: `fp-${Date.now()}`,
      author: currentUser,
      title: newPost.title,
      content: newPost.content,
      likes: 0, comments: 0, shares: 0,
      time: 'Just now',
      isLiked: false,
    };
    setPosts(prev => [post, ...prev]);
    setNewPost({ title: '', content: '' });
    setShowCreatePost(false);
  };

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left: Community info */}
      <div className="w-64 bg-white border-r border-border overflow-y-auto shrink-0 hidden lg:block">
        {/* Cover */}
        <div className="relative h-28">
          <img src={community.cover} alt={community.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27,43,75,0.8) 0%, transparent 60%)' }} />
        </div>

        {/* Community info */}
        <div className="p-4">
          <h3 className="text-[#1B2B4B] mb-1" style={{ fontSize: '14px', fontWeight: 700 }}>{community.name}</h3>
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mb-2" style={{ background: '#FFD100', color: '#1B2B4B' }}>
            {community.category}
          </span>
          <p className="text-muted-foreground mb-4" style={{ fontSize: '11px', lineHeight: '1.5' }}>{community.description}</p>

          <div className="space-y-2.5 mb-4">
            {[
              { icon: Users, label: `${community.members.toLocaleString()} Members` },
              { icon: Globe, label: 'Public Community' },
              { icon: Shield, label: 'Verified Community' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon size={13} className="text-muted-foreground" />
                <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Admin */}
          <div className="border-t border-border pt-3">
            <div className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</div>
            <div className="flex items-center gap-2">
              <img src={platformUsers[0].avatar} alt={platformUsers[0].name} className="w-7 h-7 rounded-full object-cover" />
              <div>
                <div className="text-[#1B2B4B]" style={{ fontSize: '12px', fontWeight: 600 }}>{platformUsers[0].name}</div>
                <div className="text-muted-foreground" style={{ fontSize: '10px' }}>{platformUsers[0].career}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Create post trigger */}
          <div className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover" />
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex-1 text-left px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                style={{ fontSize: '13px' }}
              >
                Share something with the community...
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                <Image size={14} className="text-[#3B82F6]" /> Photo
              </button>
              <button
                onClick={() => setShowCreatePost(true)}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-[#1B2B4B] hover:brightness-105 transition-all"
                style={{ background: '#FFD100', fontSize: '12px' }}
              >
                <Plus size={13} /> Create Post
              </button>
            </div>
          </div>

          {/* Feed posts */}
          {posts.map(post => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>
      </div>

      {/* Right: Members list */}
      <div className="w-64 bg-white border-l border-border overflow-y-auto shrink-0 hidden xl:block">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1B2B4B' }}>Members</h3>
            <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{community.members.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Online members */}
          <div>
            <div className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Online Now ({platformUsers.filter(u => u.isOnline).length})
            </div>
            {platformUsers.filter(u => u.isOnline).map(user => (
              <div key={user.id} className="flex items-center gap-2.5 py-2">
                <div className="relative shrink-0">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '12px' }}>{user.name}</div>
                  <div className="text-muted-foreground truncate" style={{ fontSize: '10px' }}>{user.career}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <div className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              All Members
            </div>
            {platformUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2.5 py-2">
                <div className="relative shrink-0">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '12px' }}>{user.name}</div>
                  <div className="text-muted-foreground truncate" style={{ fontSize: '10px' }}>{user.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1B2B4B' }}>Create Post</h3>
              <button onClick={() => setShowCreatePost(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{currentUser.name}</div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted mt-0.5">
                    <Globe size={10} className="text-muted-foreground" />
                    <span className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600 }}>Community</span>
                    <ChevronDown size={9} className="text-muted-foreground" />
                  </div>
                </div>
              </div>
              <input
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                placeholder="Post title..."
                className="w-full px-4 py-3 rounded-xl border border-border text-[14px] font-semibold text-[#1B2B4B] placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20 transition-all"
              />
              <textarea
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                placeholder="What do you want to share with the community?"
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-border text-[13px] text-[#1B2B4B] placeholder:text-muted-foreground focus:outline-none focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20 transition-all resize-none"
              />
              {/* Image upload area */}
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-[#FFD100] hover:bg-[#FFD100]/5 transition-all group">
                <Image size={16} className="text-muted-foreground group-hover:text-[#1B2B4B]" />
                <span className="text-muted-foreground group-hover:text-[#1B2B4B] transition-colors" style={{ fontSize: '13px' }}>Add Photo or Media</span>
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-muted-foreground hover:text-[#1B2B4B] hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.title.trim() || !newPost.content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-[#1B2B4B] hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#FFD100' }}
              >
                <Send size={13} />
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
