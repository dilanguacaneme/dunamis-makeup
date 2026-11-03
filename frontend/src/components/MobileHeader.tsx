import React from 'react';
import { Menu, Sparkles, RefreshCw, LogOut, Database, Server } from 'lucide-react';
import type { Usuario } from '../types';

interface MobileHeaderProps {
  user: Usuario;
  isDemo: boolean;
  backendOnline: boolean | null;
  isLoading: boolean;
  onOpenSidebar: () => void;
  onToggleDemo: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  isDemo,
  backendOnline,
  isLoading,
  onOpenSidebar,
  onToggleDemo,
  onRefresh,
  onLogout,
}) => {
  const isAdmin = user.role === 'ADMIN';

  return (
    <header className="mobile-header" aria-label="Cabecera móvil del Atelier">
      {/* Left: Hamburger menu toggle button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button
          type="button"
          className="mobile-header-menu-btn"
          onClick={onOpenSidebar}
          aria-label="Abrir menú de navegación"
        >
          <Menu size={22} />
        </button>

        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="mobile-brand-crest">
            <Sparkles size={16} />
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <span className="mobile-brand-title">Dunamis Makeup</span>
            <span className="mobile-brand-subtitle">Atelier Cosmético</span>
          </div>
        </div>
      </div>

      {/* Right: Environment toggle + Refresh + User avatar + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Demo / Live quick button */}
        <button
          type="button"
          onClick={onToggleDemo}
          className="btn-ghost"
          style={{
            padding: '0.35rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: isDemo
              ? 'var(--color-rose-subtle)'
              : backendOnline
              ? 'var(--color-sage-light)'
              : 'var(--color-crimson-light)',
            color: isDemo
              ? 'var(--color-rosewood)'
              : backendOnline
              ? 'var(--color-sage)'
              : 'var(--color-crimson)',
            border: `1px solid ${
              isDemo
                ? 'var(--color-border)'
                : backendOnline
                ? 'var(--color-sage-border)'
                : 'var(--color-crimson-border)'
            }`,
          }}
          title={
            isDemo
              ? 'Modo Demo (toca para cambiar a backend)'
              : backendOnline
              ? 'Servidor Spring Boot en línea (toca para cambiar a demo)'
              : 'Servidor desconectado (toca para cambiar a demo)'
          }
        >
          {isDemo ? <Database size={11} /> : <Server size={11} />}
          <span>{isDemo ? 'Demo' : backendOnline ? 'Online' : 'Offline'}</span>
        </button>

        {/* Refresh button */}
        <button
          type="button"
          className="btn-ghost"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Recargar datos"
          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)' }}
        >
          <RefreshCw
            size={14}
            style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
          />
        </button>

        {/* User avatar */}
        <div
          className={`mobile-user-avatar ${isAdmin ? 'admin' : 'seller'}`}
          title={`${user.fullName || user.username} (${isAdmin ? 'Administradora' : 'Vendedora'})`}
          style={{ width: '1.85rem', height: '1.85rem', fontSize: '0.75rem' }}
        >
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
        </div>

        {/* Logout button */}
        <button
          type="button"
          className="btn-ghost logout"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          style={{ padding: '0.35rem', color: 'var(--color-crimson)' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};
