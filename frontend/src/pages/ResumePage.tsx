import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Sparkles, History, X, Calendar, Target } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';

const P = '#7C3AED';
const P_BG = '#F5F3FF';
const P_BD = '#DDD6FE';
const TEXT = '#1E1B4B';
const MUTED = '#6B7280';
const BORDER = '#E9E5F5';

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 10,
};

/* ── Parse suggestion text into structured parts ── */
interface SuggestionPart {
  type: 'intro' | 'item';
  title?: string;
  body: string;
}

function parseSuggestion(text: string): SuggestionPart[] {
  const parts: SuggestionPart[] = [];
  // Split on numbered list items: "1. " or "1) "
  const chunks = text.split(/(?=\d+\.\s)/);
  chunks.forEach(chunk => {
    const numbered = chunk.match(/^(\d+)\.\s+\*\*([^*]+)\*\*[:\s]*([\s\S]*)/);
    if (numbered) {
      parts.push({ type: 'item', title: numbered[2].replace(/:$/, ''), body: numbered[3].trim() });
    } else {
      const clean = chunk.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
      if (clean) parts.push({ type: 'intro', body: clean });
    }
  });
  return parts;
}

/* Render inline **bold** spans */
function renderBold(text: string) {
  const segments = text.split(/\*\*([^*]+)\*\*/g);
  return segments.map((seg, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 700, color: '#4C1D95' }}>{seg}</strong>
      : seg
  );
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState('');
  const [showBullets, setShowBullets] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /* history popup */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const resetFile = () => { setFile(null); setFileInputKey(k => k + 1); };

  const loadResult = (data: ResumeAnalysis) => {
    setResult(data);
    resetFile();
    setJd('');
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    if (history.length > 0) return;
    setHistLoading(true);
    try {
      const data = await resumeAPI.getHistory();
      setHistory(data);
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  };

  /* close on outside click */
  useEffect(() => {
    if (!historyOpen) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [historyOpen]);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await resumeAPI.analyze(file, jd);
      loadResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith('.pdf')) setFile(dropped);
  };

  return (
    <div style={{ padding: '24px 28px 48px' }}>

      {/* ── Page header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
          Upload your resume to receive an ATS compatibility score, skill gap analysis, and targeted bullet point improvements.
        </p>
        <button
          onClick={openHistory}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: '1px solid #E9E5F5',
            background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0, marginLeft: 16,
            transition: 'all .15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F5F3FF';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDD6FE';
            (e.currentTarget as HTMLButtonElement).style.color = P;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#fff';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E9E5F5';
            (e.currentTarget as HTMLButtonElement).style.color = '#374151';
          }}
        >
          <History size={14} /> History
        </button>
      </div>

      {/* ── History popup ── */}
      <AnimatePresence>
        {historyOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
              }}
            />
            {/* Drawer */}
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, x: 320 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
                width: 420, background: '#fff',
                boxShadow: '-4px 0 32px rgba(124,58,237,.08)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid #E9E5F5',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={16} style={{ color: P }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', fontFamily: 'Poppins, sans-serif' }}>
                    Analysis History
                  </span>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {histLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: P }} />
                  </div>
                ) : history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <FileText size={40} style={{ color: '#D1D5DB', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>No previous analyses found.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { loadResult(item); setHistoryOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 16px', borderRadius: 10,
                          border: '1px solid #E9E5F5', background: '#fff',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#F5F3FF';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDD6FE';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#E9E5F5';
                        }}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                          background: '#F5F3FF', border: '1px solid #DDD6FE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={18} style={{ color: P }} />
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 13, fontWeight: 700, color: '#1E1B4B',
                            margin: '0 0 4px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.filename || 'Resume'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                              <Calendar size={10} />
                              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                              <Target size={10} />
                              v{item.version_number}
                            </span>
                          </div>
                        </div>

                        {/* ATS score */}
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          background: item.ats_score >= 70 ? 'rgba(22,163,74,.1)' : item.ats_score >= 50 ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.1)',
                          borderRadius: 8, padding: '6px 12px', flexShrink: 0,
                        }}>
                          <span style={{
                            fontSize: 18, fontWeight: 800, lineHeight: 1,
                            color: item.ats_score >= 70 ? '#16a34a' : item.ats_score >= 50 ? '#d97706' : '#dc2626',
                            fontFamily: 'Poppins, sans-serif',
                          }}>
                            {item.ats_score}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', letterSpacing: '.05em', textTransform: 'uppercase' }}>ATS</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap: 24 }}>

          {/* ── Upload card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #E9E5F5',
              boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
              padding: '28px',
              display: 'flex', flexDirection: 'column', gap: 24,
            }}
          >
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 17, fontWeight: 700, color: TEXT, margin: 0 }}>
              Upload Resume
            </h3>

            {/* Drop zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                padding: '36px 24px',
                border: `2px dashed ${dragOver ? P : file ? '#22c55e' : BORDER}`,
                borderRadius: 14,
                background: dragOver ? 'rgba(124,58,237,.04)' : file ? 'rgba(34,197,94,.04)' : '#F8F7FF',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: file ? 'rgba(34,197,94,.12)' : P_BG,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {file
                  ? <CheckCircle size={26} color="#22c55e" />
                  : <Upload size={26} color={P} />
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: '0 0 4px' }}>
                  {file ? file.name : 'Click or drag PDF here'}
                </p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF format · max 5 MB'}
                </p>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); resetFile(); }}
                  style={{ fontSize: 12, color: P, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Remove
                </button>
              )}
              <input key={fileInputKey} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>

            {/* JD textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 8 }}>
                Job Description <span style={{ fontWeight: 400, color: MUTED }}>(optional)</span>
              </label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description for JD-specific gap analysis…"
                className="input"
                style={{ minHeight: 120, resize: 'vertical' }}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                    color: '#ef4444', borderRadius: 10, padding: '12px 14px', fontSize: 13,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '15px 0', borderRadius: 8, border: 'none',
                background: !file ? '#9CA3AF' : loading ? '#C4B5FD' : P,
                color: !file ? '#6B7280' : '#fff',
                fontSize: 15, fontWeight: 600,
                cursor: !file || loading ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {loading
                ? <><Loader2 className="animate-spin" size={18} /> Analysing…</>
                : <><Sparkles size={16} /> Analyse Resume</>
              }
            </button>
          </motion.div>

          {/* ── Score snapshot card (right col) ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: '#fff', borderRadius: 14,
              border: '1px solid #E9E5F5',
              boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
              padding: '28px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {!result ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 10, background: '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <FileText size={28} style={{ opacity: 0.3 }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: MUTED, margin: '0 0 6px' }}>Your score will appear here</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, textAlign: 'center', maxWidth: 220 }}>Upload your resume and click Analyse Resume to get your results.</p>
              </div>
            ) : (() => {
              const score = result.ats_score || 0;
              const grade = score >= 80 ? { label: 'Excellent',  color: '#16a34a', track: '#dcfce7', arc: '#22c55e' }
                          : score >= 65 ? { label: 'Good',       color: '#7C3AED', track: '#EDE9FE', arc: '#8B5CF6' }
                          : score >= 50 ? { label: 'Fair',        color: '#d97706', track: '#fef3c7', arc: '#f59e0b' }
                          :               { label: 'Needs Work',  color: '#dc2626', track: '#fee2e2', arc: '#ef4444' };

              /* inline ring — no SVG gradient IDs, no webkit clip */
              const RING = 160, SW = 12;
              const R = (RING - SW) / 2;
              const CIRC = 2 * Math.PI * R;
              const arcOffset = CIRC - (score / 100) * CIRC;

              return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                  {/* Ring */}
                  <div style={{ position: 'relative', width: RING, height: RING }}>
                    <svg width={RING} height={RING} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                      {/* track */}
                      <circle cx={RING/2} cy={RING/2} r={R} fill="none" stroke={grade.track} strokeWidth={SW} />
                      {/* arc */}
                      <motion.circle
                        cx={RING/2} cy={RING/2} r={R}
                        fill="none" stroke={grade.arc} strokeWidth={SW} strokeLinecap="round"
                        strokeDasharray={CIRC}
                        initial={{ strokeDashoffset: CIRC }}
                        animate={{ strokeDashoffset: arcOffset }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                      />
                    </svg>
                    {/* center label */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                        style={{ fontFamily: 'Poppins, sans-serif', fontSize: 36, fontWeight: 800, lineHeight: 1, color: grade.color }}
                      >
                        {score}
                      </motion.span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '.04em' }}>/100</span>
                    </div>
                  </div>

                  {/* Grade + blurb */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '4px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: grade.color, background: grade.track, marginBottom: 8 }}>
                      {grade.label}
                    </span>
                    <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                      {score >= 80 ? 'Your resume is well-optimised for ATS systems.' :
                       score >= 65 ? 'Good start — a few tweaks will push you higher.' :
                       score >= 50 ? 'Your resume needs some keyword and format improvements.' :
                                     'Significant improvements needed to pass ATS filters.'}
                    </p>
                  </div>

                  {/* Quick stats */}
                  {(() => {
                    const skipped = result.keyword_gaps?.length ?? 0;
                    const found   = result.skills_found?.length ?? 0;
                    const bullets = result.weak_bullets?.length ?? 0;
                    const stats = [
                      { value: found,   label: 'Skills matched', color: '#16a34a', bg: 'rgba(22,163,74,.08)',   bd: 'rgba(22,163,74,.25)'   },
                      { value: skipped, label: 'Keywords missing', color: '#d97706', bg: 'rgba(217,119,6,.08)', bd: 'rgba(217,119,6,.3)'   },
                      { value: bullets, label: 'Bullets to fix',  color: P,         bg: P_BG,                  bd: P_BD                    },
                    ];
                    return (
                      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {stats.map(s => (
                          <div key={s.label} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '10px 6px', borderRadius: 8,
                            background: s.bg, border: `1px solid ${s.bd}`,
                          }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>{s.value}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 3, textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Scroll CTA */}
                  <button
                    onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 8,
                      border: `1px solid ${P_BD}`, background: P_BG,
                      color: P, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6, transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EDE9FE')}
                    onMouseLeave={e => (e.currentTarget.style.background = P_BG)}
                  >
                    View Full Analysis <ChevronDown size={15} />
                  </button>
                </motion.div>
              );
            })()}
          </motion.div>
        </div>

        {/* ══ Full-width detailed results ══ */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
            >

              {/* ── Empty state when PDF had no extractable content ── */}
              {(() => {
                const hasAny = result.overall_suggestion ||
                  (result.keyword_gaps?.length ?? 0) > 0 ||
                  (result.skills_found?.length ?? 0) > 0 ||
                  (result.weak_bullets?.length ?? 0) > 0 ||
                  (result.bias_flags?.length ?? 0) > 0;
                if (hasAny) return null;
                return (
                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: '1px solid #FDE68A',
                    padding: '28px 28px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', gap: 10,
                  }}>
                    <div style={{ fontSize: 32 }}>📄</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Limited content detected</p>
                    <p style={{ fontSize: 13, color: MUTED, margin: 0, maxWidth: 440, lineHeight: 1.7 }}>
                      We could extract your ATS score, but couldn't find enough structured content
                      (skills, bullet points, or keywords) to analyse. This usually happens with
                      image-based PDFs, scanned documents, or heavily formatted resumes.
                      Try uploading a plain-text PDF export for the best results.
                    </p>
                  </div>
                );
              })()}

              {/* ── Section navigator ── */}
              <div style={{
                background: '#fff', borderRadius: 14,
                border: '1px solid #E9E5F5',
                padding: '12px 20px',
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginRight: 4, whiteSpace: 'nowrap' }}>
                  Jump to:
                </span>
                {([
                  result.overall_suggestion
                    ? { id: 'sec-rec', label: '💡 Recommendations', color: P, bg: P_BG, bd: P_BD }
                    : null,
                  (result.keyword_gaps?.length ?? 0) > 0
                    ? { id: 'sec-kw', label: `🔑 ${result.keyword_gaps!.length} Missing Keyword${result.keyword_gaps!.length !== 1 ? 's' : ''}`, color: '#d97706', bg: 'rgba(217,119,6,.08)', bd: 'rgba(217,119,6,.3)' }
                    : null,
                  (result.skills_found?.length ?? 0) > 0
                    ? { id: 'sec-sk', label: `✓ ${result.skills_found!.length} Skills Found`, color: '#16a34a', bg: 'rgba(22,163,74,.08)', bd: 'rgba(22,163,74,.25)' }
                    : null,
                  (result.weak_bullets?.length ?? 0) > 0
                    ? { id: 'sec-bu', label: `✏️ ${result.weak_bullets!.length} Bullet Upgrade${result.weak_bullets!.length !== 1 ? 's' : ''}`, color: P, bg: P_BG, bd: P_BD }
                    : null,
                  (result.bias_flags?.length ?? 0) > 0
                    ? { id: 'sec-bi', label: '⚠️ Inclusion Check', color: '#ca8a04', bg: '#fef9c3', bd: '#FDE68A' }
                    : null,
                ] as Array<{ id: string; label: string; color: string; bg: string; bd: string } | null>)
                  .filter((s): s is { id: string; label: string; color: string; bg: string; bd: string } => s !== null)
                  .map(s => (
                    <button
                      key={s.id}
                      onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{
                        padding: '5px 14px', borderRadius: 999,
                        fontSize: 12, fontWeight: 600,
                        color: s.color, background: s.bg,
                        border: `1px solid ${s.bd}`,
                        cursor: 'pointer', transition: 'opacity .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      {s.label}
                    </button>
                  ))}
              </div>

              {/* Overall suggestion banner */}
              {result.overall_suggestion && (() => {
                const parts = parseSuggestion(result.overall_suggestion);
                return (
                  <div id="sec-rec" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '20px 24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={16} color="#fff" />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: P, margin: 0 }}>How to Improve Your Resume</p>
                    </div>

                    {/* Intro paragraph */}
                    {parts.filter(p => p.type === 'intro').map((p, i) => (
                      <p key={i} style={{ fontSize: 13, color: '#5B21B6', lineHeight: 1.7, margin: '0 0 16px' }}>
                        {renderBold(p.body)}
                      </p>
                    ))}

                    {/* Numbered action items */}
                    {parts.filter(p => p.type === 'item').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {parts.filter(p => p.type === 'item').map((p, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: 14, alignItems: 'flex-start',
                            background: '#fff', borderRadius: 8,
                            border: '1px solid #DDD6FE', padding: '14px 16px',
                          }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                              background: P, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 800, fontFamily: 'Poppins, sans-serif',
                            }}>
                              {i + 1}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95', margin: '0 0 4px' }}>{p.title}</p>
                              <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                                {renderBold(p.body)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', gap: 16 }}>

                {/* Missing keywords */}
                {result.keyword_gaps && result.keyword_gaps.length > 0 && (
                  <div id="sec-kw" style={{ background: '#fff', borderRadius: 14, border: '1px solid #E9E5F5', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '22px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(217,119,6,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={15} color="#d97706" />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Keywords to Add</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>These words from the job description are missing in your resume</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {result.keyword_gaps.map((kw, i) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(217,119,6,.08)', color: '#92400e', border: '1px solid rgba(217,119,6,.25)' }}>
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills found */}
                {result.skills_found && result.skills_found.length > 0 && (
                  <div id="sec-sk" style={{ background: '#fff', borderRadius: 14, border: '1px solid #E9E5F5', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '22px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(22,163,74,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={15} color="#16a34a" />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Skills You Already Have</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>These are already visible in your resume — great work!</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {result.skills_found.map((sk, i) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(22,163,74,.08)', color: '#15803d', border: '1px solid rgba(22,163,74,.2)' }}>
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bullet improvements — before/after */}
              {result.weak_bullets && result.weak_bullets.length > 0 && (
                <div id="sec-bu" style={{ background: '#fff', borderRadius: 14, border: '1px solid #E9E5F5', boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setShowBullets(!showBullets)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: P_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={15} color={P} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Rewrite These Bullet Points</p>
                        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{result.weak_bullets.length} weak bullets found — see stronger versions below</p>
                      </div>
                    </div>
                    {showBullets ? <ChevronUp size={16} color={MUTED} /> : <ChevronDown size={16} color={MUTED} />}
                  </button>
                  <AnimatePresence>
                    {showBullets && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ borderTop: '1px solid #E9E5F5', padding: '8px 24px 24px' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                          {result.weak_bullets.map((wb, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(220,38,38,.04)', border: '1px solid rgba(220,38,38,.15)' }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Before</p>
                                <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>{wb.original}</p>
                              </div>
                              <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(22,163,74,.04)', border: '1px solid rgba(22,163,74,.2)' }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>After ✓</p>
                                <p style={{ fontSize: 13, color: '#14532d', margin: 0, lineHeight: 1.6 }}>{wb.improved}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Bias / inclusion warnings */}
              {result.bias_flags && result.bias_flags.length > 0 && (
                <div id="sec-bi" style={{ background: '#fff', borderRadius: 14, border: '1px solid #FDE68A', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '22px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={15} color="#ca8a04" />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Inclusion Check</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>These phrases could unintentionally signal bias to recruiters — consider rewording</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.bias_flags.map((bf, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: '#fefce8', border: '1px solid #FDE68A' }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                        <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.55 }}>{bf}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

    </div>
  );
}
