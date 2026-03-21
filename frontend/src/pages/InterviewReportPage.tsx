import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisAPI, interviewAPI } from '../services/api';
import type { InterviewSession, InterviewAnswer, AnalysisStatus } from '../types';
import ScoreCard from '../components/ScoreCard';
import ProgressBar from '../components/ProgressBar';
import {
  BarChart3, CheckCircle, AlertTriangle, Star,
  Eye, Mic2, Brain, Play, ArrowRight, Loader2, BookOpen, ChevronLeft,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (loadFailed || !session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <BarChart3 size={48} style={{ color: '#9CA3AF', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#6B7280' }}>Report not available yet</p>
        </div>
      </div>
    );
  }

  if (analysisStatus?.status === 'failed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 12, border: '1px solid #FEE2E2',
            boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '40px 36px',
            width: '100%', maxWidth: 520,
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 10, background: '#FEF2F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <AlertTriangle size={28} style={{ color: '#ef4444' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827',
                       textAlign: 'center', margin: '0 0 10px' }}>
            Analysis Failed
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center',
                      lineHeight: 1.65, margin: '0 0 28px' }}>
            We were unable to process your interview analysis. This can happen if the video
            could not be read or the AI service was unavailable. Please record a new session
            or contact support.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link
              to="/history"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1.5px solid #E5E7EB', color: '#374151', textDecoration: 'none',
              }}
            >
              <ChevronLeft size={14} /> Back to History
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (session.status !== 'completed' || answers.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
            boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '40px 36px',
            width: '100%', maxWidth: 520,
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 10,
            background: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Loader2 size={28} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827',
                       textAlign: 'center', margin: '0 0 10px' }}>
            Preparing your interview report
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center',
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
    Math.round(answers.reduce((s, a) => s + (fn(a) ?? 0), 0) / answers.length);

  /* ─── shared inline style helpers ────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #E7E7E7',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ padding: '24px 28px 48px' }}>

        {/* ── Back + page header ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <Link
            to="/history"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13,
                     color: '#6B7280', marginBottom: 18, textDecoration: 'none' }}
          >
            <ChevronLeft size={14} /> Back to History
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#EFF6FF', border: '1px solid #BFDBFE',
            }}>
              <BarChart3 size={20} color="#2563EB" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                Interview Report
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
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
              <ScoreCard score={session.overall_score ?? 0} label="Overall Score" size="lg" />
              <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase',
                             letterSpacing: '0.06em', fontWeight: 600, marginTop: 4 }}>
                Session Average
              </span>
            </div>

            {/* Breakdown bars */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280',
                           textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
                Score Breakdown (averages)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ProgressBar value={avgOf((a) => a.technical_score ?? 0)}            label="Technical" />
                <ProgressBar value={avgOf((a) => a.structure_score ?? 0)}            label="Structure" />
                <ProgressBar value={avgOf((a) => a.depth_score ?? 0)}                label="Depth" />
                <ProgressBar value={avgOf((a) => (a.eye_contact_pct ?? 0) * 100)}    label="Eye Contact" />
                <ProgressBar value={avgOf((a) => a.confidence_score ?? 0)}           label="Confidence" />
                <ProgressBar value={avgOf((a) => a.speech_clarity_score ?? 0)}       label="Speech Clarity" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28,
                        paddingTop: 24, borderTop: '1px solid #E5E7EB' }}>
            <Link
              to={`/interview/${sessionId}/replay`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#fff', textDecoration: 'none',
                background: '#2563EB',
                transition: 'opacity .2s',
              }}
            >
              <Play size={14} /> Watch Replay
            </Link>
            <Link
              to={`/roadmap/${sessionId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1.5px solid #2563EB',
                color: '#2563EB', textDecoration: 'none',
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
                  ? '1.5px solid #BFDBFE'
                  : '1.5px solid #E5E7EB',
                background: i === selectedAnswer ? '#EFF6FF' : '#fff',
                color: i === selectedAnswer ? '#2563EB' : '#6B7280',
                cursor: 'pointer', transition: 'all .18s',
              }}
            >
              Q{i + 1}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                background: (a.overall_score ?? 0) >= 80 ? '#dcfce7' : (a.overall_score ?? 0) >= 60 ? '#fef3c7' : '#fee2e2',
                color: (a.overall_score ?? 0) >= 80 ? '#16a34a' : (a.overall_score ?? 0) >= 60 ? '#d97706' : '#dc2626',
              }}>
                {a.overall_score ?? 0}
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
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#111827',
                               lineHeight: 1.65, marginBottom: 24 }}>
                    {current.question_text}
                  </p>
                  {/* 2 × 2 grid — no overflow on any width */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <ScoreCard score={current.technical_score ?? 0} label="Technical"  size="sm" />
                    <ScoreCard score={current.structure_score ?? 0} label="Structure"  size="sm" />
                    <ScoreCard score={current.depth_score ?? 0}     label="Depth"      size="sm" />
                    <ScoreCard score={current.overall_score ?? 0}   label="Overall"    size="sm" />
                  </div>
                </div>

                {/* Performance metrics */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: '#111827', marginBottom: 18 }}>
                    <Eye size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
                    Performance Metrics
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                    <ProgressBar value={(current.eye_contact_pct ?? 0) * 100} label="Eye Contact" />
                    <ProgressBar value={current.confidence_score ?? 0}          label="Confidence" />
                    <ProgressBar value={current.speech_clarity_score ?? 0}      label="Speech Clarity" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                                 paddingTop: 18, borderTop: '1px solid #E5E7EB' }}>
                    {[
                      { icon: <Mic2 size={14} />,          label: 'WPM',     value: Math.round(current.wpm ?? 0) },
                      { icon: <AlertTriangle size={14} />, label: 'Fillers', value: current.filler_count ?? 0 },
                      { icon: <Star size={14} />,          label: 'STAR',    value: current.star_format_used ? 'Yes' : 'No' },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '12px 8px',
                                                borderRadius: 8, background: '#F9FAFB' }}>
                        <div style={{ display: 'flex', justifyContent: 'center',
                                      color: '#9CA3AF', marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>{label}</div>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          color: label === 'STAR'
                            ? value === 'Yes' ? '#22c55e' : '#ef4444'
                            : '#111827',
                        }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Emotion Distribution */}
                  {current.emotion_scores && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #E5E7EB' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280',
                                   textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Emotion Distribution
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {(Object.entries(current.emotion_scores) as [string, number][])
                          .sort(([, a], [, b]) => b - a)
                          .map(([emotion, val]) => {
                            const emoColor: Record<string, string> = {
                              happy: '#22c55e', neutral: '#6b7280', sad: '#3b82f6',
                              angry: '#ef4444', surprise: '#f59e0b', fear: '#a855f7', disgust: '#f97316',
                            };
                            const color = emoColor[emotion] ?? '#9ca3af';
                            return (
                              <div key={emotion} style={{
                                textAlign: 'center', padding: '10px 4px', borderRadius: 8,
                                background: '#F9FAFB', border: '1px solid #E5E7EB',
                              }}>
                                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4,
                                               textTransform: 'capitalize' }}>{emotion}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color }}>
                                  {Math.round((val ?? 0) * 100)}%
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ── RIGHT column ────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Strengths */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                    <CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                    Strengths
                  </h4>
                  {(current.strengths ?? []).length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0,
                                  display: 'flex', flexDirection: 'column', gap: 10,
                                  maxHeight: 220, overflowY: 'auto' }}>
                      {(current.strengths ?? []).map((s, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                                             fontSize: 13, color: '#4B5563', lineHeight: 1.55 }}>
                          <CheckCircle size={13} style={{ color: '#22c55e',
                                                           marginTop: 2, flexShrink: 0 }} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
                      {!(current.transcript?.trim())
                        ? 'No audio was detected — strengths require a spoken answer.'
                        : 'No strengths were extracted for this answer.'}
                    </p>
                  )}
                </div>

                {/* Areas for improvement */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                    <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    Areas for Improvement
                  </h4>
                  {(current.improvements ?? []).length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0,
                                  display: 'flex', flexDirection: 'column', gap: 10,
                                  maxHeight: 220, overflowY: 'auto' }}>
                      {(current.improvements ?? []).map((imp, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                                             fontSize: 13, color: '#4B5563', lineHeight: 1.55 }}>
                          <ArrowRight size={13} style={{ color: '#f59e0b',
                                                          marginTop: 2, flexShrink: 0 }} />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                      No improvement notes were generated for this answer.
                    </p>
                  )}
                </div>

                {/* Transcript */}
                <div style={{ ...card, padding: 28 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                                fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                    <Brain size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
                    Transcript
                  </h4>
                  <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7,
                               maxHeight: 200, overflowY: 'auto', margin: 0 }}>
                    {current.transcript?.trim() || 'No transcript available — audio may have been too short or silent.'}
                  </p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

    </div>
  );
}
