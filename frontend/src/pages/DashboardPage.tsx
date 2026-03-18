import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSearch, Video, Play, BookOpen, Clock, TrendingUp, ArrowRight, Briefcase } from 'lucide-react';
import ScoreCard from '../components/ScoreCard';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import type { CRIScore, InterviewSession } from '../types';
import { criAPI, interviewAPI } from '../services/api';

const quickActions = [
  { icon: FileSearch, label: 'Resume Analysis',  path: '/resume',          color: '#FF6575' },
  { icon: Video,      label: 'Mock Interview',    path: '/interview/setup', color: '#B4A7F5' },
  { icon: Play,       label: 'Replay Sessions',   path: '/history',         color: '#22c55e' },
  { icon: BookOpen,   label: 'Learning Roadmap',  path: '/history',         color: '#3b82f6' },
  { icon: Briefcase,  label: 'Find Jobs',         path: '/jobs',            color: '#f59e0b' },
];

const mockCRI: CRIScore = {
  id: '1', user_id: '1', cri_total: 72,
  resume_score: 78, interview_score: 65, jd_fit_score: 74,
  improvement_delta: 0, percentile: 68,
  recorded_at: new Date().toISOString(),
};

const mockSessions: InterviewSession[] = [
  { id: '1', user_id: '1', job_role: 'Frontend Developer',   difficulty: 'Intermediate', status: 'completed', overall_score: 78, questions: [], created_at: new Date(Date.now() - 86400000).toISOString(),  resume_analysis_id: null },
  { id: '2', user_id: '1', job_role: 'Full Stack Engineer',  difficulty: 'Advanced',     status: 'completed', overall_score: 65, questions: [], created_at: new Date(Date.now() - 172800000).toISOString(), resume_analysis_id: null },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [cri, setCri]         = useState<CRIScore>(mockCRI);
  const [sessions, setSessions] = useState<InterviewSession[]>(mockSessions);

  useEffect(() => {
    criAPI.getCurrent().then(r => setCri(r)).catch(() => {});
    interviewAPI.getSessions().then(r => setSessions(r.length ? r.slice(0, 5) : mockSessions)).catch(() => {});
  }, []);

  const scoreColor = (s: number) => s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, backgroundColor: '#f7f7ff' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 32px' }}>

        {/* ── Welcome ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 700, color: '#002058', margin: '0 0 6px' }}>
            Welcome back,{' '}
            <span style={{ color: '#ff6575' }}>{user?.full_name || 'User'}</span>
          </h1>
          <p style={{ fontSize: 15, color: '#685f78', margin: 0 }}>
            Track your career readiness and keep improving.
          </p>
        </motion.div>

        {/* ── Main grid: CRI card + right column ───────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 24 }}>

          {/* CRI Score card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: 28,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#002058', alignSelf: 'flex-start', margin: 0 }}>
              Career Readiness Index
            </h3>
            <ScoreCard score={cri.cri_total ?? (cri as never as { overall_score?: number }).overall_score ?? 0} label="Overall CRI" size={140} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ProgressBar value={cri.resume_score}   label="Resume"    />
              <ProgressBar value={cri.interview_score} label="Interview" />
              <ProgressBar value={cri.jd_fit_score ?? (cri as never as { jd_match_score?: number }).jd_match_score ?? 0} label="JD Match" />
            </div>
            {cri.improvement_delta > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                <TrendingUp size={14} />
                Trending up
              </div>
            )}
          </motion.div>

          {/* Right column: Quick Actions + Recent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#002058', margin: '0 0 14px' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: 12 }}>
                {quickActions.map((a) => (
                  <Link
                    key={a.label}
                    to={a.path}
                    style={{
                      backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: 14,
                      boxShadow: '0 1px 6px rgba(0,0,0,.04)',
                      padding: '20px 12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                      textDecoration: 'none', transition: 'box-shadow .2s',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: a.color + '18', color: a.color }}>
                      <a.icon size={22} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#002058', textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Recent Sessions */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#002058', margin: 0 }}>Recent Sessions</h3>
                <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#ff6575', fontWeight: 500, textDecoration: 'none' }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((s) => (
                  <Link
                    key={s.id}
                    to={`/interview/${s.id}/report`}
                    style={{
                      backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: 12,
                      boxShadow: '0 1px 6px rgba(0,0,0,.04)', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      textDecoration: 'none', gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(180,167,245,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Video size={18} style={{ color: '#392c7d' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#002058', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.job_role}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' }}>
                          <Clock size={11} />
                          {new Date(s.created_at).toLocaleDateString()}
                          <span style={{ padding: '1px 8px', borderRadius: 99, backgroundColor: '#f0f0f8', color: '#685f78' }}>
                            {s.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(s.overall_score || 0) }}>
                        {s.overall_score || '--'}
                      </span>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '1px 0 0' }}>/ 100</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
