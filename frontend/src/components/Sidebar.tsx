import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInterviewGuard } from '../context/InterviewGuardContext';
import {
  LayoutDashboard, FileText, Video, BookOpen,
  Briefcase, Clock, Target, X, Menu, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const P = '#2563EB';

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
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
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
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 6,
              flexShrink: 0, transition: 'color 0.13s ease, background 0.13s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
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
              fontSize: 16, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.4px', fontFamily: 'Poppins, sans-serif',
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
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
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
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            padding: '0 12px', margin: '0 0 10px', fontFamily: 'monospace',
          }}>
            Main
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
                  gap: slim ? 0 : 10,
                  padding: slim ? '10px 0' : '9px 12px',
                  marginBottom: 1,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? '#fff'
                    : isHov
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.5)',
                  background: isActive
                    ? 'rgba(255,255,255,0.12)'
                    : isHov
                    ? 'rgba(255,255,255,0.07)'
                    : 'transparent',
                  borderLeft: slim ? 'none' : `2px solid ${isActive ? P : 'transparent'}`,
                  borderRadius: 6,
                  transition: 'all 0.13s ease',
                  userSelect: 'none',
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!slim && <span>{label}</span>}
              </div>

              {/* Tooltip rendered inline — replaced by fixed portal below */}
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
          background: '#1F2937',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          padding: '5px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            position: 'absolute',
            left: -4, top: '50%',
            transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: '4px solid #1F2937',
          }} />
          {tooltip.label}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: slim ? '10px 0' : '10px 10px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
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
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: slim ? 'center' : 'flex-start',
            gap: 10,
            width: '100%',
            padding: slim ? '9px 0' : '9px 12px',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 13.5, fontWeight: 400,
            cursor: 'pointer', borderRadius: 6,
            transition: 'all 0.13s ease',
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!slim && <span>Logout</span>}
        </button>

        {!slim && (
          <p style={{
            fontSize: 11, color: 'rgba(255,255,255,0.18)',
            margin: '4px 0 0', letterSpacing: '0.02em', padding: '0 12px',
          }}>
            Career AI Studio &copy; {new Date().getFullYear()}
          </p>
        )}
      </div>
    </aside>
  );
}