import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch, Video, Play, Target, BookOpen, Shield,
  ArrowRight, Sparkles,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────
// Deep Indigo + Luminous Violet premium system
const P      = '#7C3AED';   // primary violet
const P_D    = '#6D28D9';   // primary dark (hover)
const P_BG   = '#F5F3FF';   // primary tint bg
const P_BD   = '#DDD6FE';   // primary tint border

const BG     = '#FFFFFF';
const BG_ALT = '#F8F7FF';   // neutral-50
const TEXT   = '#1E1B4B';   // slate-950
const TEXT2  = '#374151';   // slate-700
const MUTED  = '#6B7280';   // slate-500
const BORDER = '#E9E5F5';   // slate-200
const NAVY   = '#1E1B4B';   // CTA bg
const NAVY2  = '#1E1B4B';   // footer bg

// ── Feature data ───────────────────────────────────────────────
const features = [
  {
    icon: FileSearch,
    title: 'Resume Intelligence',
    description: 'ATS compatibility scoring, keyword gap analysis, and AI-improved bullet points tailored to your exact target role.',
  },
  {
    icon: Video,
    title: 'Mock Interview Coach',
    description: 'Record video answers to AI-generated questions. Scored on content, eye contact, confidence, and speech clarity.',
  },
  {
    icon: Play,
    title: 'Interview Replay',
    description: 'Review your session with synced video playback. Feedback cards appear timestamped to the exact moment they occurred.',
  },
  {
    icon: Target,
    title: 'Career Readiness Index',
    description: 'A composite score from resume quality, interview performance, and JD fit. Track your progress with percentile rankings.',
  },
  {
    icon: BookOpen,
    title: '30-Day Roadmap',
    description: 'AI-generated study plan based on your weak areas. Daily tasks, curated videos, and targeted practice resources.',
  },
  {
    icon: Shield,
    title: 'Bias Detection',
    description: 'Flags gendered words, age indicators, and exclusionary phrases in your resume automatically, before a recruiter sees them.',
  },
];

const stats = [
  { value: '7',       label: 'AI Modules' },
  { value: 'Multi-Modal', label: 'Video + Audio + Text Analysis' },
  { value: '< 3 min', label: 'Full Resume Analysis' },
  { value: 'Open Source', label: 'Final Year Project' },
];

const steps = [
  {
    num: '01',
    title: 'Upload & Analyze',
    desc: 'Paste a job description and upload your resume. Get an ATS compatibility score, keyword gap report, and AI-improved bullet points in under 3 minutes.',
  },
  {
    num: '02',
    title: 'Practice on Camera',
    desc: 'Take AI-generated mock interviews. Get scored in real-time on content quality, eye contact, speech pace, and confidence indicators.',
  },
  {
    num: '03',
    title: 'Land the Offer',
    desc: 'Follow your personalized 30-day roadmap. Watch your Career Readiness Index rise and walk into every interview fully confident.',
  },
];

const testimonials = [
  {
    quote: 'The ATS scanner highlighted exactly which keywords were missing from my resume compared to the job description. Really useful for understanding what recruiters look for.',
    name: 'Beta Tester — CSE Final Year',
    role: 'Anna University',
    initials: 'BT',
  },
  {
    quote: 'Watching the replay with synced feedback timestamps was genuinely eye-opening. I did not realise how often I broke eye contact until I saw it annotated frame-by-frame.',
    name: 'Beta Tester — IT Department',
    role: 'St. Joseph\u2019s College of Engineering',
    initials: 'BT',
  },
  {
    quote: 'The 30-day roadmap gave me a structured plan I could actually follow, rather than just a list of generic skills to learn.',
    name: 'Beta Tester — MCA Programme',
    role: 'Anna University',
    initials: 'BT',
  },
];

