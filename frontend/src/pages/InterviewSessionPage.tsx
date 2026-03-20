import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VideoRecorder from '../components/VideoRecorder';
import ProgressBar from '../components/ProgressBar';
import { interviewAPI, analysisAPI } from '../services/api';
import type { InterviewSession, InterviewQuestion } from '../types';
import {
  ChevronRight, ChevronLeft, Loader2, CheckCircle,
  Clock, HelpCircle, Briefcase, Lightbulb,
} from 'lucide-react';

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession]                   = useState<InterviewSession | null>(null);
  const [currentQ, setCurrentQ]                 = useState(0);
  const [submitted, setSubmitted]               = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing]               = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    interviewAPI.getSession(sessionId)
      .then((s) => { setSession(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    if (!sessionId) return;
    await interviewAPI.uploadAnswer(sessionId, currentQ, blob);
    setSubmitted((prev) => new Set(prev).add(currentQ));
  }, [sessionId, currentQ]);

  const handleFinish = useCallback(async () => {
    if (!sessionId) return;
    setAnalyzing(true);
    try {
      await analysisAPI.triggerAnalysis(sessionId);
      const poll = setInterval(async () => {
        try {
          const status = await analysisAPI.getStatus(sessionId);
          setAnalysisProgress(status.progress);
          if (status.status === 'completed') {
            clearInterval(poll);
            navigate(`/interview/${sessionId}/report`);
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0,0,0,.08)',
            padding: '48px 40px', textAlign: 'center', width: '100%', maxWidth: 440,
          }}
        >
          <div style={{ width: 72, height: 72, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Loader2 size={36} style={{ color: '#2563EB' }} className="animate-spin" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
            Analyzing Your Interview
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, lineHeight: 1.7 }}>
            AI is evaluating your answers, body language, eye contact, and speech patterns…
          </p>
          <ProgressBar value={analysisProgress} label="Analysis Progress" height={10} />
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>This may take a few minutes</p>
        </motion.div>
      </div>
    );
  }

  const questions: InterviewQuestion[] = session.questions || [];
  const totalQ          = questions.length;
  const currentQuestion = questions[currentQ];
  const allSubmitted    = submitted.size >= totalQ;

  return (
    <div style={{ padding: '24px 28px 48px' }}>

        {/* ── Header ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={18} style={{ color: '#2563EB' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3, fontFamily: 'Poppins, sans-serif' }}>
                {session.job_role}
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                Difficulty: <strong style={{ color: '#111827' }}>{session.difficulty}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB', fontSize: 14, color: '#4B5563', flexShrink: 0 }}>
            <Clock size={14} style={{ color: '#2563EB' }} />
            Question&nbsp;<strong style={{ color: '#111827' }}>{currentQ + 1}</strong>&nbsp;of&nbsp;{totalQ}
          </div>
        </motion.div>

        {/* ── Progress track ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          {Array.from({ length: totalQ }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              title={`Q${i + 1}${submitted.has(i) ? ' ✓' : ''}`}
              style={{
                flex: i === currentQ ? 2 : 1,
                height: 8,
                borderRadius: 99,
                border: 'none',
                cursor: 'pointer',
                transition: 'all .3s',
                background: submitted.has(i)
                  ? '#22c55e'
                  : i === currentQ
                  ? '#2563EB'
                  : '#E5E7EB',
              }}
            />
          ))}
        </div>

        {/* ── Two-column layout ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.35fr',
                gap: 28,
                alignItems: 'start',
              }}
            >
              {/* ── Left: Question + Tips + Nav pills ────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Question card */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '28px 28px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className={`badge badge-${currentQuestion.type === 'technical' ? 'info' : 'warning'}`}>
                      {currentQuestion.type}
                    </span>
                    {currentQuestion.focus_area && (
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                        {currentQuestion.focus_area}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.65 }}>
                    {currentQuestion.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, paddingTop: 16, borderTop: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
                    <Clock size={12} />
                    Suggested duration: ~{currentQuestion.expected_duration_seconds}s
                  </div>
                </div>

                {/* Tips card */}
                <div style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Lightbulb size={15} style={{ color: '#2563EB' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Interview Tips</span>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      'Use the STAR method (Situation, Task, Action, Result)',
                      'Keep eye contact with the camera while speaking',
                      'Speak clearly and at a steady, confident pace',
                      'Stay within the suggested duration for best results',
                    ].map((tip, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', marginTop: 5, flexShrink: 0 }} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Question number pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Array.from({ length: totalQ }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      style={{
                        width: 38, height: 38,
                        borderRadius: 10, border: 'none',
                        fontSize: 13, fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all .2s',
                        background: i === currentQ
                          ? '#2563EB'
                          : submitted.has(i)
                          ? 'rgba(34,197,94,.12)'
                          : '#fff',
                        color: i === currentQ
                          ? '#fff'
                          : submitted.has(i)
                          ? '#22c55e'
                          : '#6B7280',
                        boxShadow: i === currentQ ? '0 2px 8px rgba(37,99,235,.3)' : 'none',
                        outline: submitted.has(i) ? '1.5px solid rgba(34,197,94,.4)' : i === currentQ ? 'none' : '1px solid #E5E7EB',
                      }}
                    >
                      {submitted.has(i) ? '✓' : i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Right: Video recorder ─────────────────────── */}
              <div>
                {submitted.has(currentQ) ? (
                  <div
                    style={{
                      background: '#fff', borderRadius: 12,
                      border: '1.5px solid rgba(34,197,94,.3)',
                      padding: '64px 32px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', textAlign: 'center', gap: 14,
                    }}
                  >
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={36} style={{ color: '#22c55e' }} />
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>Answer Submitted!</p>
                    <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 260 }}>
                      Navigate to the next question or finish when all are done.
                    </p>
                  </div>
                ) : (
                  <VideoRecorder
                    onRecordingComplete={handleRecordingComplete}
                    maxDuration={currentQuestion.expected_duration_seconds + 60}
                    questionText=""
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation footer ─────────────────────────────── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 36, paddingTop: 24, borderTop: '1px solid #E5E7EB',
          }}
        >
          <button
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="btn-secondary"
            style={{ padding: '10px 22px', opacity: currentQ === 0 ? 0.35 : 1 }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span style={{ fontSize: 14, color: '#6B7280' }}>
            <strong style={{ color: '#111827' }}>{submitted.size}</strong>
            &nbsp;/ {totalQ} answered
          </span>

          {currentQ < totalQ - 1 ? (
            <button
              onClick={() => setCurrentQ((p) => Math.min(totalQ - 1, p + 1))}
              className="btn-primary"
              style={{ padding: '10px 22px' }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!allSubmitted}
              className="btn-primary"
              style={{
                padding: '10px 22px',
                background: allSubmitted ? '#22c55e' : undefined,
                opacity: allSubmitted ? 1 : 0.4,
                cursor: allSubmitted ? 'pointer' : 'not-allowed',
              }}
            >
              <CheckCircle size={16} />
              Finish & Analyze
            </button>
          )}
        </div>

    </div>
  );
}
