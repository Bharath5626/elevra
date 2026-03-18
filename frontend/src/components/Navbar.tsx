import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/resume', label: 'Resume' },
  { path: '/interview/setup', label: 'Interview' },
  { path: '/jobs', label: 'Jobs' },
  { path: '/history', label: 'History' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wide, setWide] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWide(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid var(--color-surface-300)',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>E</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-secondary-500)' }}>
            Elev<span style={{ color: 'var(--color-primary-400)' }}>ra</span>
          </span>
        </Link>

        {/* Desktop Nav Links (authenticated only) */}
        <nav style={{ display: wide >= 1024 ? 'flex' : 'none', alignItems: 'center', gap: 4 }}>
          {user &&
            navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    position: 'relative',
                    padding: '8px 16px', borderRadius: 50,
                    fontSize: 14, fontWeight: 500,
                    color: isActive ? '#FF6575' : '#685f78',
                    textDecoration: 'none',
                    transition: 'color .2s',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute', bottom: 0, left: 8, right: 8,
                        height: 2, borderRadius: 2,
                        background: 'var(--color-primary-400)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Right side: Auth buttons (always visible) + Mobile menu toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              {/* User badge - desktop only */}
              <div
                style={{
                  display: wide >= 768 ? 'flex' : 'none',
                  alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 50,
                  border: '1px solid var(--color-surface-300)',
                  fontSize: 14,
                }}
              >
                <User size={16} style={{ color: 'var(--color-accent-700)' }} />
                <span style={{ color: 'var(--color-secondary-500)', fontWeight: 500 }}>
                  {user.full_name || user.email}
                </span>
              </div>
              {/* Logout button */}
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 50,
                  fontSize: 14, fontWeight: 500, border: 'none',
                  background: 'transparent',
                  color: 'var(--color-surface-600)',
                  cursor: 'pointer', transition: 'color .2s',
                }}
              >
                <LogOut size={15} />
                <span style={{ display: wide >= 640 ? 'inline' : 'none' }}>Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Sign In - always visible */}
              <Link
                to="/login?mode=signin"
                style={{
                  padding: '8px 20px', borderRadius: 50,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  border: '2px solid var(--color-surface-300)',
                  color: 'var(--color-surface-600)',
                  background: 'var(--color-surface-100)',
                  transition: 'all .2s',
                }}
              >
                Sign In
              </Link>
              {/* Register - always visible */}
              <Link
                to="/login?mode=register"
                style={{
                  padding: '8px 20px', borderRadius: 50,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  border: '2px solid transparent',
                  color: '#fff',
                  background: 'var(--color-primary-400)',
                  transition: 'all .2s',
                }}
              >
                Register
              </Link>
            </>
          )}

          {/* Mobile menu toggle (authenticated users only — need to access nav links) */}
          {user && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: wide < 1024 ? 'flex' : 'none',
                alignItems: 'center', justifyContent: 'center',
                padding: 8, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: 'var(--color-secondary-500)',
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu (nav links for authenticated users) */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: '#fff',
              borderTop: '1px solid var(--color-surface-300)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '10px 16px', borderRadius: 10,
                    fontSize: 15, fontWeight: 500, textDecoration: 'none',
                    color: location.pathname.startsWith(link.path) ? '#FF6575' : 'var(--color-surface-600)',
                    background: location.pathname.startsWith(link.path) ? 'var(--color-primary-50)' : 'transparent',
                    transition: 'all .2s',
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--color-surface-300)', paddingTop: 12, marginTop: 8 }}>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 16px', borderRadius: 10,
                    fontSize: 15, fontWeight: 500, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-surface-600)',
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
