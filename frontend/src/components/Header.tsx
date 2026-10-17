import React from 'react';
import { Sparkles, LogOut, RefreshCw, Database, Server } from 'lucide-react';
import type { Usuario } from '../types';

interface HeaderProps {
  user: Usuario;
  isDemo: boolean;
  backendOnline: boolean | null;
  isLoading: boolean;
  onToggleDemo: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDemo,
  backendOnline,
  isLoading,
  onToggleDemo,
  onLogout,
  onRefresh,
}) => {
  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-rosewood) 0%, var(--color-rosewood-deep) 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(148, 73, 96, 0.25)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-rosewood-deep)',
                  lineHeight: 1.2,
                }}
              >
                Dunamis Makeup
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-rosewood)',
                  backgroundColor: 'var(--color-rose-soft)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Atelier Privado
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Gestión de inventario y existencias
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* In-dashboard demo / live toggle (Available only to authenticated admin) */}
          <button
            type="button"
            onClick={onToggleDemo}
            title={
              isDemo
                ? 'Cambiar a conexión en tiempo real con backend Spring Boot'
                : 'Cambiar a datos de demostración locales'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: '1px solid',
              backgroundColor: isDemo ? 'var(--color-rose-soft)' : 'var(--color-sage-light)',
              borderColor: isDemo ? 'var(--color-rosewood)' : 'var(--color-sage-border)',
              color: isDemo ? 'var(--color-rosewood-deep)' : 'var(--color-sage)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {isDemo ? <Database size={13} /> : <Server size={13} />}
            <span>
              {isDemo
                ? 'Modo Demostración'
                : backendOnline
                ? 'Backend Spring Boot (En línea)'
                : 'Backend Spring Boot'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                textDecoration: 'underline',
                opacity: 0.85,
                marginLeft: '0.2rem',
              }}
            >
              {isDemo ? 'Usar backend' : 'Ver demo'}
            </span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            className="btn-ghost"
            onClick={onRefresh}
            disabled={isLoading}
            title="Recargar inventario"
            style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
          >
            <RefreshCw
              size={16}
              style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>

          {/* User profile / session state */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: 'var(--color-rose-subtle)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-rosewood)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-rosewood-deep)',
                  display: 'block',
                }}
              >
                {user.fullName || user.username}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                {isDemo ? 'Cuenta Demostración' : 'Administradora'}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="btn-ghost"
              title="Cerrar sesión"
              style={{
                padding: '0.3rem',
                marginLeft: '0.25rem',
                color: 'var(--color-crimson)',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};

export default Header;
