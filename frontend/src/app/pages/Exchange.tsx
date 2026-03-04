import { useState } from 'react';
import { ArrowDownUp, RefreshCw, TrendingUp, TrendingDown, Info, Check } from 'lucide-react';

const currencies = [
    { code: 'RON', name: 'Romanian Leu', flag: 'https://flagcdn.com/w40/ro.png' },
    { code: 'EUR', name: 'Euro', flag: 'https://flagcdn.com/w40/eu.png' },
    { code: 'USD', name: 'US Dollar', flag: 'https://flagcdn.com/w40/us.png' },
    { code: 'GBP', name: 'British Pound', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'CHF', name: 'Swiss Franc', flag: 'https://flagcdn.com/w40/ch.png' },
    { code: 'HUF', name: 'Hungarian Forint', flag: 'https://flagcdn.com/w40/hu.png' },
];

const exchangeRates: Record<string, Record<string, number>> = {
    RON: { EUR: 0.2012, USD: 0.2185, GBP: 0.1724, CHF: 0.1892, HUF: 78.45, RON: 1 },
    EUR: { RON: 4.9700, USD: 1.0860, GBP: 0.8568, CHF: 0.9405, HUF: 389.82, EUR: 1 },
    USD: { RON: 4.5760, EUR: 0.9208, GBP: 0.7889, CHF: 0.8662, HUF: 358.90, USD: 1 },
    GBP: { RON: 5.8010, EUR: 1.1672, USD: 1.2676, CHF: 1.0979, HUF: 455.02, GBP: 1 },
    CHF: { RON: 5.2854, EUR: 1.0633, USD: 1.1544, GBP: 0.9108, HUF: 414.28, CHF: 1 },
    HUF: { RON: 0.01275, EUR: 0.002565, USD: 0.002786, GBP: 0.002198, CHF: 0.002414, HUF: 1 },
};

export function Exchange() {
    const [fromCurrency, setFromCurrency] = useState('RON');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [amount, setAmount] = useState('1000');
    const [exchanging, setExchanging] = useState(false);
    const [exchangeComplete, setExchangeComplete] = useState(false);
    const [fromOpen, setFromOpen] = useState(false);
    const [toOpen, setToOpen] = useState(false);

    const CurrencySelect = ({ value, onChange, open, setOpen, closeOther }: { value: string; onChange: (v: string) => void; open: boolean; setOpen: (v: boolean) => void; closeOther: () => void }) => {
        const selected = currencies.find(c => c.code === value)!;
        return (
            <div className="relative" style={{ width: '260px' }}>
                <button
                    type="button"
                    onClick={() => { setOpen(!open); if (!open) closeOther(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white text-[#1B2B4B] font-semibold outline-none hover:border-[#FFD100] transition-colors"
                    style={{ fontSize: '14px' }}
                >
                    <img src={selected.flag} alt={selected.code} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                    <span className="truncate">{selected.code} — {selected.name}</span>
                    <svg className="w-4 h-4 ml-auto shrink-0 text-[#1B2B4B]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {open && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-border shadow-xl z-50 overflow-y-auto" style={{ maxHeight: '200px', width: '320px' }}>
                        {currencies.map(c => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => { onChange(c.code); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#FFD10010] transition-colors ${c.code === value ? 'bg-[#FFD10015]' : ''}`}
                                style={{ fontSize: '14px' }}
                            >
                                <img src={c.flag} alt={c.code} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                                <span className="font-semibold text-[#1B2B4B]">{c.code}</span>
                                <span className="text-muted-foreground">{c.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const rate = exchangeRates[fromCurrency]?.[toCurrency] || 0;
    const convertedAmount = (parseFloat(amount || '0') * rate).toFixed(2);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const handleExchange = () => {
        setExchanging(true);
        setTimeout(() => {
            setExchanging(false);
            setExchangeComplete(true);
            setTimeout(() => setExchangeComplete(false), 4000);
        }, 2000);
    };

    const popularPairs = [
        { from: 'EUR', to: 'RON', rate: 4.97, change: +0.12 },
        { from: 'USD', to: 'RON', rate: 4.576, change: -0.03 },
        { from: 'GBP', to: 'RON', rate: 5.801, change: +0.08 },
        { from: 'CHF', to: 'RON', rate: 5.285, change: +0.05 },
    ];

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFD10020' }}>
                    <RefreshCw size={24} className="text-[#1B2B4B]" />
                </div>
                <div>
                    <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>Currency Exchange</h1>
                    <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Exchange currencies at competitive rates</p>
                </div>
            </div>

            {/* Exchange Card */}
            <div className="bg-white rounded-2xl border border-border">
                <div className="px-6 py-4 border-b border-border rounded-t-2xl" style={{ background: '#1B2B4B' }}>
                    <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Convert</h2>
                </div>

                <div className="px-6 py-6 space-y-5">
                    {/* From */}
                    <div>
                        <label className="text-muted-foreground block mb-2" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
                        <div className="flex gap-3">
                            <CurrencySelect value={fromCurrency} onChange={setFromCurrency} open={fromOpen} setOpen={setFromOpen} closeOther={() => setToOpen(false)} />
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-border text-[#1B2B4B] font-semibold outline-none focus:border-[#FFD100] transition-colors text-right"
                                style={{ fontSize: '18px' }}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Swap button */}
                    <div className="flex items-center justify-center">
                        <button
                            onClick={handleSwap}
                            className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-border hover:border-[#FFD100] hover:bg-[#FFD10010] transition-all"
                        >
                            <ArrowDownUp size={18} className="text-[#1B2B4B]" />
                        </button>
                    </div>

                    {/* To */}
                    <div>
                        <label className="text-muted-foreground block mb-2" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
                        <div className="flex gap-3">
                            <CurrencySelect value={toCurrency} onChange={setToCurrency} open={toOpen} setOpen={setToOpen} closeOther={() => setFromOpen(false)} />
                            <div
                                className="flex-1 px-4 py-3 rounded-xl border border-border text-right font-bold text-[#1B2B4B]"
                                style={{ fontSize: '18px', background: '#F8FAFC' }}
                            >
                                {convertedAmount} {toCurrency}
                            </div>
                        </div>
                    </div>

                    {/* Rate info */}
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#FFD10010' }}>
                        <Info size={14} className="text-[#1B2B4B]/60 shrink-0" />
                        <span className="text-[#1B2B4B]/70" style={{ fontSize: '13px' }}>
                            1 {fromCurrency} = <strong>{rate.toFixed(4)}</strong> {toCurrency} · Rate updated just now
                        </span>
                    </div>

                    {/* Exchange button */}
                    <button
                        onClick={handleExchange}
                        disabled={exchanging || !amount || parseFloat(amount) <= 0}
                        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 disabled:opacity-60"
                        style={{ background: '#FFD100', fontSize: '15px' }}
                    >
                        {exchanging ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[#1B2B4B]/30 border-t-[#1B2B4B] rounded-full animate-spin" />
                                Processing Exchange...
                            </>
                        ) : exchangeComplete ? (
                            <>
                                <Check size={18} />
                                Exchange Successful!
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                Exchange {amount || '0'} {fromCurrency} → {convertedAmount} {toCurrency}
                            </>
                        )}
                    </button>

                    {exchangeComplete && (
                        <p className="text-green-600 text-center" style={{ fontSize: '12px', fontWeight: 600 }}>
                            ✓ {amount} {fromCurrency} has been converted to {convertedAmount} {toCurrency}. Your balance has been updated.
                        </p>
                    )}


                </div>
            </div>
        </div>
    );
}
