import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, TrendingDown, CreditCard, ShoppingBag, Wallet, ArrowRight, Send, ReceiptText, RefreshCw, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { transactions, spendingByCategory, monthlySpending } from '../services/mockData';

const formatRON = (v: number) => `RON ${v.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const quickActions = [
  { icon: Send, label: 'Send', color: '#FFD100' },
  { icon: ReceiptText, label: 'Pay', color: '#1B2B4B' },
  { icon: RefreshCw, label: 'Exchange', color: '#3B82F6' },
  { icon: ArrowUpRight, label: 'Invest', color: '#10B981' },
];

const categoryColors: Record<string, string> = {
  Groceries: '#FFD100', Food: '#FF8C00', Fuel: '#1B2B4B',
  Entertainment: '#8B5CF6', Subscriptions: '#3B82F6',
  Shopping: '#F472B6', Transport: '#06B6D4', Health: '#10B981', Utilities: '#94A3B8'
};

export function Dashboard() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const recent = transactions.slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* Top stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="col-span-1 md:col-span-2 xl:col-span-1 rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: '#1B2B4B' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,209,0,0.15) 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Balance</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFD100' }}>
                <Wallet size={15} className="text-[#1B2B4B]" />
              </div>
            </div>
            <div className="font-bold text-white" style={{ fontSize: '28px' }}>RON 24,851.20</div>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp size={13} className="text-green-400" />
              <span className="text-green-400" style={{ fontSize: '12px', fontWeight: 600 }}>+8.3%</span>
              <span className="text-white/40" style={{ fontSize: '12px' }}>vs last month</span>
            </div>
          </div>
        </div>

        {/* Monthly Spending */}
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feb Spending</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
              <TrendingDown size={15} className="text-[#1B2B4B]" />
            </div>
          </div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '24px' }}>RON 2,816.28</div>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingDown size={13} className="text-green-500" />
            <span className="text-green-500" style={{ fontSize: '12px', fontWeight: 600 }}>-8.3%</span>
            <span className="text-muted-foreground" style={{ fontSize: '12px' }}>vs January</span>
          </div>
        </div>

        {/* Top Merchant */}
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Merchant</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
              <ShoppingBag size={15} className="text-[#1B2B4B]" />
            </div>
          </div>
          <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>Emag.ro</div>
          <div className="text-muted-foreground mt-1" style={{ fontSize: '13px' }}>RON 2,100 total · 6 visits</div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '74%', background: '#FFD100' }} />
          </div>
        </div>

        {/* Card info */}
        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #2D4A78 0%, #1B2B4B 100%)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-white/60" style={{ fontSize: '12px' }}>Debit Card</span>
            <CreditCard size={18} className="text-white/60" />
          </div>
          <div className="font-mono text-white/80" style={{ fontSize: '14px', letterSpacing: '0.2em' }}>•••• •••• •••• 4821</div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="text-white/50" style={{ fontSize: '10px' }}>EXPIRY</div>
              <div className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>09/28</div>
            </div>
            <div className="text-right">
              <div className="text-white/50" style={{ fontSize: '10px' }}>LIMIT</div>
              <div className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>RON 5,000</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {quickActions.map(action => (
          <button
            key={action.label}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-border hover:shadow-md transition-all whitespace-nowrap group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: action.color + '20' }}>
              <action.icon size={14} style={{ color: action.color }} />
            </div>
            <span className="text-[13px] font-semibold text-[#1B2B4B]">{action.label}</span>
          </button>
        ))}
        <button
          onClick={() => navigate('/app/confirm')}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-border hover:shadow-md transition-all whitespace-nowrap"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#FFD100]/20">
            <ReceiptText size={14} className="text-[#B8960C]" />
          </div>
          <span className="text-[13px] font-semibold text-[#1B2B4B]">Pending (1)</span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Spending by Category */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>Spending by Category</h3>
              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>February 2026</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendingByCategory} barSize={28} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FF" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${v}`} />
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

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>Monthly Trend</h3>
              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Last 6 months</p>
            </div>
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

      {/* Bottom row */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>Recent Transactions</h3>
            <button className="flex items-center gap-1 text-[12px] font-semibold text-[#1B2B4B]/60 hover:text-[#1B2B4B] transition-colors">
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recent.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors group">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: (categoryColors[tx.category] || '#94A3B8') + '20' }}
                >
                  <span style={{ fontSize: '14px' }}>
                    {tx.category === 'Groceries' ? '🛒' : tx.category === 'Fuel' ? '⛽' : tx.category === 'Subscriptions' ? '📱' : tx.category === 'Food' ? '🍔' : tx.category === 'Shopping' ? '🛍️' : tx.category === 'Transport' ? '🚗' : tx.category === 'Health' ? '💊' : '💡'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '13px' }}>{tx.merchant}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '11px' }}>{tx.date} · {tx.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>-RON {tx.amount.toFixed(2)}</div>
                  <div className={`px-2 py-0.5 rounded-full inline-block mt-0.5 ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`} style={{ fontSize: '10px', fontWeight: 600 }}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick AI Chat */}
        <div className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#FFD100' }}>
                <span style={{ fontSize: '12px' }}>🤖</span>
              </div>
              <h3 style={{ fontSize: '15px', color: '#1B2B4B' }}>Smart Assistant</h3>
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
      </div>
    </div>
  );
}