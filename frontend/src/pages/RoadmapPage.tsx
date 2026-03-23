import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { roadmapAPI } from '../services/api';
import type { LearningRoadmap } from '../types';
import {
  BookOpen, ChevronLeft, ExternalLink, Video, FileText,
  Code, Zap, Calendar, Loader2, Briefcase, ChevronDown,
  ChevronUp, CheckCircle2, Target,
} from 'lucide-react';
import { interviewAPI } from '../services/api';
import type { InterviewSession } from '../types';
import { useWindowWidth } from '../hooks/useWindowWidth';

/* ---------- inline style helpers ---------------------------------- */
const s = {
  page: {
    padding: '24px 28px 48px',
    maxWidth: 800,
    margin: '0 auto',
  } as React.CSSProperties,

  inner: {
    maxWidth: 800,
    margin: '0 auto',
  } as React.CSSProperties,

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    border: '1px solid #E9E5F5',
    boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
    padding: 24,
    marginBottom: 20,
  } as React.CSSProperties,

  cardFlush: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    border: '1px solid #E9E5F5',
    boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
    overflow: 'hidden',
    marginBottom: 16,
  } as React.CSSProperties,

  badge: (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: color === 'warning' ? '#fef9c3' : color === 'info' ? '#EDE9FE' : '#F5F3FF',
    color: color === 'warning' ? '#854d0e' : color === 'info' ? '#6D28D9' : '#4B5563',
  }),

  weekBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
  } as React.CSSProperties,

  weekIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  expandedContent: {
    borderTop: '1px solid #E9E5F5',
    padding: '20px 24px 28px',
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 0,
  } as React.CSSProperties,

  taskItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 1.6,
    marginBottom: 10,
  } as React.CSSProperties,

  taskCheck: {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: '1px solid #D1D5DB',
    flexShrink: 0,
    marginTop: 3,
  } as React.CSSProperties,

  resourceLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    backgroundColor: '#F8F7FF',
    textDecoration: 'none',
    marginBottom: 8,
  } as React.CSSProperties,

  resourceTitle: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    minWidth: 0,
    wordBreak: 'break-word' as const,
  } as React.CSSProperties,

  centered: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  } as React.CSSProperties,

  centerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    border: '1px solid #E9E5F5',
    boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
    padding: 48,
    textAlign: 'center' as const,
    width: '100%',
    maxWidth: 460,
  } as React.CSSProperties,

  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: '#9CA3AF',
    textDecoration: 'none',
    marginBottom: 16,
  } as React.CSSProperties,

  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 22px',
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  } as React.CSSProperties,
};

const resourceIcon = (type: string) => {
  switch (type) {
    case 'video':    return <Video    size={14} style={{ color: '#f87171', flexShrink: 0 }} />;
    case 'article':  return <FileText size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />;
    case 'practice': return <Code     size={14} style={{ color: '#34d399', flexShrink: 0 }} />;
    default:         return <ExternalLink size={14} style={{ flexShrink: 0 }} />;
  }
};

