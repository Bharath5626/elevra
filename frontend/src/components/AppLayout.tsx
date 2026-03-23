import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InterviewGuardProvider } from '../context/InterviewGuardContext';
import Sidebar from './Sidebar';

const routeTitles: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/resume':          'Resume Analysis',
  '/interview/setup': 'Mock Interview',
  '/roadmap':         'Learning Roadmap',
  '/jobs':            'Find Jobs',
  '/applications':    'Applications',
  '/history':         'Interview History',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  for (const [path, title] of Object.entries(routeTitles)) {
    if (pathname.startsWith(path + '/')) return title;
  }
  if (pathname.includes('/session')) return 'Interview Session';
  if (pathname.includes('/report'))  return 'Interview Report';
  if (pathname.includes('/replay'))  return 'Session Replay';
  return 'Career AI Studio';
}

function AppLayoutInner() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const handleToggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7FF' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #E9E5F5', borderTopColor: '#7C3AED',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <Sidebar
        isOpen={isMobile ? sidebarOpen : true}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* ── Mobile backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 30,
            background: 'rgba(0,20,50,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Right column (topbar + content) ── */}
      <div className="app-main" style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 56 : 240), transition: 'margin-left 0.2s ease' }}>

        {/* Topbar */}
        <header className="app-topbar">
          {/* Hamburger – mobile only */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8,
                border: 'none', background: 'transparent',
              cursor: 'pointer', color: '#1E1B4B',
                flexShrink: 0,
              }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          {/* Page title */}
          <h1 style={{
            flex: 1,
            fontSize: 15, fontWeight: 700,
            color: '#1E1B4B', margin: 0,
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '-0.3px',
          }}>
            {pageTitle}
          </h1>

          {/* User chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 12px 5px 6px', borderRadius: 8,
              background: '#F5F3FF',
              border: '1px solid #E9E5F5',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <span className="topbar-username" style={{
                fontSize: 13, fontWeight: 600, color: '#1E1B4B',
                maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.full_name || user?.email}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid #E9E5F5',
              background: 'transparent', cursor: 'pointer',
              color: '#6B7280', transition: 'all 0.15s',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <InterviewGuardProvider>
      <AppLayoutInner />
    </InterviewGuardProvider>
  );
}
