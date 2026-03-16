import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

type Mode = 'signup' | 'login';

interface FieldState {
  value: string;
  error?: string;
  touched: boolean;
}

const initialField = (): FieldState => ({ value: '', touched: false });

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const referralInviteId = searchParams.get('rid') || undefined;
  const referredEmail = searchParams.get('email') || '';
  const hasReferral = Boolean(searchParams.get('ref') || referralInviteId);

  const [mode, setMode] = useState<Mode>(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'login') return 'login';
    if (modeParam === 'signup' || hasReferral) return 'signup';
    return 'signup';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [allowOnline, setAllowOnline] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [fields, setFields] = useState({
    fullName: initialField(),
    email: initialField(),
    password: initialField(),
    career: initialField(),
    phone: initialField(),
  });

  useEffect(() => {
    if (!referredEmail) return;
    setFields(prev => ({
      ...prev,
      email: {
        value: referredEmail,
        touched: true,
        error: validate('email', referredEmail),
      }
    }));
  }, [referredEmail]);

  const validate = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        break;
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter';
        break;
      case 'career':
        if (!value.trim()) return 'Career field is required';
        break;
      case 'phone':
        if (!value) return 'Phone number is required';
        if (!/^(\+40|0)[0-9]{9}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid Romanian phone number';
        break;
    }
  };

  const updateField = (name: keyof typeof fields, value: string) => {
    setFields(prev => ({
      ...prev,
      [name]: { value, touched: true, error: validate(name, value) }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (mode === 'login') {
      setIsLoading(true);
      try {
        const user = await api.login({
          email: fields.email.value,
          password: fields.password.value
        });
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user.id);
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/app/dashboard');
        }
      } catch (e) {
        console.error(e);
        setApiError('Invalid credentials');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // Validate all fields
    const newFields = { ...fields };
    let hasErrors = false;
    Object.entries(fields).forEach(([key, f]) => {
      const error = validate(key, f.value);
      (newFields as any)[key] = { ...f, touched: true, error };
      if (error) hasErrors = true;
    });
    setFields(newFields);
    if (!acceptTerms) return;
    if (hasErrors) return;

    setIsLoading(true);
    
    try {
      const user = await api.register({
        name: fields.fullName.value,
        email: fields.email.value,
        password: fields.password.value,
        phone: fields.phone.value,
        referral_invite_id: referralInviteId,
      });
      setIsLoading(false);
      setSubmitted(true);
      // Store user session
      localStorage.setItem('user', JSON.stringify(user));
      if (user.id) localStorage.setItem('userId', user.id);
      
      setTimeout(() => navigate('/app/dashboard'), 1500);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setApiError(typeof err.message === 'string' ? err.message : "Registration failed. Please try again.");
    }
  };

  const getFieldClass = (field: FieldState) => {
    const base = 'w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all bg-white';
    if (!field.touched) return `${base} border-border focus:border-[#FFD100] focus:ring-2 focus:ring-[#FFD100]/20`;
    if (field.error) return `${base} border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 bg-red-50`;
    return `${base} border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 bg-green-50/30`;
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1B2B4B' }}>Account Created!</h2>
          <p className="text-muted-foreground mt-2">Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#F5F7FA' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#1B2B4B' }}
      >
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 70%, rgba(255,209,0,0.12) 0%, transparent 60%)' }} />
        <button onClick={() => navigate('/')} className="flex items-center gap-2 z-10 relative w-fit">
          <img src="/logo.png" alt="Connect & Grow" className="w-10 h-10 object-contain" />
          <span className="text-white font-bold" style={{ fontSize: '16px' }}>Connect & Grow</span>
        </button>
        <div className="z-10 relative">
          <h1 style={{ fontSize: '40px', fontWeight: 700, color: 'white', lineHeight: '1.2' }}>
            Your financial<br />
            <span style={{ color: '#FFD100' }}>future starts</span><br />
            here.
          </h1>
          <p className="text-white/60 mt-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>
            Join thousands of Romanian professionals managing their money smarter with AI-powered insights and community banking.
          </p>
          <div className="mt-8 space-y-3">
            {['AI-powered spending analysis', 'Interactive Romania spending map', 'Professional community network', 'Bank-grade security & compliance'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFD100' }}>
                  <CheckCircle2 size={12} className="text-[#1B2B4B]" />
                </div>
                <span className="text-white/80" style={{ fontSize: '14px' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="z-10 relative flex items-center gap-3">
          <div className="flex -space-x-2">
            {['https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?w=36&h=36&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?w=36&h=36&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=36&h=36&fit=crop&crop=face',
            ].map((src, i) => (
              <img key={i} src={src} alt="User" className="w-9 h-9 rounded-full object-cover border-2 border-[#1B2B4B]" />
            ))}
          </div>
          <div>
            <div className="text-white font-semibold" style={{ fontSize: '13px' }}>2.4M+ users already joined</div>
            <div className="text-white/50" style={{ fontSize: '12px' }}>⭐⭐⭐⭐⭐ Rated 4.9/5</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-8 lg:hidden">
            <ArrowLeft size={16} className="text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">Back</span>
          </button>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-muted p-1 rounded-xl mb-8">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${mode === 'signup' ? 'bg-white text-[#1B2B4B] shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${mode === 'login' ? 'bg-white text-[#1B2B4B] shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Log In
            </button>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1B2B4B' }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-muted-foreground mt-1 mb-6" style={{ fontSize: '14px' }}>
            {mode === 'signup' ? 'Fill in your details to get started' : 'Sign in to your Connect & Grow account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete={mode === 'signup' ? 'off' : 'on'}>
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block mb-1.5 text-[#1B2B4B]" style={{ fontSize: '13px' }}>Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      autoComplete="off"
                      placeholder="Alexandru Petrescu"
                      value={fields.fullName.value}
                      onChange={e => updateField('fullName', e.target.value)}
                      className={getFieldClass(fields.fullName)}
                    />
                    {fields.fullName.touched && !fields.fullName.error && (
                      <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {fields.fullName.touched && fields.fullName.error && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span className="text-red-500" style={{ fontSize: '12px' }}>{fields.fullName.error}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block mb-1.5 text-[#1B2B4B]" style={{ fontSize: '13px' }}>Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete={mode === 'signup' ? 'off' : 'email'}
                  placeholder="alex@email.com"
                  value={fields.email.value}
                  onChange={e => updateField('email', e.target.value)}
                  className={getFieldClass(fields.email)}
                />
                {fields.email.touched && !fields.email.error && (
                  <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {fields.email.touched && fields.email.error && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <span className="text-red-500" style={{ fontSize: '12px' }}>{fields.email.error}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1.5 text-[#1B2B4B]" style={{ fontSize: '13px' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="Min. 8 characters, 1 uppercase"
                  value={fields.password.value}
                  onChange={e => updateField('password', e.target.value)}
                  className={`${getFieldClass(fields.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fields.password.touched && fields.password.error && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <span className="text-red-500" style={{ fontSize: '12px' }}>{fields.password.error}</span>
                </div>
              )}
              {fields.password.touched && !fields.password.error && fields.password.value && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle2 size={13} className="text-green-500" />
                  <span className="text-green-600" style={{ fontSize: '12px' }}>Strong password</span>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <>
                {/* Career */}
                <div>
                  <label className="block mb-1.5 text-[#1B2B4B]" style={{ fontSize: '13px' }}>Job / Career Field</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="career"
                      autoComplete="off"
                      placeholder="e.g. Software Engineer, Financial Analyst"
                      value={fields.career.value}
                      onChange={e => updateField('career', e.target.value)}
                      className={getFieldClass(fields.career)}
                    />
                    {fields.career.touched && !fields.career.error && (
                      <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {fields.career.touched && fields.career.error && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span className="text-red-500" style={{ fontSize: '12px' }}>{fields.career.error}</span>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-1.5 text-[#1B2B4B]" style={{ fontSize: '13px' }}>Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="off"
                      placeholder="+40 7XX XXX XXX"
                      value={fields.phone.value}
                      onChange={e => updateField('phone', e.target.value)}
                      className={getFieldClass(fields.phone)}
                    />
                    {fields.phone.touched && !fields.phone.error && (
                      <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {fields.phone.touched && fields.phone.error && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span className="text-red-500" style={{ fontSize: '12px' }}>{fields.phone.error}</span>
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div
                      onClick={() => setAllowOnline(!allowOnline)}
                      className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0 transition-all border-2 ${allowOnline ? 'border-[#FFD100]' : 'border-border'
                        }`}
                      style={{ background: allowOnline ? '#FFD100' : 'white' }}
                    >
                      {allowOnline && <CheckCircle2 size={12} className="text-[#1B2B4B]" />}
                    </div>
                    <span className="text-[13px] text-muted-foreground">Allow others to see me as online in the community</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <div
                      onClick={() => setAcceptTerms(!acceptTerms)}
                      className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0 transition-all border-2 ${acceptTerms ? 'border-[#FFD100]' : 'border-border'
                        }`}
                      style={{ background: acceptTerms ? '#FFD100' : 'white' }}
                    >
                      {acceptTerms && <CheckCircle2 size={12} className="text-[#1B2B4B]" />}
                    </div>
                    <span className="text-[13px] text-muted-foreground">
                      I agree to the{' '}
                      <span className="text-[#1B2B4B] font-semibold underline cursor-pointer">Terms of Service</span>
                      {' '}and{' '}
                      <span className="text-[#1B2B4B] font-semibold underline cursor-pointer">Privacy Policy</span>
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Submit */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoading || (mode === 'signup' && !acceptTerms)}
                className="w-full py-3.5 rounded-xl font-semibold text-[#1B2B4B] transition-all hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: '#FFD100', fontSize: '14px' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#1B2B4B]/30 border-t-[#1B2B4B] rounded-full animate-spin" />
                ) : (
                  mode === 'signup' ? 'Create Account' : 'Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/app/dashboard')}
                className="w-full py-3.5 rounded-xl font-semibold text-[#1B2B4B] border-2 border-[#1B2B4B]/20 hover:border-[#1B2B4B]/40 transition-all"
                style={{ fontSize: '14px' }}
              >
                Continue as Guest (Demo)
              </button>
            </div>

            <p className="text-center text-muted-foreground" style={{ fontSize: '13px' }}>
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="text-[#1B2B4B] font-semibold hover:underline">
                {mode === 'signup' ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
