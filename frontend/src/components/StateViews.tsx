import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw, Database, Trash2, X, RotateCcw } from 'lucide-react';
import type { Producto } from '../types';

export const TableSkeleton: React.FC = () => {
  return (
    <div className="table-responsive-wrapper" aria-busy="true" aria-label="Cargando inventario">
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: '3.2rem',
              backgroundColor: 'var(--color-cashmere)',
              borderRadius: 'var(--radius-md)',
              opacity: 0.6,
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem',
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--color-cashmere)',
          color: 'var(--color-plum)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PackageOpen size={28} />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-plum)',
        }}
      >
        {title}
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          className="btn-primary"
          onClick={onAction}
          style={{ marginTop: '0.5rem' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onUseDemo: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  onUseDemo,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-crimson-light)',
        border: '1px solid var(--color-crimson-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <AlertCircle size={22} color="var(--color-crimson)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-crimson)', marginBottom: '0.2rem' }}>
            Aviso de conexión con el backend
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#6A191A', maxWidth: '640px', lineHeight: 1.4 }}>
            {message}
          </p>
          <div style={{ fontSize: '0.78rem', color: '#7E2021', marginTop: '0.35rem' }}>
            Si el servidor Spring Boot local no está corriendo en http://localhost:8080, puedes explorar la aplicación usando datos de demostración aislados.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button type="button" className="btn-secondary" onClick={onRetry} style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}>
          <RefreshCw size={14} />
          <span>Reintentar</span>
        </button>
        <button type="button" className="btn-primary" onClick={onUseDemo} style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}>
          <Database size={14} />
          <span>Activar modo demostración</span>
        </button>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: Producto | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !product) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-rose-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-crimson-light)',
                color: 'var(--color-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={16} />
            </div>
            <h3
              id="delete-dialog-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-plum)',
              }}
            >
              Confirmar Eliminación
            </h3>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            ¿Estás segura de eliminar permanentemente la referencia <strong>{product.nombre}</strong> (Ref #{product.id}) del inventario?
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Esta acción eliminará el registro de existencias ({product.cantidad} unidades disponibles) y no se puede deshacer.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isDeleting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleConfirm}
              disabled={isDeleting}
              style={{ padding: '0.55rem 1.15rem' }}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DemoNoticeBannerProps {
  onResetDefaults?: () => void;
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({ onResetDefaults }) => {
  return (
    <div className="demo-notice-banner" role="status" aria-label="Aviso de modo demostración">
      <div className="demo-notice-content">
        <div className="demo-notice-icon-box">
          <Database size={20} />
        </div>
        <div className="demo-notice-text-group">
          <div className="demo-notice-header">
            <span className="demo-notice-pill">Modo Demostración Activo</span>
            <span className="demo-notice-subtitle">Entorno de prueba local · Sin conexión al servidor</span>
          </div>
          <p className="demo-notice-body">
            <strong>Aviso:</strong> Todos los productos cosméticos, existencias, ventas y modificaciones en este modo son <strong>ficticios</strong> y <strong>locales a este navegador</strong> (guardados en localStorage). No afectan el inventario ni la base de datos real del sistema Dunamis Makeup.
          </p>
        </div>
      </div>
      {onResetDefaults && (
        <button
          type="button"
          onClick={onResetDefaults}
          className="demo-notice-reset-btn"
          title="Restablecer los 12 productos cosméticos iniciales de prueba"
        >
          <RotateCcw size={14} />
          <span>Restablecer datos demo</span>
        </button>
      )}
    </div>
  );
};

