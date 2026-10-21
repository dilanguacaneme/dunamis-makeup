import React from 'react';
import {
  Package,
  Receipt,
  Tag,
  BarChart3,
  RefreshCw,
  Server,
  Database,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { ActiveTab, Usuario } from '../types';

interface DesktopTopBarProps {
  activeTab: ActiveTab;
  user: Usuario;
  isDemo: boolean;
  backendOnline: boolean | null;
  isLoading: boolean;
  onRefresh: () => void;
  onToggleDemo: () => void;
  onToggleDemoRole?: () => void;
  onLogout: () => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({
  activeTab,
  user,
  isDemo,
  backendOnline,
  isLoading,
  onRefresh,
  onToggleDemo,
  onToggleDemoRole,
  onLogout,
}) => {
  const isAdmin = user.role === 'ADMIN';

  const titles: Record<ActiveTab, { title: string; subtitle: string; icon: React.ReactNode }> = {
    inventory: {
      title: 'Inventario Cosmético',
      subtitle: 'Control de existencias, referencias y precios unitarios',
      icon: <Package size={18} color="var(--color-rosewood)" />,
    },
    invoices: {
      title: 'Historial de Facturas & Ventas',
      subtitle: 'Comprobantes emitidos, estados de pago y descargas en PDF',
      icon: <Receipt size={18} color="var(--color-rosewood)" />,
    },
    'monthly-sales': {
      title: 'Reporte de Ventas por Mes',
      subtitle: 'Cálculo de ingresos mensuales, recaudo efectivo y saldos pendientes',
      icon: <BarChart3 size={18} color="var(--color-rosewood)" />,
    },
    brands: {
      title: 'Marcas Cosméticas',
      subtitle: 'Catálogo oficial de marcas activas del Atelier',
      icon: <Tag size={18} color="var(--color-rosewood)" />,
    },
  };

  const current = titles[activeTab] || titles.inventory;

  return (
    <header className="desktop-topbar" aria-label="Barra superior de contexto">
      <div className="desktop-topbar-inner">
        {/* Left: Section Title & Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="desktop-topbar-icon-box">
            {current.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 500 }}>
                Atelier
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-border)' }}>/</span>
              <h2 className="desktop-topbar-title">{current.title}</h2>
            </div>
            <p className="desktop-topbar-subtitle">{current.subtitle}</p>
          </div>
        </div>

        {/* Right: Consolidated Controls (Environment switch + Session + Refresh) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Backend / Demo status pill with click-to-switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '0.2rem 0.35rem 0.2rem 0.65rem',
              gap: '0.45rem',
            }}
          >
            <div
              className={`desktop-topbar-status-pill ${
                isDemo ? 'demo' : backendOnline ? 'online' : 'offline'
              }`}
              style={{ padding: 0, border: 'none', background: 'transparent' }}
              title={
                isDemo
                  ? 'Navegando con catálogo local ficticio (localStorage)'
                  : backendOnline
                  ? 'Conectado a Spring Boot en http://localhost:8080'
                  : 'Servidor Spring Boot no detectado'
              }
            >
              {isDemo ? <Database size={12} /> : <Server size={12} />}
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {isDemo
                  ? 'Modo Demo'
                  : backendOnline
                  ? 'Spring Boot En línea'
                  : 'Desconectado'}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleDemo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--color-rosewood)',
                backgroundColor: 'var(--color-rose-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
                padding: '0.15rem 0.5rem',
                cursor: 'pointer',
              }}
              title={
                isDemo
                  ? 'Cambiar a conexión con backend Spring Boot'
                  : 'Cambiar a modo demostración con datos locales'
              }
            >
              <span>{isDemo ? 'Cambiar a Backend' : 'Cambiar a Demo'}</span>
            </button>

            {isDemo && onToggleDemoRole && (
              <button
                type="button"
                onClick={onToggleDemoRole}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--color-accent-gold)',
                  backgroundColor: 'var(--color-accent-gold-light)',
                  border: '1px solid var(--color-accent-gold-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.45rem',
                  cursor: 'pointer',
                }}
                title="Alternar rol demo (Administradora / Vendedora)"
              >
                <span>{isAdmin ? 'Rol: ADMIN' : 'Rol: VENDEDOR'}</span>
              </button>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            className="btn-ghost"
            onClick={onRefresh}
            disabled={isLoading}
            title="Recargar datos del Atelier"
            aria-label="Recargar datos"
            style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)' }}
          >
            <RefreshCw
              size={15}
              style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--color-border)' }} />

          {/* User Profile Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-rose-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '0.2rem 0.65rem 0.2rem 0.35rem',
            }}
          >
            <div
              className={`sidebar-user-avatar ${isAdmin ? 'admin' : 'seller'}`}
              style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.75rem' }}
              aria-hidden="true"
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--color-rosewood-deep)',
                  maxWidth: '120px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={user.fullName || user.username}
              >
                {user.fullName || user.username}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck size={10} color="var(--color-rosewood)" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={10} color="var(--color-rose-mauve)" />
                    <span>Vendedora</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            className="btn-ghost logout"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-crimson)',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
