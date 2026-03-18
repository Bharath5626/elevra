import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisAPI, interviewAPI } from '../services/api';
import type { InterviewSession, InterviewAnswer, AnalysisStatus } from '../types';
import ScoreCard from '../components/ScoreCard';
import ProgressBar from '../components/ProgressBar';
import {
  BarChart3, CheckCircle, AlertTriangle, Star,
  Eye, Mic2, Brain, Play, ArrowRight, Loader2, BookOpen, ChevronLeft, X,
} from 'lucide-react';

export default function InterviewReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession]           = useState<InterviewSession | null>(null);
  const [answers, setAnswers]           = useState<InterviewAnswer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const loadReport = async () => {
      try {
        const [s, a, status] = await Promise.all([
          interviewAPI.getSession(sessionId),
          interviewAPI.getAnswers(sessionId),
          analysisAPI.getStatus(sessionId),
        ]);

        if (cancelled) return;

        setSession(s);
        setAnswers(a);
        setAnalysisStatus(status);
        setLoadFailed(false);

        const reportReady = s.status === 'completed' && a.length > 0;
        if (!reportReady && status.status !== 'failed') {
          timeoutId = window.setTimeout(loadReport, 2000);
        }
      } catch {
        if (cancelled) return;
        setLoadFailed(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (selectedAnswer < answers.length) return;
    setSelectedAnswer(0);
  }, [answers, selectedAnswer]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-surface-100)' }}>
        <Loader2 size={36} style={{ color: 'var(--color-primary-400)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (loadFailed || !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-surface-100)' }}>
        <div style={{ textAlign: 'center' }}>
          <BarChart3 size={48} style={{ color: 'var(--color-surface-400)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--color-surface-600)' }}>Report not available yet</p>
        </div>
      </div>
    );
  }

  if (session.status !== 'completed' || answers.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-surface-100)', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 20, border: '1px solid var(--color-surface-300)',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)', padding: '40px 36px',
            width: '100%', maxWidth: 520,
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--color-primary-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Loader2 size={28} style={{ color: 'var(--color-primary-400)', animation: 'spin 1s linear infinite' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-secondary-500)',
                       textAlign: 'center', margin: '0 0 10px' }}>
            Preparing your interview report
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-surface-500)', textAlign: 'center',
                      lineHeight: 1.65, margin: '0 0 28px' }}>
            Your real interview metrics are still being processed. This page will update automatically when the report is ready.
          </p>
          <ProgressBar value={analysisStatus?.progress ?? 0} label={analysisStatus?.current_step || 'Collecting analysis results'} />
        </motion.div>
      </div>
    );
  }

  const current = answers[selectedAnswer];
  const avgOf   = (fn: (a: InterviewAnswer) => number) =>
    Math.round(answers.reduce((s, a) => s + fn(a), 0) / answers.length);

  /* ─── shared inline style helpers ────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid var(--color-surface-300)',
    boxShadow: '0 2px 12px rgba(0,0,0,.04)',
  };

  return (
    <div className="page-wrapper" style={{ background: 'var(--color-surface-100)' }}>
      <div className="container" style={{ maxWidth: 1100, paddingTop: 40, paddingBottom: 72 }}>

        {/* ── Back + page header ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <Link
            to="/history"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13,
                     color: 'var(--color-surface-500)', marginBottom: 18, textDecoration: 'none' }}
          >
            <ChevronLeft size={14} /> Back to History
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
            }}>
              <BarChart3 size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-secondary-500)', margin: 0, lineHeight: 1.3 }}>
                Interview Report
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-surface-500)', margin: '3px 0 0' }}>
                {session.job_role} &bull; {session.difficulty} &bull; {answers.length} question{answers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Overall score card ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ ...card, padding: '36px 36px 28px', marginBottom: 24 }}
        >
          {/* Ring + bars row */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 40, alignItems: 'start' }}>
            {/* Score ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ScoreCard score={session.overall_score} label="Overall Score" size="lg" />
              <span style={{ fontSize: 11, color: 'var(--color-surface-500)', textTransform: 'uppercase',
                             letterSpacing: '0.06em', fontWeight: 600, marginTop: 4 }}>
                Session Average
              </span>
            </div>

            {/* Breakdown bars */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-surface-500)',
                           textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
                Score Breakdown (averages)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ProgressBar value={avgOf((a) => a.technical_score)}       label="Technical (30%)" />
                <ProgressBar value={avgOf((a) => a.structure_score)}       label="Structure (20%)" />
                <ProgressBar value={avgOf((a) => a.depth_score)}           label="Depth (15%)" />
                <ProgressBar value={avgOf((a) => a.eye_contact_pct * 100)} label="Eye Contact (15%)" />
                <ProgressBar value={avgOf((a) => a.confidence_score)}      label="Confidence (10%)" />
                <ProgressBar value={avgOf((a) => a.speech_clarity_score)}  label="Speech Clarity (10%)" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28,
                        paddingTop: 24, borderTop: '1px solid var(--color-surface-200)' }}>
            <Link
              to={`/interview/${sessionId}/replay`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                color: '#fff', textDecoration: 'none',
                background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
                transition: 'opacity .2s',
              }}
            >
              <Play size={14} /> Watch Replay
            </Link>
            <Link
              to={`/roadmap/${sessionId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                border: '1.5px solid var(--color-primary-400)',
                color: 'var(--color-primary-400)', textDecoration: 'none',
                transition: 'background .2s',
              }}
            >
              <BookOpen size={14} /> View Roadmap
            </Link>
          </div>
        </motion.div>

        {/* ── Question tabs ───────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 20 }}>
          {answers.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setSelectedAnswer(i)}
              style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                border: i === selectedAnswer
                  ? '1.5px solid var(--color-primary-300)'
                  : '1.5px solid var(--color-surface-300)',
                background: i === selectedAnswer ? 'var(--color-primary-50)' : '#fff',
                color: i === selectedAnswer ? 'var(--color-primary-500)' : 'var(--color-surface-600)',
                cursor: 'pointer', transition: 'all .18s',
              }}
            >
              Q{i + 1}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                background: i === selectedAnswer ? 'var(--color-primary-400)' : 'var(--color-surface-200)',
                color: i === selectedAnswer ? '#fff' : 'var(--color-surface-500)',
              }}>
                {a.overall_score}
              </span>
            </button>
          ))}
        </div>

        {/* ── Per-question detail ─────────────────────────── */}
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={selectedAnswer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
            >

              {/* ── LEFT column ─────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Question + 4 score rings */}
                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-secondary-500)',
                               lineHeight: 1.65, marginBottom: 24 }}>
                    {current.question_text}
                  </p>
                  {/* 2 × 2 grid — no overflow on any width */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <ScoreCard score={current.technical_score} label="Technical"  size="sm" />
                    <ScoreCard score={current.structure_score} label="Structure"  size="sm" />
                    <ScoreCard score={current.depth_score}     label="Depth"      size="sm" />
                    <ScoreCard score={current.overall_score}   label="Overall"    size="sm" />
                  </div>
                </div>

                {/* Performance metrics */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 18 }}>
                    <Eye size={14} style={{ color: 'var(--color-accent-400)', flexShrink: 0 }} />
                    Performance Metrics
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                    <ProgressBar value={current.eye_contact_pct * 100} label="Eye Contact" />
                    <ProgressBar value={current.confidence_score}      label="Confidence" />
                    <ProgressBar value={current.speech_clarity_score}  label="Speech Clarity" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                                 paddingTop: 18, borderTop: '1px solid var(--color-surface-200)' }}>
                    {[
                      { icon: <Mic2 size={14} />,          label: 'WPM',     value: Math.round(current.wpm) },
                      { icon: <AlertTriangle size={14} />, label: 'Fillers', value: current.filler_count },
                      { icon: <Star size={14} />,          label: 'STAR',    value: current.star_format_used ? 'Yes' : 'No' },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '12px 8px',
                                                borderRadius: 12, background: 'var(--color-surface-100)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center',
                                      color: 'var(--color-surface-400)', marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-surface-500)', marginBottom: 5 }}>{label}</div>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          color: label === 'STAR'
                            ? value === 'Yes' ? 'var(--color-success-400)' : 'var(--color-danger-400)'
                            : 'var(--color-secondary-500)',
                        }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ── RIGHT column ────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Strengths */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 16 }}>
                    <CheckCircle size={14} style={{ color: 'var(--color-success-400)', flexShrink: 0 }} />
                    Strengths
                  </h4>
                  {current.strengths.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0,
                                  display: 'flex', flexDirection: 'column', gap: 10,
                                  maxHeight: 220, overflowY: 'auto' }}>
                      {current.strengths.map((s, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                                             fontSize: 13, color: 'var(--color-surface-600)', lineHeight: 1.55 }}>
                          <CheckCircle size={13} style={{ color: 'var(--color-success-400)',
                                                           marginTop: 2, flexShrink: 0 }} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>
                      No strengths were extracted for this answer.
                    </p>
                  )}
                </div>

                {/* Areas for improvement */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 16 }}>
                    <AlertTriangle size={14} style={{ color: 'var(--color-warning-400)', flexShrink: 0 }} />
                    Areas for Improvement
                  </h4>
                  {current.improvements.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0,
                                  display: 'flex', flexDirection: 'column', gap: 10,
                                  maxHeight: 220, overflowY: 'auto' }}>
                      {current.improvements.map((imp, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                                             fontSize: 13, color: 'var(--color-surface-600)', lineHeight: 1.55 }}>
                          <ArrowRight size={13} style={{ color: 'var(--color-warning-400)',
                                                          marginTop: 2, flexShrink: 0 }} />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>
                      No improvement notes were generated for this answer.
                    </p>
                  )}
                </div>

                {/* Transcript */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 16 }}>
                    <Brain size={14} style={{ color: 'var(--color-primary-400)', flexShrink: 0 }} />
                    Transcript
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--color-surface-600)', lineHeight: 1.7,
                               maxHeight: 200, overflowY: 'auto', margin: 0 }}>
                    {current.transcript || 'Transcript not available'}
                  </p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
