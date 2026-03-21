import type { ElementType } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  iconColor?: string;
  iconBg?: string;
  /** positive = up, negative = down, undefined = hidden */
  trend?: number;
  subLabel?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = '#7C3AED',
  iconBg,
  trend,
  subLabel,
}: StatCardProps) {
  const bgColor = iconBg || `${iconColor}1a`;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E9E5F5',
      borderRadius: 14,
      padding: '20px',
      boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Icon */}
      <div style={{
        width: 50, height: 50, borderRadius: 12,
        background: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px', fontWeight: 500 }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B', margin: 0, lineHeight: 1.2, fontFamily: 'Poppins, sans-serif' }}>
          {value}
        </p>
        {subLabel && (
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>{subLabel}</p>
        )}
      </div>

      {/* Trend badge */}
      {trend !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600,
          color: trend > 0 ? '#15803d' : trend < 0 ? '#dc2626' : '#6B7280',
          flexShrink: 0,
        }}>
          {trend > 0
            ? <TrendingUp size={14} />
            : trend < 0
              ? <TrendingDown size={14} />
              : <Minus size={14} />}
          {trend !== 0 ? `${Math.abs(trend)}%` : '—'}
        </div>
      )}
    </div>
  );
}
