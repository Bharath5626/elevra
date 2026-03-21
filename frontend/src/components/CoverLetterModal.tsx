import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import Modal from './Modal';
import { jobsAPI } from '../services/api';
import type { JobListing } from '../types';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing;
  resumeAnalysisId: string;
  onApplied: () => void;
}

export default function CoverLetterModal({ isOpen, onClose, job, resumeAnalysisId, onApplied }: CoverLetterModalProps) {
  const [letter, setLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLetter('');
    setError('');
    setCopied(false);
    setGenerating(true);

    jobsAPI
      .generateCoverLetter({
        job_title: job.job_title,
        company: job.company,
        job_description: job.description,
        resume_analysis_id: resumeAnalysisId,
      })
      .then((res) => setLetter(res.cover_letter))
      .catch(() => setError('Failed to generate cover letter. Please try again.'))
      .finally(() => setGenerating(false));
  }, [isOpen, job, resumeAnalysisId]);

  const handleCopyAndApply = async () => {
    setSaving(true);
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);

      await jobsAPI.apply({
        job_id: job.job_id,
        job_title: job.job_title,
        company: job.company,
        location: job.location,
        apply_url: job.apply_url,
        job_description: job.description,
        salary_range: job.salary_range,
        employer_logo: job.employer_logo,
        match_score: 0,
        cover_letter: letter,
        resume_analysis_id: resumeAnalysisId,
      });

      window.open(job.apply_url, '_blank', 'noopener');
      onApplied();

      setTimeout(() => onClose(), 1200);
    } catch {
      setError('Failed to save application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Apply" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Job info bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', borderRadius: 14,
          background: 'var(--color-surface-100)',
          border: '1px solid var(--color-surface-200)',
        }}>
          {job.employer_logo ? (
            <img
              src={job.employer_logo}
              alt={job.company}
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: '#fff' }}
            />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#F5F3FF', border: '1px solid #DDD6FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#7C3AED', fontWeight: 700, fontSize: 16, flexShrink: 0,
            }}>
              {job.company.charAt(0)}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-secondary-500)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {job.job_title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-surface-500)', margin: '2px 0 0' }}>
              {job.company} &bull; {job.location}
            </p>
          </div>
        </div>

        {/* Cover letter area */}
        {generating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '48px 24px', gap: 16,
            }}
          >
            <Sparkles size={32} style={{ color: 'var(--color-primary-400)' }} />
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary-400)' }} />
            <p style={{ fontSize: 14, color: 'var(--color-surface-500)', textAlign: 'center', margin: 0 }}>
              AI is crafting a tailored cover letter...
            </p>
          </motion.div>
        ) : error && !letter ? (
          <p style={{ fontSize: 14, color: '#ef4444', textAlign: 'center', padding: '32px 0' }}>{error}</p>
        ) : (
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            style={{
              width: '100%', minHeight: 260, maxHeight: 400,
              padding: 16, borderRadius: 12, fontSize: 13, lineHeight: 1.7,
              fontFamily: 'inherit',
              border: '1px solid var(--color-surface-300)',
              background: '#fff', color: 'var(--color-secondary-500)',
              resize: 'vertical', outline: 'none',
            }}
          />
        )}

        {error && letter && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              border: '1.5px solid var(--color-surface-300)', background: '#fff',
              color: 'var(--color-surface-600)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleCopyAndApply}
            disabled={!letter || saving || generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: !letter || saving || generating ? 'not-allowed' : 'pointer',
              color: '#fff',
              background: copied
                ? '#22c55e'
                : '#7C3AED',
              opacity: !letter || generating ? 0.5 : 1,
              transition: 'all .2s',
            }}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : copied ? (
              <><CheckCircle size={14} /> Copied & Applied!</>
            ) : (
              <><Copy size={14} /> Copy & Apply <ExternalLink size={12} /></>
            )}
          </button>
        </div>

      </div>
    </Modal>
  );
}
