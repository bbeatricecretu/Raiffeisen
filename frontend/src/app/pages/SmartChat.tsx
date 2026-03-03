import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Lightbulb, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { initialChatMessages, transactions, spendingByCategory, type ChatMessage } from '../services/mockData';

const suggestions = [
  'How much did I spend last month?',
  'What did I pay at Lidl?',
  'Show me subscriptions',
  'Top 3 merchants this year',
  'Compare Jan vs Feb spending',
  'Any unusual transactions?',
];

const aiInsights = [
  { icon: TrendingUp, title: 'Spending Down 8.3%', desc: 'Great news! February spending decreased compared to January.', color: '#10B981' },
  { icon: Lightbulb, title: 'Save RON 88/month', desc: 'Cancel 2 underused subscriptions to save on recurring costs.', color: '#FFD100' },
  { icon: Sparkles, title: 'Top Category: Shopping', desc: 'Shopping represents 18.7% of total spend this month.', color: '#8B5CF6' },
];

const subData = [
  { name: 'Netflix', amount: 52.99, frequency: 'Monthly' },
  { name: 'Spotify', amount: 34.99, frequency: 'Monthly' },
];

const lidlData = [
  { date: 'Feb 28', amount: 125.50 },
  { date: 'Feb 21', amount: 87.30 },
  { date: 'Feb 14', amount: 142.20 },
  { date: 'Feb 7', amount: 98.60 },
  { date: 'Jan 31', amount: 110.80 },
];

function AiResponseCard({ data }: { data: ChatMessage['data'] }) {
  if (data === 'chart') {
    return (
      <div className="mt-3 bg-white rounded-xl border border-border p-4">
        <div className="text-[12px] font-semibold text-[#1B2B4B] mb-3">February 2026 — Spending Breakdown</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={spendingByCategory.slice(0, 5)} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FF" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip formatter={(val: number) => [`RON ${val}`, '']} contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
            <Bar dataKey="amount" fill="#FFD100" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (data === 'transactions') {
    return (
      <div className="mt-3 bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-[12px] font-semibold text-[#1B2B4B]">Lidl Transactions</div>
        {lidlData.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/50">
            <span className="text-[12px] text-muted-foreground">{row.date}</span>
            <span className="text-[12px] font-semibold text-[#1B2B4B]">RON {row.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (data === 'suggestions') {
    return (
      <div className="mt-3 space-y-2">
        {subData.map((sub, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]" style={{ background: '#F0F4FF' }}>
                {sub.name === 'Netflix' ? '🎬' : '🎵'}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-[#1B2B4B]">{sub.name}</div>
                <div className="text-[11px] text-muted-foreground">{sub.frequency}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-[#1B2B4B]">RON {sub.amount}</div>
              <button className="text-[11px] text-red-500 font-semibold hover:underline">Cancel</button>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function SmartChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content: text, time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: text.toLowerCase().includes('subscri')
          ? 'You have 2 active subscriptions totaling **RON 87.98/month**. Netflix (RON 52.99) and Spotify (RON 34.99). You could save RON 1,055.76/year by cancelling both.'
          : text.toLowerCase().includes('lidl')
          ? 'You\'ve visited Lidl **18 times** with a total of **RON 2,340** spent. Average transaction: RON 130. Your last visit was Feb 28.'
          : text.toLowerCase().includes('month') || text.toLowerCase().includes('spend')
          ? 'In February 2026 you spent **RON 2,816.28** across 15 transactions — **8.3% less** than January. Top category: Shopping (RON 527.50).'
          : 'I found relevant data for your query. Your spending patterns look healthy! Would you like a detailed breakdown by category or merchant?',
        time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
        data: text.toLowerCase().includes('subscri') ? 'suggestions' : text.toLowerCase().includes('lidl') ? 'transactions' : text.toLowerCase().includes('month') ? 'chart' : undefined
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1600);
  };

  return (
    <div className="h-full flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFD100' }}>
            <Bot size={20} className="text-[#1B2B4B]" />
          </div>
          <div>
            <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '15px' }}>AI Financial Assistant</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-muted-foreground" style={{ fontSize: '11px' }}>Online · Powered by Connect & Grow AI</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${msg.role === 'user' ? '' : 'flex items-start gap-2.5'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#FFD100' }}>
                    <Bot size={14} className="text-[#1B2B4B]" />
                  </div>
                )}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm text-white'
                        : 'rounded-tl-sm'
                    }`}
                    style={{
                      background: msg.role === 'user' ? '#1B2B4B' : '#F0F4FF',
                    }}
                  >
                    <p
                      className={msg.role === 'user' ? 'text-white' : 'text-[#1B2B4B]'}
                      style={{ fontSize: '13px', lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>
                  {msg.data && <AiResponseCard data={msg.data} />}
                  <div className={`mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <span className="text-muted-foreground" style={{ fontSize: '10px' }}>{msg.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#FFD100' }}>
                <Bot size={14} className="text-[#1B2B4B]" />
              </div>
              <div className="bg-[#F0F4FF] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1B2B4B]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions row */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto shrink-0">
          {suggestions.slice(0, 4).map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#1B2B4B]/20 text-[11px] font-medium text-[#1B2B4B]/70 hover:border-[#FFD100] hover:text-[#1B2B4B] hover:bg-[#FFD100]/10 transition-all shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 pb-6 shrink-0">
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-border shadow-sm px-4 py-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask anything about your finances..."
              className="flex-1 text-[13px] outline-none text-[#1B2B4B] placeholder:text-muted-foreground bg-transparent"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:brightness-105"
              style={{ background: '#FFD100' }}
            >
              <Send size={15} className="text-[#1B2B4B]" />
            </button>
          </div>
        </div>
      </div>

      {/* Right — AI Insights Panel */}
      <div className="w-80 bg-white border-l border-border overflow-y-auto shrink-0 hidden lg:block">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-[#FFD100]" />
            <h3 style={{ fontSize: '14px', color: '#1B2B4B' }}>AI Insights</h3>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '11px' }}>Real-time analysis of your finances</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Insight cards */}
          {aiInsights.map((insight, i) => (
            <div key={i} className="rounded-xl border border-border p-3.5 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: insight.color + '20' }}>
                  <insight.icon size={15} style={{ color: insight.color }} />
                </div>
                <div>
                  <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '12px' }}>{insight.title}</div>
                  <div className="text-muted-foreground mt-0.5" style={{ fontSize: '11px', lineHeight: '1.5' }}>{insight.desc}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Category breakdown */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>Category Breakdown</div>
            </div>
            <div className="p-3 space-y-2.5">
              {spendingByCategory.map(cat => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#1B2B4B]">{cat.name}</span>
                    <span className="text-[11px] font-bold text-[#1B2B4B]">RON {cat.amount}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(cat.amount / 527.5) * 100}%`,
                        background: cat.fill
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="rounded-xl border border-border p-4">
            <div className="font-semibold text-[#1B2B4B] mb-3" style={{ fontSize: '13px' }}>Quick Queries</div>
            <div className="space-y-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
                >
                  <span className="text-[11px] text-muted-foreground group-hover:text-[#1B2B4B]">{s}</span>
                  <ArrowRight size={11} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
