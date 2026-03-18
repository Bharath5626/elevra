import { motion } from 'framer-motion';

type SizePreset = 'sm' | 'md' | 'lg';
const PRESET_SIZES: Record<SizePreset, number> = { sm: 88, md: 120, lg: 160 };

interface ScoreCardProps {
  score: number;
  label: string;
  size?: number | SizePreset;
  strokeWidth?: number;
}

export default function ScoreCard({ score, label, size = 120, strokeWidth = 8 }: ScoreCardProps) {
  const resolvedSize = typeof size === 'string' ? PRESET_SIZES[size] ?? 120 : size;
  const radius = (resolvedSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);
  const scoreFontSize = resolvedSize <= 90 ? '13px' : resolvedSize <= 120 ? '18px' : '24px';
  const labelFontSize = resolvedSize <= 90 ? '11px' : '14px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: resolvedSize, height: resolvedSize }}>
        <svg
          width={resolvedSize}
          height={resolvedSize}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}
        >
          <circle
            cx={resolvedSize / 2} cy={resolvedSize / 2} r={radius}
            fill="none" stroke="#e9ecef" strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={resolvedSize / 2} cy={resolvedSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.span
            style={{ color, fontFamily: 'Poppins, sans-serif', fontSize: scoreFontSize, fontWeight: 700, lineHeight: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span style={{
        fontSize: labelFontSize, fontWeight: 500,
        color: 'var(--color-surface-600)',
        textAlign: 'center', lineHeight: 1.3,
      }}>{label}</span>
    </div>
  );
}
