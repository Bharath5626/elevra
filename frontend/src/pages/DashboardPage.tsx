import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch, Video, Play, BookOpen, Clock,
  TrendingUp, ArrowRight, Briefcase, Award, Target,
  Sparkles, ChevronRight, Zap, BarChart2,
} from 'lucide-react';
import ScoreCard from '../components/ScoreCard';
import { useAuth } from '../context/AuthContext';
import type { CRIScore, InterviewSession } from '../types';
import { criAPI, interviewAPI } from '../services/api';

/* ── design tokens ── */
const P      = '#2563EB';
const P_D    = '#1D4ED8';
const P_BG   = '#EFF6FF';
const P_BD   = '#BFDBFE';
const BG     = '#FFFFFF';
const BG_ALT = '#F9FAFB';
const TEXT   = '#111827';
const TEXT2  = '#374151';
const MUTED  = '#6B7280';
const BORDER = '#E5E7EB';

const quickActions = [
  { icon: FileSearch, label: 'Resume Analysis', path: '/resume' },
  { icon: Video,      label: 'Mock Interview',   path: '/interview/setup' },
  { icon: Play,       label: 'Replay Sessions',  path: '/history' },
  { icon: BookOpen,   label: 'Learning Roadmap', path: '/roadmap' },
  { icon: Briefcase,  label: 'Find Jobs',        path: '/jobs' },
];

const mockCRI: CRIScore = {
  id: '1', user_id: '1', cri_total: 0,
  resume_score: 0, interview_score: 0, jd_fit_score: 0,
  improvement_delta: 0, percentile: 0,
  recorded_at: new Date().toISOString(),
};

const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';
const scoreBg    = (s: number) => s >= 70 ? 'rgba(22,163,74,.1)' : s >= 50 ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.1)';
const difficultyColor = (d: string) => d === 'Advanced' ? P : d === 'Intermediate' ? TEXT2 : MUTED;

