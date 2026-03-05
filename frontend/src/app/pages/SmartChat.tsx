import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Bot } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { initialChatMessages, currentUser, spendingByCategory, transactions as mockTransactions, type ChatMessage } from '../services/mockData';
import { api } from '../services/api';

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
  const [currentUserData, setCurrentUserData] = useState(currentUser);
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const uid = localStorage.getItem('userId') || 'me';
    
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUserData(prev => ({ ...prev, name: u.name, id: u.id }));
      } catch {}
    }

    // Fetch real transactions for AI analysis
    api.getTransactions(uid, 1000).then(txs => {
      const normalized = txs.map((t: any) => ({
        ...t,
        merchant: t.merchant_name || t.merchant, // Handle backend field name difference
        date: t.date?.split(' ')[0] || t.date // Ensure YYYY-MM-DD
      }));
      setRealTransactions(normalized);
    }).catch(err => {
      console.error("Failed to fetch transactions for AI", err);
      // Fallback to mock data if API fails
      setRealTransactions(mockTransactions);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content: text,
      time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 2. Call AI Search to Parse Query
      const searchRes = await api.search(text);

      let responseText = "Sorry, I couldn't understand that.";
      let filteredTx: any[] = [];
      let cardData: any = undefined;

      if (searchRes.status === 'success' && searchRes.parsed_intent) {
        // 3. Filter Transactions (Client-side logic now uses REAL data)
        const intent = searchRes.parsed_intent;
        
        // Use the large dataset fetched from backend
        const dataset = realTransactions.length > 0 ? realTransactions : mockTransactions;

        filteredTx = dataset.filter(tx => {
          // Normalize texts for comparison
          const merchant = (tx.merchant_name || tx.merchant).toLowerCase();
          const qMerchant = (intent.merchant_name || '').toLowerCase();
          
          let match = true;
          
          // Fuzzy merchant match (handle "Carrefour Baneasa" vs "Carrefour")
          if (qMerchant) {
            // Check if one contains the other
            if (!merchant.includes(qMerchant) && !qMerchant.includes(merchant)) {
               match = false;
            }
          }
          
          // Approximate location matching
          if (intent.location && !tx.county?.toLowerCase().includes(intent.location.toLowerCase())) match = false;
          // Handle nullable category in tx if needed
          if (intent.category && tx.category && !tx.category.toLowerCase().includes(intent.category.toLowerCase())) match = false;
          
          return match;
        });

        // 4. Format Results with AI
        const formatRes = await api.formatResults(text, intent, filteredTx);
        responseText = formatRes.answer_text;
      } else if (searchRes.status === 'refused') {
        responseText = searchRes.message || "I cannot answer that question.";
      }

      // 5. Add AI Response
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: responseText,
        data: cardData,
        time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'ai',
        content: "Sorry, I'm having trouble connecting to the AI service right now. Is the backend running?",
        time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 py-10" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* Heading */}
      <h1 className="font-bold text-[#1B2B4B] mb-8 text-center" style={{ fontSize: '34px', letterSpacing: '-0.5px' }}>
        Hello, {currentUserData.name.split(' ')[0]}!
      </h1>

      {/* Chat card */}
      <div className="w-full max-w-2xl flex flex-col rounded-3xl border border-border bg-white shadow-sm overflow-hidden" style={{ minHeight: '420px', maxHeight: '620px' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'ai' ? 'flex items-start gap-3' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#FFD100' }}>
                    <Bot size={15} className="text-[#1B2B4B]" />
                  </div>
                )}
                <div>
                  <div
                    className="rounded-2xl px-4 py-3"
                    style={{
                      background: msg.role === 'user' ? '#1B2B4B' : '#F5F7FF',
                      borderTopRightRadius: msg.role === 'user' ? '6px' : undefined,
                      borderTopLeftRadius: msg.role === 'ai' ? '6px' : undefined,
                    }}
                  >
                    <p
                      className={msg.role === 'user' ? 'text-white' : 'text-[#1B2B4B]'}
                      style={{ fontSize: '14px', lineHeight: '1.65' }}
                      dangerouslySetInnerHTML={{
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>
                  {msg.data && <AiResponseCard data={msg.data} />}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFD100' }}>
                <Bot size={15} className="text-[#1B2B4B]" />
              </div>
              <div className="bg-[#F5F7FF] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1B2B4B]/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-5 py-4 border-t border-border bg-white">
          <div className="flex items-center gap-3 bg-[#F5F7FF] rounded-full px-5 py-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask anything about your finances"
              className="flex-1 text-[13px] outline-none text-[#1B2B4B] placeholder:text-[#1B2B4B]/40 bg-transparent"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 hover:brightness-105 shrink-0"
              style={{ background: '#1B2B4B' }}
            >
              <ArrowRight size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
