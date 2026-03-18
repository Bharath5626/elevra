import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch, Video, Play, Target, BookOpen, Shield,
  ArrowRight, Upload, Camera, Zap, CheckCircle, Star,
} from 'lucide-react';

const features = [
  { icon: FileSearch, title: 'Resume Intelligence', description: 'Upload your resume + job description. Get an ATS compatibility score, keyword gap analysis, and AI-improved bullet points.', color: '#FF6575' },
  { icon: Video, title: 'Mock Interview Coach', description: 'Record video answers to AI-generated questions. Get scored on content, eye contact, confidence, and speech clarity.', color: '#B4A7F5' },
  { icon: Play, title: 'Interview Replay', description: 'Review your performance with synced video playback. Feedback cards appear at the exact moment they occurred.', color: '#22c55e' },
  { icon: Target, title: 'Career Readiness Index', description: 'A composite score combining resume, interview, and JD fit. Track your progress over time with percentile ranking.', color: '#f59e0b' },
  { icon: BookOpen, title: '30-Day Learning Roadmap', description: 'AI generates a personalized study plan based on your weak areas. Includes daily tasks, videos, and practice resources.', color: '#3b82f6' },
  { icon: Shield, title: 'Bias Detection', description: 'Flags potentially biased language in your resume — gendered words, age indicators, and exclusionary phrases.', color: '#8b5cf6' },
];

const steps = [
  { icon: Upload, step: '01', title: 'Upload & Analyze', description: 'Upload your resume and paste the job description. Our AI analyzes ATS compatibility and identifies gaps.' },
  { icon: Camera, step: '02', title: 'Practice & Record', description: 'Take a mock interview on camera. AI evaluates your answers, body language, eye contact, and confidence.' },
  { icon: Zap, step: '03', title: 'Review & Improve', description: 'Watch your replay with synced feedback. Follow a personalized 30-day roadmap to level up.' },
];

const stats = [
  { value: '95%', label: 'ATS Accuracy' },
  { value: '6', label: 'AI Modules' },
  { value: '4', label: 'ML Models' },
  { value: '<3min', label: 'Full Analysis' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: 70 }}>

      {/* ────────────────── Hero ────────────────── */}
      <section
        style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #392C7D 0%, #002058 100%)' }}
      >
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -128, right: -128, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,101,117,.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -128, left: -128, width: 500, height: 500, borderRadius: '50%', background: 'rgba(180,167,245,.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>

            {/* badge */}
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 20px', borderRadius: 50,
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.12)',
                color: 'rgba(255,255,255,.8)', fontSize: 15, fontWeight: 500,
                marginBottom: 32,
              }}
            >
              <Star size={15} style={{ color: '#facc15' }} />
              AI-Powered Career Development
            </motion.span>

            {/* heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(2.25rem, 5vw, 4.25rem)',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.15,
                marginBottom: 28,
              }}
            >
              Analyze. Practice.{' '}
              <span style={{ color: '#FF6575' }}>Get&nbsp;Hired.</span>
            </motion.h1>

            {/* subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
                color: 'rgba(255,255,255,.65)',
                lineHeight: 1.7,
                maxWidth: 620,
                margin: '0 auto 40px',
              }}
            >
              Resume intelligence, multi-modal mock interviews, and career
              readiness tracking — all in one platform built for students and freshers.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}
            >
              <Link
                to="/login?mode=register"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 36px', borderRadius: 50,
                  background: '#FF6575', color: '#fff',
                  fontSize: 17, fontWeight: 600,
                  border: 'none', textDecoration: 'none',
                }}
              >
                Get Started Free <ArrowRight size={19} />
              </Link>
              <a
                href="#features"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 36px', borderRadius: 50,
                  border: '2px solid rgba(255,255,255,.3)', background: 'transparent',
                  color: '#fff', fontSize: 17, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                See How It Works
              </a>
            </motion.div>

            {/* stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                gap: 48, marginTop: 56,
              }}
            >
              {stats.map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, color: '#FF6575' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────── Features ────────────────── */}
      <section id="features" style={{ padding: '80px 0', background: 'var(--color-surface-100)' }}>
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp} custom={0}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <span
              style={{
                display: 'inline-block', padding: '8px 22px', borderRadius: 50,
                background: 'var(--color-primary-50)', color: 'var(--color-primary-400)',
                fontSize: 15, fontWeight: 600, marginBottom: 18,
                border: '1px solid var(--color-primary-100)',
              }}
            >
              Features
            </span>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 14 }}>
              6 AI-Powered Modules
            </h2>
            <p style={{ fontSize: 17, color: 'var(--color-surface-600)', maxWidth: 540, margin: '0 auto' }}>
              Everything you need to go from unprepared to interview-ready.
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: 28,
            }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp} custom={i}
                className="card"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: f.color + '18', color: f.color,
                    marginBottom: 20, flexShrink: 0,
                  }}
                >
                  <f.icon size={26} />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 19, fontWeight: 600, color: 'var(--color-secondary-500)', marginBottom: 10 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-surface-600)' }}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── How It Works ────────────────── */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true }} variants={fadeUp} custom={0}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <span
              style={{
                display: 'inline-block', padding: '8px 22px', borderRadius: 50,
                background: 'var(--color-accent-50)', color: 'var(--color-accent-700)',
                fontSize: 15, fontWeight: 600, marginBottom: 18,
                border: '1px solid var(--color-accent-100)',
              }}
            >
              How It Works
            </span>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: 'var(--color-secondary-500)', marginBottom: 10 }}>
              Three Simple Steps
            </h2>
            <p style={{ fontSize: 17, color: 'var(--color-surface-600)', marginTop: 8 }}>
              Go from unprepared to interview-ready.
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: 40,
            }}
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden" whileInView="visible"
                viewport={{ once: true }} variants={fadeUp} custom={i}
                style={{ textAlign: 'center' }}
              >
                <div
                  style={{
                    width: 72, height: 72, borderRadius: 18,
                    background: 'var(--color-primary-50)',
                    border: '1px solid var(--color-primary-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <s.icon size={30} style={{ color: 'var(--color-primary-400)' }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary-400)', display: 'block', marginBottom: 8 }}>
                  {s.step}
                </span>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 21, fontWeight: 600, color: 'var(--color-secondary-500)', marginBottom: 10 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-surface-600)', maxWidth: 340, margin: '0 auto' }}>
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── CTA ────────────────── */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #FF6575 0%, #e72f41 100%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              Ready to Ace Your Next Interview?
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.8)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Join thousands of students who are using AI to supercharge their career preparation.
            </p>
            <Link
              to="/login?mode=register"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '15px 40px', borderRadius: 50,
                background: '#fff', color: 'var(--color-primary-400)',
                fontSize: 18, fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(0,0,0,.15)',
              }}
            >
              <CheckCircle size={22} />
              Start Free Today
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ────────────────── Footer ────────────────── */}
      <footer style={{ background: '#002058', padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            {/* logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ color: '#fff', fontSize: 15, fontWeight: 900 }}>E</span>
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
                Elev<span style={{ color: 'var(--color-primary-400)' }}>ra</span>
              </span>
            </div>

            <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
              © 2026 Elevra. All rights reserved.
            </p>

            <div style={{ display: 'flex', gap: 28 }}>
              {['Privacy', 'Terms', 'Contact'].map((t) => (
                <a key={t} href="#" style={{ color: 'rgba(255,255,255,.35)', fontSize: 14, textDecoration: 'none' }}>
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
