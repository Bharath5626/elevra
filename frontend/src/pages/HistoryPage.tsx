import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { interviewAPI } from '../services/api';
import type { InterviewSession } from '../types';
import {
  History, Mic, ChevronRight, TrendingUp, TrendingDown,
  Calendar, Loader2, Sparkles, ArrowRight, Filter,
} from 'lucide-react';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  useEffect(() => {
    interviewAPI.getSessions().then(setSessions).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter((s) => filter === 'all' || s.status === filter);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'rgba(34,197,94,.1)';
    if (score >= 60) return 'rgba(59,130,246,.1)';
    if (score >= 40) return 'rgba(245,158,11,.1)';
    return 'rgba(239,68,68,.1)';
  };

  const getTrend = (idx: number): 'up' | 'down' | 'none' => {
    if (idx >= sessions.length - 1) return 'none';
    const current = sessions[idx].overall_score;
    const prev = sessions[idx + 1].overall_score;
    if (current > prev) return 'up';
    if (current < prev) return 'down';
    return 'none';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary-400)' }} />
      </div>
    );
  }

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.overall_score || 0), 0) / sessions.length) : 0;
  const bestScore = sessions.length > 0 ? Math.max(...sessions.map((s) => s.overall_score || 0)) : 0;
  const completed = sessions.filter((s) => s.status === 'completed').length;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, background: 'var(--color-surface-100)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 32px' }}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <History size={20} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, color: 'var(--color-secondary-500)', margin: 0 }}>
              Session History
            </h1>
          </div>
          <p style={{ fontSize: 15, color: 'var(--color-surface-600)', marginLeft: 52 }}>
            Track your interview performance over time.
          </p>
        </motion.div>

        {/* Stats row */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
              gap: 16, marginBottom: 28,
            }}
          >
            {[
              { value: sessions.length, label: 'Total Sessions', color: 'var(--color-primary-400)' },
              { value: avgScore, label: 'Avg Score', color: '#22c55e' },
              { value: bestScore, label: 'Best Score', color: '#3b82f6' },
              { value: completed, label: 'Completed', color: '#a855f7' },
            ].map(({ value, label, color }) => (
              <div key={label} style={{
                background: '#fff', borderRadius: 14, border: '1px solid var(--color-surface-300)',
                boxShadow: '0 2px 10px rgba(0,0,0,.04)', padding: '20px 24px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 28, fontWeight: 800, color, margin: 0 }}>{value}</p>
                <p style={{ fontSize: 12, color: 'var(--color-surface-500)', marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}
        >
          <Filter size={14} style={{ color: 'var(--color-surface-500)', flexShrink: 0 }} />
          {(['all', 'completed', 'in_progress'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: filter === f ? '1.5px solid var(--color-primary-400)' : '1.5px solid var(--color-surface-300)',
                background: filter === f ? 'var(--color-primary-50)' : '#fff',
                color: filter === f ? 'var(--color-primary-400)' : 'var(--color-surface-600)',
                transition: 'all .2s',
              }}
            >
              {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
            </button>
          ))}
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: '#fff', borderRadius: 16, border: '1px solid var(--color-surface-300)',
              boxShadow: '0 2px 12px rgba(0,0,0,.04)',
              padding: '64px 32px', textAlign: 'center',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 18, background: 'var(--color-surface-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <History size={32} style={{ color: 'var(--color-surface-400)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-surface-500)', margin: '0 0 8px' }}>
              No sessions yet
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-surface-400)', margin: '0 0 24px' }}>
              Start your first mock interview to begin tracking your progress
            </p>
            <Link
              to="/interview/setup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 50,
                background: 'var(--color-primary-400)', color: '#fff',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}
            >
              <Sparkles size={15} /> Start Interview <ArrowRight size={14} />
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((session, i) => {
              const trend = getTrend(i);
              const score = session.overall_score || 0;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    to={`/interview/${session.id}/report`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{
                      background: '#fff', borderRadius: 14,
                      border: '1px solid var(--color-surface-300)',
                      boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                      padding: '18px 24px',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'box-shadow .2s, border-color .2s',
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,.08)';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary-200)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.04)';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-surface-300)';
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'rgba(255,101,117,.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Mic size={22} style={{ color: 'var(--color-primary-400)' }} />
                      </div>

                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-secondary-500)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.job_role}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-surface-500)' }}>
                            <Calendar size={12} />
                            {new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--color-surface-400)' }}>Â·</span>
                          <span style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>{session.difficulty}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-surface-400)' }}>Â·</span>
                          <span style={{
                            padding: '2px 10px', borderRadius: 50, fontSize: 12, fontWeight: 600,
                            background: session.status === 'completed' ? 'rgba(34,197,94,.1)' : 'rgba(245,158,11,.1)',
                            color: session.status === 'completed' ? '#15803d' : '#92400e',
                          }}>
                            {session.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>

                      {/* Right: trend + score + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        {trend === 'up' && <TrendingUp size={16} style={{ color: '#22c55e' }} />}
                        {trend === 'down' && <TrendingDown size={16} style={{ color: '#ef4444' }} />}

                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: getScoreBg(score),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: getScoreColor(score) }}>
                            {score}
                          </span>
                        </div>

                        <ChevronRight size={18} style={{ color: 'var(--color-surface-400)' }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
