import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Send, ReceiptText, RefreshCw, Users, FileText, Plus,
  CreditCard, Wifi, ChevronLeft, ChevronRight, ArrowRight,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { transactions, spendingByCategory, monthlySpending } from '../services/mockData';

const categoryColors: Record<string, string> = {
  Groceries: '#FFD100', Food: '#1B2B4B', Fuel: '#000000',
  Entertainment: '#1B2B4B', Subscriptions: '#1B2B4B',
  Shopping: '#FFD100', Transport: '#1B2B4B', Health: '#10B981', Utilities: '#94A3B8'
};

type Tab = 'cards' | 'economy';

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('cards');
  const [chatInput, setChatInput] = useState('');
  const recent = transactions.slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* Tabs row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cards')}
            className="px-5 py-2 rounded-xl font-semibold transition-all"
            style={{
              fontSize: '14px',
              background: activeTab === 'cards' ? '#1B2B4B' : 'white',
              color: activeTab === 'cards' ? 'white' : '#1B2B4B',
              border: activeTab === 'cards' ? 'none' : '1px solid #E2E8F0',
            }}
          >
            Cards
          </button>
          <button
            disabled
            className="px-5 py-2 rounded-xl font-semibold transition-all cursor-not-allowed opacity-40"
            style={{
              fontSize: '14px',
              background: 'white',
              color: '#1B2B4B',
              border: '1px solid #E2E8F0',
            }}
          >
            Economy
          </button>
        </div>
        <button className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:shadow-md transition-all">
          <Plus size={20} className="text-[#1B2B4B]" />
        </button>
      </div>

      {/* Cards Tab */}
      {activeTab === 'cards' && (
        <>
          {/* Centered Card with arrows */}
          <div className="flex items-center justify-center gap-4">
            {/* Left arrow */}
            <button className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:shadow-md transition-all shrink-0">
              <ChevronLeft size={20} className="text-[#1B2B4B]" />
            </button>

            {/* Card */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFD100 0%, #FFC200 50%, #FFB800 100%)',
                width: '420px',
                height: '260px',
              }}
            >
              <div className="flex flex-col justify-between h-full relative z-10">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '16px' }}>Connect & Grow</div>
                    <div className="text-[#1B2B4B]/60" style={{ fontSize: '11px' }}>Bank</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#1B2B4B]/10 rounded-lg px-2 py-1.5">
                    <CreditCard size={14} className="text-[#1B2B4B]" />
                    <Wifi size={14} className="text-[#1B2B4B]" />
                  </div>
                </div>

                {/* Bottom row */}
                <div>
                  <div className="text-[#1B2B4B]/50 mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    DEBIT RON
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[#1B2B4B]/60" style={{ fontSize: '12px' }}>Zero Simple Package</div>
                      <div className="font-mono text-[#1B2B4B]/70 mt-1" style={{ fontSize: '13px', letterSpacing: '0.15em' }}>
                        •••• •••• •••• 4821
                      </div>
                    </div>
                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '20px', fontStyle: 'italic' }}>
                      VISA
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(27,43,75,0.05) 20px, rgba(27,43,75,0.05) 40px)',
              }} />
            </div>

            {/* Right arrow */}
            <button className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center hover:shadow-md transition-all shrink-0">
              <ChevronRight size={20} className="text-[#1B2B4B]" />
            </button>
          </div>

          {/* Balance below card */}
          <div className="text-center">
            <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '32px' }}>24,851.20 RON</div>
          </div>

          {/* Quick Actions - two rows */}
          <div className="space-y-3">
            {/* Row 1: 3 buttons */}
            <div className="flex items-center justify-center gap-3">
              {[
                { icon: Send, label: 'Send', onClick: () => navigate('/app/send') },
                { icon: Users, label: 'Merchants', onClick: () => navigate('/app/merchant/emag') },
                { icon: ReceiptText, label: 'Transactions', onClick: () => navigate('/app/transactions') },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-border hover:shadow-lg hover:border-[#FFD100]/50 transition-all group"
                  style={{ width: '160px', height: '110px' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: '#FFD10020' }}>
                    <action.icon size={22} className="text-[#1B2B4B]" />
                  </div>
                  <span className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{action.label}</span>
                </button>
              ))}
            </div>
            {/* Row 2: 2 buttons */}
            <div className="flex items-center justify-center gap-3">
              {[
                { icon: FileText, label: 'Details', onClick: () => navigate('/app/details') },
                { icon: RefreshCw, label: 'Exchange', onClick: () => navigate('/app/exchange') },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-border hover:shadow-lg hover:border-[#FFD100]/50 transition-all group"
                  style={{ width: '160px', height: '110px' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: '#FFD10020' }}>
                    <action.icon size={22} className="text-[#1B2B4B]" />
                  </div>
                  <span className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Economy Tab */}
      {activeTab === 'economy' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: '#1B2B4B' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,209,0,0.15) 0%, transparent 60%)' }} />
              <div className="relative z-10">
                <span className="text-white/60" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Balance</span>
                <div className="font-bold text-white mt-2" style={{ fontSize: '28px' }}>RON 24,851.20</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp size={13} className="text-green-400" />
                  <span className="text-green-400" style={{ fontSize: '12px', fontWeight: 600 }}>+8.3%</span>
                  <span className="text-white/40" style={{ fontSize: '12px' }}>vs last month</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border">
              <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feb Spending</span>
              <div className="font-bold text-[#1B2B4B] mt-2" style={{ fontSize: '24px' }}>RON 2,816.28</div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingDown size={13} className="text-green-500" />
                <span className="text-green-500" style={{ fontSize: '12px', fontWeight: 600 }}>-8.3%</span>
                <span className="text-muted-foreground" style={{ fontSize: '12px' }}>vs January</span>
              </div>
            </div>

            <div
              className="bg-white rounded-2xl p-5 border border-border cursor-pointer hover:border-[#FFD100] hover:shadow-sm transition-all"
              onClick={() => navigate('/app/merchant/emag')}
            >
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Merchant</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
              <div className="font-bold text-[#1B2B4B] mt-2" style={{ fontSize: '18px' }}>Emag.ro</div>
              <div className="text-muted-foreground mt-1" style={{ fontSize: '13px' }}>RON 2,100 total · 6 visits</div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '74%', background: '#FFD100' }} />
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-border">
              <div className="mb-4">
                <h3 style={{ fontSize: '15px', color: '#1B2B4B', fontWeight: 600 }}>Spending by Category</h3>
                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>February 2026</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={spendingByCategory} barSize={28} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FF" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: string | number) => `${v}`} />
                  <Tooltip
                    formatter={(val: number) => [`RON ${val.toFixed(2)}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border">
              <div className="mb-4">
                <h3 style={{ fontSize: '15px', color: '#1B2B4B', fontWeight: 600 }}>Monthly Trend</h3>
                <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Last 6 months</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FF" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(val: number) => [`RON ${val}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#FFD100"
                    strokeWidth={2.5}
                    dot={{ fill: '#FFD100', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#1B2B4B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Smart Chat Preview */}
          <div className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden" style={{ maxHeight: '280px' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#FFD100' }}>
                  <span style={{ fontSize: '12px' }}>🤖</span>
                </div>
                <h3 style={{ fontSize: '15px', color: '#1B2B4B', fontWeight: 600 }}>Smart Assistant</h3>
              </div>
              <button
                onClick={() => navigate('/app/chat')}
                className="text-[11px] font-semibold text-[#1B2B4B]/60 hover:text-[#1B2B4B] flex items-center gap-1"
              >
                Open <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="bg-muted/80 rounded-xl rounded-tl-sm p-3 max-w-[90%]">
                <p className="text-[#1B2B4B]" style={{ fontSize: '12px', lineHeight: '1.5' }}>Hello! Ask me anything about your finances.</p>
              </div>
              <div className="bg-[#1B2B4B] rounded-xl rounded-tr-sm p-3 max-w-[90%] ml-auto">
                <p className="text-white" style={{ fontSize: '12px', lineHeight: '1.5' }}>How much did I spend last month?</p>
              </div>
              <div className="bg-muted/80 rounded-xl rounded-tl-sm p-3 max-w-[90%]">
                <p className="text-[#1B2B4B]" style={{ fontSize: '12px', lineHeight: '1.5' }}>You spent <strong>RON 2,816.28</strong> in February — 8.3% less than January! 🎉</p>
              </div>
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
                  onKeyDown={e => { if (e.key === 'Enter') navigate('/app/chat'); }}
                />
                <button
                  onClick={() => navigate('/app/chat')}
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#FFD100' }}
                >
                  <ArrowRight size={12} className="text-[#1B2B4B]" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}