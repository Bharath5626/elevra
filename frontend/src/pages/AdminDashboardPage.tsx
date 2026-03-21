import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, FileText, Mic, Briefcase, Map, BarChart2,
  LogOut, RefreshCw, Search, ChevronLeft, ChevronRight,
  X, AlertCircle, Zap, TrendingUp,
} from 'lucide-react';
import { adminAPI } from '../services/api';
import type { AdminStats, AdminUserRow, AdminUserDetail } from '../types';

const P      = '#7C3AED';
const P_BG   = '#F5F3FF';
const BORDER = '#E9E5F5';
const TEXT   = '#1E1B4B';
const MUTED  = '#64748B';
const BG     = '#F5F3FF';

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}
function StatCard({ label, value, sub, icon, accent = P }: StatCardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`,
      boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      padding: '24px 26px',
      display: 'flex', alignItems: 'flex-start', gap: 18,
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: `${accent}12`, border: `1px solid ${accent}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 6px' }}>
          {label}
        </p>
        <p style={{ fontSize: 30, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 12, color: MUTED, margin: '6px 0 0' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini row stat ─────────────────────────────────────────────────────────────
function MiniStat({ label, value, color = TEXT }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700,
      background: `${color}12`, color,
      border: `1px solid ${color}25`,
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats]             = useState<AdminStats | null>(null);
  const [statsError, setStatsError]   = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastTick, setLastTick]       = useState<Date | null>(null);

  const [users, setUsers]             = useState<AdminUserRow[]>([]);
  const [usersTotal, setUsersTotal]   = useState(0);
  const [usersPage, setUsersPage]     = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [detail, setDetail]           = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adminAPI.isLoggedIn()) navigate('/admin/login', { replace: true });
  }, [navigate]);

  // ── Fetch stats once on mount ───────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const data = await adminAPI.getStats();
      setStats(data);
      setLastTick(new Date());
    } catch {
      setStatsError('Failed to fetch stats.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── User list ───────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (page: number, q: string) => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.getUsers(page, q);
      setUsers(res.users);
      setUsersTotal(res.total);
    } catch { /* silent */ } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(usersPage, search); }, [usersPage, search, loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsersPage(1);
    setSearch(searchInput);
  };

  // ── User detail drawer ──────────────────────────────────────────────────────
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await adminAPI.getUserDetail(id);
      setDetail(d);
    } catch { /* silent */ } finally {
      setDetailLoading(false);
    }
  };

  const handleLogout = () => {
    adminAPI.logout();
    navigate('/admin/login', { replace: true });
  };

  const totalPages = Math.ceil(usersTotal / 20);

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1E1B4B',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          padding: '0 40px',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="#A78BFA" />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                Elevra <span style={{ color: '#A78BFA' }}>Admin</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastTick && (
              <span style={{ fontSize: 12, color: '#475569' }}>
                Updated {lastTick.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchStats}
              disabled={statsLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#94a3b8', fontSize: 13, fontWeight: 500,
                cursor: statsLoading ? 'default' : 'pointer',
                opacity: statsLoading ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px 80px' }}>

        {/* ── Page heading ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT, margin: '0 0 6px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            Platform-wide usage overview and user management.
          </p>
        </div>

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        {statsError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#ef4444',
          }}>
            <AlertCircle size={15} /> {statsError}
          </div>
        )}

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
          Platform Overview
        </p>

        {/* ── Stat cards ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
          <StatCard
            label="Total Users"
            value={stats?.users.total ?? '–'}
            sub={stats ? `+${stats.users.last_24h} today · +${stats.users.last_7d} this week` : undefined}
            icon={<Users size={22} color={P} />}
          />
          <StatCard
            label="Resumes Analysed"
            value={stats?.resume.total ?? '–'}
            sub={stats ? `+${stats.resume.last_24h} today · avg ATS ${stats.resume.avg_ats_score}` : undefined}
            icon={<FileText size={22} color="#8b5cf6" />}
            accent="#8b5cf6"
          />
          <StatCard
            label="Mock Interviews"
            value={stats?.interview.total ?? '–'}
            sub={stats ? `${stats.interview.completed} completed · +${stats.interview.last_24h} today` : undefined}
            icon={<Mic size={22} color="#f59e0b" />}
            accent="#f59e0b"
          />
          <StatCard
            label="Job Applications"
            value={stats?.job_applications.total ?? '–'}
            sub={stats ? `+${stats.job_applications.last_7d} this week` : undefined}
            icon={<Briefcase size={22} color="#10b981" />}
            accent="#10b981"
          />
          <StatCard
            label="Learning Roadmaps"
            value={stats?.roadmap.total ?? '–'}
            sub={stats ? `+${stats.roadmap.last_7d} this week` : undefined}
            icon={<Map size={22} color="#ec4899" />}
            accent="#ec4899"
          />
          <StatCard
            label="JD Analyses"
            value={stats?.jd_analysis.total ?? '–'}
            sub={stats ? `+${stats.jd_analysis.last_24h} today` : undefined}
            icon={<Zap size={22} color="#06b6d4" />}
            accent="#06b6d4"
          />
          <StatCard
            label="CRI Assessments"
            value={stats?.cri.total ?? '–'}
            sub={stats ? `avg score ${stats.cri.avg_score}` : undefined}
            icon={<TrendingUp size={22} color="#f97316" />}
            accent="#f97316"
          />
          <StatCard
            label="Profiles Filled"
            value={stats?.profiles.total ?? '–'}
            sub={stats ? `of ${stats.users.total} users` : undefined}
            icon={<BarChart2 size={22} color={P} />}
          />
        </div>

        {/* ── Growth detail panels ──────────────────────────────────────────── */}
        {stats && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
              Growth Breakdown
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 48 }}>
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, padding: '24px 26px', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} color={P} /> User Growth
                </p>
                <MiniStat label="Today"      value={`+${stats.users.last_24h}`}  color="#7C3AED" />
                <MiniStat label="This week"  value={`+${stats.users.last_7d}`}   color="#7C3AED" />
                <MiniStat label="This month" value={`+${stats.users.last_30d}`}  color="#7C3AED" />
                <MiniStat label="All time"   value={stats.users.total} />
              </div>
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, padding: '24px 26px', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={15} color="#8b5cf6" /> Resume Stats
                </p>
                <MiniStat label="Today"         value={`+${stats.resume.last_24h}`} color="#8b5cf6" />
                <MiniStat label="This week"     value={`+${stats.resume.last_7d}`}  color="#8b5cf6" />
                <MiniStat label="Avg ATS Score" value={`${stats.resume.avg_ats_score}/100`} color={stats.resume.avg_ats_score >= 70 ? '#22c55e' : '#f59e0b'} />
                <MiniStat label="All time"      value={stats.resume.total} />
              </div>
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, padding: '24px 26px', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mic size={15} color="#f59e0b" /> Interview Stats
                </p>
                <MiniStat label="Today"     value={`+${stats.interview.last_24h}`} color="#f59e0b" />
                <MiniStat label="This week" value={`+${stats.interview.last_7d}`}  color="#f59e0b" />
                <MiniStat label="Completed" value={stats.interview.completed}       color="#22c55e" />
                <MiniStat label="All time"  value={stats.interview.total} />
              </div>
            </div>
          </>
        )}

        {/* ── Users section ─────────────────────────────────────────────────── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
          User Management
        </p>
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>

          {/* Table toolbar */}
          <div style={{
            padding: '20px 28px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 2px', fontFamily: 'Poppins, sans-serif' }}>
                Users
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{usersTotal} total accounts</p>
            </div>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by name or email…"
                  style={{
                    padding: '9px 14px 9px 36px', borderRadius: 9,
                    border: `1.5px solid ${BORDER}`, fontSize: 13, color: TEXT,
                    width: 260, outline: 'none', background: BG,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = P; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.background = BG; }}
                />
              </div>
              <button type="submit" style={{
                padding: '9px 18px', borderRadius: 9, border: 'none',
                background: P, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Search</button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setUsersPage(1); }} style={{
                  padding: '9px 14px', borderRadius: 9, border: `1.5px solid ${BORDER}`,
                  background: '#fff', color: MUTED, fontSize: 13, cursor: 'pointer',
                }}>Clear</button>
              )}
            </form>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F7FF', borderBottom: `1px solid ${BORDER}` }}>
                  {['Name', 'Email', 'Joined', 'Resumes', 'Interviews', 'JD', 'Apps', 'Roadmaps', 'Role', ''].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontWeight: 600, color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={10} style={{ padding: '56px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: '56px 0', textAlign: 'center', color: MUTED, fontSize: 14 }}>No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F7FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '15px 20px', fontWeight: 600, color: TEXT, whiteSpace: 'nowrap' }}>{u.name}</td>
                    <td style={{ padding: '15px 20px', color: MUTED }}>{u.email}</td>
                    <td style={{ padding: '15px 20px', color: MUTED, whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}><Badge color="#8b5cf6">{u.resume_count}</Badge></td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}><Badge color="#f59e0b">{u.interview_count}</Badge></td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}><Badge color="#06b6d4">{u.jd_count}</Badge></td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}><Badge color="#10b981">{u.application_count}</Badge></td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}><Badge color="#ec4899">{u.roadmap_count}</Badge></td>
                    <td style={{ padding: '15px 20px' }}>
                      {u.is_admin
                        ? <Badge color="#dc2626">Admin</Badge>
                        : u.is_blocked
                          ? <Badge color="#f97316">Blocked</Badge>
                          : <Badge color="#64748b">User</Badge>
                      }
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <button
                        onClick={() => openDetail(u.id)}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          border: `1.5px solid ${BORDER}`,
                          background: '#fff', color: P, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = P; (e.currentTarget as HTMLButtonElement).style.background = P_BG; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '16px 28px', borderTop: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: MUTED }}>
                Page {usersPage} of {totalPages} &nbsp;·&nbsp; {usersTotal} users
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage(p => p - 1)}
                  style={{
                    padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`,
                    background: '#fff', color: usersPage <= 1 ? '#D4D0E8' : TEXT,
                    cursor: usersPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
                  }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={usersPage >= totalPages}
                  onClick={() => setUsersPage(p => p + 1)}
                  style={{
                    padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`,
                    background: '#fff', color: usersPage >= totalPages ? '#D4D0E8' : TEXT,
                    cursor: usersPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── User detail drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(detailLoading || detail) && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetail(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
            />
            <motion.div
              initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
                width: 520, background: '#fff',
                boxShadow: '-12px 0 48px rgba(15,23,42,0.12)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Drawer header */}
              <div style={{
                padding: '22px 28px', borderBottom: `1px solid ${BORDER}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#FAFBFC',
              }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: 'Poppins, sans-serif' }}>User Detail</span>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED }}>Activity and profile overview</p>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', padding: 6, borderRadius: 8 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px' }}>
                {detailLoading && !detail ? (
                  <div style={{ textAlign: 'center', paddingTop: 80, color: MUTED, fontSize: 14 }}>Loading…</div>
                ) : detail && (
                  <>
                    {/* User info */}
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: 16,
                          background: P_BG, border: `1.5px solid ${P}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 22, color: P, fontFamily: 'Poppins, sans-serif',
                          flexShrink: 0,
                        }}>
                          {detail.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: TEXT, fontSize: 16, lineHeight: 1.2 }}>{detail.name}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>{detail.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {detail.is_admin && <Badge color="#dc2626">Admin</Badge>}
                        {detail.is_blocked && <Badge color="#f97316">Blocked</Badge>}
                        <Badge color="#64748b">Joined {new Date(detail.created_at).toLocaleDateString()}</Badge>
                        {detail.cri && <Badge color="#f97316">CRI {detail.cri.cri_total}</Badge>}
                      </div>
                    </div>

                    {/* Activity counts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
                      {[
                        { label: 'Resumes',     value: detail.resume_count,      color: '#8b5cf6' },
                        { label: 'Interviews',  value: detail.interview_count,   color: '#f59e0b' },
                        { label: 'JD Analyses', value: detail.jd_count,          color: '#06b6d4' },
                        { label: 'Applications',value: detail.application_count, color: '#10b981' },
                        { label: 'Roadmaps',    value: detail.roadmap_count,     color: '#ec4899' },
                      ].map(item => (
                        <div key={item.label} style={{
                          background: BG, borderRadius: 12, border: `1px solid ${BORDER}`,
                          padding: '14px 16px',
                        }}>
                          <p style={{ margin: 0, fontSize: 10, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                          <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800, color: item.color, lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recent resumes */}
                    {detail.resumes.length > 0 && (
                      <Section title="Recent Resumes">
                        {detail.resumes.slice(0, 5).map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                            <span style={{ fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{r.filename || 'resume.pdf'}</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                              <Badge color={r.ats_score >= 70 ? '#22c55e' : r.ats_score >= 50 ? '#f59e0b' : '#ef4444'}>
                                {r.ats_score} ATS
                              </Badge>
                              <span style={{ fontSize: 11, color: MUTED }}>{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </Section>
                    )}

                    {/* Recent interviews */}
                    {detail.interview_sessions.length > 0 && (
                      <Section title="Recent Interviews">
                        {detail.interview_sessions.slice(0, 5).map(s => (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                            <span style={{ fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{s.job_role || 'Interview'}</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                              <Badge color={s.status === 'completed' ? '#22c55e' : '#f59e0b'}>
                                {s.status}
                              </Badge>
                              {s.overall_score > 0 && <Badge color="#7C3AED">{s.overall_score}%</Badge>}
                            </div>
                          </div>
                        ))}
                      </Section>
                    )}

                    {/* Recent applications */}
                    {detail.job_applications.length > 0 && (
                      <Section title="Job Applications">
                        {detail.job_applications.slice(0, 5).map((a, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                            <div style={{ overflow: 'hidden' }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{a.job_title}</p>
                              <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{a.company}</p>
                            </div>
                            <Badge color={a.status === 'offer' ? '#22c55e' : a.status === 'interviewing' ? '#f59e0b' : a.status === 'rejected' ? '#ef4444' : '#7C3AED'}>
                              {a.status}
                            </Badge>
                          </div>
                        ))}
                      </Section>
                    )}

                    {/* CRI */}
                    {detail.cri && (
                      <Section title="Career Readiness Index">
                        <MiniStat label="CRI Total"   value={detail.cri.cri_total} color="#f97316" />
                        <MiniStat label="Percentile"  value={`Top ${Math.round(100 - detail.cri.percentile)}%`} color="#7C3AED" />
                        <MiniStat label="Assessed on" value={new Date(detail.cri.recorded_at).toLocaleDateString()} />
                      </Section>
                    )}

                    {/* Actions: promote / block / delete */}
                    <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Promote / demote */}
                      <button
                        onClick={async () => {
                          const updated = await adminAPI.promoteUser(detail.id, !detail.is_admin);
                          setDetail(d => d ? { ...d, is_admin: updated.is_admin } : d);
                          setUsers(us => us.map(u => u.id === updated.id ? { ...u, is_admin: updated.is_admin } : u));
                        }}
                        style={{
                          width: '100%', padding: '11px 0', borderRadius: 10,
                          border: `1.5px solid ${detail.is_admin ? 'rgba(239,68,68,.25)' : P + '40'}`,
                          background: detail.is_admin ? 'rgba(239,68,68,.06)' : P_BG,
                          color: detail.is_admin ? '#ef4444' : P,
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        } as React.CSSProperties}
                      >
                        {detail.is_admin ? '✕ Remove Admin' : '↑ Promote to Admin'}
                      </button>

                      {/* Block / unblock — disabled for admins */}
                      {!detail.is_admin && (
                        <button
                          onClick={async () => {
                            const updated = await adminAPI.blockUser(detail.id, !detail.is_blocked);
                            setDetail(d => d ? { ...d, is_blocked: updated.is_blocked } : d);
                            setUsers(us => us.map(u => u.id === updated.id ? { ...u, is_blocked: updated.is_blocked } : u));
                          }}
                          style={{
                            width: '100%', padding: '11px 0', borderRadius: 10,
                            border: `1.5px solid ${detail.is_blocked ? 'rgba(34,197,94,.3)' : 'rgba(249,115,22,.3)'}`,
                            background: detail.is_blocked ? 'rgba(34,197,94,.07)' : 'rgba(249,115,22,.07)',
                            color: detail.is_blocked ? '#16a34a' : '#ea580c',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          } as React.CSSProperties}
                        >
                          {detail.is_blocked ? '✓ Unblock Account' : '⛔ Block Account'}
                        </button>
                      )}

                      {/* Delete — disabled for admins */}
                      {!detail.is_admin && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Permanently delete ${detail.name}'s account and all their data? This cannot be undone.`)) return;
                            await adminAPI.deleteUser(detail.id);
                            setDetail(null);
                            setUsers(us => us.filter(u => u.id !== detail.id));
                            setUsersTotal(t => t - 1);
                          }}
                          style={{
                            width: '100%', padding: '11px 0', borderRadius: 10,
                            border: '1.5px solid rgba(239,68,68,.3)',
                            background: 'rgba(239,68,68,.06)',
                            color: '#dc2626',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          } as React.CSSProperties}
                        >
                          🗑 Delete Account
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 10px' }}>
        {title}
      </p>
      {children}
    </div>
  );
}
