import { useState, useEffect } from 'react';
import { Send, User, Building2, ArrowRight, Lock, Check, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';

const CORRECT_CODE = '1234';

export function SendMoney() {
    const [contacts, setContacts] = useState<{ name: string; iban: string; phone: string }[]>([]);
    const [accounts, setAccounts] = useState([
        { label: 'Current Account (RON)', iban: 'RO49BBBR1831007593840099', balance: 0 },
        { label: 'Savings Account (RON)', iban: 'RO21BBBR1831007593840100', balance: 15420.50 },
    ]);
    const [step, setStep] = useState<'form' | 'overview' | 'code' | 'success'>('form');
    
    useEffect(() => {
        const uid = localStorage.getItem('userId');
        if (!uid) return;
        const fetchData = async () => {
            try {
                const user = await api.getUser(uid);
                if (user) {
                    setAccounts(prev => {
                        const newAccs = [...prev];
                        newAccs[0].balance = typeof user.balance === 'number' ? user.balance : 0;
                        newAccs[1].balance = typeof user.balance_savings === 'number' ? user.balance_savings : newAccs[1].balance;
                        return newAccs;
                    });
                }
            } catch (e) { console.error("Failed to fetch balance", e); }
            try {
                const c = await api.getUserContacts(uid);
                setContacts(c.map((ct: any) => ({ name: ct.name, iban: ct.iban || '', phone: ct.phone || 'N/A' })));
            } catch { /* no contacts yet */ }
        };
        fetchData();
    }, []);

    const [selectedAccount, setSelectedAccount] = useState(0);
    const [recipientInput, setRecipientInput] = useState('');
    const [showContacts, setShowContacts] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [sending, setSending] = useState(false);

    const account = accounts[selectedAccount];
    const balance = account.balance;
    const parsedAmount = parseFloat(amount || '0');
    const matchedContact = contacts.find(c =>
        c.iban === recipientInput ||
        c.phone.replace(/\s+/g, '') === recipientInput.replace(/\s+/g, '')
    );

    const resolvedName = matchedContact ? matchedContact.name : (recipientInput.length >= 10 ? 'Unknown Recipient' : '');
    // If we have an exact contact, send name. If unknown, send the raw input (might be IBAN/Phone) so backend can resolve it.
    const merchantPayload = matchedContact ? matchedContact.name : recipientInput;

    const canProceed = recipientInput.trim().length >= 10 && parsedAmount > 0 && parsedAmount <= balance;

    const handleSelectContact = (contact: typeof contacts[0]) => {
        setRecipientInput(contact.iban);
        setShowContacts(false);
    };

    const handleVerifyCode = async () => {
        if (securityCode === CORRECT_CODE) {
            setCodeError(false);
            setSending(true);
            
            const uid = localStorage.getItem('userId');
            // Simulate processing delay
            await new Promise(r => setTimeout(r, 1500));

            if (uid) {
                 try {
                     await api.confirmTransaction({
                         user_id: uid,
                         merchant: merchantPayload, // Send resolved name or raw IBAN
                         amount: parsedAmount,
                         category: 'Transfer',
                         city: 'Online',
                         source_account: selectedAccount === 0 ? 'current' : 'savings',
                     });
                 } catch (e) {
                     console.error("Transfer failed", e);
                     setSending(false);
                     return;
                 }
            }
            
            setAccounts(prev => {
                const newAccs = [...prev];
                newAccs[selectedAccount] = { ...newAccs[selectedAccount], balance: newAccs[selectedAccount].balance - parsedAmount };
                return newAccs;
            });

            setSending(false);
            setStep('success');
        } else {
            setCodeError(true);
        }
    };

    const handleReset = () => {
        setStep('form');
        setRecipientInput('');
        setShowContacts(false);
        setAmount('');
        setDescription('');
        setSecurityCode('');
        setCodeError(false);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFD10020' }}>
                    <Send size={24} className="text-[#1B2B4B]" />
                </div>
                <div>
                    <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>Send Money</h1>
                    <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Transfer funds to another account</p>
                </div>
            </div>

            {/* ===== STEP 1: FORM ===== */}
            {step === 'form' && (
                <div className="space-y-6">
                    {/* From Account */}
                    <div className="bg-white rounded-2xl border border-border">
                        <div className="px-6 py-4 border-b border-border rounded-t-2xl" style={{ background: '#1B2B4B' }}>
                            <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>From Account</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            {accounts.map((acc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedAccount(idx)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left ${selectedAccount === idx ? 'border-[#FFD100] bg-[#FFD10008]' : 'border-border hover:border-[#FFD100]/40'}`}
                                >
                                    <div>
                                        <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{acc.label}</div>
                                        <div className="text-muted-foreground font-mono" style={{ fontSize: '11px' }}>{acc.iban}</div>
                                    </div>
                                    <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '15px' }}>{acc.balance.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipient */}
                    <div className="bg-white rounded-2xl border border-border">
                        <div className="px-6 py-4 border-b border-border rounded-t-2xl" style={{ background: '#1B2B4B' }}>
                            <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Recipient</h2>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="text-muted-foreground block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IBAN or Phone Number</label>
                                <input
                                    value={recipientInput}
                                    onChange={e => setRecipientInput(e.target.value.toUpperCase())}
                                    placeholder="RO00XXXX... or +40 7XX..."
                                    className="w-full px-4 py-3 rounded-xl border border-border text-[#1B2B4B] font-mono outline-none focus:border-[#FFD100] transition-colors"
                                    style={{ fontSize: '14px', letterSpacing: '0.03em' }}
                                />
                                {resolvedName && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#1B2B4B05' }}>
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFD10020' }}>
                                            <User size={12} className="text-[#1B2B4B]" />
                                        </div>
                                        <span className="font-semibold text-[#1B2B4B]" style={{ fontSize: '13px' }}>{resolvedName}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-muted-foreground block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (RON)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-xl border border-border text-[#1B2B4B] font-semibold outline-none focus:border-[#FFD100] transition-colors"
                                    style={{ fontSize: '18px' }}
                                />
                                {parsedAmount > balance && (
                                    <p className="text-red-500 mt-1" style={{ fontSize: '12px', fontWeight: 600 }}>Insufficient funds</p>
                                )}
                            </div>
                            <div>
                                <label className="text-muted-foreground block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description (optional)</label>
                                <input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Payment for..."
                                    className="w-full px-4 py-3 rounded-xl border border-border text-[#1B2B4B] outline-none focus:border-[#FFD100] transition-colors"
                                    style={{ fontSize: '14px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <button
                            onClick={() => setShowContacts(!showContacts)}
                            className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-black/5"
                        >
                            <h2 className="font-semibold text-[#1B2B4B]" style={{ fontSize: '15px' }}>Your Contacts</h2>
                            <ChevronLeft size={18} className={`text-[#1B2B4B] transition-transform ${showContacts ? '-rotate-90' : 'rotate-180'}`} />
                        </button>
                        {showContacts && (
                            <div className="divide-y divide-border border-t border-border max-h-[250px] overflow-y-auto">
                                {contacts.map((c, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectContact(c)}
                                        className={`w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-[#FFD10008] transition-colors ${recipientInput === c.iban ? 'bg-[#FFD10010]' : ''}`}
                                    >
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: c.phone === 'N/A' ? '#1B2B4B15' : '#FFD10020' }}>
                                            {c.phone === 'N/A' ? <Building2 size={16} className="text-[#1B2B4B]" /> : <User size={16} className="text-[#1B2B4B]" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-[#1B2B4B] truncate" style={{ fontSize: '14px' }}>{c.name}</div>
                                            <div className="text-muted-foreground" style={{ fontSize: '11px' }}>{c.phone !== 'N/A' ? c.phone : 'Business'}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Next button */}
                    <button
                        onClick={() => setStep('overview')}
                        disabled={!canProceed}
                        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: '#FFD100', fontSize: '15px' }}
                    >
                        Next
                        <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* ===== STEP 2: OVERVIEW ===== */}
            {step === 'overview' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-border">
                        <div className="px-6 py-4 border-b border-border rounded-t-2xl" style={{ background: '#1B2B4B' }}>
                            <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Transfer Overview</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {[
                                { label: 'From', value: account.label, sub: account.iban },
                                { label: 'To', value: resolvedName, sub: recipientInput },
                                { label: 'Amount', value: `${parsedAmount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON`, sub: '' },
                                ...(description ? [{ label: 'Description', value: description, sub: '' }] : []),
                            ].map(row => (
                                <div key={row.label} className="flex items-start justify-between px-6 py-4">
                                    <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                                    <div className="text-right">
                                        <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{row.value}</div>
                                        {row.sub && <div className="text-muted-foreground font-mono" style={{ fontSize: '11px' }}>{row.sub}</div>}
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between px-6 py-4" style={{ background: '#FFD10008' }}>
                                <div className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Balance</div>
                                <div className="font-bold text-[#1B2B4B]" style={{ fontSize: '18px' }}>{(balance - parsedAmount).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('form')}
                            className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-[#1B2B4B] border-2 border-border hover:border-[#1B2B4B]/30 transition-all flex-1"
                            style={{ fontSize: '15px' }}
                        >
                            <ChevronLeft size={18} />
                            Back
                        </button>
                        <button
                            onClick={() => setStep('code')}
                            className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 flex-[2]"
                            style={{ background: '#FFD100', fontSize: '15px' }}
                        >
                            Confirm & Send
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ===== STEP 3: SECURITY CODE ===== */}
            {step === 'code' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-border">
                        <div className="px-6 py-4 border-b border-border rounded-t-2xl" style={{ background: '#1B2B4B' }}>
                            <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>Security Verification</h2>
                        </div>
                        <div className="px-6 py-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#1B2B4B10' }}>
                                <Lock size={28} className="text-[#1B2B4B]/40" />
                            </div>
                            <p className="text-[#1B2B4B] font-semibold mb-1" style={{ fontSize: '16px' }}>
                                Sending {parsedAmount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                            </p>
                            <p className="text-muted-foreground mb-1" style={{ fontSize: '13px' }}>
                                to <strong>{resolvedName}</strong>
                            </p>
                            <p className="text-muted-foreground mb-6 text-center" style={{ fontSize: '13px' }}>
                                Enter your 4-digit security code to authorize this transfer.
                            </p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={securityCode}
                                    onChange={e => { setSecurityCode(e.target.value); setCodeError(false); }}
                                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyCode(); }}
                                    placeholder="••••"
                                    className="w-40 text-center px-4 py-3 rounded-xl border-2 font-mono tracking-[0.5em] outline-none transition-all"
                                    style={{
                                        fontSize: '20px',
                                        borderColor: codeError ? '#EF4444' : '#E2E8F0',
                                        background: codeError ? '#FEF2F220' : 'white',
                                    }}
                                />
                                <button
                                    onClick={handleVerifyCode}
                                    disabled={sending || securityCode.length < 4}
                                    className="px-6 py-3 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 disabled:opacity-60"
                                    style={{ background: '#FFD100', fontSize: '14px' }}
                                >
                                    {sending ? (
                                        <div className="w-5 h-5 border-2 border-[#1B2B4B]/30 border-t-[#1B2B4B] rounded-full animate-spin" />
                                    ) : 'Send'}
                                </button>
                            </div>
                            {codeError && (
                                <p className="text-red-500 mt-2" style={{ fontSize: '12px', fontWeight: 600 }}>Incorrect code. Please try again.</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => { setStep('overview'); setSecurityCode(''); setCodeError(false); }}
                        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-[#1B2B4B] border-2 border-border hover:border-[#1B2B4B]/30 transition-all"
                        style={{ fontSize: '15px' }}
                    >
                        <ChevronLeft size={18} />
                        Back to Overview
                    </button>
                </div>
            )}

            {/* ===== STEP 4: SUCCESS ===== */}
            {step === 'success' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-border">
                        <div className="px-6 py-12 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#22C55E20' }}>
                                <Check size={36} className="text-green-500" />
                            </div>
                            <h2 className="font-bold text-[#1B2B4B] mb-1" style={{ fontSize: '20px' }}>Transfer Successful!</h2>
                            <p className="text-muted-foreground text-center mb-6" style={{ fontSize: '14px' }}>
                                You sent <strong>{parsedAmount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</strong> to <strong>{resolvedName}</strong>
                            </p>
                            <div className="w-full max-w-sm divide-y divide-border rounded-xl border border-border overflow-hidden">
                                <div className="flex justify-between px-4 py-3">
                                    <span className="text-muted-foreground" style={{ fontSize: '12px' }}>Recipient</span>
                                    <span className="font-mono text-[#1B2B4B]" style={{ fontSize: '12px' }}>{recipientInput}</span>
                                </div>
                                <div className="flex justify-between px-4 py-3" style={{ background: '#FFD10008' }}>
                                    <span className="text-muted-foreground" style={{ fontSize: '12px' }}>New Balance</span>
                                    <span className="font-bold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{balance.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105"
                        style={{ background: '#FFD100', fontSize: '15px' }}
                    >
                        New Transfer
                    </button>
                </div>
            )}
        </div>
    );
}
