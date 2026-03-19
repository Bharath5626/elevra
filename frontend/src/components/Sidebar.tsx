import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Video, BookOpen,
  Briefcase, Clock, Target, X, ChevronRight,
} from 'lucide-react';

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
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className="app-sidebar"
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
    >
      {/* ── Logo ── */}
      <div style={{
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
        gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #ff6575, #b4a7f5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>E</span>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
          Elev<span style={{ color: '#ff6575' }}>ra</span>
        </span>

        {/* Close button – mobile only */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, padding: '20px 12px' }}>
        <p style={{
          fontSize: 10, fontWeight: 700,
          color: 'rgba(255,255,255,0.38)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0 10px',
          marginBottom: 10,
          margin: '0 0 10px',
        }}>
          Main Menu
        </p>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path !== '/dashboard' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 10px 10px 11px',
                borderRadius: 8,
                marginBottom: 3,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ff6575' : 'rgba(255,255,255,0.72)',
                background: isActive ? 'rgba(255,101,117,0.14)' : 'transparent',
                borderLeft: isActive ? '3px solid #ff6575' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer branding ── */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'center' }}>
          Career AI Studio &copy; {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
