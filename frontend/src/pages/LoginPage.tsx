import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const iconBox: React.CSSProperties = {
  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
  color: 'var(--color-surface-500)', pointerEvents: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 14, fontWeight: 600,
  color: 'var(--color-secondary-500)', marginBottom: 8,
};

export default function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = searchParams.get('mode');
  const isLogin = mode !== 'register';

  // Default to signin if no mode param — must be in useEffect, not render
  useEffect(() => {
    if (!mode) {
      setSearchParams({ mode: 'signin' }, { replace: true });
    }
  }, [mode, setSearchParams]);

  // Redirect once isAuthenticated flushes after login/register
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const setIsLogin = (val: boolean) => setSearchParams({ mode: val ? 'signin' : 'register' }, { replace: true });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stable random values for register defaults (generated once per mount)
  const rnd = useRef(Math.floor(Math.random() * 9000) + 1000);
  const registerDefaults = useRef({
    email: `user${rnd.current}@example.com`,
    password: `Pass${rnd.current}!`,
    full_name: `Test User ${rnd.current}`,
  });

  const signinDefaults = { email: 'admin@gmail.com', password: 'admin', full_name: '' };

  const [form, setForm] = useState(signinDefaults);

  // Reset form to appropriate defaults when switching tabs
  useEffect(() => {
    if (isLogin) {
      setForm(signinDefaults);
    } else {
      setForm(registerDefaults.current);
    }
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
      // navigation handled by isAuthenticated useEffect above
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = axiosErr.response?.data?.detail ?? axiosErr.message ?? 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 0', borderRadius: 50, border: 'none',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    transition: 'all .25s ease',
    background: active ? 'var(--color-primary-400)' : 'transparent',
    color: active ? '#fff' : 'var(--color-surface-600)',
    boxShadow: active ? '0 4px 12px rgba(255,101,117,.25)' : 'none',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '90px 20px 40px',
        background: 'linear-gradient(135deg, #FEE0DE 0%, #E4F5FD 50%, #DDEDFF 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
          <div
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>E</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-secondary-500)' }}>
            Elev<span style={{ color: 'var(--color-primary-400)' }}>ra</span>
          </span>
        </Link>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid var(--color-surface-300)',
            boxShadow: '0 8px 32px rgba(0,0,0,.08)',
            padding: '40px 36px',
          }}
        >
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--color-secondary-500)', textAlign: 'center', marginBottom: 6 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--color-surface-600)', textAlign: 'center', marginBottom: 28 }}>
            {isLogin ? 'Sign in to continue your journey' : 'Join thousands of students leveling up'}
          </p>

          {/* Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--color-surface-100)',
              borderRadius: 50, padding: 4, marginBottom: 28,
              border: '1px solid var(--color-surface-300)',
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
                  padding: '12px 16px', borderRadius: 10,
                  fontSize: 14, marginBottom: 20,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                    color: 'var(--color-surface-500)',
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
                width: '100%', padding: '14px 0',
                borderRadius: 50, border: 'none',
                background: loading ? '#ffb3bb' : 'var(--color-primary-400)',
                color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background .2s',
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
