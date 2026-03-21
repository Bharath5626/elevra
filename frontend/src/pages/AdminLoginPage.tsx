import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminAPI.login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Login failed. Check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E1B4B 0%, #1A1145 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%', maxWidth: 400,
          background: '#fff', borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: '#F5F3FF', border: '1.5px solid #DDD6FE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <ShieldCheck size={26} color="#7C3AED" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B', margin: '0 0 4px', fontFamily: 'Poppins, sans-serif' }}>
          Admin Portal
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 28px' }}>
          Elevra — internal dashboard access only
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="admin@elevra.ai"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1.5px solid #E9E5F5', fontSize: 14, color: '#1E1B4B',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
              onBlur={e => { e.target.style.borderColor = '#E9E5F5'; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 42px 11px 14px', borderRadius: 10,
                  border: '1.5px solid #E9E5F5', fontSize: 14, color: '#1E1B4B',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                onBlur={e => { e.target.style.borderColor = '#E9E5F5'; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0,
                  display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 0', borderRadius: 10, border: 'none',
              background: loading ? '#C4B5FD' : '#7C3AED',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background .2s',
              marginTop: 4,
            }}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              : <><ShieldCheck size={16} /> Sign in as Admin</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}
