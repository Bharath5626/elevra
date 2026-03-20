import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Briefcase, Loader2, Zap, ExternalLink, Building2,
  DollarSign, Clock, Wifi, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckCircle, AlertCircle, X,
} from 'lucide-react';
import CoverLetterModal from '../components/CoverLetterModal';
import { jobsAPI, resumeAPI, profileAPI } from '../services/api';
import type { JobListing, ResumeAnalysis, MatchScoreResult, ApplyKit } from '../types';

export default function JobsPage() {
  /* search state */
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  /* data state */
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /* resume state */
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [selectedResume, setSelectedResume] = useState('');

  /* match scores cache: job_id -> MatchScoreResult */
  const [matchScores, setMatchScores] = useState<Record<string, MatchScoreResult>>({});

  /* modal state */
  const [applyJob, setApplyJob] = useState<JobListing | null>(null);

  /* One-Click Apply state */
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [oneClickJob, setOneClickJob]       = useState<JobListing | null>(null);
  const [oneClickStatus, setOneClickStatus] = useState<'idle'|'fetching'|'waiting'|'ready'|'submitting'|'done'|'error'>('idle');
  const [applyKit, setApplyKit]             = useState<ApplyKit | null>(null);
  const [oneClickError, setOneClickError]   = useState('');

  /* ── Load user resumes on mount ───────────────────── */
  useEffect(() => {
    resumeAPI.getHistory().then((list) => {
      setResumes(list);
      if (list.length > 0) setSelectedResume(list[0].id);
    }).catch(() => {});
  }, []);
  /* ── Detect extension via PING/PONG postMessage ─────────── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'ELEVRA_PONG') setExtensionAvailable(true);
    };
    window.addEventListener('message', onMsg);
    // Send ping — bridge.js will respond with PONG immediately
    window.postMessage({ type: 'ELEVRA_PING' }, '*');
    // Also catch PONG that bridge.js fires on its own load (before our listener)
    const t = setTimeout(() => window.postMessage({ type: 'ELEVRA_PING' }, '*'), 600);
    return () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(t);
    };
  }, []);

  /* ── Listen to extension relay messages ──────────── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'ELEVRA_FORM_READY') {
        setOneClickStatus('ready');
      }
      if (e.data?.type === 'ELEVRA_APPLICATION_SUBMITTED') {
        setOneClickStatus('done');
        // Save to application history in the background
        if (oneClickJob && applyKit) {
          const ms = matchScores[oneClickJob.job_id];
          jobsAPI.apply({
            job_id: oneClickJob.job_id,
            job_title: oneClickJob.job_title,
            company: oneClickJob.company,
            location: oneClickJob.location,
            apply_url: oneClickJob.apply_url,
            job_description: oneClickJob.description,
            salary_range: oneClickJob.salary_range,
            employer_logo: oneClickJob.employer_logo,
            match_score: ms?.match_score ?? 0,
            cover_letter: '',
            resume_analysis_id: applyKit.resumeAnalysisId,
          }).catch(() => {});
        }
      }
      if (e.data?.type === 'ELEVRA_ERROR') {
        setOneClickStatus('error');
        setOneClickError(e.data.error || 'Extension error. Try the Direct Link instead.');
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [oneClickJob, applyKit, matchScores]);

  /* ── One-Click Apply handlers ────────────────── */
  const handleOneClickApply = async (job: JobListing) => {
    setOneClickJob(job);
    setOneClickError('');
    if (!extensionAvailable) {
      setOneClickStatus('idle');
      return;
    }
    setOneClickStatus('fetching');
    try {
      const kit = await profileAPI.getApplyKit();
      setApplyKit(kit);
      // Tell extension: store data first, THEN open the tab
      // so content.js always finds data in storage when it runs
      window.postMessage({ type: 'ELEVRA_APPLY', payload: { jobUrl: job.apply_url, userData: kit } }, '*');
      setOneClickStatus('waiting');
    } catch {
      setOneClickStatus('error');
      setOneClickError('Could not load your profile. Upload a resume first.');
    }
  };

  const handleConfirmSubmit = () => {
    window.postMessage({ type: 'ELEVRA_SUBMIT' }, '*');
    setOneClickStatus('submitting');
  };

  const closeOneClick = () => {
    setOneClickJob(null);
    setOneClickStatus('idle');
    setApplyKit(null);
  };
  /* ── Search handler ───────────────────────────────── */
  const handleSearch = useCallback(async (p = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setPage(p);
    try {
      const results = await jobsAPI.search({ query: query.trim(), location: location.trim(), remote_only: remoteOnly, page: p });
      setJobs(results);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [query, location, remoteOnly]);

  /* ── Fetch match scores when jobs + resume available ── */
  useEffect(() => {
    if (!selectedResume || jobs.length === 0) return;
    jobs.forEach((job) => {
      if (matchScores[job.job_id]) return;
      jobsAPI.getMatchScore(job.description, selectedResume).then((res) => {
        setMatchScores((prev) => ({ ...prev, [job.job_id]: res }));
      }).catch(() => {});
    });
  }, [jobs, selectedResume]);

  /* ── style helpers ────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 10,
    border: '1px solid #E7E7E7',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: 0, padding: '12px 16px 12px 42px',
    borderRadius: 12, fontSize: 14, border: '1.5px solid #E5E7EB',
    background: '#fff', color: '#111827',
    outline: 'none', transition: 'border-color .15s',
  };

  return (
    <div style={{ padding: '24px 28px 48px' }}>

        {/* ── Header ────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#EFF6FF', border: '1px solid #BFDBFE',
            }}>
              <Briefcase size={20} color="#2563EB" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                Job Discovery
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
                Search real jobs from LinkedIn, Indeed, Glassdoor &amp; more
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Search card ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{ ...card, padding: '24px 28px', marginBottom: 24 }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(1); }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}
          >
            {/* Query input */}
            <div style={{ flex: '2 1 240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, keywords, or company"
                style={inputStyle}
              />
            </div>

            {/* Location input */}
            <div style={{ flex: '1 1 180px', position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (optional)"
                style={inputStyle}
              />
            </div>

            {/* Remote toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '10px 16px', borderRadius: 12,
              border: `1.5px solid ${remoteOnly ? '#2563EB' : '#E5E7EB'}`,
              background: remoteOnly ? '#EFF6FF' : '#fff',
              color: remoteOnly ? '#2563EB' : '#6B7280',
              fontSize: 13, fontWeight: 500, transition: 'all .15s', flexShrink: 0,
            }}>
              <Wifi size={14} />
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                style={{ display: 'none' }}
              />
              Remote
            </label>

            {/* Search button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                color: '#fff',
              background: '#2563EB',
                opacity: loading || !query.trim() ? 0.6 : 1,
                transition: 'opacity .15s', flexShrink: 0,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </form>

          {/* Resume selector */}
          {resumes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-surface-200)' }}>
              <SlidersHorizontal size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, flexShrink: 0 }}>Match against:</span>
              <select
                value={selectedResume}
                onChange={(e) => { setSelectedResume(e.target.value); setMatchScores({}); }}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  border: '1px solid #E5E7EB', background: '#fff',
                  color: '#111827', outline: 'none', maxWidth: 300,
                }}
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename} (ATS: {r.ats_score}%)
                  </option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        {/* ── Results ───────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: '#2563EB' }} />
          </div>
        ) : searched && jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Briefcase size={40} style={{ color: '#9CA3AF', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#6B7280' }}>No jobs found. Try different keywords or location.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map((job, idx) => {
              const ms = matchScores[job.job_id];
              return (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ ...card, padding: '24px 28px' }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Logo */}
                    {job.employer_logo ? (
                      <img
                        src={job.employer_logo}
                        alt={job.company}
                        style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: '#F9FAFB', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#2563EB', fontWeight: 700, fontSize: 18,
                      }}>
                        {job.company.charAt(0)}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                          {job.job_title}
                        </h3>
                        {job.is_remote && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                            background: 'rgba(34,197,94,.1)', color: '#22c55e',
                          }}>
                            Remote
                          </span>
                        )}
                        {ms && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                            background: ms.match_score >= 80 ? 'rgba(34,197,94,.1)' : ms.match_score >= 60 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)',
                            color: ms.match_score >= 80 ? '#22c55e' : ms.match_score >= 60 ? '#f59e0b' : '#ef4444',
                          }}>
                            {ms.match_score}% Match
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={13} /> {job.company}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {job.location || 'Not specified'}
                        </span>
                        {job.salary_range && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <DollarSign size={13} /> {job.salary_range}
                          </span>
                        )}
                        {job.posted_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> {job.posted_date}
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: 13, color: '#4B5563', lineHeight: 1.6,
                        margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {job.description}
                      </p>

                      {/* Skills match */}
                      {ms && (ms.matching_skills.length > 0 || ms.missing_skills.length > 0) && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                          {ms.matching_skills.slice(0, 5).map((s) => (
                            <span key={s} style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(34,197,94,.08)', color: '#16a34a', fontWeight: 500,
                            }}>
                              {s}
                            </span>
                          ))}
                          {ms.missing_skills.slice(0, 3).map((s) => (
                            <span key={s} style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(239,68,68,.08)', color: '#dc2626', fontWeight: 500,
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleOneClickApply(job)}
                        disabled={!selectedResume}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                          border: 'none', cursor: selectedResume ? 'pointer' : 'not-allowed',
                          color: '#fff',
                          background: '#2563EB',
                          opacity: selectedResume ? 1 : 0.5,
                          transition: 'opacity .15s', whiteSpace: 'nowrap',
                        }}
                      >
                        <Zap size={14} /> One-Click Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyJob(job)}
                        disabled={!selectedResume}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                          border: '1.5px solid #E5E7EB',
                          cursor: selectedResume ? 'pointer' : 'not-allowed',
                          color: '#374151', background: '#fff',
                          opacity: selectedResume ? 1 : 0.5,
                          transition: 'opacity .15s', whiteSpace: 'nowrap',
                        }}
                      >
                        <Zap size={14} /> Quick Apply
                      </button>
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                          border: '1.5px solid #E5E7EB',
                          color: '#374151', textDecoration: 'none',
                          transition: 'border-color .15s', whiteSpace: 'nowrap',
                        }}
                      >
                        <ExternalLink size={12} /> Direct Link
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Pagination */}
            {jobs.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => handleSearch(page - 1)}
                  disabled={page <= 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: '1.5px solid #E5E7EB', background: '#fff',
                    color: page <= 1 ? '#9CA3AF' : '#111827',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{
                  display: 'flex', alignItems: 'center',
                  fontSize: 13, fontWeight: 600, color: '#111827',
                }}>
                  Page {page}
                </span>
                <button
                  onClick={() => handleSearch(page + 1)}
                  disabled={jobs.length < 10}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: '1.5px solid #E5E7EB', background: '#fff',
                    color: jobs.length < 10 ? '#9CA3AF' : '#111827',
                    cursor: jobs.length < 10 ? 'not-allowed' : 'pointer', opacity: jobs.length < 10 ? 0.5 : 1,
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── No search yet placeholder ─────────────── */}
        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Search size={44} style={{ color: '#E5E7EB', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
              Search for your next opportunity
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 400, margin: '0 auto' }}>
              Enter a job title or keywords above. We'll search LinkedIn, Indeed, Glassdoor, and 500+ job boards.
            </p>
            <Link
              to="/applications"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 20, padding: '10px 22px', borderRadius: 12,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                border: '1.5px solid #2563EB',
                color: '#2563EB',
              }}
            >
              <Briefcase size={14} /> View My Applications
            </Link>
          </div>
        )}

      {/* ── Cover Letter Modal ──────────────────────── */}
      {applyJob && (
        <CoverLetterModal
          isOpen={!!applyJob}
          onClose={() => setApplyJob(null)}
          job={applyJob}
          resumeAnalysisId={selectedResume}
          onApplied={() => setApplyJob(null)}
        />
      )}
      {/* ── One-Click Apply Modal ───────────────── */}
      {oneClickJob && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px 32px 28px',
            width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,.22)',
            position: 'relative', margin: '0 16px',
          }}>
            {/* Close */}
            <button onClick={closeOneClick} style={{
              position: 'absolute', top: 14, right: 14,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', padding: 4,
            }}><X size={18} /></button>

            {/* Header */}
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-surface-400)', textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 6px' }}>One-Click Apply</p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 3px', paddingRight: 28 }}>{oneClickJob.job_title}</h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>{oneClickJob.company} · {oneClickJob.location}</p>

            {/* ATS Score pill */}
            {(() => {
              const ms = matchScores[oneClickJob.job_id];
              if (!ms) return null;
              const col = ms.match_score >= 80 ? '#16a34a' : ms.match_score >= 60 ? '#d97706' : '#dc2626';
              const bg  = ms.match_score >= 80 ? 'rgba(34,197,94,.07)' : ms.match_score >= 60 ? 'rgba(245,158,11,.07)' : 'rgba(239,68,68,.07)';
              const border = ms.match_score >= 80 ? 'rgba(34,197,94,.2)' : ms.match_score >= 60 ? 'rgba(245,158,11,.2)' : 'rgba(239,68,68,.2)';
              return (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: bg, border: `1px solid ${border}`, marginBottom: 20 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: col, lineHeight: 1 }}>{ms.match_score}%</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-secondary-500)' }}>ATS Match Score</p>
                    {ms.missing_skills.length > 0 && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-surface-500)' }}>Missing: {ms.missing_skills.slice(0, 4).join(', ')}</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ─ Status states ─ */}
            {oneClickStatus === 'fetching' && (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#2563EB', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Loading your profile…</p>
              </div>
            )}

            {oneClickStatus === 'waiting' && (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#2563EB', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>Waiting for Application Form…</p>
                <div style={{ textAlign: 'left', background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#4B5563', lineHeight: 1.8 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Follow these steps in the new tab:</p>
                  <p style={{ margin: 0 }}>1. If you see a job listing → click <strong>Apply</strong></p>
                  <p style={{ margin: 0 }}>2. If asked to login/register → complete that step</p>
                  <p style={{ margin: 0 }}>3. Once the application form appears, it will be auto-filled</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>Then come back here to confirm &amp; submit.</p>
                </div>
              </div>
            )}

            {oneClickStatus === 'ready' && (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '11px 14px', borderRadius: 10, background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.18)', marginBottom: 18 }}>
                  <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#15803d', fontWeight: 500 }}>Form filled! Review the new tab, then confirm here to submit.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a href="/resume" onClick={closeOneClick} style={{
                    flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    border: '1.5px solid var(--color-surface-300)', color: 'var(--color-surface-600)',
                    textDecoration: 'none', textAlign: 'center' as const,
                  }}>Improve Resume</a>
                  <button onClick={handleConfirmSubmit} style={{
                    flex: 2, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: 'none', cursor: 'pointer', color: '#fff',
                  background: '#2563EB',
                  }}>✓ Confirm &amp; Submit</button>
                </div>
              </>
            )}

            {oneClickStatus === 'submitting' && (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#2563EB', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Submitting application…</p>
              </div>
            )}

            {oneClickStatus === 'done' && (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <CheckCircle size={40} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Applied Successfully!</p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>Your application to {oneClickJob.company} has been submitted and saved to history.</p>
                <button onClick={closeOneClick} style={{
                  padding: '10px 32px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', color: '#fff',
                  background: '#2563EB',
                }}>Done</button>
              </div>
            )}

            {oneClickStatus === 'error' && (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>Something went wrong</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>{oneClickError}</p>
                <a href={oneClickJob.apply_url} target="_blank" rel="noopener noreferrer" onClick={closeOneClick} style={{
                  display: 'inline-block', padding: '10px 26px', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, color: '#fff', background: '#111827', textDecoration: 'none',
                }}>Open Direct Link</a>
              </div>
            )}

            {!extensionAvailable && oneClickStatus === 'idle' && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>Install Elevra Extension</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>Install the Chrome extension to auto-fill job forms with your profile data.</p>
                <a href={oneClickJob.apply_url} target="_blank" rel="noopener noreferrer" onClick={closeOneClick} style={{
                  display: 'inline-block', padding: '10px 26px', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, color: '#fff', background: '#111827', textDecoration: 'none',
                }}>Apply Manually</a>
              </div>
            )}
          </div>
        </div>
      )}    </div>
  );
}
