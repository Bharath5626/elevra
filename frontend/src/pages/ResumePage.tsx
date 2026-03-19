import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import ScoreCard from '../components/ScoreCard';
import { resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-surface-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 10,
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState('');
  const [showBullets, setShowBullets] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await resumeAPI.analyze(file, jd);
      setResult(res);
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
      <p style={{ fontSize: 13, color: '#685f78', margin: '0 0 24px' }}>
        Upload your resume and get AI-powered ATS scoring, skill gap analysis, and bullet improvements.
      </p>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap: 24 }}>

          {/* ── Upload card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #E7E7E7',
              boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
              padding: '28px',
              display: 'flex', flexDirection: 'column', gap: 24,
            }}
          >
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--color-secondary-500)', margin: 0 }}>
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
                border: `2px dashed ${dragOver ? 'var(--color-primary-400)' : file ? '#22c55e' : 'var(--color-surface-300)'}`,
                borderRadius: 14,
                background: dragOver ? 'rgba(255,101,117,.04)' : file ? 'rgba(34,197,94,.04)' : 'var(--color-surface-50)',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: file ? 'rgba(34,197,94,.12)' : 'rgba(255,101,117,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {file
                  ? <CheckCircle size={26} color="#22c55e" />
                  : <Upload size={26} color="var(--color-primary-400)" />
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-secondary-500)', margin: '0 0 4px' }}>
                  {file ? file.name : 'Click or drag PDF here'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-surface-500)', margin: 0 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF format · max 5 MB'}
                </p>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setFile(null); }}
                  style={{ fontSize: 12, color: 'var(--color-primary-400)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Remove
                </button>
              )}
              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>

            {/* JD textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-secondary-500)', marginBottom: 8 }}>
                Job Description <span style={{ fontWeight: 400, color: 'var(--color-surface-500)' }}>(optional)</span>
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
                width: '100%', padding: '15px 0', borderRadius: 50, border: 'none',
                background: !file ? 'var(--color-surface-300)' : loading ? 'var(--color-primary-200)' : 'var(--color-primary-400)',
                color: !file ? 'var(--color-surface-500)' : '#fff',
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

          {/* ── Results card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #E7E7E7',
              boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
              padding: '28px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--color-secondary-500)', margin: '0 0 24px' }}>
              Analysis Results
            </h3>

            {!result ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: 'var(--color-surface-400)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-surface-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <FileText size={28} style={{ opacity: 0.4 }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-surface-500)', margin: '0 0 4px' }}>No analysis yet</p>
                <p style={{ fontSize: 13, color: 'var(--color-surface-400)', margin: 0 }}>Upload a PDF and click Analyse</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ATS Score centred */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <ScoreCard score={result.ats_score || 0} label="ATS Score" size={140} />
                </div>

                {/* Keyword gaps */}
                {result.keyword_gaps && result.keyword_gaps.length > 0 && (
                  <div>
                    <p style={sectionTitle}>Keyword Gaps</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {result.keyword_gaps.map((kw: string, i: number) => (
                        <span key={i} className="badge badge-warning">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills found */}
                {result.skills_found && (result.skills_found as string[]).length > 0 && (
                  <div>
                    <p style={sectionTitle}>Skills Found</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(result.skills_found as string[]).map((sk: string, i: number) => (
                        <span key={i} className="badge badge-success">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improved bullets collapsible */}
                {result.improved_bullets && (result.improved_bullets as string[]).length > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-surface-200)', paddingTop: 16 }}>
                    <button
                      onClick={() => setShowBullets(!showBullets)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: 600, color: 'var(--color-primary-400)', padding: 0,
                      }}
                    >
                      <CheckCircle size={15} />
                      Improved Bullet Points
                      {showBullets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <AnimatePresence>
                      {showBullets && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}
                        >
                          {(result.improved_bullets as string[]).map((b: string, i: number) => (
                            <li key={i} style={{
                              fontSize: 13, color: 'var(--color-surface-600)',
                              paddingLeft: 16, borderLeft: '3px solid var(--color-primary-200)',
                              lineHeight: 1.55,
                            }}>
                              {b}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Bias flags */}
                {result.bias_flags && (result.bias_flags as string[]).length > 0 && (
                  <div>
                    <p style={sectionTitle}>Bias Flags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(result.bias_flags as string[]).map((bf: string, i: number) => (
                        <span key={i} className="badge badge-danger">{bf}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Readability bar */}
                {typeof result.overall_readability === 'number' && (
                  <div style={{ borderTop: '1px solid var(--color-surface-200)', paddingTop: 16 }}>
                    <ProgressBar value={result.overall_readability} label="Readability Score" height={12} />
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
    </div>
  );
}
