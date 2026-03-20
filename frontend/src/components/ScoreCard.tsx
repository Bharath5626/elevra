import { motion } from 'framer-motion';

type SizePreset = 'sm' | 'md' | 'lg';
const PRESET_SIZES: Record<SizePreset, number> = { sm: 88, md: 120, lg: 160 };

interface ScoreCardProps {
  score: number;
  label: string;
  size?: number | SizePreset;
  strokeWidth?: number;
}

export default function ScoreCard({ score, label, size = 120, strokeWidth = 10 }: ScoreCardProps) {
  const resolvedSize = typeof size === 'string' ? PRESET_SIZES[size] ?? 120 : size;
  const radius = (resolvedSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const uid = `scg-${resolvedSize}-${score}`;

  const gradientStart = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const gradientEnd   = score >= 80 ? '#86efac' : score >= 60 ? '#fcd34d' : '#f87171';

  const scoreFontSize = resolvedSize <= 90 ? '14px' : resolvedSize <= 120 ? '20px' : '28px';
  const labelFontSize = resolvedSize <= 90 ? '10px' : '12px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: resolvedSize, height: resolvedSize }}>
        <svg
          width={resolvedSize}
          height={resolvedSize}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}
        >
          <defs>
            <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
          {/* track */}
          <circle
            cx={resolvedSize / 2} cy={resolvedSize / 2} r={radius}
            fill="none" stroke="#f0f0f8" strokeWidth={strokeWidth}
          />
          {/* progress arc */}
          <motion.circle
            cx={resolvedSize / 2} cy={resolvedSize / 2} r={radius}
            fill="none"
            stroke={`url(#${uid})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </svg>
        {/* center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 0,
        }}>
          <motion.span
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: scoreFontSize,
              fontWeight: 800,
              lineHeight: 1,
              color: gradientStart,
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          >
            {score}
          </motion.span>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', letterSpacing: '.04em', textTransform: 'uppercase' }}>pts</span>
        </div>
      </div>
      <span style={{
        fontSize: labelFontSize,
        fontWeight: 600,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 1.3,
        letterSpacing: '.01em',
      }}>{label}</span>
    </div>
  );
}
