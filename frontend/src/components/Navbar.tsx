import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const P      = '#2563EB';
const P_D    = '#1D4ED8';
const TEXT   = '#111827';
const MUTED  = '#6B7280';
const BORDER = '#E5E7EB';

const navLinks = [
  { path: '/dashboard',       label: 'Dashboard' },
  { path: '/resume',          label: 'Resume' },
  { path: '/roadmap',         label: 'Roadmap' },
  { path: '/interview/setup', label: 'Interview' },
  { path: '/jobs',            label: 'Jobs' },
  { path: '/history',         label: 'History' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [wide, setWide]             = useState(() => window.innerWidth);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [hoveredSignIn, setHoveredSignIn]   = useState(false);
  const [hoveredRegister, setHoveredRegister] = useState(false);
  const [hoveredLogout, setHoveredLogout]   = useState(false);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth);
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff',
      borderBottom: `1px solid ${scrolled ? BORDER : 'transparent'}`,
      boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,.06)' : 'none',
      transition: 'border-color .2s, box-shadow .2s',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 62,
      }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28,
            background: P,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, letterSpacing: '-0.5px' }}>E</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: '-0.4px', fontFamily: 'Poppins, sans-serif' }}>
            elevra
          </span>
        </Link>

        {/* ── Desktop Nav (authenticated) ── */}
        {user && wide >= 1024 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {navLinks.map(link => {
              const isActive = location.pathname.startsWith(link.path);
              const isHov = hoveredLink === link.path && !isActive;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onMouseEnter={() => setHoveredLink(link.path)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    position: 'relative',
                    padding: '6px 14px',
                    fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                    color: isActive ? TEXT : isHov ? TEXT : MUTED,
                    textDecoration: 'none',
                    transition: 'color .15s',
                    letterSpacing: '-0.1px',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      style={{
                        position: 'absolute', bottom: -1, left: 10, right: 10,
                        height: 2, background: P,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── Right Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {user ? (
            <>
              {/* User name chip — desktop */}
              {wide >= 768 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px 5px 6px',
                  border: `1px solid ${BORDER}`, background: '#F9FAFB',
                }}>
                  <div style={{
                    width: 22, height: 22,
                    background: P,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff',
                  }}>
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: TEXT, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.full_name || user.email}
                  </span>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                onMouseEnter={() => setHoveredLogout(true)}
                onMouseLeave={() => setHoveredLogout(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  fontSize: 13, fontWeight: 500, border: `1px solid ${BORDER}`,
                  background: hoveredLogout ? '#F9FAFB' : '#fff',
                  color: MUTED, cursor: 'pointer', transition: 'all .15s',
                }}
              >
                <LogOut size={14} />
                {wide >= 640 && <span>Logout</span>}
              </button>

              {/* Mobile toggle */}
              {wide < 1024 && (
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34,
                    border: `1px solid ${BORDER}`,
                    background: 'transparent', cursor: 'pointer', color: TEXT,
                  }}
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login?mode=signin"
                onMouseEnter={() => setHoveredSignIn(true)}
                onMouseLeave={() => setHoveredSignIn(false)}
                style={{
                  padding: '8px 18px',
                  fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
                  border: `1px solid ${BORDER}`,
                  color: hoveredSignIn ? TEXT : MUTED,
                  background: hoveredSignIn ? '#F9FAFB' : '#fff',
                  transition: 'all .15s',
                }}
              >
                Sign in
              </Link>
              <Link
                to="/login?mode=register"
                onMouseEnter={() => setHoveredRegister(true)}
                onMouseLeave={() => setHoveredRegister(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px',
                  fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                  background: hoveredRegister ? P_D : P,
                  color: '#fff',
                  border: `1px solid ${hoveredRegister ? P_D : P}`,
                  transition: 'background .15s, border-color .15s',
                }}
              >
                Get started <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              background: '#fff',
              borderTop: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column' }}>
              {navLinks.map(link => {
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      fontSize: 14, fontWeight: isActive ? 600 : 400,
                      textDecoration: 'none',
                      color: isActive ? P : TEXT,
                      borderLeft: `2px solid ${isActive ? P : 'transparent'}`,
                      background: isActive ? '#EFF6FF' : 'transparent',
                      transition: 'all .15s',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginTop: 8 }}>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 12px',
                    fontSize: 14, fontWeight: 400, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: MUTED,
                  }}
                >
                  <LogOut size={15} />
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