import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VideoRecorder from '../components/VideoRecorder';
import CodeEditor from '../components/CodeEditor';
import ProgressBar from '../components/ProgressBar';
import { interviewAPI, analysisAPI } from '../services/api';
import type { InterviewSession, InterviewQuestion } from '../types';
import { useInterviewGuard } from '../context/InterviewGuardContext';
import { useWindowWidth } from '../hooks/useWindowWidth';
import {
  ChevronRight, ChevronLeft, Loader2, CheckCircle,
  Clock, HelpCircle, Briefcase, Lightbulb,
  Sparkles, Brain, Eye, Mic2, MessageSquare, History, Code2,
} from 'lucide-react';

const P      = '#7C3AED';
const P_D    = '#6D28D9';
const P_BG   = '#F5F3FF';
const P_BD   = '#DDD6FE';
const BORDER = '#E9E5F5';
const TEXT   = '#1E1B4B';
const MUTED  = '#6B7280';

const ANALYSIS_STEPS = [
  { icon: MessageSquare, label: 'Transcribing answers' },
  { icon: Brain,         label: 'Scoring technical depth' },
  { icon: Eye,           label: 'Evaluating eye contact & body language' },
  { icon: Mic2,          label: 'Analysing speech clarity & confidence' },
  { icon: Sparkles,      label: 'Generating feedback & insights' },
];

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession]                   = useState<InterviewSession | null>(null);
  const [currentQ, setCurrentQ]                 = useState(0);
  const [submitted, setSubmitted]               = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing]               = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [activeStep, setActiveStep]             = useState(0);
  const [codeAnswers, setCodeAnswers]           = useState<Record<number, string>>({});
  const [codeLanguages, setCodeLanguages]       = useState<Record<number, string>>({});
  const [showLeaveModal, setShowLeaveModal]     = useState(false);
  const guard = useInterviewGuard();
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  useEffect(() => {
    if (!sessionId) return;
    interviewAPI.getSession(sessionId)
      .then((s) => { setSession(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  // Register navigation guard while interview is active
  useEffect(() => {
    if (!sessionId || !session || analyzing) return;
    guard.registerGuard(sessionId, async () => {
      await interviewAPI.discardSession(sessionId);
    });
    return () => { guard.unregisterGuard(); };
  }, [sessionId, session, analyzing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn on browser tab close / refresh during active interview
  useEffect(() => {
    if (!session || analyzing) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [session, analyzing]);

  // Show leave modal when guard fires
  useEffect(() => {
    const onGuardTriggered = () => setShowLeaveModal(true);
    window.addEventListener('interview-guard-triggered', onGuardTriggered);
    return () => window.removeEventListener('interview-guard-triggered', onGuardTriggered);
  }, []);

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    if (!sessionId) return;
    const isCoding = session?.questions?.[currentQ]?.type === 'coding';
    const codeText = isCoding ? (codeAnswers[currentQ] ?? '') : undefined;
    await interviewAPI.uploadAnswer(sessionId, currentQ, blob, codeText);
    setSubmitted((prev) => new Set(prev).add(currentQ));
  }, [sessionId, currentQ, session, codeAnswers]);

  const handleFinish = useCallback(async () => {
    if (!sessionId) return;
    setAnalyzing(true);
    setAnalysisProgress(0);
    setActiveStep(0);
    let highWater = 0; // progress only ever moves forward
    let stepIdx   = 0;
    try {
      await analysisAPI.triggerAnalysis(sessionId);
      const poll = setInterval(async () => {
        try {
          const status = await analysisAPI.getStatus(sessionId);
          // clamp to 0–99 and never go backwards
          const raw = typeof status.progress === 'number' ? status.progress : 0;
          const clamped = Math.min(99, Math.max(0, raw));
          if (clamped > highWater) {
            highWater = clamped;
            setAnalysisProgress(highWater);
            // advance step indicator proportionally
            const newStep = Math.min(ANALYSIS_STEPS.length - 1, Math.floor((highWater / 100) * ANALYSIS_STEPS.length));
            if (newStep > stepIdx) { stepIdx = newStep; setActiveStep(newStep); }
          }
          if (status.status === 'completed') {
            clearInterval(poll);
            setAnalysisProgress(100);
            setTimeout(() => navigate(`/interview/${sessionId}/report`), 600);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            setAnalyzing(false);
          }
        } catch {
          clearInterval(poll);
          navigate(`/interview/${sessionId}/report`);
        }
      }, 2000);
    } catch {
      navigate(`/interview/${sessionId}/report`);
    }
  }, [sessionId, navigate]);

  /* ── Loading ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} className="animate-spin text-primary-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="text-center">
          <HelpCircle size={52} style={{ margin: '0 auto 12px', color: '#9CA3AF' }} />
          <p style={{ color: '#4B5563' }}>Session not found</p>
        </div>
      </div>
    );
  }

  /* ── Analyzing overlay ────────────────────────────────── */
  if (analyzing) {
    const safeProgress = Math.min(100, Math.max(0, analysisProgress));
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
            padding: isMobile ? '24px 20px 20px' : '36px 36px 32px',
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
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0, fontFamily: 'Inter, sans-serif' }}>AI Processing</p>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '4px 0 0', fontFamily: 'Poppins, sans-serif' }}>Analysing Your Interview</h2>
              </div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {ANALYSIS_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const done  = i < activeStep;
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Progress</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA' }}>{Math.round(safeProgress)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
                  animate={{ width: `${safeProgress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* ── History reminder card ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: P_BG,
              border: `1px solid ${P_BD}`,
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              alignItems: isMobile ? 'stretch' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <History size={20} style={{ color: P, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, margin: 0 }}>You don't have to wait here</p>
                <p style={{ fontSize: 12, color: MUTED, margin: '2px 0 0' }}>Your full report will be ready in the History page.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/history')}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 8,
                background: P,
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Go to History
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const questions: InterviewQuestion[] = session.questions || [];
  const totalQ          = questions.length;
  const currentQuestion = questions[currentQ];
  const allSubmitted    = submitted.size >= totalQ;

  const isCodingActive = currentQuestion?.type === 'coding' && !submitted.has(currentQ);

  return (
    <div style={{ padding: isMobile ? '14px 16px 32px' : '14px 28px 32px', maxWidth: 1480, margin: '0 auto' }}>

      {/* ── Leave Interview Confirmation Modal ──────────────────── */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: '#fff', borderRadius: 16,
              padding: '32px 32px 28px',
              width: '100%', maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: '#FEF2F2', border: '1px solid #FECACA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <History size={18} style={{ color: '#EF4444' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px' }}>
                  Leave Interview?
                </h3>
                <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                  Your progress will be lost and this session will be permanently discarded. This cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => { setShowLeaveModal(false); guard.getPendingNav()?.cancel(); }}
                style={{
                  padding: '9px 20px', borderRadius: 8,
                  border: '1px solid #E9E5F5', background: '#fff',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151',
                  transition: 'background 0.13s',
                }}
              >
                Stay
              </button>
              <button
                onClick={async () => {
                  const pending = guard.getPendingNav();
                  setShowLeaveModal(false);
                  if (sessionId) {
                    try { await interviewAPI.discardSession(sessionId); } catch { /* ignore */ }
                  }
                  guard.unregisterGuard();
                  if (pending) pending.confirm();
                }}
                style={{
                  padding: '9px 20px', borderRadius: 8,
                  border: 'none', background: '#EF4444',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff',
                  transition: 'background 0.13s',
                }}
              >
                Leave &amp; Discard
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, marginBottom: 12,
        }}
      >
        {/* Left: icon + role inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(124,58,237,.25)',
          }}>
            <Briefcase size={15} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session.job_role}
          </span>
          <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>· {session.difficulty}</span>
        </div>

        {/* Right: pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            background: submitted.size > 0 ? 'rgba(34,197,94,.08)' : '#F8F7FF',
            border: `1px solid ${submitted.size > 0 ? 'rgba(34,197,94,.25)' : '#E9E5F5'}`,
            fontSize: 12, fontWeight: 600,
            color: submitted.size > 0 ? '#16a34a' : '#6B7280',
          }}>
            <CheckCircle size={12} style={{ opacity: submitted.size > 0 ? 1 : 0.4 }} />
            {submitted.size}/{totalQ} answered
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            background: '#F5F3FF', border: '1px solid #DDD6FE',
            fontSize: 12, fontWeight: 600, color: '#6D28D9',
          }}>
            <Clock size={12} />
            Q{currentQ + 1} / {totalQ}
          </div>
        </div>
      </motion.div>

      {/* ── Progress track ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
        {Array.from({ length: totalQ }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            title={`Q${i + 1}${submitted.has(i) ? ' ✓' : ''}`}
            style={{
              flex: i === currentQ ? 2.5 : 1,
              height: 6, borderRadius: 99, border: 'none',
              cursor: 'pointer', transition: 'all .35s ease',
              background: submitted.has(i) ? '#22c55e' : i === currentQ ? '#7C3AED' : '#E9E5F5',
            }}
          />
        ))}
      </div>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {isCodingActive ? (
              /* ════════════════════════════════════════════════════
                 CODING LAYOUT
                 Row 1 — Question banner (full width)
                 Row 2 — Code editor | Video side-by-side
                 ════════════════════════════════════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Question banner ─────────────────────────── */}
                <div style={{
                  background: '#fff', borderRadius: 14, overflow: 'hidden',
                  border: '1px solid #E9E5F5',
                  boxShadow: '0 2px 10px rgba(0,0,0,.05)',
                }}>
                  <div style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(90deg,#F5F3FF 0%,#F8FAFF 100%)',
                    borderBottom: '1px solid #EDE9FE',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Code2 size={14} style={{ color: '#fff' }} />
                      </div>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {currentQuestion.type?.replace(/_/g, ' ')}
                      </span>
                      {currentQuestion.focus_area && (
                        <span style={{ fontSize: 12, color: '#6B7280' }}>· {currentQuestion.focus_area}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <Clock size={11} style={{ color: '#C4B5FD' }} />
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        ~{currentQuestion.expected_duration_seconds}s
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '18px 24px' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B4B', lineHeight: 1.7, margin: 0 }}>
                      {currentQuestion.text}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Code2 size={12} style={{ color: '#C4B5FD', flexShrink: 0 }} />
                      Write your solution below, then record a verbal walkthrough of your approach.
                    </p>
                  </div>
                </div>

                {/* ── Code editor + Video side by side ────────── */}
                {submitted.has(currentQ) ? (
                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: '1.5px solid rgba(34,197,94,.25)',
                    boxShadow: '0 2px 12px rgba(34,197,94,.08)',
                    padding: '48px 32px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', gap: 14, minHeight: 260,
                  }}>
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <CheckCircle size={34} style={{ color: '#22c55e' }} />
                    </motion.div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', margin: '0 0 6px' }}>Answer Submitted!</p>
                      <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
                        Move to the next question or finish when ready.
                      </p>
                    </div>
                  </div>
                ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2.5fr', gap: 16, alignItems: 'stretch' }}>

                  {/* Code editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Code2 size={13} style={{ color: '#7C3AED' }} /> Solution Editor
                      </span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        Brackets &amp; quotes auto-close · Tab = 4 spaces
                      </span>
                    </div>
                    <CodeEditor
                      value={codeAnswers[currentQ] ?? ''}
                      onChange={(code) => setCodeAnswers((prev) => ({ ...prev, [currentQ]: code }))}
                      language={codeLanguages[currentQ] ?? 'Python'}
                      onLanguageChange={(lang) => setCodeLanguages((prev) => ({ ...prev, [currentQ]: lang }))}
                      fillHeight
                    />
                  </div>

                  {/* Video recorder */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mic2 size={13} style={{ color: '#7C3AED' }} /> Verbal Explanation
                    </span>
                    <VideoRecorder
                      onRecordingComplete={handleRecordingComplete}
                      maxDuration={currentQuestion.expected_duration_seconds + 60}
                      questionText={currentQuestion.text}
                      interviewMode
                    />
                  </div>
                </div>
                )}
              </div>
            ) : (
              /* ════════════════════════════════════════════════════
                 NON-CODING LAYOUT
                 Two columns: Question/tips/nav | Video
                 ════════════════════════════════════════════════════ */
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr',
                gap: 20,
                alignItems: 'start',
              }}>
                {/* Left: question + tips + nav */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Question card */}
                  <div style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid #E9E5F5', boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                  }}>
                    <div style={{
                      padding: '12px 18px', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0',
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                    }}>
                      <span className={`badge badge-${
                        currentQuestion.type === 'technical_concept' || currentQuestion.type === 'system_design'
                          ? 'info' : 'warning'
                      }`} style={{ textTransform: 'capitalize' }}>
                        {currentQuestion.type?.replace(/_/g, ' ')}
                      </span>
                      {currentQuestion.focus_area && (
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                          · {currentQuestion.focus_area}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '20px 18px 16px' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1E1B4B', lineHeight: 1.7, margin: 0 }}>
                        {currentQuestion.text}
                      </p>
                    </div>
                    <div style={{ padding: '10px 18px 12px', borderTop: '1px solid #F0EEFA', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} style={{ color: '#D1D5DB' }} />
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>~{currentQuestion.expected_duration_seconds}s suggested</span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                      <Lightbulb size={13} style={{ color: '#D97706' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.08em' }}>Answer Tips</span>
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {(currentQuestion.type === 'behavioral'
                        ? ['Use the STAR method', 'Be specific — include metrics', 'Keep it under 2–3 minutes']
                        : currentQuestion.type === 'system_design'
                        ? ['Clarify requirements first', 'Think aloud as you design', 'Mention trade-offs']
                        : ['Structure your answer clearly', 'Give concrete examples', 'Stay concise and direct']
                      ).map((tip) => (
                        <li key={tip} style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Question nav pills */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 8px' }}>Jump to question</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {Array.from({ length: totalQ }, (_, i) => (
                        <button key={i} onClick={() => setCurrentQ(i)} style={{
                          width: 36, height: 36, borderRadius: 9, border: 'none',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                          background: i === currentQ ? '#7C3AED' : submitted.has(i) ? 'rgba(34,197,94,.1)' : '#F8F7FF',
                          color: i === currentQ ? '#fff' : submitted.has(i) ? '#16a34a' : '#6B7280',
                          outline: submitted.has(i) ? '1.5px solid rgba(34,197,94,.35)' : i === currentQ ? 'none' : '1px solid #E9E5F5',
                          boxShadow: i === currentQ ? '0 2px 8px rgba(124,58,237,.28)' : 'none',
                        }}>
                          {submitted.has(i) ? '✓' : i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: video / submitted */}
                <div>
                  {submitted.has(currentQ) ? (
                    <div style={{
                      background: '#fff', borderRadius: 14,
                      border: '1.5px solid rgba(34,197,94,.25)',
                      boxShadow: '0 2px 12px rgba(34,197,94,.08)',
                      padding: '52px 32px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center', gap: 14, minHeight: 280,
                    }}>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <CheckCircle size={34} style={{ color: '#22c55e' }} />
                      </motion.div>
                      <div>
                        <p style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', margin: '0 0 6px' }}>Answer Submitted!</p>
                        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 220, margin: '0 auto' }}>
                          Move to the next question or finish when ready.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <VideoRecorder
                      onRecordingComplete={handleRecordingComplete}
                      maxDuration={currentQuestion.expected_duration_seconds + 60}
                      questionText={currentQuestion.text}
                      interviewMode
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation footer ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 16, paddingTop: 16,
        borderTop: '1px solid #F0EEFA',
      }}>
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="btn-secondary"
          style={{ padding: '10px 22px', opacity: currentQ === 0 ? 0.35 : 1 }}
        >
          <ChevronLeft size={15} />
          Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isMobile && Array.from({ length: totalQ }, (_, i) => (
            <div
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: submitted.has(i) ? '#22c55e' : i === currentQ ? '#7C3AED' : '#E9E5F5',
                transition: 'all .3s',
              }}
            />
          ))}
        </div>

        {currentQ < totalQ - 1 ? (
          <button
            onClick={() => setCurrentQ((p) => Math.min(totalQ - 1, p + 1))}
            className="btn-primary"
            style={{ padding: '10px 22px' }}
          >
            Next
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!allSubmitted}
            className="btn-primary"
            style={{
              padding: '10px 22px',
              background: allSubmitted ? '#16a34a' : undefined,
              opacity: allSubmitted ? 1 : 0.38,
              cursor: allSubmitted ? 'pointer' : 'not-allowed',
            }}
          >
            <CheckCircle size={15} />
            Finish &amp; Analyze
          </button>
        )}
      </div>

    </div>
  );
}
