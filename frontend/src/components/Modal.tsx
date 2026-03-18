import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizeMap: Record<'sm' | 'md' | 'lg', number> = { sm: 400, md: 560, lg: 800 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(30,20,60,.45)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'relative', zIndex: 10,
              width: '100%', maxWidth: sizeMap[size],
              background: '#fff',
              borderRadius: 20,
              border: '1px solid var(--color-surface-300)',
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
              overflow: 'hidden',
            }}
          >
            {title && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-surface-300)',
              }}>
                <h3 style={{
                  fontSize: 17, fontWeight: 600,
                  color: 'var(--color-secondary-500)',
                  fontFamily: 'Poppins, sans-serif',
                  margin: 0,
                }}>{title}</h3>
                <button
                  onClick={onClose}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-100)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  style={{
                    padding: 6, borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-surface-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .15s',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div style={{ padding: 24 }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
