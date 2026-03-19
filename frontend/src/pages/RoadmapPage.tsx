import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { roadmapAPI } from '../services/api';
import type { LearningRoadmap } from '../types';
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  Video,
  FileText,
  Code,
  Check,
  Zap,
  Calendar,
  Loader2,
} from 'lucide-react';

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
    borderRadius: 10,
    border: '1px solid #E7E7E7',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
    padding: 24,
    marginBottom: 20,
  } as React.CSSProperties,

  cardFlush: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    border: '1px solid #E7E7E7',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
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
    backgroundColor: color === 'warning' ? '#fef9c3' : color === 'info' ? '#dbeafe' : '#f1f5f9',
    color: color === 'warning' ? '#854d0e' : color === 'info' ? '#1d4ed8' : '#475569',
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
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  expandedContent: {
    borderTop: '1px solid #e2e8f0',
    padding: '20px 24px 28px',
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 12,
    marginTop: 0,
  } as React.CSSProperties,

  taskItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.6,
    marginBottom: 10,
  } as React.CSSProperties,

  taskCheck: {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: '1px solid #cbd5e1',
    flexShrink: 0,
    marginTop: 3,
  } as React.CSSProperties,

  resourceLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    textDecoration: 'none',
    marginBottom: 8,
  } as React.CSSProperties,

  resourceTitle: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
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
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
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
    color: '#94a3b8',
    textDecoration: 'none',
    marginBottom: 16,
  } as React.CSSProperties,

  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 22px',
    borderRadius: 10,
    backgroundColor: '#6366f1',
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
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const r = await roadmapAPI.getBySession(sessionId);
        setRoadmap(r);
        setLoading(false);
        return;
      } catch { /* 404 — fall through */ }

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

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={s.centered}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
      </div>
    );
  }

  /* ── Generating ──────────────────────────────────────────────── */
  if (generating) {
    return (
      <div style={s.centered}>
        <div style={s.centerCard}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, backgroundColor: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Loader2 size={30} className="animate-spin" style={{ color: '#6366f1' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
            Generating Your Roadmap
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
            AI is building a personalised 30-day learning plan based on your interview performance.
            This usually takes 10–20 seconds…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error / empty ───────────────────────────────────────────── */
  if (genError || !roadmap) {
    return (
      <div style={s.centered}>
        <div style={s.centerCard}>
          <BookOpen size={48} style={{ color: '#94a3b8', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 10px' }}>
            Could not generate roadmap
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
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

  /* ── Main ────────────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <Link to={`/interview/${sessionId}/report`} style={s.backLink}>
            <ChevronLeft size={14} /> Back to Report
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            30-Day{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Learning Roadmap
            </span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{plan.summary}</p>
        </motion.div>

        {/* Quick Wins */}
        {plan.quick_wins && plan.quick_wins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={s.card}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Zap size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>Quick Wins</span>
              <span style={s.badge('warning')}>{plan.quick_wins.length}</span>
            </div>
            {plan.quick_wins.map((win, i) => (
              <div key={i} style={s.taskItem}>
                <Check size={14} style={{ color: '#22c55e', flexShrink: 0, marginTop: 3 }} />
                <span>{win}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Weekly Plan */}
        <div>
          {plan.weeks.map((week, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              style={s.cardFlush}
            >
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(expandedWeek === i ? -1 : i)}
                style={s.weekBtn}
              >
                <div style={s.weekIcon}>
                  <Calendar size={18} style={{ color: '#6366f1' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>Week {week.week}</span>
                    <span style={s.badge('info')}>{week.daily_tasks.length} tasks</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{week.focus}</p>
                </div>
                <span style={{ fontSize: 20, color: '#94a3b8', marginLeft: 8, flexShrink: 0 }}>
                  {expandedWeek === i ? '−' : '+'}
                </span>
              </button>

              {/* Expanded panel */}
              {expandedWeek === i && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={s.expandedContent}
                >
                  <p style={s.sectionLabel}>Daily Tasks</p>
                  <div style={{ marginBottom: 24 }}>
                    {week.daily_tasks.map((task, j) => (
                      <div key={j} style={s.taskItem}>
                        <div style={s.taskCheck} />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>

                  {week.resources.length > 0 && (
                    <>
                      <p style={s.sectionLabel}>Resources</p>
                      <div>
                        {week.resources.map((res, j) => (
                          <a
                            key={j}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={s.resourceLink}
                          >
                            {resourceIcon(res.type)}
                            <span style={s.resourceTitle}>{res.title}</span>
                            <ExternalLink size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
