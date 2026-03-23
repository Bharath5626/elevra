import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWindowWidth } from '../hooks/useWindowWidth';
import {
  FileSearch, Video, Play, BookOpen, Clock,
  TrendingUp, ArrowRight, Briefcase, Award, Target,
  Sparkles, ChevronRight, Zap, BarChart2,
} from 'lucide-react';
import ScoreCard from '../components/ScoreCard';
import { useAuth } from '../context/AuthContext';
import type { CRIScore, InterviewSession } from '../types';
import { criAPI, interviewAPI } from '../services/api';

/* ── premium design tokens ── */
const P      = '#7C3AED';   // violet-600
const P_D    = '#6D28D9';   // violet-700
const P_L    = '#8B5CF6';   // violet-500
const P_BG   = '#F5F3FF';   // violet-50
const P_BD   = '#DDD6FE';   // violet-200
const BG     = '#FFFFFF';
const BG_PAGE= '#F8F7FF';   // warm-tinted page
const TEXT   = '#1E1B4B';   // indigo-950
const TEXT2  = '#4338CA';   // indigo-700
const MUTED  = '#6B7280';
const BORDER = '#E9E5F5';   // soft violet-tinted border
const CARD_S = '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)';
const HERO_BG= 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4C1D95 100%)';

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
const scoreBg    = (s: number) => s >= 70 ? 'rgba(22,163,74,.08)' : s >= 50 ? 'rgba(217,119,6,.08)' : 'rgba(220,38,38,.08)';
const difficultyColor = (d: string) => d === 'Advanced' ? P : d === 'Intermediate' ? '#4338CA' : MUTED;

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
  const winW = useWindowWidth();
  const isMobile = winW < 768;
  const isSmall  = winW < 480;
  const [cri, setCri]           = useState<CRIScore>(mockCRI);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [hoveredAction, setHoveredAction]   = useState<string | null>(null);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [hoveredCTA, setHoveredCTA]         = useState(false);
  const [streakDays, setStreakDays]         = useState<Set<number>>(new Set());
  const [streakCount, setStreakCount]       = useState(0);

  useEffect(() => {
    criAPI.getCurrent().then(r => setCri(r)).catch(() => {});
    interviewAPI.getSessions().then(r => {
      setSessions(r.slice(0, 5));
      // Determine Monday of the current week (Mon = 0 … Sun = 6)
      const now = new Date();
      const monday = new Date(now);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const active = new Set<number>();
      r.forEach(s => {
        const d = new Date(s.created_at);
        const diff = Math.floor((d.getTime() - monday.getTime()) / 86400000);
        if (diff >= 0 && diff < 7) active.add(diff);
      });
      setStreakDays(active);
      const todayIdx = (now.getDay() + 6) % 7; // Mon=0, Sun=6
      let streak = 0;
      for (let i = todayIdx; i >= 0; i--) {
        if (active.has(i)) streak++; else break;
      }
      setStreakCount(streak);
    }).catch(() => {});
  }, []);

  const statCards = getStatCards(cri);

  return (
    <div style={{ padding: isMobile ? '20px 16px 48px' : '32px 32px 64px', maxWidth: 1320, margin: '0 auto', background: BG_PAGE, minHeight: '100vh' }}>

      {/* ══ Hero banner ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          marginBottom: 36,
          padding: isMobile ? '24px 20px' : '36px 40px',
          background: HERO_BG,
          border: 'none',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(30,27,75,.25)',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient orbs */}
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(139,92,246,.15)', filter: 'blur(80px)', top: -60, right: -40, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,.1)', filter: 'blur(60px)', bottom: -50, left: 60, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? 16 : 20 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(167,139,250,0.3)',
              padding: '4px 14px', marginBottom: 14, borderRadius: 20,
              fontSize: 11, fontWeight: 700, color: '#C4B5FD',
              letterSpacing: '.08em', textTransform: 'uppercase' as const,
            }}>
              <Sparkles size={11} />
              Career Intelligence
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              Welcome back,{' '}
              <span style={{ background: 'linear-gradient(135deg, #C4B5FD, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.full_name || 'User'}</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: 460 }}>
              Your career readiness score is <strong style={{ color: '#C4B5FD' }}>{cri.cri_total}%</strong> — keep pushing. Here's today's overview.
            </p>
          </div>

          <Link
            to="/interview/setup"
            onMouseEnter={() => setHoveredCTA(true)}
            onMouseLeave={() => setHoveredCTA(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: hoveredCTA ? '#fff' : 'rgba(255,255,255,.95)',
              color: '#1E1B4B', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              border: 'none',
              borderRadius: 10,
              transition: 'all .2s',
              flexShrink: 0,
              boxShadow: hoveredCTA ? '0 4px 20px rgba(139,92,246,.3)' : '0 2px 8px rgba(0,0,0,.1)',
              transform: hoveredCTA ? 'translateY(-1px)' : 'none',
              letterSpacing: '-0.01em',
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
              borderRadius: 14,
              padding: '24px 24px 22px',
              boxShadow: CARD_S,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${P_L}, ${P_D})`, opacity: 0.5 }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: P_BG, border: `1px solid ${P_BD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon size={18} style={{ color: P }} />
              </div>
              {card.trend !== undefined && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(22,163,74,.08)', borderRadius: 6,
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
                <span style={{ fontSize: 34, fontWeight: 800, color: TEXT, fontFamily: 'Poppins, sans-serif', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {card.value}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: MUTED }}>{card.unit}</span>
              </div>
            </div>

            {card.sparkline && (
              <svg width={80} height={32} style={{ marginBottom: 6, display: 'block' }}>
                <path d={sparkPath} fill="none" stroke={P_L} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ══ Main grid ══════════════════════════════════════ */}
      <div className="dash-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: isMobile ? 16 : 24 }}>

        {/* ── CRI Breakdown — col span 4 ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          style={{ gridColumn: isMobile ? 'span 12' : 'span 4' }}
        >
          <div style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            boxShadow: CARD_S,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: P_L, textTransform: 'uppercase' as const, letterSpacing: '.1em', margin: '0 0 3px' }}>Readiness Index</p>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>CRI Breakdown</h3>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
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
                    <div style={{ height: 6, background: P_BG, border: `1px solid ${BORDER}`, borderRadius: 3 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${P}, ${P_L})`, borderRadius: 3 }}
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
        <div style={{ gridColumn: isMobile ? 'span 12' : 'span 8', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            <div style={{
              background: BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              boxShadow: CARD_S,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: P_L, textTransform: 'uppercase' as const, letterSpacing: '.1em', margin: '0 0 3px' }}>Jump Right In</p>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>Quick Actions</h3>
                </div>
                <Zap size={16} style={{ color: '#F59E0B' }} />
              </div>

              <div className="dash-quick-actions" style={{ padding: isMobile ? '16px' : '24px 24px', display: 'grid', gridTemplateColumns: isSmall ? 'repeat(2, 1fr)' : isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? 10 : 14 }}>
                {quickActions.map((a) => (
                  <Link
                    key={a.label}
                    to={a.path}
                    onMouseEnter={() => setHoveredAction(a.label)}
                    onMouseLeave={() => setHoveredAction(null)}
                    style={{
                      padding: '20px 12px 16px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                      textDecoration: 'none', borderRadius: 12,
                      background: hoveredAction === a.label ? P_BG : BG_PAGE,
                      border: `1px solid ${hoveredAction === a.label ? P_BD : BORDER}`,
                      transition: 'all .2s',
                      transform: hoveredAction === a.label ? 'translateY(-2px)' : 'none',
                      boxShadow: hoveredAction === a.label ? '0 4px 16px rgba(124,58,237,.1)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 11,
                      background: hoveredAction === a.label ? `linear-gradient(135deg, ${P}, ${P_L})` : P_BG,
                      border: `1px solid ${P_BD}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                    }}>
                      <a.icon size={20} style={{ color: hoveredAction === a.label ? '#fff' : P, transition: 'color .2s' }} />
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
              borderRadius: 14,
              boxShadow: CARD_S,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: P_L, textTransform: 'uppercase' as const, letterSpacing: '.1em', margin: '0 0 3px' }}>Interview History</p>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>Recent Sessions</h3>
                </div>
                <Link
                  to="/history"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 8,
                    background: P_BG, color: P,
                    fontWeight: 600, fontSize: 12,
                    textDecoration: 'none',
                    border: `1px solid ${P_BD}`,
                    transition: 'all .15s',
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
                            background: BG_PAGE,
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
            background: HERO_BG,
            border: 'none',
            borderRadius: 16,
            padding: '28px 28px 24px',
            boxShadow: '0 8px 32px rgba(30,27,75,.2)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative orb */}
            <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,.12)', filter: 'blur(40px)', top: -20, right: -10, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} style={{ color: '#C4B5FD' }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(196,181,253,.5)', textTransform: 'uppercase' as const, letterSpacing: '.1em', margin: 0 }}>This Week</p>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', color: '#fff', fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Practice Streak</h4>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const done = streakDays.has(i);
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', minWidth: 0, borderRadius: 6,
                      background: done ? `linear-gradient(135deg, ${P}, ${P_L})` : 'rgba(255,255,255,.06)',
                      border: done ? '1px solid rgba(139,92,246,.4)' : '1px solid rgba(255,255,255,.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: done ? '0 2px 8px rgba(139,92,246,.3)' : 'none',
                    }}>
                      {done && <span style={{ fontSize: 11, color: '#fff' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: done ? '#C4B5FD' : 'rgba(255,255,255,.3)', letterSpacing: '.02em' }}>{day}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(196,181,253,.45)', margin: '14px 0 0' }}>
              {streakCount > 0 ? `${streakCount}-day streak — keep it going!` : 'No activity yet — start today!'}
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
            borderRadius: 16,
            padding: '28px 28px 24px',
            boxShadow: CARD_S,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: P_BG, border: `1px solid ${P_BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} style={{ color: P }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: P_L, textTransform: 'uppercase' as const, letterSpacing: '.1em', margin: 0 }}>Smart Insight</p>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', color: TEXT, fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Today's Tip</h4>
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