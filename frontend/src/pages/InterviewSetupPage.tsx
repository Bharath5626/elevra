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
  // ── Language / Stack specific ──
  'Python Developer',
  'JavaScript Developer',
  'TypeScript Developer',
  'Java Developer',
  'C++ Developer',
  'C# Developer',
  'Go Developer',
  'Rust Developer',
  'Ruby Developer',
  'PHP Developer',
  'Swift Developer',
  'Kotlin Developer',
  'Scala Developer',
  'R Developer',
  'Dart Developer',
  // ── Frontend ──
  'Frontend Developer',
  'React Developer',
  'Angular Developer',
  'Vue.js Developer',
  'Next.js Developer',
  'UI Developer',
  'Design Systems Engineer',
  // ── Backend ──
  'Backend Developer',
  'Node.js Developer',
  'Django Developer',
  'FastAPI Developer',
  'Flask Developer',
  'Spring Boot Developer',
  '.NET Developer',
  'Laravel Developer',
  'Ruby on Rails Developer',
  'GraphQL Developer',
  'REST API Developer',
  // ── Full Stack ──
  'Full Stack Developer',
  'MEAN Stack Developer',
  'MERN Stack Developer',
  // ── General Engineering ──
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Principal Engineer',
  'Software Architect',
  // ── Mobile ──
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'React Native Developer',
  'Flutter Developer',
  // ── Embedded / Systems ──
  'Embedded Systems Engineer',
  'Firmware Engineer',
  'Systems Engineer',
  'Systems Programmer',
  'Linux Kernel Developer',
  // ── DevOps / Cloud / Infra ──
  'DevOps Engineer',
  'Site Reliability Engineer (SRE)',
  'Platform Engineer',
  'Cloud Engineer',
  'AWS Cloud Engineer',
  'AWS Solutions Architect',
  'Azure Engineer',
  'GCP Engineer',
  'Infrastructure Engineer',
  'Linux Administrator',
  'Kubernetes Engineer',
  'Terraform Engineer',
  'CI/CD Engineer',
  // ── Data / Analytics ──
  'Data Analyst',
  'Data Scientist',
  'Data Engineer',
  'Analytics Engineer',
  'Business Intelligence (BI) Analyst',
  'Quantitative Analyst',
  'Database Administrator (DBA)',
  'SQL Developer',
  'ETL Developer',
  'Big Data Engineer',
  'Spark Developer',
  // ── AI / ML ──
  'Machine Learning Engineer',
  'AI Engineer',
  'Deep Learning Engineer',
  'NLP Engineer',
  'Computer Vision Engineer',
  'MLOps Engineer',
  'AI Research Scientist',
  'Prompt Engineer',
  'LLM Engineer',
  // ── Security / Cyber ──
  'Security Engineer',
  'Application Security Engineer',
  'Penetration Tester',
  'Security Analyst',
  'SOC Analyst',
  'Cybersecurity Analyst',
  'Cloud Security Engineer',
  // ── QA / Testing ──
  'QA Engineer',
  'SDET',
  'Test Automation Engineer',
  'Performance Engineer',
  'QA Lead',
  // ── Game / Graphics ──
  'Game Developer',
  'Unity Developer',
  'Unreal Engine Developer',
  'Graphics Engineer',
  'AR/VR Developer',
  // ── Product / Design ──
  'Product Manager',
  'Senior Product Manager',
  'Product Owner',
  'UI/UX Designer',
  'UX Researcher',
  'Product Designer',
  'Visual Designer',
  'Interaction Designer',
  // ── Management / Leadership ──
  'Engineering Manager',
  'VP of Engineering',
  'CTO',
  'Tech Lead',
  'Team Lead',
  'Scrum Master',
  'Agile Coach',
  // ── Other Tech ──
  'Solutions Architect',
  'Technical Program Manager',
  'Business Analyst',
  'Technical Writer',
  'Developer Advocate',
  'Developer Relations Engineer',
  'Blockchain Developer',
  'Web3 Developer',
  'Smart Contract Developer',
  'Network Engineer',
  'Salesforce Developer',
  'SAP Developer',
].sort();

