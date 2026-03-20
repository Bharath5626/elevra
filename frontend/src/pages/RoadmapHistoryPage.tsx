import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { roadmapAPI, interviewAPI } from '../services/api';
import type { LearningRoadmap, InterviewSession } from '../types';
import { BookOpen, ArrowRight, Calendar, Loader2, Briefcase } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function RoadmapHistoryPage() {
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [sessionMap, setSessionMap] = useState<Record<string, InterviewSession>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([roadmapAPI.getAll(), interviewAPI.getSessions()])
      .then(([rms, sessions]) => {
        setRoadmaps(rms);
        const map: Record<string, InterviewSession> = {};
        sessions.forEach(s => { map[s.id] = s; });
        setSessionMap(map);
      })
      .catch(() => setError('Failed to load roadmaps.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#2563EB' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: 760, margin: '0 auto' }}>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
            color: '#ef4444', padding: '14px 18px', borderRadius: 12, marginBottom: 24, fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && roadmaps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: '#fff', borderRadius: 10, border: '1px solid #E7E7E7',
              boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
              padding: '60px 40px', textAlign: 'center',
            }}
          >
            <BookOpen size={52} style={{ color: '#D1D5DB', margin: '0 auto 20px', display: 'block' }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>
              No roadmaps yet
            </h3>
            <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
              Complete a mock interview to get a personalised AI-generated 30-day learning roadmap.
            </p>
            <Link
              to="/interview/setup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 28px', borderRadius: 8,
                background: '#2563EB',
                color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none',
              }}
            >
              Start an Interview <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}

        {/* Roadmap cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {roadmaps.map((rm, i) => (
            <motion.div
              key={rm.id}
              initial="hidden" animate="visible"
              variants={fadeUp} custom={i}
            >
              <Link
                to={`/roadmap/${rm.session_id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    background: '#fff', borderRadius: 10,
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
                    padding: '24px 28px',
                    transition: 'box-shadow .2s, transform .2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(37,99,235,.12)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.05)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    {/* Left */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Job role + meta badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        {sessionMap[rm.session_id] && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 12px', borderRadius: 999,
                            background: '#F0F9FF', border: '1px solid #BAE6FD',
                            color: '#0369A1', fontSize: 12, fontWeight: 700,
                          }}>
                            <Briefcase size={11} />
                            {sessionMap[rm.session_id].job_role}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 12px', borderRadius: 999,
                          background: '#EFF6FF', border: '1px solid #BFDBFE',
                          color: '#2563EB', fontSize: 12, fontWeight: 600,
                        }}>
                          <BookOpen size={11} />
                          {rm.plan.weeks?.length ?? 0}-Week Plan
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          color: '#9CA3AF', fontSize: 12,
                        }}>
                          <Calendar size={12} />
                          {formatDate(rm.generated_at)}
                        </span>
                      </div>

                      {/* Summary */}
                      {/* Short description */}
                      <p style={{
                        fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
                        overflow: 'hidden',
                      }}>
                        {rm.plan.summary}
                      </p>

                      {/* Quick wins preview */}
                      {rm.plan.quick_wins && rm.plan.quick_wins.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                          {rm.plan.quick_wins.slice(0, 3).map((qw, qi) => (
                            <span key={qi} style={{
                              padding: '3px 10px', borderRadius: 999,
                              background: '#f0fdf4', color: '#15803d',
                              fontSize: 12, fontWeight: 500,
                              border: '1px solid #bbf7d0',
                              maxWidth: 200,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {qw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ArrowRight size={18} style={{ color: '#2563EB' }} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

    </div>
  );
}
