import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWindowWidth } from '../hooks/useWindowWidth';
import { motion } from 'framer-motion';
import ReplayPlayer from '../components/ReplayPlayer';
import { interviewAPI } from '../services/api';
import type { InterviewAnswer } from '../types';
import { Loader2, ChevronLeft, Play } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ReplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [answers, setAnswers]       = useState<InterviewAnswer[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading]       = useState(true);
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  useEffect(() => {
    if (!sessionId) return;
    interviewAPI
      .getAnswers(sessionId)
      .then(setAnswers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  /* -- Loading ------------------------------------------- */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C3AED' }} />
      </div>
    );
  }

  /* -- Empty state --------------------------------------- */
  if (answers.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <Play size={48} style={{ color: '#d1d5db', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20 }}>No recordings found for this session</p>
          <Link
            to={`/interview/${sessionId}/report`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 8,
              border: '1.5px solid #DDD6FE', backgroundColor: 'transparent',
              color: '#7C3AED', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <ChevronLeft size={14} /> Back to Report
          </Link>
        </div>
      </div>
    );
  }

  const current = answers[selectedIdx];

  /* -- Main ---------------------------------------------- */
  return (
    <div style={{ padding: isMobile ? '16px 16px 40px' : '24px 28px 48px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <Link
            to={`/interview/${sessionId}/report`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280', textDecoration: 'none', marginBottom: 14 }}
          >
            <ChevronLeft size={14} /> Back to Report
          </Link>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#1E1B4B', margin: '0 0 8px' }}>
            Interview{' '}
            <span style={{ color: '#7C3AED' }}>
              Replay
            </span>
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{current?.question_text}</p>
        </motion.div>

        {/* Question tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {answers.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setSelectedIdx(i)}
              style={{
                flexShrink: 0,
                padding: '8px 18px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: i === selectedIdx ? '1.5px solid #7C3AED' : '1.5px solid #E9E5F5',
                backgroundColor: i === selectedIdx ? '#F5F3FF' : '#fff',
                color: i === selectedIdx ? '#7C3AED' : '#6B7280',
                transition: 'all .15s',
              }}
            >
              Question {i + 1}
            </button>
          ))}
        </div>

        {/* Replay Player */}
        <motion.div
          key={selectedIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ReplayPlayer
            videoUrl={`${API_BASE}/interview/${sessionId}/video/${current.question_index}?token=${localStorage.getItem('access_token') ?? ''}`}
            feedbackTimestamps={current.feedback_timestamps || []}
            eyeContactTimeline={current.eye_contact_timeline || []}
            transcript={current.transcript}
          />
        </motion.div>
      </div>
  );
}
