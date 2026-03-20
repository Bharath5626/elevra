import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { interviewAPI } from '../services/api';
import type { InterviewSession } from '../types';
import { History, Mic, ChevronRight, TrendingUp, TrendingDown, Calendar, Loader2, Sparkles, ArrowRight, Filter, Award, CheckCircle } from 'lucide-react';
import StatCard from '../components/StatCard';

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#2563EB' }} />
      </div>
    );
  }

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.overall_score || 0), 0) / sessions.length) : 0;
  const bestScore = sessions.length > 0 ? Math.max(...sessions.map((s) => s.overall_score || 0)) : 0;
  const completed = sessions.filter((s) => s.status === 'completed').length;

  return (
    <div style={{ padding: '24px 28px 48px' }}>

        {/* Stats row */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
              gap: 16, marginBottom: 24,
            }}
          >
            <StatCard label="Total Sessions" value={sessions.length}    icon={History}   iconColor="#2563EB" />
            <StatCard label="Average Score"  value={`${avgScore}%`}    icon={TrendingUp} iconColor="#22c55e" />
            <StatCard label="Best Score"     value={`${bestScore}/100`} icon={Award}      iconColor="#3b82f6" />
            <StatCard label="Completed"      value={completed}          icon={CheckCircle} iconColor="#a855f7" />
          </motion.div>
        )}

        {/* Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}
        >
          <Filter size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
          {(['all', 'completed', 'in_progress'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: filter === f ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
                background: filter === f ? '#EFF6FF' : '#fff',
                color: filter === f ? '#2563EB' : '#6B7280',
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
              background: '#fff', borderRadius: 10, border: '1px solid #E7E7E7',
              boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
              padding: '64px 32px', textAlign: 'center',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 18, background: '#F9FAFB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <History size={32} style={{ color: '#9CA3AF' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#6B7280', margin: '0 0 8px' }}>
              No sessions yet
            </h3>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px' }}>
              Start your first mock interview to begin tracking your progress
            </p>
            <Link
              to="/interview/setup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 8,
                background: '#2563EB', color: '#fff',
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
                      background: '#fff', borderRadius: 10,
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
                      padding: '18px 24px',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'box-shadow .2s, border-color .2s',
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,.08)';
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#BFDBFE';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.04)';
                        (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB';
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Mic size={22} style={{ color: '#2563EB' }} />
                      </div>

                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.job_role}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
                            <Calendar size={12} />
                            {new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: 13, color: '#9CA3AF' }}>·</span>
                          <span style={{ fontSize: 13, color: '#6B7280' }}>{session.difficulty}</span>
                          <span style={{ fontSize: 13, color: '#9CA3AF' }}>·</span>
                          <span style={{
                            padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
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

                        <ChevronRight size={18} style={{ color: '#9CA3AF' }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}
