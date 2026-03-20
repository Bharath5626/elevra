import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewAPI, resumeAPI } from '../services/api';
import type { ResumeAnalysis } from '../types';
import {
  Mic, Briefcase, BarChart2, ArrowRight, Sparkles,
  AlertCircle, Loader2, FileText, Upload, ChevronDown, Search, X,
} from 'lucide-react';

/* ── comprehensive job roles list ── */
const JOB_ROLES = [
  // Engineering
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
  'Mobile Developer', 'iOS Developer', 'Android Developer', 'React Native Developer',
  'Flutter Developer', 'Embedded Systems Engineer', 'Firmware Engineer',
  'Game Developer', 'Graphics Engineer', 'AR/VR Developer',
  // DevOps / Infra / Cloud
  'DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer',
  'Cloud Engineer', 'AWS Solutions Architect', 'GCP Engineer', 'Azure Engineer',
  'Infrastructure Engineer', 'Systems Engineer', 'Linux Admin',
  // Data / AI / ML
  'Data Analyst', 'Data Scientist', 'Data Engineer', 'ML Engineer',
  'Machine Learning Engineer', 'AI Engineer', 'NLP Engineer',
  'Computer Vision Engineer', 'Research Scientist', 'BI Analyst',
  'Analytics Engineer', 'Quantitative Analyst',
  // Security
  'Security Engineer', 'Penetration Tester', 'Security Analyst',
  'Application Security Engineer', 'SOC Analyst',
  // QA / Testing
  'QA Engineer', 'SDET', 'Test Automation Engineer', 'Performance Engineer',
  // Product / Design
  'Product Manager', 'Senior Product Manager', 'Product Owner',
  'UI/UX Designer', 'UX Researcher', 'Product Designer', 'Visual Designer',
  'Interaction Designer', 'Design Systems Engineer',
  // Management / Leadership
  'Engineering Manager', 'VP of Engineering', 'CTO', 'Tech Lead',
  'Team Lead', 'Scrum Master', 'Agile Coach',
  // Business / Other Tech
  'Business Analyst', 'Technical Program Manager', 'Solutions Architect',
  'Technical Writer', 'Developer Advocate', 'Blockchain Developer',
  'Web3 Developer', 'Cybersecurity Analyst', 'Network Engineer',
].sort();

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

const P      = '#2563EB';
const P_BG   = '#EFF6FF';
const P_BD   = '#BFDBFE';
const BORDER = '#E5E7EB';
const TEXT   = '#111827';
const MUTED  = '#6B7280';