export default function RoadmapPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const winW = useWindowWidth();
  const isMobile = winW < 640;

  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    // Fetch session details in parallel
    interviewAPI.getSession(sessionId).then(setSession).catch(() => {});

    const load = async () => {
      try {
        const r = await roadmapAPI.getBySession(sessionId);
        setRoadmap(r);
        setLoading(false);
        return;
      } catch { /* 404 � fall through */ }

      setLoading(false);
      setGenerating(true);
      try {
        const r = await roadmapAPI.generate(sessionId);
        setRoadmap(r);
      } catch (err: unknown) {
        setGenError(err instanceof Error ? err.message : 'Roadmap generation failed.');
      } finally {
        setGenerating(false);
      }
    };
    void load();
  }, [sessionId]);

  /* -- Loading --------------------------------------------------- */
  if (loading) {
    return (
      <div style={s.centered}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C3AED' }} />
      </div>
    );
  }

  /* -- Generating ------------------------------------------------ */
  if (generating) {
    return (
      <div style={s.centered}>
        <div style={s.centerCard}>
          <div style={{
            width: 64, height: 64, borderRadius: 10, backgroundColor: '#F5F3FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Loader2 size={30} className="animate-spin" style={{ color: '#7C3AED' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1E1B4B', margin: '0 0 12px' }}>
            Generating Your Roadmap
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
            AI is building a personalised 30-day learning plan based on your interview performance.
            This usually takes 10�20 seconds�
          </p>
        </div>
      </div>
    );
  }

  /* -- Error / empty --------------------------------------------- */
  if (genError || !roadmap) {
    return (
      <div style={s.centered}>
        <div style={s.centerCard}>
          <BookOpen size={48} style={{ color: '#9CA3AF', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1E1B4B', margin: '0 0 10px' }}>
            Could not generate roadmap
          </h3>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
            {genError ?? 'Something went wrong. Please try again from the report page.'}
          </p>
          <Link to={sessionId ? `/interview/${sessionId}/report` : '/history'} style={s.primaryBtn}>
            Back to Report
          </Link>
        </div>
      </div>
    );
  }

  const { plan } = roadmap;

  const weekColors = ['#7C3AED', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
  const weekTracks  = ['#EDE9FE', '#EDE9FE', '#D1FAE5', '#FEF3C7', '#FEE2E2', '#CFFAFE'];

  const totalTasks     = plan.weeks.reduce((n, w) => n + w.daily_tasks.length, 0);
  const totalResources = plan.weeks.reduce((n, w) => n + w.resources.length, 0);

  const resourceIcon = (type: string) => {
    if (type === 'video')    return { icon: <Video    size={13} />, color: '#ef4444', bg: '#FEE2E2', label: 'Video'    };
    if (type === 'article')  return { icon: <FileText size={13} />, color: '#7C3AED', bg: '#EDE9FE', label: 'Article'  };
    if (type === 'practice') return { icon: <Code     size={13} />, color: '#059669', bg: '#D1FAE5', label: 'Practice' };
    return                          { icon: <ExternalLink size={13} />, color: '#6B7280', bg: '#F0EEFA', label: 'Link' };
  };

  return (
    <div style={{ padding: isMobile ? '16px 16px 40px' : '28px 28px 64px', maxWidth: 860, margin: '0 auto' }}>

      {/* ── Back + header ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <Link to="/roadmap" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9CA3AF', textDecoration: 'none', marginBottom: 16 }}>
          <ChevronLeft size={14} /> Back to Roadmaps
        </Link>

        {session && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: 13, fontWeight: 700 }}>
              <Briefcase size={13} /> {session.job_role}
            </span>
          </div>
        )}

        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 800, color: '#1E1B4B', margin: '0 0 8px' }}>
          Your <span style={{ color: '#7C3AED' }}>30-Day Learning Plan</span>
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 0 20px', maxWidth: 660 }}>{plan.summary}</p>

        {/* Stats bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { icon: <Calendar size={13} />, value: `${plan.weeks.length} Weeks`,       color: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
            { icon: <Target   size={13} />, value: `${totalTasks} Tasks`,              color: '#7C3AED', bg: '#F5F3FF', bd: '#DDD6FE' },
            { icon: <BookOpen size={13} />, value: `${totalResources} Resources`,      color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
            { icon: <Zap      size={13} />, value: `${plan.quick_wins?.length ?? 0} Quick Wins`, color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A' },
          ].map(s => (
            <div key={s.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: s.bg, border: `1px solid ${s.bd}`, fontSize: 12, fontWeight: 700, color: s.color }}>
              {s.icon} {s.value}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Wins ── */}
      {plan.quick_wins && plan.quick_wins.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E', margin: 0 }}>Quick Wins — Start Today</p>
              <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>Easy actions you can do right now to get ahead</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plan.quick_wins.map((win, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff', borderRadius: 8, border: '1px solid #FDE68A', padding: '10px 14px' }}>
                <CheckCircle2 size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{win}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Weekly plan ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {plan.weeks.map((week, i) => {
          const color = weekColors[i % weekColors.length];
          const track = weekTracks[i % weekTracks.length];
          const isOpen = expandedWeek === i;

          return (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              style={{ background: '#fff', borderRadius: 12, border: '1px solid #E9E5F5', boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}
            >
              {/* Week header button */}
              <button
                onClick={() => setExpandedWeek(isOpen ? -1 : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                {/* Week number circle */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: track, border: `2px solid ${color}22`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '.06em', lineHeight: 1 }}>WEEK</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>{week.week}</span>
                </div>

                {/* Focus + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: '0 0 4px' }}>{week.focus}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>📋 {week.daily_tasks.length} tasks</span>
                    {week.resources.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>📚 {week.resources.length} resources</span>}
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ width: 28, height: 28, borderRadius: 6, background: isOpen ? track : '#F8F7FF', border: `1px solid ${isOpen ? color + '44' : '#E9E5F5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={14} color={color} /> : <ChevronDown size={14} color="#9CA3AF" />}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: `2px solid ${track}`, padding: '20px 22px 24px' }}>

                      {/* Daily tasks */}
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 12px' }}>Daily Tasks</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: week.resources.length > 0 ? 24 : 0 }}>
                        {week.daily_tasks.map((task, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, background: '#F8F7FF', border: '1px solid #F0EEFA' }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: track, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color, fontFamily: 'Poppins, sans-serif' }}>
                              {j + 1}
                            </div>
                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{task}</span>
                          </div>
                        ))}
                      </div>

                      {/* Resources */}
                      {week.resources.length > 0 && (
                        <>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 12px' }}>Learning Resources</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {week.resources.map((res, j) => {
                              const ri = resourceIcon(res.type);
                              return (
                                <a key={j} href={res.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: '#fff', border: '1px solid #E9E5F5', textDecoration: 'none', transition: 'border-color .15s' }}
                                  onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E9E5F5')}
                                >
                                  <div style={{ width: 28, height: 28, borderRadius: 6, background: ri.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: ri.color }}>
                                    {ri.icon}
                                  </div>
                                  <span style={{ flex: 1, fontSize: 13, color: '#374151', minWidth: 0, wordBreak: 'break-word' }}>{res.title}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: ri.color, background: ri.bg, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                                    {ri.label} <ExternalLink size={10} />
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
