import { useState, useMemo } from 'react';
import { ArrowLeft, MessageSquare, ReceiptText, ChevronRight, Search, Filter, Calendar, Bus, ShoppingCart, Utensils, CreditCard, Activity, Music, Banknote, TrendingUp, Lightbulb, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

// Available colors for categories
const CATEGORY_COLORS: Record<string, string> = {
    'Groceries': '#FFD100',
    'Shopping': '#1B2B4B',
    'Fuel': '#2A3C5F',
    'Subs': '#94A3B8',
    'Food': '#22C55E',
    'Transport': '#000000',
    'Health': '#22C55E',
    'Utilities': '#94A3B8',
    'Other': '#CBD5E1'
};

const aiInsights = [
    { icon: TrendingUp, title: 'Spending Down 8.3%', desc: 'Great news! February spending decreased compared to January.', color: '#10B981', bg: '#ecfdf5' },
    { icon: Lightbulb, title: 'Save RON 88/month', desc: 'Cancel 2 underused subscriptions to save on recurring costs.', color: '#FFD100', bg: '#fffbeb' },
    { icon: Sparkles, title: 'Top Category: Shopping', desc: 'Shopping represents 18.7% of total spend this month.', color: '#1B2B4B', bg: '#f1f5f9' },
];

export function Transactions() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dateRange, setDateRange] = useState('This Month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const allTransactions = useMemo(() => [
        { title: 'CTP CLUJ VALIDATOR', category: 'Transport', desc: 'CTP CLUJ VALIDATOR, CLUJ NAPOCA, RO', date: '28 feb. 2026', amount: '-3.5 RON', icon: <Bus size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'Forever Living', category: 'Shopping', desc: 'FOREVER LIVING PRODUCT, BUCURESTI, RO', date: '26 feb. 2026', amount: '-451.02 RON', icon: <ShoppingCart size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'Transfer din card 2496 CRETU...', category: 'Other', desc: 'BANCA TRANSILVANIA', date: '26 feb. 2026', amount: '-4000.0 RON', icon: <Banknote size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'INDPRODCOM SRL', category: 'Groceries', desc: 'INDPRODCOM SRL,Str. Principala, SANTANDR...', date: '25 feb. 2026', amount: '-4.0 RON', icon: <ShoppingCart size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'C.A.S.P.', category: 'Food', desc: 'Strada Émile Zola 2, 400112, CLUJ-NAPOCA,...', date: '25 feb. 2026', amount: '-23.72 RON', icon: <Utensils size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'Mega Image', category: 'Groceries', desc: 'MEGAIMAGE 1069 MI Her,Str Herculane nr 1,...', date: '25 feb. 2026', amount: '-4.49 RON', icon: <ShoppingCart size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'Mega Image', category: 'Groceries', desc: 'MEGAIMAGE 1069 MI Her,Str Herculane nr...', date: '20 feb. 2026', amount: '-12.98 RON', icon: <ShoppingCart size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'Spotify', category: 'Subs', desc: 'Birger Jarlsgatan 61, 113 56, Stockholm, SWE,...', date: '19 feb. 2026', amount: '-14.0 RON', icon: <Music size={20} className="text-[#1B2B4B]/60" /> },
        { title: 'Revolut', category: 'Other', desc: 'Revolut**0526*, Dublin, IE', date: '17 feb. 2026', amount: '-180.0 RON', icon: <CreditCard size={20} className="text-[#1B2B4B]/60" /> }
    ], []);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(trx => {
            // Apply category filter
            if (selectedCategory !== 'All' && trx.category !== selectedCategory) {
                return false;
            }

            // Apply search filter
            if (searchQuery && !trx.title.toLowerCase().includes(searchQuery.toLowerCase()) && !trx.desc.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Apply date filter
            if (dateRange === 'Custom Range' && customStartDate && customEndDate) {
                // Parse the mock dates ('28 feb. 2026' format) for a basic comparison
                const monthMap: Record<string, number> = {
                    'ian.': 0, 'feb.': 1, 'mar.': 2, 'apr.': 3, 'mai': 4, 'iun.': 5,
                    'iul.': 6, 'aug.': 7, 'sep.': 8, 'oct.': 9, 'nov.': 10, 'dec.': 11
                };

                try {
                    const [dayStr, monthStr, yearStr] = trx.date.split(' ');
                    const day = parseInt(dayStr);
                    const month = monthMap[monthStr.toLowerCase()];
                    const year = parseInt(yearStr);

                    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                        const trxDate = new Date(year, month, day);
                        const start = new Date(customStartDate);
                        const end = new Date(customEndDate);

                        // Set hours to cover the whole day
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);

                        if (trxDate < start || trxDate > end) {
                            return false;
                        }
                    }
                } catch (e) {
                    // If date parsing fails, keep it in the list
                }
            }

            return true;
        });
    }, [allTransactions, selectedCategory, searchQuery, dateRange, customStartDate, customEndDate]);

    // Derive category breakdown from currently visible transactions
    const categories = useMemo(() => {
        const sums: Record<string, number> = {};
        let total = 0;

        filteredTransactions.forEach(trx => {
            // Parse amount (e.g. "-3.5 RON" -> 3.5)
            const amtStr = trx.amount.replace(/[^0-9.]/g, '');
            const val = parseFloat(amtStr);
            if (!isNaN(val)) {
                sums[trx.category] = (sums[trx.category] || 0) + val;
                total += val;
            }
        });

        if (total === 0) return [];

        return Object.entries(sums)
            .map(([name, amount]) => ({
                name,
                amount: parseFloat(amount.toFixed(2)),
                color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'],
                percentage: Math.round((amount / total) * 100)
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions]);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/dashboard')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-black/5 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-[#1B2B4B]" />
                    </button>
                    <div>
                        <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>Transactions</h1>
                        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Your spending details</p>
                    </div>
                </div>

                {/* AI Chat Button */}
                <button
                    onClick={() => navigate('/app/chat')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all hover:brightness-105 shadow-sm"
                    style={{ background: '#FFD100', color: '#1B2B4B', fontSize: '14px' }}
                >
                    <MessageSquare size={18} />
                    Ask AI Assistant
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Transaction List */}
                <div className="md:col-span-2 space-y-6">
                    {/* Filters & Search */}
                    <div className="space-y-3">
                        {/* Search Row */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border outline-none focus:border-[#FFD100] transition-colors bg-white hover:bg-black/5 focus:bg-white"
                                style={{ fontSize: '14px' }}
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-3 bg-white border border-border rounded-xl font-semibold text-[#1B2B4B] hover:bg-black/5 transition-colors outline-none cursor-pointer flex-1"
                                style={{ fontSize: '14px' }}
                            >
                                <option value="All">All Categories</option>
                                {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            {/* Date Filter */}
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <select
                                    value={dateRange}
                                    onChange={(e) => {
                                        setDateRange(e.target.value);
                                        if (e.target.value !== 'Custom Range') {
                                            setCustomStartDate('');
                                            setCustomEndDate('');
                                        }
                                    }}
                                    className="w-full pl-10 pr-8 py-3 bg-white border border-border rounded-xl font-semibold text-[#1B2B4B] hover:bg-black/5 transition-colors outline-none cursor-pointer appearance-none"
                                    style={{ fontSize: '14px' }}
                                >
                                    <option>Today</option>
                                    <option>Last 7 Days</option>
                                    <option>This Month</option>
                                    <option>Last Month</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {dateRange === 'Custom Range' && (
                        <div className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Start Date</label>
                                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full border border-border rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">End Date</label>
                                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full border border-border rounded-lg bg-slate-50 px-3 py-2 text-sm outline-none" />
                            </div>
                        </div>
                    )}



                    {/* Recent Transactions */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-slate-50/50">
                            <h3 className="font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: '12px' }}>Recent</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {filteredTransactions.map((trx, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: '#1B2B4B08', border: '1px solid #1B2B4B15', fontSize: '20px' }}>
                                            <div className="w-full h-full flex items-center justify-center">{trx.icon}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{trx.title}</div>
                                            <div className="text-muted-foreground truncate max-w-[200px] sm:max-w-xs" style={{ fontSize: '12px' }}>{trx.desc}</div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <div className={`font-bold ${trx.amount.startsWith('+') ? 'text-green-600' : 'text-[#1B2B4B]'} mb-0.5`} style={{ fontSize: '15px' }}>{trx.amount}</div>
                                        <div className="text-muted-foreground" style={{ fontSize: '12px' }}>{trx.date}</div>
                                    </div>
                                </div>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground" style={{ fontSize: '14px' }}>No transactions found for the selected filters.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Category Breakdown */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '16px' }}>Category Breakdown</h2>
                        </div>
                        <div className="p-5 space-y-5">
                            {categories.length > 0 ? categories.map((cat) => (
                                <div key={cat.name} className="space-y-2">
                                    <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                                        <span className="text-[#1B2B4B]">{cat.name}</span>
                                        <span className="font-bold text-[#1B2B4B]">RON {cat.amount}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${cat.percentage}%`,
                                                background: cat.color
                                            }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-4" style={{ fontSize: '13px' }}>No classification data available</div>
                            )}
                        </div>
                    </div>

                    {/* AI Insights Card */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 mt-2">
                            <Sparkles size={18} className="text-[#FFD100]" />
                            <h2 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '16px' }}>AI Insights</h2>
                        </div>
                        <p className="text-muted-foreground mt-[-10px] mb-4" style={{ fontSize: '13px' }}>Real-time analysis of your finances</p>

                        {aiInsights.map((insight, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-border p-5 hover:shadow-sm transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: insight.bg }}>
                                        <insight.icon size={20} style={{ color: insight.color }} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[#1B2B4B] mb-1" style={{ fontSize: '14px' }}>{insight.title}</div>
                                        <div className="text-muted-foreground" style={{ fontSize: '13px', lineHeight: '1.5' }}>{insight.desc}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
