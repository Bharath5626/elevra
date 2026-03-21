import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

/* ── Design tokens — matches the rest of the app ── */
const P      = '#7C3AED';
const P_D    = '#6D28D9';
const TEXT   = '#1E1B4B';
const MUTED  = '#6B7280';
const BORDER = '#E9E5F5';
const BG_ALT = '#F8F7FF';

const iconBox: React.CSSProperties = {
  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
  color: MUTED, pointerEvents: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: TEXT, marginBottom: 8,
};

const emptyForm = { email: '', password: '', full_name: '' };

export default function LoginPage() {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = searchParams.get('mode');
  const isLogin = mode !== 'register';

  useEffect(() => {
    if (!mode) {
      setSearchParams({ mode: 'signin' }, { replace: true });
    }
  }, [mode, setSearchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const setIsLogin = (val: boolean) => setSearchParams({ mode: val ? 'signin' : 'register' }, { replace: true });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setError('');
    setGoogleLoading(true);
    try {
      await googleLogin(tokenResponse.access_token);
      // navigation handled by isAuthenticated effect
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  useEffect(() => {
    setForm(emptyForm);
    setError('');
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.full_name);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = axiosErr.response?.data?.detail ?? axiosErr.message ?? 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '11px 0', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all .2s',
    background: active ? P : 'transparent',
    color: active ? '#fff' : MUTED,
    boxShadow: active ? '0 2px 8px rgba(124,58,237,.3)' : 'none',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '90px 20px 40px',
        background: '#F8F7FF',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        {/* Card */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderTop: `3px solid ${P}`,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,.06)',
            padding: '36px 32px',
          }}
        >
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: TEXT, textAlign: 'center', marginBottom: 6 }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          {isLogin && (
            <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 28 }}>
              Sign in to continue your journey
            </p>
          )}

          {/* ── Google button — top, most visible ── */}
          <button
            onClick={() => triggerGoogle()}
            disabled={googleLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', marginBottom: 20, padding: '12px 0',
              background: googleLoading ? BG_ALT : '#fff',
              border: `1px solid ${BORDER}`,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, color: TEXT,
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => { if (!googleLoading) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#4285F4'; (e.currentTarget as HTMLButtonElement).style.background = '#F8F7FF'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
          >
            {googleLoading ? (
              <Loader2 className="animate-spin" size={18} style={{ color: MUTED }} />
            ) : (
              /* Google logo SVG */
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
            )}
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* ── Divider ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 500, whiteSpace: 'nowrap' }}>or use email</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          {/* Toggle */}
          <div
            style={{
              display: 'flex',
              background: BG_ALT,
              padding: 4, marginBottom: 24,
              border: `1px solid ${BORDER}`,
            }}
          >
            <button onClick={() => setIsLogin(true)} style={toggleBtn(isLogin)}>
              Sign In
            </button>
            <button onClick={() => setIsLogin(false)} style={toggleBtn(!isLogin)}>
              Register
            </button>
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(239,68,68,.08)',
                  border: '1px solid rgba(239,68,68,.25)',
                  color: '#ef4444',
                  padding: '12px 16px',
                  fontSize: 13, marginBottom: 20,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Full Name (register only) */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={17} style={iconBox} />
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Your full name"
                      className="input"
                      style={{ paddingLeft: 42 }}
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={iconBox} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="input"
                  style={{ paddingLeft: 42 }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={iconBox} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: MUTED,
                  }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '12px 0',
                border: 'none',
                background: loading ? '#C4B5FD' : P,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background .2s',
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
