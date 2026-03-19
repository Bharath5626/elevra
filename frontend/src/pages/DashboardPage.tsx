import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch, Video, Play, BookOpen, Clock,
  TrendingUp, ArrowRight, Briefcase, Award, Target,
  Sparkles, ChevronRight, Zap, BarChart2, Star,
} from 'lucide-react';
import ScoreCard from '../components/ScoreCard';
import { useAuth } from '../context/AuthContext';
import type { CRIScore, InterviewSession } from '../types';
import { criAPI, interviewAPI } from '../services/api';

const quickActions = [
  { icon: FileSearch, label: 'Resume Analysis', path: '/resume',          gradient: 'linear-gradient(135deg,#ff6575,#ff9a9e)', glow: '#ff657544' },
  { icon: Video,      label: 'Mock Interview',   path: '/interview/setup', gradient: 'linear-gradient(135deg,#b4a7f5,#7c6fec)', glow: '#b4a7f544' },
  { icon: Play,       label: 'Replay Sessions',  path: '/history',         gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', glow: '#22c55e44' },
  { icon: BookOpen,   label: 'Learning Roadmap', path: '/roadmap',         gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', glow: '#3b82f644' },
  { icon: Briefcase,  label: 'Find Jobs',        path: '/jobs',            gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', glow: '#f59e0b44' },
];

const mockCRI: CRIScore = {
  id: '1', user_id: '1', cri_total: 72,
  resume_score: 78, interview_score: 65, jd_fit_score: 74,
  improvement_delta: 5, percentile: 68,
  recorded_at: new Date().toISOString(),
};

const mockSessions: InterviewSession[] = [
  { id: '1', user_id: '1', job_role: 'Frontend Developer',  difficulty: 'Intermediate', status: 'completed', overall_score: 78, questions: [], created_at: new Date(Date.now() - 86400000).toISOString(),  resume_analysis_id: null },
  { id: '2', user_id: '1', job_role: 'Full Stack Engineer', difficulty: 'Advanced',     status: 'completed', overall_score: 65, questions: [], created_at: new Date(Date.now() - 172800000).toISOString(), resume_analysis_id: null },
  { id: '3', user_id: '1', job_role: 'Product Manager',    difficulty: 'Intermediate', status: 'completed', overall_score: 82, questions: [], created_at: new Date(Date.now() - 259200000).toISOString(), resume_analysis_id: null },
];

const scoreColor  = (s: number) => s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444';
const scoreBg     = (s: number) => s >= 70 ? 'rgba(34,197,94,.12)' : s >= 50 ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)';
const difficultyColor = (d: string) => d === 'Advanced' ? '#b4a7f5' : d === 'Intermediate' ? '#3b82f6' : '#22c55e';

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

/* ── stat cards data ── */
const getStatCards = (cri: CRIScore) => [
  {
    label: 'Career Readiness',
    value: `${cri.cri_total ?? 0}`,
    unit: '%',
    icon: Award,
    gradient: 'linear-gradient(135deg, #ff6575 0%, #ff9a9e 100%)',
    glow: '#ff657530',
    trend: cri.improvement_delta,
    sub: `Top ${100 - (cri.percentile ?? 0)}% of candidates`,
    sparkline: true,
  },
  {
    label: 'Resume Score',
    value: `${cri.resume_score ?? 0}`,
    unit: '%',
    icon: FileSearch,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    glow: '#3b82f630',
    sub: 'ATS optimised',
  },
  {
    label: 'Interview Score',
    value: `${cri.interview_score ?? 0}`,
    unit: '%',
    icon: Video,
    gradient: 'linear-gradient(135deg, #b4a7f5 0%, #7c6fec 100%)',
    glow: '#b4a7f530',
    sub: 'Based on last session',
  },
  {
    label: 'JD Match',
    value: `${cri.jd_fit_score ?? 0}`,
    unit: '%',
    icon: Target,
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    glow: '#22c55e30',
    sub: 'Role compatibility',
  },
];

/* ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [cri, setCri]         = useState<CRIScore>(mockCRI);
  const [sessions, setSessions] = useState<InterviewSession[]>(mockSessions);
  const [hoveredAction, setHoveredAction]   = useState<string | null>(null);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  useEffect(() => {
    criAPI.getCurrent().then(r => setCri(r)).catch(() => {});
    interviewAPI.getSessions().then(r => setSessions(r.length ? r.slice(0, 5) : mockSessions)).catch(() => {});
  }, []);

  const statCards = getStatCards(cri);

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1320, margin: '0 auto' }}>

      {/* ══ Hero banner ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 28,
          padding: '32px 36px',
          background: 'linear-gradient(135deg, #002058 0%, #1a0a4e 55%, #2d1066 100%)',
          boxShadow: '0 20px 60px rgba(0,32,88,.35), 0 4px 16px rgba(0,0,0,.2)',
        }}
      >
        {/* ambient orbs */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,167,245,.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,101,117,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -20, left: '55%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            {/* greeting pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 99, padding: '5px 14px',
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.85)',
              marginBottom: 14, backdropFilter: 'blur(10px)',
            }}>
              <Sparkles size={12} style={{ color: '#f59e0b' }} />
              AI-Powered Career Studio
            </div>

            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.25 }}>
              Welcome back,{' '}
              <span style={{ background: 'linear-gradient(90deg,#ff6575,#b4a7f5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {user?.full_name || 'User'}
              </span>{' '}👋
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', margin: 0, maxWidth: 460 }}>
              Your career readiness score is <strong style={{ color: '#fff' }}>{cri.cri_total}%</strong> — keep pushing. Here's today's overview.
            </p>
          </div>

          {/* CTA button */}
          <Link
            to="/interview/setup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg,#ff6575,#e63950)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(255,101,117,.5)',
              transition: 'transform .2s, box-shadow .2s',
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
        gap: 16,
        marginBottom: 28,
      }}>
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            style={{
              position: 'relative',
              background: '#fff',
              border: '1px solid rgba(0,0,0,.07)',
              borderRadius: 16,
              padding: '22px 22px 18px',
              boxShadow: `0 2px 12px rgba(0,0,0,.06), 0 0 0 0 ${card.glow}`,
              overflow: 'hidden',
              transition: 'box-shadow .25s, transform .25s',
            }}
            whileHover={{ y: -3, boxShadow: `0 8px 32px rgba(0,0,0,.1), 0 0 0 6px ${card.glow}` }}
          >
            {/* top-right gradient blob */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: card.glow, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: card.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${card.glow}`,
              }}>
                <card.icon size={20} style={{ color: '#fff' }} />
              </div>
              {card.trend !== undefined && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(34,197,94,.1)', borderRadius: 99,
                  padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#15803d',
                }}>
                  <TrendingUp size={11} />
                  +{card.trend}%
                </div>
              )}
            </div>

            <div style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 12, color: '#685f78', fontWeight: 500, margin: '0 0 4px', letterSpacing: '.01em' }}>{card.label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#002058', fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>
                  {card.value}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#9ca3af' }}>{card.unit}</span>
              </div>
            </div>

            {card.sparkline && (
              <svg width={80} height={32} style={{ marginBottom: 6, display: 'block' }}>
                <defs>
                  <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff6575" />
                    <stop offset="100%" stopColor="#b4a7f5" />
                  </linearGradient>
                </defs>
                <path d={sparkPath} fill="none" stroke="url(#spark-grad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ══ Main 3-column grid ══════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

        {/* ── CRI Breakdown — col span 4 ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          style={{ gridColumn: 'span 4' }}
        >
          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,.07)',
            borderRadius: 18,
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
            overflow: 'hidden',
          }}>
            {/* header */}
            <div style={{
              padding: '18px 22px 14px',
              borderBottom: '1px solid #f0f0f8',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 3px' }}>Readiness Index</p>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: '#002058', margin: 0 }}>CRI Breakdown</h3>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'linear-gradient(135deg,#ff6575,#b4a7f5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart2 size={15} style={{ color: '#fff' }} />
              </div>
            </div>

            <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
              {/* donut */}
              <div style={{ position: 'relative' }}>
                <ScoreCard
                  score={cri.cri_total ?? (cri as never as { overall_score?: number }).overall_score ?? 0}
                  label="Overall CRI"
                  size={140}
                  strokeWidth={10}
                />
                {cri.improvement_delta > 0 && (
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(34,197,94,.12)', borderRadius: 99,
                    padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#15803d',
                    whiteSpace: 'nowrap',
                  }}>
                    <TrendingUp size={10} />
                    +{cri.improvement_delta}% this week
                  </div>
                )}
              </div>

              {/* progress bars */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Resume',    value: cri.resume_score,    color: '#3b82f6' },
                  { label: 'Interview', value: cri.interview_score,  color: '#b4a7f5' },
                  { label: 'JD Match',  value: cri.jd_fit_score ?? 0, color: '#22c55e' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#685f78' }}>{bar.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#002058' }}>{bar.value}%</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 99, background: '#f0f0f8', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
                        style={{
                          height: '100%',
                          borderRadius: 99,
                          background: `linear-gradient(90deg, ${bar.color}cc, ${bar.color})`,
                          boxShadow: `0 0 8px ${bar.color}55`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* percentile chip */}
              <div style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg,rgba(0,32,88,.04),rgba(180,167,245,.08))',
                border: '1px solid rgba(180,167,245,.25)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Star size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#685f78', margin: 0, lineHeight: 1.4 }}>
                  You're in the <strong style={{ color: '#002058' }}>top {100 - (cri.percentile ?? 0)}%</strong> of all candidates on the platform.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Right two columns (Quick Actions + Recent Sessions) ── */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            <div style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,.07)',
              borderRadius: 18,
              boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 22px 14px',
                borderBottom: '1px solid #f0f0f8',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 3px' }}>Jump Right In</p>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: '#002058', margin: 0 }}>Quick Actions</h3>
                </div>
                <Zap size={16} style={{ color: '#f59e0b' }} />
              </div>

              <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {quickActions.map((a) => (
                  <Link
                    key={a.label}
                    to={a.path}
                    onMouseEnter={() => setHoveredAction(a.label)}
                    onMouseLeave={() => setHoveredAction(null)}
                    style={{
                      borderRadius: 14,
                      padding: '18px 10px 14px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                      textDecoration: 'none',
                      background: hoveredAction === a.label ? '#fafafe' : '#fff',
                      border: `1px solid ${hoveredAction === a.label ? 'rgba(180,167,245,.4)' : 'rgba(0,0,0,.07)'}`,
                      boxShadow: hoveredAction === a.label ? `0 4px 20px ${a.glow}` : 'none',
                      transition: 'all .2s',
                      transform: hoveredAction === a.label ? 'translateY(-3px)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: 13,
                      background: hoveredAction === a.label ? a.gradient : 'linear-gradient(135deg, #f7f7ff, #f0f0f8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: hoveredAction === a.label ? `0 4px 14px ${a.glow}` : 'none',
                      transition: 'all .2s',
                    }}>
                      <a.icon size={20} style={{ color: hoveredAction === a.label ? '#fff' : '#685f78', transition: 'color .2s' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#002058', textAlign: 'center', lineHeight: 1.4 }}>
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
              background: '#fff',
              border: '1px solid rgba(0,0,0,.07)',
              borderRadius: 18,
              boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              overflow: 'hidden',
            }}>
              {/* header */}
              <div style={{
                padding: '18px 22px 14px',
                borderBottom: '1px solid #f0f0f8',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 3px' }}>Interview History</p>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: '#002058', margin: 0 }}>Recent Sessions</h3>
                </div>
                <Link
                  to="/history"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 8,
                    background: 'rgba(255,101,117,.08)',
                    color: '#ff6575', fontWeight: 600, fontSize: 12,
                    textDecoration: 'none',
                    border: '1px solid rgba(255,101,117,.2)',
                    transition: 'background .2s',
                  }}
                >
                  View All <ArrowRight size={12} />
                </Link>
              </div>

              {/* session rows */}
              <div style={{ padding: '8px 0' }}>
                {sessions.map((s, idx) => (
                  <Link
                    key={s.id}
                    to={`/interview/${s.id}/report`}
                    onMouseEnter={() => setHoveredSession(s.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 22px', gap: 14,
                      textDecoration: 'none',
                      background: hoveredSession === s.id ? '#fafafe' : 'transparent',
                      borderBottom: idx < sessions.length - 1 ? '1px solid #f7f7ff' : 'none',
                      transition: 'background .15s',
                    }}
                  >
                    {/* left: avatar + meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(180,167,245,.2), rgba(57,44,125,.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        border: '1px solid rgba(180,167,245,.25)',
                      }}>
                        <Video size={18} style={{ color: '#392c7d' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, color: '#002058',
                          margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.job_role}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
                            <Clock size={10} />
                            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span style={{
                            padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: `${difficultyColor(s.difficulty)}18`,
                            color: difficultyColor(s.difficulty),
                            border: `1px solid ${difficultyColor(s.difficulty)}30`,
                          }}>
                            {s.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* right: score + arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                      }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'baseline', gap: 2,
                          background: scoreBg(s.overall_score || 0),
                          borderRadius: 8, padding: '4px 10px',
                        }}>
                          <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(s.overall_score || 0), lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>
                            {s.overall_score || '--'}
                          </span>
                          <span style={{ fontSize: 11, color: scoreColor(s.overall_score || 0), fontWeight: 600 }}>/100</span>
                        </div>
                      </div>
                      <ChevronRight size={15} style={{ color: '#d1d5db', transition: 'transform .2s', transform: hoveredSession === s.id ? 'translateX(3px)' : 'none' }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ══ Bottom row: Activity + Tips ══════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 20, marginTop: 20 }}>

        {/* Activity streak */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #002058 0%, #1a0a4e 100%)',
            borderRadius: 18,
            padding: '24px 24px 20px',
            boxShadow: '0 8px 32px rgba(0,32,88,.25)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,167,245,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>This Week</p>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', color: '#fff', fontSize: 15, fontWeight: 700, margin: 0 }}>Practice Streak</h4>
              </div>
            </div>
            {/* day chips */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const done = i < 4;
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', borderRadius: 8, minWidth: 0,
                      background: done ? 'linear-gradient(135deg,#ff6575,#b4a7f5)' : 'rgba(255,255,255,.08)',
                      border: done ? 'none' : '1px solid rgba(255,255,255,.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done && <span style={{ fontSize: 11 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: done ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)', letterSpacing: '.02em' }}>{day}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,.5)', margin: '14px 0 0' }}>
              🔥 4-day streak — keep it going!
            </p>
          </div>
        </motion.div>

        {/* AI Tips card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56 }}
        >
          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,.07)',
            borderRadius: 18,
            padding: '24px 24px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#b4a7f5,#7c6fec)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>AI Insight</p>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', color: '#002058', fontSize: 15, fontWeight: 700, margin: 0 }}>Today's Tip</h4>
              </div>
            </div>

            {[
              { icon: '💡', text: 'Add quantifiable achievements to your resume — e.g. "Reduced load time by 40%".' },
              { icon: '🎯', text: 'Practice the STAR method for behavioural questions to structure answers clearly.' },
            ].map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 12px',
                background: i === 0 ? 'rgba(180,167,245,.08)' : 'transparent',
                borderRadius: 10, marginBottom: i === 0 ? 8 : 0,
                border: i === 0 ? '1px solid rgba(180,167,245,.2)' : 'none',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.5 }}>{tip.icon}</span>
                <p style={{ fontSize: 12, color: '#685f78', margin: 0, lineHeight: 1.6 }}>{tip.text}</p>
              </div>
            ))}

            <Link
              to="/roadmap"
              style={{
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, color: '#7c6fec', textDecoration: 'none',
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
