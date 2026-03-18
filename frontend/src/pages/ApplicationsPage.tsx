import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Trash2, ExternalLink, Loader2, CheckCircle2,
  Clock, Star, XCircle, Building2, MapPin, Search,
} from 'lucide-react';
import { jobsAPI } from '../services/api';
import type { JobApplication } from '../types';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', icon: Clock, color: '#3b82f6' },
  { value: 'interviewing', label: 'Interviewing', icon: Star, color: '#f59e0b' },
  { value: 'offer', label: 'Offer', icon: CheckCircle2, color: '#22c55e' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: '#ef4444' },
] as const;

function statusMeta(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    jobsAPI.getApplications().then(setApps).catch(() => {}).finally(() => setLoading(false));
  }, []);

  /* ── Stats ──────────────────────────────────────── */
  const stats = STATUS_OPTIONS.map((s) => ({
    ...s,
    count: apps.filter((a) => a.status === s.value).length,
  }));

  /* ── Handlers ───────────────────────────────────── */
  const handleStatusChange = async (id: string, status: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as JobApplication['status'] } : a)));
    try {
      await jobsAPI.updateStatus(id, status);
    } catch {
      // revert
      jobsAPI.getApplications().then(setApps).catch(() => {});
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await jobsAPI.deleteApplication(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch {
    } finally {
      setDeleting(null);
    }
  };

  /* ── Styles ─────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 20,
    border: '1px solid var(--color-surface-300)',
    boxShadow: '0 2px 12px rgba(0,0,0,.04)',
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: 'var(--color-surface-100)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary-400)' }} />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--color-surface-100)' }}>
      <div className="container" style={{ maxWidth: 1100, paddingTop: 40, paddingBottom: 72 }}>

        {/* ── Header ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
            }}>
              <Briefcase size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-secondary-500)', margin: 0, lineHeight: 1.3 }}>
                My Applications
              </h1>
              <p style={{ fontSize: 13, color: 'var(--color-surface-500)', margin: '3px 0 0' }}>
                Track every job you've applied to
              </p>
            </div>
          </div>

          <Link
            to="/jobs"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', color: '#fff',
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
            }}
          >
            <Search size={14} /> Find More Jobs
          </Link>
        </motion.div>

        {/* ── Stats row ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}
        >
          {stats.map((s) => (
            <div key={s.value} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${s.color}18`,
              }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-secondary-500)', lineHeight: 1 }}>
                  {s.count}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-surface-500)', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Empty state ─────────────────────────── */}
        {apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Briefcase size={44} style={{ color: 'var(--color-surface-300)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-secondary-500)', margin: '0 0 6px' }}>
              No applications yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-surface-500)' }}>
              Search for jobs and apply with one click to start tracking.
            </p>
          </div>
        ) : (
          /* ── Application cards ───────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence>
              {apps.map((app, idx) => {
                const meta = statusMeta(app.status);
                return (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{ ...card, padding: '22px 26px' }}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {/* Logo */}
                      {app.employer_logo ? (
                        <img src={app.employer_logo} alt={app.company} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: '#f8fafc', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                          background: 'linear-gradient(135deg, #FF6575, #B4A7F5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 16,
                        }}>
                          {app.company.charAt(0)}
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-secondary-500)', margin: 0 }}>
                          {app.job_title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-surface-500)', marginTop: 4 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Building2 size={12} /> {app.company}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {app.location}</span>
                          {app.match_score != null && (
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 5,
                              background: app.match_score >= 80 ? 'rgba(34,197,94,.1)' : app.match_score >= 60 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)',
                              color: app.match_score >= 80 ? '#22c55e' : app.match_score >= 60 ? '#f59e0b' : '#ef4444',
                            }}>
                              {app.match_score}% Match
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status selector */}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        style={{
                          padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${meta.color}40`,
                          background: `${meta.color}10`, color: meta.color,
                          cursor: 'pointer', outline: 'none',
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>

                      <span style={{ fontSize: 11, color: 'var(--color-surface-400)', whiteSpace: 'nowrap' }}>
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>

                      {/* Actions */}
                      <a
                        href={app.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 34, height: 34, borderRadius: 8,
                          border: '1px solid var(--color-surface-300)',
                          color: 'var(--color-surface-500)', flexShrink: 0,
                        }}
                        title="Open job posting"
                      >
                        <ExternalLink size={14} />
                      </a>

                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deleting === app.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 34, height: 34, borderRadius: 8,
                          border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)',
                          color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                        }}
                        title="Delete application"
                      >
                        {deleting === app.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