/* ── mini sparkline data ── */
const sparkPoints = [52, 58, 61, 55, 65, 68, 72];
const sparkPath = (() => {
  const w = 80, h = 32, min = Math.min(...sparkPoints), max = Math.max(...sparkPoints);
  return sparkPoints.map((v, i) => {
    const x = (i / (sparkPoints.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
})();

const getStatCards = (cri: CRIScore) => [
  {
    label: 'Career Readiness',
    value: `${cri.cri_total ?? 0}`,
    unit: '%',
    icon: Award,
    trend: cri.improvement_delta,
    sub: `Top ${100 - (cri.percentile ?? 0)}% of candidates`,
    sparkline: true,
  },
  {
    label: 'Resume Score',
    value: `${cri.resume_score ?? 0}`,
    unit: '%',
    icon: FileSearch,
    sub: 'ATS optimised',
  },
  {
    label: 'Interview Score',
    value: `${cri.interview_score ?? 0}`,
    unit: '%',
    icon: Video,
    sub: 'Based on last session',
  },
  {
    label: 'JD Match',
    value: `${cri.jd_fit_score ?? 0}`,
    unit: '%',
    icon: Target,
    sub: 'Role compatibility',
  },
];

/* ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [cri, setCri]           = useState<CRIScore>(mockCRI);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [hoveredAction, setHoveredAction]   = useState<string | null>(null);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [hoveredCTA, setHoveredCTA]         = useState(false);

  useEffect(() => {
    criAPI.getCurrent().then(r => setCri(r)).catch(() => {});
    interviewAPI.getSessions().then(r => setSessions(r.slice(0, 5))).catch(() => {});
  }, []);

  const statCards = getStatCards(cri);

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1320, margin: '0 auto', background: BG_ALT, minHeight: '100vh' }}>

      {/* ══ Hero banner ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          marginBottom: 36,
          padding: '32px 36px',
          background: '#111827',
          border: 'none',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(27,43,30,.25)',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              padding: '4px 12px', marginBottom: 14, borderRadius: 20,
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              letterSpacing: '.08em', textTransform: 'uppercase' as const, fontFamily: 'monospace',
            }}>
              <Sparkles size={11} />
              Intelligent Career Studio
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.25 }}>
              Welcome back,{' '}
              <span style={{ color: '#93C5FD' }}>{user?.full_name || 'User'}</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 460 }}>
              Your career readiness score is <strong style={{ color: '#fff' }}>{cri.cri_total}%</strong> — keep pushing. Here's today's overview.
            </p>
          </div>

          <Link
            to="/interview/setup"
            onMouseEnter={() => setHoveredCTA(true)}
            onMouseLeave={() => setHoveredCTA(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px',
              background: '#fff',
              color: '#111827', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              border: 'none',
              borderRadius: 8,
              transition: 'opacity .18s',
              flexShrink: 0,
            }}
          >
            <Zap size={16} />
            Start Interview
          </Link>
        </div>
      </motion.div>

      {/* ══ Stat cards ══════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            style={{
              background: BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '24px 24px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: P_BG, border: `1px solid ${P_BD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon size={18} style={{ color: P }} />
              </div>
              {card.trend !== undefined && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(22,163,74,.1)', borderRadius: 6,
                  padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#16a34a',
                }}>
                  <TrendingUp size={11} />
                  +{card.trend}%
                </div>
              )}
            </div>

            <div style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 12, color: MUTED, fontWeight: 500, margin: '0 0 4px', letterSpacing: '.01em' }}>{card.label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: TEXT, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>
                  {card.value}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: MUTED }}>{card.unit}</span>
              </div>
            </div>

            {card.sparkline && (
              <svg width={80} height={32} style={{ marginBottom: 6, display: 'block' }}>
                <path d={sparkPath} fill="none" stroke={P} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ══ Main grid ══════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>

        {/* ── CRI Breakdown — col span 4 ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          style={{ gridColumn: 'span 4' }}
        >
          <div style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: P_D, textTransform: 'uppercase' as const, letterSpacing: '.08em', margin: '0 0 3px', fontFamily: 'monospace' }}>Readiness Index</p>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>CRI Breakdown</h3>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: P_BG, border: `1px solid ${P_BD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart2 size={15} style={{ color: P }} />
              </div>
            </div>

            <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative' }}>
                <ScoreCard
                  score={cri.cri_total ?? 0}
                  label="Overall CRI"
                  size={140}
                  strokeWidth={10}
                />
                {cri.improvement_delta > 0 && (
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(22,163,74,.1)',
                    padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#16a34a',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    <TrendingUp size={10} />
                    +{cri.improvement_delta}% this week
                  </div>
                )}
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Resume',    value: cri.resume_score },
                  { label: 'Interview', value: cri.interview_score },
                  { label: 'JD Match',  value: cri.jd_fit_score ?? 0 },
                ].map(bar => (
                  <div key={bar.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT2 }}>{bar.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{bar.value}%</span>
                    </div>
                    <div style={{ height: 6, background: BG_ALT, border: `1px solid ${BORDER}` }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
                        style={{ height: '100%', background: P }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                width: '100%', padding: '12px 16px',
                background: P_BG, border: `1px solid ${P_BD}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <TrendingUp size={14} style={{ color: P, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: TEXT2, margin: 0, lineHeight: 1.4 }}>
                  {cri.cri_total > 0
                    ? <>Your composite score is <strong style={{ color: TEXT }}>{cri.cri_total}%</strong>. Complete more sessions to improve it.</>
                    : <>Complete a resume analysis and mock interview to get your first CRI score.</>
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Right two columns ── */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            <div style={{
              background: BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: P_D, textTransform: 'uppercase' as const, letterSpacing: '.08em', margin: '0 0 3px', fontFamily: 'monospace' }}>Jump Right In</p>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>Quick Actions</h3>
                </div>
                <Zap size={16} style={{ color: '#F59E0B' }} />
              </div>

              <div style={{ padding: '24px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                {quickActions.map((a) => (
                  <Link
                    key={a.label}
                    to={a.path}
                    onMouseEnter={() => setHoveredAction(a.label)}
                    onMouseLeave={() => setHoveredAction(null)}
                    style={{
                      padding: '20px 12px 16px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                      textDecoration: 'none', borderRadius: 10,
                      background: hoveredAction === a.label ? P_BG : BG_ALT,
                      border: `1px solid ${hoveredAction === a.label ? P_BD : BORDER}`,
                      transition: 'all .18s',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: hoveredAction === a.label ? P : P_BG,
                      border: `1px solid ${P_BD}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background .18s',
                    }}>
                      <a.icon size={20} style={{ color: hoveredAction === a.label ? '#fff' : P, transition: 'color .18s' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TEXT, textAlign: 'center' as const, lineHeight: 1.4 }}>
                      {a.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <div style={{
              background: BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: P_D, textTransform: 'uppercase' as const, letterSpacing: '.08em', margin: '0 0 3px', fontFamily: 'monospace' }}>Interview History</p>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>Recent Sessions</h3>
                </div>
                <Link
                  to="/history"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 6,
                    background: P_BG, color: P,
                    fontWeight: 600, fontSize: 12,
                    textDecoration: 'none',
                    border: `1px solid ${P_BD}`,
                  }}
                >
                  View All <ArrowRight size={12} />
                </Link>
              </div>

              <div style={{ padding: '4px 0' }}>
                {sessions.length === 0 ? (
                  <div style={{ padding: '36px 22px', textAlign: 'center' as const }}>
                    <Video size={28} style={{ color: BORDER, marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: MUTED, margin: '0 0 6px' }}>No sessions yet</p>
                    <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>Complete your first mock interview to see results here.</p>
                    <Link
                      to="/interview/setup"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                        background: P, color: '#fff', textDecoration: 'none',
                        border: `1px solid ${P}`,
                      }}
                    >
                      Start Interview <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : (
                  sessions.map((s, idx) => (
                  <Link
                    key={s.id}
                    to={`/interview/${s.id}/report`}
                    onMouseEnter={() => setHoveredSession(s.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 24px', gap: 16,
                      textDecoration: 'none',
                      background: hoveredSession === s.id ? P_BG : 'transparent',
                      borderBottom: idx < sessions.length - 1 ? `1px solid ${BORDER}` : 'none',
                      borderLeft: `3px solid ${hoveredSession === s.id ? P : 'transparent'}`,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                      <div style={{
                          width: 40, height: 40, borderRadius: 10,
                        background: P_BG, border: `1px solid ${P_BD}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Video size={17} style={{ color: P }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, color: TEXT,
                          margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                        }}>
                          {s.job_role}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUTED }}>
                            <Clock size={10} />
                            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{
                            padding: '2px 8px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                            background: BG_ALT,
                            color: difficultyColor(s.difficulty),
                            border: `1px solid ${BORDER}`,
                          }}>
                            {s.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'baseline', gap: 2,
                        background: scoreBg(s.overall_score || 0), borderRadius: 6,
                        padding: '4px 10px',
                        border: `1px solid ${scoreColor(s.overall_score || 0)}50`,
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(s.overall_score || 0), lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>
                          {s.overall_score || '--'}
                        </span>
                        <span style={{ fontSize: 11, color: scoreColor(s.overall_score || 0), fontWeight: 600 }}>/100</span>
                      </div>
                      <ChevronRight size={15} style={{ color: MUTED, transition: 'transform .15s', transform: hoveredSession === s.id ? 'translateX(3px)' : 'none' }} />
                    </div>
                  </Link>
                  ))
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ══ Bottom row ══════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 20, marginTop: 20 }}>

        {/* Activity streak */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{
            background: '#111827',
            border: 'none',
            borderRadius: 12,
            padding: '28px 28px 24px',
            boxShadow: '0 4px 16px rgba(27,43,30,.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase' as const, letterSpacing: '.08em', margin: 0, fontFamily: 'monospace' }}>This Week</p>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', color: '#fff', fontSize: 15, fontWeight: 700, margin: 0 }}>Practice Streak</h4>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const done = i < 4;
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', minWidth: 0,
                      background: done ? P : 'rgba(255,255,255,.08)',
                      border: done ? `1px solid ${P_D}` : '1px solid rgba(255,255,255,.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done && <span style={{ fontSize: 11, color: '#fff' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: done ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)', letterSpacing: '.02em' }}>{day}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,.5)', margin: '14px 0 0' }}>
              4-day streak — keep it going!
            </p>
          </div>
        </motion.div>

        {/* Career Tips card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56 }}
        >
          <div style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: '28px 28px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: P_BG, border: `1px solid ${P_BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} style={{ color: P }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: P_D, textTransform: 'uppercase' as const, letterSpacing: '.08em', margin: 0, fontFamily: 'monospace' }}>Smart Insight</p>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', color: TEXT, fontSize: 15, fontWeight: 700, margin: 0 }}>Today's Tip</h4>
              </div>
            </div>

            {[
              { icon: '💡', text: 'Add quantifiable achievements to your resume — e.g. "Reduced load time by 40%".' },
              { icon: '🎯', text: 'Practice the STAR method for behavioural questions to structure answers clearly.' },
            ].map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8,
                background: i === 0 ? P_BG : 'transparent',
                marginBottom: i === 0 ? 8 : 0,
                border: i === 0 ? `1px solid ${P_BD}` : 'none',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.5 }}>{tip.icon}</span>
                <p style={{ fontSize: 12, color: TEXT2, margin: 0, lineHeight: 1.6 }}>{tip.text}</p>
              </div>
            ))}

            <Link
              to="/roadmap"
              style={{
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, color: P, textDecoration: 'none',
              }}
            >
              View full roadmap <ChevronRight size={13} />
            </Link>
          </div>
        </motion.div>

      </div>

    </div>
  );
}