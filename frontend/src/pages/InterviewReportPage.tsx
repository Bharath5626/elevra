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
  MessageSquare, Sparkles,
} from 'lucide-react';
import { useWindowWidth } from '../hooks/useWindowWidth';

const ANALYSIS_STEPS = [
  { icon: MessageSquare, label: 'Transcribing answers' },
  { icon: Brain,         label: 'Scoring technical depth' },
  { icon: Eye,           label: 'Evaluating eye contact & body language' },
  { icon: Mic2,          label: 'Analysing speech clarity & confidence' },
  { icon: Sparkles,      label: 'Generating feedback & insights' },
];

export default function InterviewReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession]           = useState<InterviewSession | null>(null);
  const [answers, setAnswers]           = useState<InterviewAnswer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showRoadmapBanner, setShowRoadmapBanner] = useState(true);

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
        <Loader2 size={36} style={{ color: '#7C3AED', animation: 'spin 1s linear infinite' }} />
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
            boxShadow: '0 1px 4px rgba(124,58,237,.05)', padding: '40px 36px',
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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E1B4B',
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
                border: '1.5px solid #E9E5F5', color: '#374151', textDecoration: 'none',
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
    const progress = analysisStatus?.progress ?? 0;
    const safeProgress = Math.min(100, Math.max(0, progress));
    const activeStep = Math.min(
      ANALYSIS_STEPS.length - 1,
      Math.floor((safeProgress / 100) * ANALYSIS_STEPS.length),
    );
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '24px',
        background: '#F8F7FF',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* ── Main card ── */}
          <div style={{
            background: '#1E1B4B',
            borderRadius: 16,
            padding: '36px 36px 32px',
            boxShadow: '0 8px 32px rgba(30,27,75,.18)',
          }}>
            {/* Icon + heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(124,58,237,.25)',
                  border: '1px solid rgba(124,58,237,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Brain size={26} style={{ color: '#C4B5FD' }} />
              </motion.div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>AI Processing</p>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '4px 0 0' }}>Analysing Your Interview</h2>
              </div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {ANALYSIS_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const done   = i < activeStep;
                const active = i === activeStep;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: done ? 'rgba(34,197,94,.2)' : active ? 'rgba(124,58,237,.25)' : 'rgba(255,255,255,.06)',
                      border: `1px solid ${done ? 'rgba(34,197,94,.4)' : active ? 'rgba(124,58,237,.4)' : 'rgba(255,255,255,.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done
                        ? <CheckCircle size={14} style={{ color: '#4ade80' }} />
                        : active
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                            <Loader2 size={14} style={{ color: '#A78BFA' }} />
                          </motion.div>
                        : <StepIcon size={14} style={{ color: 'rgba(255,255,255,.25)' }} />
                      }
                    </div>
                    <span style={{
                      fontSize: 13,
                      color: done ? 'rgba(255,255,255,.7)' : active ? '#fff' : 'rgba(255,255,255,.3)',
                      fontWeight: active ? 600 : 400,
                    }}>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <ProgressBar value={safeProgress} label={analysisStatus?.current_step || 'Collecting analysis results'} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            This page updates automatically — no need to refresh.
          </p>
        </motion.div>
      </div>
    );
  }

  const current = answers[selectedAnswer];
  const avgOf   = (fn: (a: InterviewAnswer) => number) =>
    Math.round(answers.reduce((s, a) => s + (fn(a) ?? 0), 0) / answers.length);
  const winW = useWindowWidth();
  const isMobile = winW < 640;
  /* ─── shared inline style helpers ────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #E9E5F5',
    boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
  };

  return (
    <div style={{ padding: isMobile ? '16px 16px 40px' : '24px 28px 48px' }}>

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
              background: '#F5F3FF', border: '1px solid #DDD6FE',
            }}>
              <BarChart3 size={20} color="#7C3AED" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B', margin: 0, lineHeight: 1.3 }}>
                Interview Report
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
                {session.job_role} &bull; {session.difficulty} &bull; {answers.length} question{answers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Roadmap-ready banner ────────────────────────────────── */}
        <AnimatePresence>
          {showRoadmapBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                border: '1.5px solid #DDD6FE',
                borderRadius: 12, padding: '14px 18px', marginBottom: 20,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={16} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#1E1B4B' }}>
                  Your personalised learning roadmap is ready!
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#6B7280' }}>
                  A 30-day plan tailored to this interview has been generated in the Roadmap section.
                </p>
              </div>
              <Link
                to={`/roadmap/${sessionId}`}
                style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  background: '#7C3AED', color: '#fff', textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                View Roadmap <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => setShowRoadmapBanner(false)}
                style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#9CA3AF', padding: 4, lineHeight: 1,
                  fontSize: 18, fontWeight: 300,
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overall score card ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ ...card, padding: '36px 36px 28px', marginBottom: 24 }}
        >
          {/* Ring + bars row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: isMobile ? 24 : 40, alignItems: 'start' }}>
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
                        paddingTop: 24, borderTop: '1px solid #E9E5F5' }}>
            <Link
              to={`/interview/${sessionId}/replay`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#fff', textDecoration: 'none',
                background: '#7C3AED',
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
                border: '1.5px solid #7C3AED',
                color: '#7C3AED', textDecoration: 'none',
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
                  ? '1.5px solid #DDD6FE'
                  : '1.5px solid #E9E5F5',
                background: i === selectedAnswer ? '#F5F3FF' : '#fff',
                color: i === selectedAnswer ? '#7C3AED' : '#6B7280',
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
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B4B',
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
                                fontWeight: 700, color: '#1E1B4B', marginBottom: 18 }}>
                    <Eye size={14} style={{ color: '#7C3AED', flexShrink: 0 }} />
                    Performance Metrics
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                    <ProgressBar value={(current.eye_contact_pct ?? 0) * 100} label="Eye Contact" />
                    <ProgressBar value={current.confidence_score ?? 0}          label="Confidence" />
                    <ProgressBar value={current.speech_clarity_score ?? 0}      label="Speech Clarity" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                                 paddingTop: 18, borderTop: '1px solid #E9E5F5' }}>
                    {[
                      { icon: <Mic2 size={14} />,          label: 'WPM',     value: Math.round(current.wpm ?? 0) },
                      { icon: <AlertTriangle size={14} />, label: 'Fillers', value: current.filler_count ?? 0 },
                      { icon: <Star size={14} />,          label: 'STAR',    value: current.star_format_used ? 'Yes' : 'No' },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '12px 8px',
                                                borderRadius: 8, background: '#F8F7FF' }}>
                        <div style={{ display: 'flex', justifyContent: 'center',
                                      color: '#9CA3AF', marginBottom: 6 }}>{icon}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>{label}</div>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          color: label === 'STAR'
                            ? value === 'Yes' ? '#22c55e' : '#ef4444'
                            : '#1E1B4B',
                        }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Emotion Distribution */}
                  {current.emotion_scores && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #E9E5F5' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280',
                                   textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Emotion Distribution
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {(Object.entries(current.emotion_scores) as [string, number][])
                          .sort(([, a], [, b]) => b - a)
                          .map(([emotion, val]) => {
                            const emoColor: Record<string, string> = {
                              happy: '#22c55e', neutral: '#6b7280', sad: '#8B5CF6',
                              angry: '#ef4444', surprise: '#f59e0b', fear: '#a855f7', disgust: '#f97316',
                            };
                            const color = emoColor[emotion] ?? '#9ca3af';
                            return (
                              <div key={emotion} style={{
                                textAlign: 'center', padding: '10px 4px', borderRadius: 8,
                                background: '#F8F7FF', border: '1px solid #E9E5F5',
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
                                fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
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
                                fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
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
                                fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>
                    <Brain size={14} style={{ color: '#7C3AED', flexShrink: 0 }} />
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
