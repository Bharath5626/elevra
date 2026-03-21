import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInterviewGuard } from '../context/InterviewGuardContext';
import {
  LayoutDashboard, FileText, Video, BookOpen,
  Briefcase, Clock, Target, X, Menu, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ── Sidebar theme tokens ────────────────────── */
const SB_BG      = 'linear-gradient(180deg, #0F0B1E 0%, #1A1145 100%)';
const SB_BORDER  = 'rgba(139,92,246,.12)';
const SB_ACTIVE  = 'rgba(139,92,246,.18)';
const SB_HOVER   = 'rgba(139,92,246,.08)';
const SB_ACCENT  = '#A78BFA';         // violet-400 — luminous accent
const SB_TEXT    = 'rgba(255,255,255,.55)';
const SB_TEXT_ACT = '#fff';
const SB_PILL    = 'linear-gradient(135deg,#8B5CF6,#6366F1)';

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/resume',          label: 'Resume Analysis', icon: FileText },
  { path: '/interview/setup', label: 'Mock Interview',  icon: Video },
  { path: '/roadmap',         label: 'Roadmap',         icon: BookOpen },
  { path: '/jobs',            label: 'Find Jobs',       icon: Briefcase },
  { path: '/applications',    label: 'Applications',    icon: Target },
  { path: '/history',         label: 'History',         icon: Clock },
];

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, isMobile, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const guard = useInterviewGuard();
  const slim = isCollapsed && !isMobile;
  const W = slim ? 56 : 240;

  const handleNavClick = (to: string) => {
    const safe = guard.requestNavigation(to, () => navigate(to), () => {});
    if (safe) navigate(to);
  };

  const handleLogout = () => {
    const safe = guard.requestNavigation('/login', () => { logout(); navigate('/login'); }, () => {});
    if (safe) { logout(); navigate('/login'); }
  };

  return (
    <aside
      ref={sidebarRef}
      className="app-sidebar"
      style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        width: W,
        background: SB_BG,
        borderRight: `1px solid ${SB_BORDER}`,
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 12px',
        borderBottom: `1px solid ${SB_BORDER}`,
        flexShrink: 0,
        gap: 10,
      }}>
        {/* Hamburger toggle */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            title={slim ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'transparent', border: 'none',
              color: SB_TEXT, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 6,
              flexShrink: 0, transition: 'color 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.background = SB_HOVER;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = SB_TEXT;
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <Menu size={18} />
          </button>
        )}

        {!slim && (
          <>
            <img src="/logo.png" alt="Elevra" style={{ height: 28, width: 'auto', display: 'block', flexShrink: 0 }} />
            <span style={{
              flex: 1,
              fontSize: 17, fontWeight: 800, color: '#fff',
              letterSpacing: '-0.5px', fontFamily: 'Poppins, sans-serif',
            }}>
              Elevra
            </span>
          </>
        )}

        {isMobile && (
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', padding: 4,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav style={{
        flex: 1,
        padding: slim ? '16px 0' : '20px 10px',
        overflowY: 'auto',
      }}>
        {!slim && (
          <p style={{
            fontSize: 10, fontWeight: 700,
            color: 'rgba(167,139,250,.45)',
            letterSpacing: '0.14em', textTransform: 'uppercase' as const,
            padding: '0 12px', margin: '0 0 10px',
          }}>
            Navigation
          </p>
        )}

        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path !== '/dashboard' && location.pathname.startsWith(path));
          const isHov = tooltip?.label === label;

          return (
            <div
              key={path}
              style={{ position: 'relative' }}
              onMouseEnter={e => {
                if (slim) {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTooltip({ label, y: rect.top + rect.height / 2 });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleNavClick(path)}
                onKeyDown={e => e.key === 'Enter' && handleNavClick(path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: slim ? 'center' : 'flex-start',
                  gap: slim ? 0 : 11,
                  padding: slim ? '10px 0' : '9px 12px',
                  marginBottom: 2,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 450,
                  letterSpacing: '-0.01em',
                  color: isActive
                    ? SB_TEXT_ACT
                    : isHov
                    ? 'rgba(255,255,255,0.85)'
                    : SB_TEXT,
                  background: isActive
                    ? SB_ACTIVE
                    : isHov
                    ? SB_HOVER
                    : 'transparent',
                  borderRadius: 8,
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  position: 'relative',
                }}
              >
                {/* Active indicator pill */}
                {isActive && !slim && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, borderRadius: 0,
                    borderTopRightRadius: 3, borderBottomRightRadius: 3,
                    background: SB_PILL,
                    boxShadow: '0 0 8px rgba(139,92,246,.5)',
                  }} />
                )}
                <Icon size={16} style={{
                  flexShrink: 0,
                  color: isActive ? SB_ACCENT : isHov ? 'rgba(255,255,255,0.7)' : SB_TEXT,
                  transition: 'color 0.15s ease',
                }} />
                {!slim && <span>{label}</span>}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Fixed-position tooltip — escapes overflow clipping */}
      {slim && tooltip && (
        <div style={{
          position: 'fixed',
          left: W + 10,
          top: tooltip.y,
          transform: 'translateY(-50%)',
          background: '#1E1550',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          padding: '5px 12px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          border: `1px solid ${SB_BORDER}`,
        }}>
          <div style={{
            position: 'absolute',
            left: -4, top: '50%',
            transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: '4px solid #1E1550',
          }} />
          {tooltip.label}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: slim ? '12px 0' : '12px 10px',
        borderTop: `1px solid ${SB_BORDER}`,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#FCA5A5';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = SB_TEXT;
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: slim ? 'center' : 'flex-start',
            gap: 10,
            width: '100%',
            padding: slim ? '9px 0' : '9px 12px',
            background: 'transparent', border: 'none',
            color: SB_TEXT,
            fontSize: 13.5, fontWeight: 400,
            cursor: 'pointer', borderRadius: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!slim && <span>Logout</span>}
        </button>

        {!slim && (
          <p style={{
            fontSize: 10, color: 'rgba(167,139,250,.2)',
            margin: '4px 0 0', letterSpacing: '0.02em', padding: '0 12px',
          }}>
            Elevra &copy; {new Date().getFullYear()}
          </p>
        )}
      </div>
    </aside>
  );
}