import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewAPI, resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';
import { Mic, Briefcase, BarChart2, ArrowRight, Sparkles, AlertCircle, Loader2, FileText, Upload } from 'lucide-react';

const roles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Analyst', 'Machine Learning Engineer', 'DevOps Engineer',
  'Mobile Developer', 'UI/UX Designer', 'Software Engineer', 'Product Manager',
];

const difficulties = [
  { value: '1', label: 'Fresher',   desc: 'Entry-level questions',  color: '#22c55e' },
  { value: '2', label: 'Junior',    desc: '0–1 years experience',   color: '#3b82f6' },
  { value: '3', label: 'Mid-Level', desc: '1–3 years experience',   color: '#f59e0b' },
  { value: '4', label: 'Senior',    desc: '3–5 years experience',   color: '#ef4444' },
  { value: '5', label: 'Lead',      desc: '5+ years experience',    color: '#a855f7' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [difficulty, setDifficulty] = useState('1');
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    resumeAPI.getHistory().then(setResumes).catch(() => {});
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const analysis = await resumeAPI.analyze(file, '');
      setResumes((prev) => {
        const exists = prev.find((r) => r.id === analysis.id);
        return exists ? prev : [analysis, ...prev];
      });
      setSelectedResume(analysis.id);
    } catch {
      setUploadError('Failed to analyze resume. Check that the file is a valid PDF or DOCX.');
    } finally {
      setUploading(false);
    }
  };

  const handleStart = async () => {
    const finalRole = role === 'custom' ? customRole : role;
    if (!finalRole) { setError('Please select or enter a job role.'); return; }
    setLoading(true);
    setError('');
    try {
      const session = await interviewAPI.startSession(selectedResume, finalRole, difficulty);
      navigate(`/interview/${session.id}/session`);
    } catch {
      setError('Failed to start session. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ background: 'linear-gradient(135deg, #f7f7ff 0%, #f0f4ff 100%)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 64 }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 30, fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 8 }}>
            Mock <span className="gradient-text">Interview</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--color-surface-600)', lineHeight: 1.6 }}>
            Set up your session — AI will generate tailored questions based on your profile
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Resume picker */}
          <motion.div {...fadeUp(0.05)} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-secondary-500)' }}>
                  Resume <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-surface-400)' }}>(optional)</span>
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>Choose a saved resume or upload a new one</p>
              </div>
            </div>

            {/* Dropdown + upload row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="input"
                style={{ flex: 1, fontSize: 14 }}
              >
                <option value="">— No resume —</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename}  •  ATS {r.ats_score ?? 0}/100
                  </option>
                ))}
              </select>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 18px', borderRadius: 8, flexShrink: 0,
                  border: '1.5px solid var(--color-primary-400)',
                  background: 'var(--color-primary-50)',
                  color: 'var(--color-primary-400)',
                  fontSize: 13, fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                  transition: 'all .2s', whiteSpace: 'nowrap',
                }}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Analyzing…' : 'Upload'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Upload error */}
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', fontSize: 13, color: '#ef4444', marginTop: 12 }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {uploadError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Job role */}
          <motion.div {...fadeUp(0.1)} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={18} style={{ color: 'var(--color-accent-700)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-secondary-500)' }}>Job Role</p>
                <p style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>Pick the role you are interviewing for</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
              {roles.map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setCustomRole(''); }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: `1.5px solid ${active ? 'var(--color-primary-400)' : 'var(--color-surface-300)'}`,
                      background: active ? 'var(--color-primary-50)' : '#fff',
                      color: active ? 'var(--color-primary-400)' : 'var(--color-surface-600)',
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all .2s ease',
                    }}
                  >
                    {r}
                  </button>
                );
              })}
              <button
                onClick={() => setRole('custom')}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1.5px dashed ${role === 'custom' ? 'var(--color-primary-400)' : 'var(--color-surface-400)'}`,
                  background: role === 'custom' ? 'var(--color-primary-50)' : 'transparent',
                  color: role === 'custom' ? 'var(--color-primary-400)' : 'var(--color-surface-500)',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                }}
              >
                + Custom Role
              </button>
            </div>

            {role === 'custom' && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter your job role..."
                className="input"
                style={{ marginTop: 4 }}
                autoFocus
              />
            )}
          </motion.div>

          {/* Difficulty */}
          <motion.div {...fadeUp(0.2)} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} style={{ color: 'var(--color-warning-400)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-secondary-500)' }}>Difficulty Level</p>
                <p style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>Match questions to your experience level</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {difficulties.map((d) => {
                const active = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: `1.5px solid ${active ? d.color + '60' : 'var(--color-surface-300)'}`,
                      background: active ? d.color + '0d' : '#fff',
                      cursor: 'pointer',
                      transition: 'all .2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: d.color,
                      flexShrink: 0,
                      boxShadow: active ? `0 0 0 4px ${d.color}25` : 'none',
                      transition: 'box-shadow .2s',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-secondary-500)', marginBottom: 2 }}>{d.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-surface-500)' }}>{d.desc}</p>
                    </div>
                    {active && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(239,68,68,.07)',
                border: '1px solid rgba(239,68,68,.25)',
                fontSize: 14,
                color: '#ef4444',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          {/* Start button */}
          <motion.div {...fadeUp(0.3)}>
            <button
              onClick={handleStart}
              disabled={loading || (!role && !customRole)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px 0',
                fontSize: 16,
                opacity: loading || (!role && !customRole) ? 0.45 : 1,
                cursor: loading || (!role && !customRole) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Generating Questions...</>
              ) : (
                <><Mic size={20} /> Start Mock Interview <ArrowRight size={18} /></>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-surface-500)', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Sparkles size={13} />
              AI will generate 6 tailored questions based on your profile
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