export default function InterviewSetupPage() {
  const navigate    = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  const [jobRole, setJobRole]           = useState('');
  const [showDrop, setShowDrop]         = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [difficulty, setDifficulty]     = useState('1');
  const [resumes, setResumes]           = useState<ResumeAnalysis[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  /* filter suggestions — starts-with matches first, then contains */
  const suggestions = jobRole.trim().length === 0
    ? JOB_ROLES
    : [
        ...JOB_ROLES.filter(r => r.toLowerCase().startsWith(jobRole.toLowerCase())),
        ...JOB_ROLES.filter(r =>
          !r.toLowerCase().startsWith(jobRole.toLowerCase()) &&
          r.toLowerCase().includes(jobRole.toLowerCase())
        ),
      ];

  /* show "Use custom" row when typed value is not an exact match */
  const isExactMatch = JOB_ROLES.some(r => r.toLowerCase() === jobRole.toLowerCase());
  const showCustomRow = jobRole.trim().length > 0 && !isExactMatch;

  useEffect(() => {
    resumeAPI.getHistory().then(setResumes).catch(() => {});
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectRole = useCallback((r: string) => {
    setJobRole(r);
    setShowDrop(false);
    setHighlightIdx(-1);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.length + (showCustomRow ? 1 : 0);
    if (!showDrop) { if (e.key === 'ArrowDown' || e.key === 'Enter') setShowDrop(true); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => (i + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => (i - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
        selectRole(suggestions[highlightIdx]);
      } else if (showCustomRow && highlightIdx === suggestions.length) {
        setShowDrop(false);
      } else if (jobRole.trim()) {
        setShowDrop(false);
      }
    } else if (e.key === 'Escape') {
      setShowDrop(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true); setUploadError('');
    try {
      const analysis = await resumeAPI.analyze(file, '');
      setResumes(prev => {
        const exists = prev.find(r => r.id === analysis.id);
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
    if (!jobRole.trim()) { setError('Please select or enter a job role.'); return; }
    setLoading(true); setError('');
    try {
      const session = await interviewAPI.startSession(selectedResume, jobRole.trim(), difficulty);
      navigate(`/interview/${session.id}/session`);
    } catch {
      setError('Failed to start session. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: 760, margin: '0 auto' }}>

      {/* Header */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 30, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
          Mock <span style={{ color: P }}>Interview</span>
        </h1>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6 }}>
          Set up your session — questions are intelligently tailored to your role and experience
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Resume picker */}
        <motion.div {...fadeUp(0.05)} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: P_BG, border: `1px solid ${P_BD}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} style={{ color: P }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>
                Resume <span style={{ fontWeight: 400, fontSize: 13, color: MUTED }}>(optional)</span>
              </p>
              <p style={{ fontSize: 13, color: MUTED }}>Choose a saved resume or upload a new one</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={selectedResume}
              onChange={e => setSelectedResume(e.target.value)}
              className="input"
              style={{ flex: 1, fontSize: 14 }}
            >
              <option value="">— No resume —</option>
              {resumes.map(r => (
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
                padding: '0 18px', flexShrink: 0,
                border: `1.5px solid ${P}`, background: P_BG, color: P,
                fontSize: 13, fontWeight: 600, borderRadius: 6,
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.6 : 1, whiteSpace: 'nowrap',
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
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', marginTop: 12, borderRadius: 8,
                  background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)',
                  fontSize: 13, color: '#ef4444',
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {uploadError}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Job Role combobox */}
        <motion.div {...fadeUp(0.1)} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: P_BG, border: `1px solid ${P_BD}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} style={{ color: P }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Job Role</p>
              <p style={{ fontSize: 13, color: MUTED }}>
                Type to search or enter a custom role
              </p>
            </div>
          </div>

          {/* combobox wrapper */}
          <div style={{ position: 'relative' }}>
            {/* input row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${showDrop ? P : BORDER}`,
              background: '#fff',
              transition: 'border-color .15s',
              padding: '0 12px', gap: 8,
            }}>
              <Search size={15} style={{ color: MUTED, flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={jobRole}
                onChange={e => { setJobRole(e.target.value); setShowDrop(true); setHighlightIdx(-1); }}
                onFocus={() => setShowDrop(true)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Frontend Developer, Data Scientist..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, color: TEXT, background: 'transparent',
                  padding: '12px 0', fontFamily: 'inherit',
                }}
              />
              {jobRole && (
                <button
                  onClick={() => { setJobRole(''); setHighlightIdx(-1); inputRef.current?.focus(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
              <ChevronDown
                size={15}
                style={{ color: MUTED, flexShrink: 0, transform: showDrop ? 'rotate(180deg)' : 'none', transition: 'transform .2s', cursor: 'pointer' }}
                onClick={() => { setShowDrop(v => !v); inputRef.current?.focus(); }}
              />
            </div>

            {/* dropdown */}
            <AnimatePresence>
              {showDrop && (suggestions.length > 0 || showCustomRow) && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: `1px solid ${BORDER}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                    zIndex: 100, maxHeight: 340, overflowY: 'auto',
                  }}
                >
                  {jobRole.trim().length === 0 && (
                    <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'monospace' }}>
                      All Roles — scroll to browse
                    </div>
                  )}

                  {suggestions.map((r, i) => (
                    <div
                      key={r}
                      onMouseDown={() => selectRole(r)}
                      onMouseEnter={() => setHighlightIdx(i)}
                      style={{
                        padding: '10px 14px',
                        fontSize: 14, color: highlightIdx === i ? P : TEXT,
                        background: highlightIdx === i ? P_BG : 'transparent',
                        borderLeft: `2px solid ${highlightIdx === i ? P : 'transparent'}`,
                        cursor: 'pointer', transition: 'all .1s',
                        fontWeight: highlightIdx === i ? 600 : 400,
                      }}
                    >
                      {r}
                    </div>
                  ))}

                  {showCustomRow && (
                    <div
                      onMouseDown={() => { setShowDrop(false); }}
                      onMouseEnter={() => setHighlightIdx(suggestions.length)}
                      style={{
                        padding: '10px 14px',
                        fontSize: 14,
                        color: highlightIdx === suggestions.length ? P : MUTED,
                        background: highlightIdx === suggestions.length ? P_BG : '#F9FAFB',
                        borderLeft: `2px solid ${highlightIdx === suggestions.length ? P : 'transparent'}`,
                        borderTop: `1px solid ${BORDER}`,
                        cursor: 'pointer', fontStyle: 'italic',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, background: P_BG, border: `1px solid ${P_BD}`, color: P, padding: '1px 7px', fontStyle: 'normal', fontWeight: 700, fontFamily: 'monospace' }}>
                        CUSTOM
                      </span>
                      Use "{jobRole}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* selected badge */}
          {jobRole.trim() && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: MUTED }}>Selected:</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: P,
                background: P_BG, border: `1px solid ${P_BD}`,
                padding: '2px 10px',
              }}>
                {jobRole}
              </span>
              {!isExactMatch && jobRole.trim() && (
                <span style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 8px', fontWeight: 600 }}>
                  Custom
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Difficulty */}
        <motion.div {...fadeUp(0.2)} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={18} style={{ color: '#d97706' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>Difficulty Level</p>
              <p style={{ fontSize: 13, color: MUTED }}>Match questions to your experience level</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {difficulties.map(d => {
              const active = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 18px',
                    border: `1.5px solid ${active ? d.color + '60' : BORDER}`,
                    background: active ? d.color + '0d' : '#fff',
                    cursor: 'pointer', transition: 'all .18s', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: d.color, flexShrink: 0,
                    boxShadow: active ? `0 0 0 4px ${d.color}25` : 'none', transition: 'box-shadow .2s',
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{d.label}</p>
                    <p style={{ fontSize: 12, color: MUTED }}>{d.desc}</p>
                  </div>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />}
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
              padding: '14px 18px', borderRadius: 8,
              background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)',
              fontSize: 14, color: '#ef4444',
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
            disabled={loading || !jobRole.trim()}
            style={{
              width: '100%', padding: '16px 0', fontSize: 16, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: loading || !jobRole.trim() ? '#9CA3AF' : P,
              color: '#fff', border: 'none',
              fontWeight: 700, cursor: loading || !jobRole.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background .18s',
            }}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Generating Questions...</>
            ) : (
              <><Mic size={20} /> Start Mock Interview <ArrowRight size={18} /></>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: MUTED, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Sparkles size={13} />
            6 tailored questions will be generated based on your role and experience level
          </p>
        </motion.div>

      </div>
    </div>
  );
}