// ── Animation ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── Section label ──────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      background: P_BG, border: `1px solid ${P_BD}`,
      color: P_D, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      marginBottom: 20,
    }}>
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, overflowX: 'hidden', paddingTop: 70 }}>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', background: BG }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: `linear-gradient(to bottom, transparent, ${BG})`, pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 96 }}>

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 32 }}>
          </motion.div>

          <div style={{ maxWidth: 720 }}>
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(2.6rem, 5vw, 5rem)',
                fontWeight: 800, lineHeight: 1.06,
                letterSpacing: '-0.03em', color: TEXT, marginBottom: 28,
              }}
            >
              Land Your Dream Job<br />
              <span style={{ color: P }}>Before You Apply.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.65 }}
              style={{ fontSize: 17, color: TEXT2, lineHeight: 1.8, maxWidth: 520, marginBottom: 40 }}
            >
              Elevra uses multi-modal AI to analyze your resume, coach interviews on camera,
              and build a personalized roadmap. One platform, built for the modern job market.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.6 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
            >
              <Link
                to="/login?mode=register"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '13px 28px',
                  background: P, color: '#fff',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  border: `2px solid ${P}`, letterSpacing: '0.01em',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = P_D; el.style.borderColor = P_D; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = P; el.style.borderColor = P; }}
              >
                Get started free <ArrowRight size={15} />
              </Link>
              <a
                href="#how-it-works"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '13px 28px',
                  border: `2px solid ${BORDER}`, background: 'transparent',
                  color: TEXT, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = P; el.style.background = P_BG; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = BORDER; el.style.background = 'transparent'; }}
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.65 }}
            style={{
              display: 'flex', flexWrap: 'wrap',
              border: `1px solid ${BORDER}`, borderTop: `3px solid ${P}`,
              marginTop: 72, background: BG,
            }}
          >
            {stats.map((s, i) => (
              <div key={s.label} style={{
                flex: '1 1 160px', padding: '24px 28px',
                borderRight: i < stats.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, color: TEXT, letterSpacing: '-0.025em', fontFamily: 'Poppins, sans-serif' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 0', background: BG_ALT, borderTop: `1px solid ${BORDER}` }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} custom={0} style={{ maxWidth: 540, marginBottom: 64 }}>
            <Label>Platform</Label>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 700, color: TEXT, letterSpacing: '-0.025em', marginBottom: 16 }}>
              Everything you need to get hired
            </h2>
            <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75 }}>
              Six AI modules that work together, from cold resume to confident offer.
            </p>
          </motion.div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${BORDER}` }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp} custom={i * 0.4}
                style={{
                  padding: '36px 32px', background: BG,
                  borderRight: `1px solid ${BORDER}`,
                  borderBottom: `1px solid ${BORDER}`,
                  borderLeft: '3px solid transparent',
                  transition: 'background 0.2s, border-left-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = BG_ALT; el.style.borderLeftColor = P; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = BG; el.style.borderLeftColor = 'transparent'; }}
              >
                <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P_BG, border: `1px solid ${P_BD}`, marginBottom: 20 }}>
                  <f.icon size={19} style={{ color: P }} />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 10, letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: MUTED }}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '100px 0', background: BG, borderTop: `1px solid ${BORDER}` }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} style={{ maxWidth: 500, marginBottom: 64 }}>
            <Label>Process</Label>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 700, color: TEXT, letterSpacing: '-0.025em' }}>
              Three steps to interview-ready
            </h2>
          </motion.div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${BORDER}` }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial="hidden" whileInView="visible"
                viewport={{ once: true }} variants={fadeUp} custom={i}
                style={{
                  padding: '44px 36px', background: BG,
                  borderRight: `1px solid ${BORDER}`,
                  borderTop: `3px solid ${P}`,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = BG_ALT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = BG; }}
              >
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 38, fontWeight: 800, color: P, opacity: 0.15, lineHeight: 1, marginBottom: 20, letterSpacing: '-0.04em' }}>
                  {s.num}
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 21, fontWeight: 700, color: TEXT, marginBottom: 14, letterSpacing: '-0.02em' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: MUTED }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '100px 0', background: BG_ALT, borderTop: `1px solid ${BORDER}` }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} style={{ maxWidth: 480, marginBottom: 64 }}>
            <Label>Beta Feedback</Label>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 700, color: TEXT, letterSpacing: '-0.025em' }}>
              What beta testers said
            </h2>
          </motion.div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${BORDER}` }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible"
                viewport={{ once: true }} variants={fadeUp} custom={i}
                style={{
                  padding: '36px 32px', background: BG,
                  borderRight: `1px solid ${BORDER}`,
                  display: 'flex', flexDirection: 'column' as const, gap: 22,
                  borderTop: '3px solid transparent',
                  transition: 'border-top-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderTopColor = P; el.style.background = BG_ALT; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderTopColor = 'transparent'; el.style.background = BG; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: P_D, background: P_BG, border: `1px solid ${P_BD}`, padding: '2px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Beta Tester</span>
                </div>
                <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.8, flex: 1 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: P_BG, border: `1px solid ${P_BD}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: P_D, flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: NAVY, borderTop: `4px solid ${P}`, padding: '100px 0' }}>
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}
          >
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 18 }}>
                Your next offer starts<br />right here.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
                Free to start. No credit card required.
              </p>
            </div>
            <Link
              to="/login?mode=register"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '15px 36px',
                background: P, color: '#fff',
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                border: `2px solid ${P}`, letterSpacing: '0.01em', whiteSpace: 'nowrap' as const,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = P_D; el.style.borderColor = P_D; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = P; el.style.borderColor = P; }}
            >
              Get started free <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0F0B1E', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Main footer grid */}
        <div className="container" style={{ padding: '64px 32px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px 48px' }}>

            {/* Brand col */}
            <div style={{ gridColumn: 'span 1', minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <img src="/logo.png" alt="Elevra" style={{ height: 28, width: 'auto', display: 'block' }} />
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Elevra</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 220 }}>
                Career preparation built for the modern job market.
              </p>
            </div>

            {/* Product col */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>Product</p>
              {[
                { label: 'Resume Analysis', to: '/resume' },
                { label: 'Mock Interviews', to: '/interview/setup' },
                { label: 'Learning Roadmap', to: '/roadmap/history' },
                { label: 'Job Matching', to: '/jobs' },
                { label: 'Interview History', to: '/history' },
              ].map(item => (
                <Link key={item.label} to={item.to} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Company col */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>Company</p>
              {[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Applications', to: '/applications' },
                { label: 'About', to: '#features' },
                { label: 'How It Works', to: '#how-it-works' },
              ].map(item => (
                item.to.startsWith('#')
                  ? <a key={item.label} href={item.to} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                      {item.label}
                    </a>
                  : <Link key={item.label} to={item.to} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                      {item.label}
                    </Link>
              ))}
            </div>

            {/* Legal col */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>Legal</p>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map(item => (
                <a key={item} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                  {item}
                </a>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="container" style={{ padding: '20px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.01em' }}>
              &copy; {new Date().getFullYear()} Elevra — Final Year B.Tech Project, St. Joseph’s College of Engineering, Anna University
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}