const difficulties = [
  { value: '1', label: 'Fresher',   desc: 'Entry-level questions',  color: '#22c55e' },
  { value: '2', label: 'Junior',    desc: '0–1 years experience',   color: '#8B5CF6' },
  { value: '3', label: 'Mid-Level', desc: '1–3 years experience',   color: '#f59e0b' },
  { value: '4', label: 'Senior',    desc: '3–5 years experience',   color: '#ef4444' },
  { value: '5', label: 'Lead',      desc: '5+ years experience',    color: '#a855f7' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

const P      = '#7C3AED';
const P_BG   = '#F5F3FF';
const P_BD   = '#DDD6FE';
const BORDER = '#E9E5F5';
const TEXT   = '#1E1B4B';
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
  const [showTips, setShowTips]         = useState(false);
  const [pendingSession, setPendingSession] = useState<string | null>(null);

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
      setPendingSession(session.id);
      setShowTips(true);
    } catch {
      setError('Failed to start session. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterInterview = () => {
    if (pendingSession) navigate(`/interview/${pendingSession}/session`);
  };

  const TIPS = [
    { emoji: '👁️', title: 'Eye contact', body: 'Look directly into the camera lens, not at your own face on screen. It feels like eye contact to the interviewer.' },
    { emoji: '🌟', title: 'STAR method', body: 'For behavioral questions: Situation → Task → Action → Result. Keep each part concise.' },
    { emoji: '🎙️', title: 'Speak clearly', body: 'Talk at a steady, confident pace. Pausing to think is perfectly fine — silence is better than filler words.' },
    { emoji: '⏱️', title: 'Watch the timer', body: 'Each question shows a suggested duration. Going slightly over is okay, but don\'t rush to fill time either.' },
    { emoji: '💡', title: 'Think out loud', body: 'For technical questions, narrate your thought process. Interviewers value reasoning, not just the final answer.' },
    { emoji: '📷', title: 'Camera & lighting', body: 'Make sure your face is well-lit and the camera is at eye level. A plain background helps the AI track you accurately.' },
  ];

  return (
    <>
    {/* ── Pre-interview tips modal ──────────────────────── */}
    {showTips && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: '#fff', borderRadius: 20,
            boxShadow: '0 24px 64px rgba(30,27,75,.18)',
            width: '100%', maxWidth: 580,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: '#1E1B4B',
            padding: '28px 32px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,.25)', border: '1px solid rgba(124,58,237,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>💡</span>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0, fontFamily: 'Inter, sans-serif' }}>Before you begin</p>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: '#fff', margin: '3px 0 0', fontFamily: 'Poppins, sans-serif' }}>Interview Tips</h2>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.6 }}>
              Your session for <strong style={{ color: 'rgba(255,255,255,.8)' }}>{jobRole}</strong> is ready. Read these tips before you start.
            </p>
          </div>

          {/* Tips grid */}
          <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {TIPS.map((tip) => (
              <div key={tip.title} style={{ background: '#F8F7FF', borderRadius: 12, border: '1px solid #E9E5F5', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{tip.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{tip.title}</span>
                </div>
                <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, margin: 0 }}>{tip.body}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '0 32px 28px', display: 'flex', gap: 12 }}>
            <button
              onClick={() => setShowTips(false)}
              style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid #E9E5F5', background: '#fff', fontSize: 14, fontWeight: 600, color: MUTED, cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              onClick={handleEnterInterview}
              style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: P, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              I'm ready — Start Interview →
            </button>
          </div>
        </motion.div>
      </div>
    )}
    <div style={{ padding: '20px 28px 24px' }}>

      {/* ── Header ── */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 700, color: TEXT, marginBottom: 4 }}>
          Mock <span style={{ color: P }}>Interview</span>
        </h1>
        <p style={{ fontSize: 14, color: MUTED }}>
          Set up your session — questions are tailored to your role and experience
        </p>
      </motion.div>

      {/* ── 2-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Resume + Job Role stacked ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Resume picker */}
          <motion.div {...fadeUp(0.08)} className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, background: P_BG, border: `1px solid ${P_BD}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} style={{ color: P }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: TEXT, margin: 0 }}>
                  Resume <span style={{ fontWeight: 400, fontSize: 12, color: MUTED }}>(optional)</span>
                </p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Choose saved or upload new</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={selectedResume}
                onChange={e => setSelectedResume(e.target.value)}
                className="input"
                style={{ flex: 1, fontSize: 13 }}
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
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 14px', flexShrink: 0,
                  border: `1.5px solid ${P}`, background: P_BG, color: P,
                  fontSize: 13, fontWeight: 600, borderRadius: 6,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1, whiteSpace: 'nowrap',
                }}
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
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
                    padding: '8px 12px', marginTop: 10, borderRadius: 8,
                    background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)',
                    fontSize: 12, color: '#ef4444',
                  }}
                >
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  {uploadError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Job Role combobox */}
          <motion.div {...fadeUp(0.12)} className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, background: P_BG, border: `1px solid ${P_BD}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase size={16} style={{ color: P }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: TEXT, margin: 0 }}>Job Role</p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Search or enter a custom role</p>
              </div>
            </div>

            {/* combobox wrapper */}
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${showDrop ? P : BORDER}`,
                background: '#fff', transition: 'border-color .15s',
                padding: '0 12px', gap: 8, borderRadius: 6,
              }}>
                <Search size={14} style={{ color: MUTED, flexShrink: 0 }} />
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
                    fontSize: 13, color: TEXT, background: 'transparent',
                    padding: '11px 0', fontFamily: 'inherit',
                  }}
                />
                {jobRole && (
                  <button
                    onClick={() => { setJobRole(''); setHighlightIdx(-1); inputRef.current?.focus(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                )}
                <ChevronDown
                  size={14}
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
                      zIndex: 200, maxHeight: 280, overflowY: 'auto', borderRadius: 8,
                    }}
                  >
                    {jobRole.trim().length === 0 && (
                      <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'Inter, sans-serif' }}>
                        All Roles — scroll to browse
                      </div>
                    )}

                    {suggestions.map((r, i) => (
                      <div
                        key={r}
                        onMouseDown={() => selectRole(r)}
                        onMouseEnter={() => setHighlightIdx(i)}
                        style={{
                          padding: '9px 14px',
                          fontSize: 13, color: highlightIdx === i ? P : TEXT,
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
                          padding: '9px 14px',
                          fontSize: 13,
                          color: highlightIdx === suggestions.length ? P : MUTED,
                          background: highlightIdx === suggestions.length ? P_BG : '#F8F7FF',
                          borderLeft: `2px solid ${highlightIdx === suggestions.length ? P : 'transparent'}`,
                          borderTop: `1px solid ${BORDER}`,
                          cursor: 'pointer', fontStyle: 'italic',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 11, background: P_BG, border: `1px solid ${P_BD}`, color: P, padding: '1px 7px', fontStyle: 'normal', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
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
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: MUTED }}>Selected:</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: P,
                  background: P_BG, border: `1px solid ${P_BD}`,
                  padding: '2px 10px', borderRadius: 4,
                }}>
                  {jobRole}
                </span>
                {!isExactMatch && jobRole.trim() && (
                  <span style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 8px', borderRadius: 4, fontWeight: 600 }}>
                    Custom
                  </span>
                )}
              </div>
            )}
          </motion.div>

        </div>{/* end LEFT column */}

        {/* ── RIGHT: Difficulty ── */}
        <motion.div {...fadeUp(0.05)} className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BarChart2 size={16} style={{ color: '#d97706' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: TEXT, margin: 0 }}>Difficulty Level</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Match to your experience</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {difficulties.map(d => {
              const active = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '11px 16px', borderRadius: 8,
                    border: `1.5px solid ${active ? d.color + '60' : BORDER}`,
                    background: active ? d.color + '0d' : '#fff',
                    cursor: 'pointer', transition: 'all .18s', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', background: d.color, flexShrink: 0,
                    boxShadow: active ? `0 0 0 4px ${d.color}25` : 'none', transition: 'box-shadow .2s',
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, margin: 0 }}>{d.label}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{d.desc}</p>
                  </div>
                  {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </motion.div>

      </div>{/* end 2-column grid */}

      {/* ── Error ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 8, marginTop: 16,
            background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.25)',
            fontSize: 13, color: '#ef4444',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </motion.div>
      )}

      {/* ── Start button ── */}
      <motion.div {...fadeUp(0.18)} style={{ marginTop: 20 }}>
        <button
          onClick={handleStart}
          disabled={loading || !jobRole.trim()}
          style={{
            width: '100%', padding: '15px 0', fontSize: 15, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: loading || !jobRole.trim() ? '#9CA3AF' : P,
            color: '#fff', border: 'none',
            fontWeight: 700, cursor: loading || !jobRole.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background .18s',
          }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Generating Questions...</>
          ) : (
            <><Mic size={18} /> Start Mock Interview <ArrowRight size={16} /></>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: MUTED, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Sparkles size={12} />
          6 tailored questions will be generated based on your role and experience level
        </p>
      </motion.div>

    </div>
    </>
  );
}