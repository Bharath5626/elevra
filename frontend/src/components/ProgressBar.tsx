import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  showValue?: boolean;   // alias for showPercentage
  height?: number;       // bar height in px (default 10)
}

export default function ProgressBar({ value, label, showPercentage = true, showValue, height = 10 }: ProgressBarProps) {
  const displayPercent = showValue !== undefined ? showValue : showPercentage;
  const getColor = (v: number) => {
    if (v >= 80) return { bar: '#22c55e', bg: '#dcfce7' };
    if (v >= 60) return { bar: '#f59e0b', bg: '#fef3c7' };
    return { bar: '#ef4444', bg: '#fef2f2' };
  };

  const colors = getColor(value);

  return (
    <div style={{ width: '100%' }}>
      {(label || displayPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {label && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-secondary-500)' }}>{label}</span>}
          {displayPercent && <span style={{ fontSize: 13, fontWeight: 600, color: colors.bar }}>{Math.round(value)}%</span>}
        </div>
      )}
      <div style={{ width: '100%', borderRadius: 99, overflow: 'hidden', backgroundColor: colors.bg, height }}>
        <motion.div
          style={{ height: '100%', borderRadius: 99, backgroundColor: colors.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
