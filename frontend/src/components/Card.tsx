import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  noPadding?: boolean;
  /** padding override for the body section */
  bodyPadding?: string | number;
}

export default function Card({
  children,
  header,
  footer,
  style,
  noPadding,
  bodyPadding,
}: CardProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E7E7E7',
      borderRadius: 10,
      boxShadow: '0px 2px 5px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      ...style,
    }}>
      {header && (
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #E7E7E7',
          background: '#F9FAFB',
          fontWeight: 600,
          fontSize: 14,
          color: '#111827',
          fontFamily: 'Poppins, sans-serif',
        }}>
          {header}
        </div>
      )}

      <div style={{ padding: noPadding ? 0 : (bodyPadding ?? 20) }}>
        {children}
      </div>

      {footer && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E7E7E7',
          background: '#F9FAFB',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}
