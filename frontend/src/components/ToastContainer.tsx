import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        zIndex: 2000,
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${
                isSuccess
                  ? 'var(--color-sage-border)'
                  : isError
                  ? 'var(--color-crimson-border)'
                  : 'var(--color-border)'
              }`,
              boxShadow: 'var(--shadow-modal)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              pointerEvents: 'auto',
              animation: 'slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
              {isSuccess && <CheckCircle2 size={18} color="var(--color-sage)" />}
              {isError && <AlertCircle size={18} color="var(--color-crimson)" />}
              {!isSuccess && !isError && <Info size={18} color="var(--color-bronze)" />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-plum)', lineHeight: 1.25 }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => onDismiss(toast.id)}
              style={{ padding: '0.2rem', color: 'var(--color-text-subtle)' }}
              title="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
