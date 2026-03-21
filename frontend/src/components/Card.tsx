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
      border: '1px solid #E9E5F5',
      borderRadius: 14,
      boxShadow: '0 1px 3px rgba(124,58,237,.04), 0 4px 16px rgba(124,58,237,.03)',
      overflow: 'hidden',
      ...style,
    }}>
      {header && (
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #E9E5F5',
          background: '#F8F7FF',
          fontWeight: 600,
          fontSize: 14,
          color: '#1E1B4B',
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
          borderTop: '1px solid #E9E5F5',
          background: '#F8F7FF',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}
