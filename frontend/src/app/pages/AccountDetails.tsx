import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { FileText, Eye, EyeOff, Download, Lock, Shield, Copy, Check } from 'lucide-react';

export function AccountDetails() {
    const [securityCode, setSecurityCode] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isUnlocked) {
            setCountdown(30);
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setIsUnlocked(false);
                        setSecurityCode('');
                        return 30;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isUnlocked]);
    const [codeError, setCodeError] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [generatingStatement, setGeneratingStatement] = useState(false);
    const [statementGenerated, setStatementGenerated] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 8) + '01'); // First day of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today

    const CORRECT_CODE = '1234';

    const [accountData, setAccountData] = useState({
        type: 'Current Account (RON)',
        owner: '',
        iban: '',
        balance: '0,00 RON',
        // Secured data
        cardNumber: '4821 6732 8901 7634',
        cvv: '847',
        expiryDate: '09/28',
        pin: '****',
        openDate: '15.03.2021',
        branch: 'Sucursala București – Pipera',
    });

    useEffect(() => {
        const fetchUserData = async () => {
            const uid = localStorage.getItem('userId');
            if (!uid) return;
            try {
                const user = await api.getUser(uid);
                setAccountData(prev => ({
                    ...prev,
                    owner: user.name,
                    iban: user.iban || 'RO49BBBR1831007593840099',
                    balance: (user.balance?.toLocaleString('ro-RO', { minimumFractionDigits: 2 }) || '0,00') + ' RON'
                }));
            } catch (e) {
                console.error("Failed to load user data", e);
            }
        };
        fetchUserData();
    }, []);

    const handleUnlock = () => {
        if (securityCode === CORRECT_CODE) {
            setIsUnlocked(true);
            setCodeError(false);
        } else {
            setCodeError(true);
        }
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleGenerateStatement = async () => {
        setGeneratingStatement(true);
        const uid = localStorage.getItem('userId');
        if (!uid) {
             setGeneratingStatement(false);
             return;
        }
        
        try {
            const blob = await api.generateStatement(uid, startDate, endDate);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Raiffeisen_Statement_${startDate}_${endDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            setStatementGenerated(true);
            setTimeout(() => setStatementGenerated(false), 4000);
        } catch (e: any) {
            console.error(e);
            alert("Failed to generate statement: " + e.message);
        } finally {
            setGeneratingStatement(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFD10020' }}>
                    <FileText size={24} className="text-[#1B2B4B]" />
                </div>
                <div>
                    <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>Account Details</h1>
                    <p className="text-muted-foreground" style={{ fontSize: '13px' }}>View your account information</p>
                </div>
            </div>

            {/* Basic Account Info */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border" style={{ background: '#1B2B4B' }}>
                    <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Account Information</h2>
                </div>
                <div className="divide-y divide-border">
                    {/* Account Type */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div>
                            <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Type</div>
                            <div className="font-semibold text-[#1B2B4B] mt-0.5" style={{ fontSize: '15px' }}>{accountData.type}</div>
                        </div>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div>
                            <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</div>
                            <div className="font-semibold text-[#1B2B4B] mt-0.5" style={{ fontSize: '15px' }}>{accountData.owner}</div>
                        </div>
                    </div>

                    {/* IBAN */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div>
                            <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IBAN</div>
                            <div className="font-mono font-semibold text-[#1B2B4B] mt-0.5" style={{ fontSize: '15px', letterSpacing: '0.05em' }}>{accountData.iban}</div>
                        </div>
                        <button
                            onClick={() => handleCopy(accountData.iban, 'iban')}
                            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border hover:bg-muted transition-colors"
                        >
                            {copiedField === 'iban' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[#1B2B4B]/60" />}
                        </button>
                    </div>

                    {/* Balance */}
                    <div className="flex items-center justify-between px-6 py-5" style={{ background: '#FFD10008' }}>
                        <div>
                            <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</div>
                            <div className="font-bold text-[#1B2B4B] mt-0.5" style={{ fontSize: '24px' }}>{accountData.balance}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secured Data Section */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between" style={{ background: '#1B2B4B' }}>
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#FFD100]" />
                        <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Secured Data</h2>
                    </div>
                    {isUnlocked && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: countdown <= 10 ? 'rgba(239,68,68,0.2)' : 'rgba(255,209,0,0.2)' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: countdown <= 10 ? '#EF4444' : '#FFD100' }}>{countdown}s</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-500/20 rounded-full px-3 py-1">
                                <Eye size={12} className="text-green-400" />
                                <span className="text-green-400" style={{ fontSize: '11px', fontWeight: 600 }}>Unlocked</span>
                            </div>
                        </div>
                    )}
                </div>

                {!isUnlocked ? (
                    <div className="px-6 py-8 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#1B2B4B10' }}>
                            <Lock size={28} className="text-[#1B2B4B]/40" />
                        </div>
                        <p className="text-[#1B2B4B] font-semibold mb-1" style={{ fontSize: '15px' }}>Enter Security Code</p>
                        <p className="text-muted-foreground mb-5 text-center" style={{ fontSize: '13px' }}>
                            Enter your 4-digit security code to view sensitive account details.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={securityCode}
                                    onChange={e => { setSecurityCode(e.target.value); setCodeError(false); }}
                                    onKeyDown={e => { if (e.key === 'Enter') handleUnlock(); }}
                                    placeholder="••••"
                                    className="w-40 text-center px-4 py-3 rounded-xl border-2 font-mono tracking-[0.5em] outline-none transition-all"
                                    style={{
                                        fontSize: '20px',
                                        borderColor: codeError ? '#EF4444' : '#E2E8F0',
                                        background: codeError ? '#FEF2F220' : 'white',
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleUnlock}
                                className="px-5 py-3 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105"
                                style={{ background: '#FFD100', fontSize: '14px' }}
                            >
                                Unlock
                            </button>
                        </div>
                        {codeError && (
                            <p className="text-red-500 mt-2" style={{ fontSize: '12px', fontWeight: 600 }}>Incorrect code. Please try again.</p>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {[
                            { label: 'Card Number', value: accountData.cardNumber },
                            { label: 'CVV', value: accountData.cvv },
                            { label: 'Expiry Date', value: accountData.expiryDate },
                            { label: 'Account Opened', value: accountData.openDate },
                            { label: 'Branch', value: accountData.branch },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between px-6 py-3.5">
                                <div>
                                    <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                                    <div className="font-semibold text-[#1B2B4B] mt-0.5" style={{ fontSize: '14px' }}>{item.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Generate Extras de Cont */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border" style={{ background: '#1B2B4B' }}>
                    <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Extras de Cont</h2>
                </div>
                <div className="px-6 py-6">
                    <p className="text-muted-foreground mb-4" style={{ fontSize: '13px' }}>
                        Generate an official account statement (Extras de cont) in PDF format. The statement will include all transactions for the selected period.
                    </p>

                    <div className="flex items-center gap-4 mb-5">
                        <div className="flex-1">
                            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: '12px', fontWeight: 600 }}>FROM</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-border text-[#1B2B4B] outline-none focus:border-[#FFD100] transition-colors"
                                style={{ fontSize: '13px' }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: '12px', fontWeight: 600 }}>TO</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-border text-[#1B2B4B] outline-none focus:border-[#FFD100] transition-colors"
                                style={{ fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateStatement}
                        disabled={generatingStatement}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 disabled:opacity-60"
                        style={{ background: '#FFD100', fontSize: '14px' }}
                    >
                        {generatingStatement ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[#1B2B4B]/30 border-t-[#1B2B4B] rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : statementGenerated ? (
                            <>
                                <Check size={18} />
                                Statement Ready — Download
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Generate Extras de Cont
                            </>
                        )}
                    </button>

                    {statementGenerated && (
                        <p className="text-green-600 text-center mt-3" style={{ fontSize: '12px', fontWeight: 600 }}>
                            ✓ Extras de cont generated successfully. Your PDF is ready for download.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
