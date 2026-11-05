import React, { useEffect } from 'react';
import {
  Package,
  Receipt,
  Tag,
  Layers,
  BarChart3,
  X,
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  productsCount: number;
  invoicesCount: number;
  brandsCount: number;
  categoriesCount?: number;
  isAdmin: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  productsCount,
  invoicesCount,
  brandsCount,
  categoriesCount = 0,
  isAdmin,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element (Strictly Pure Navigation) */}
      <aside
        className={`sidebar ${isMobileOpen ? 'open' : ''}`}
        aria-label="Navegación principal"
      >
        {/* 1. Brand Header */}
        <div className="sidebar-brand-section">
          <div className="sidebar-brand-identity">
            <div className="sidebar-brand-crest">
              <img
              src="/logo-dunamis.webp"
              alt="Dunamis Makeup"
              className="sidebar-brand-logo-img"
            />
            </div>
            <div className="sidebar-brand-info">
              <div className="sidebar-brand-title-row">
                <h1 className="sidebar-brand-title">Dunamis Makeup</h1>
                <span className="sidebar-brand-badge">Cosmética</span>
              </div>
              <p className="sidebar-brand-subtitle">Gestión cosmética & ventas</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Cerrar menú lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Navigation Links (Exclusively Navigation) */}
        <div className="sidebar-content-scroll">
          <nav className="sidebar-nav-group" aria-label="Secciones del sistema">
            <div className="sidebar-section-eyebrow">Menú Principal</div>

            {/* 1. Link: Inventario */}
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => handleNavClick('inventory')}
              aria-current={activeTab === 'inventory' ? 'page' : undefined}
            >
              <div className="sidebar-nav-item-left">
                <Package size={18} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">Inventario</span>
              </div>
              <span className="sidebar-nav-badge">{productsCount}</span>
            </button>

            {/* 2. Link: Categorías Cosméticas (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => handleNavClick('categories')}
                aria-current={activeTab === 'categories' ? 'page' : undefined}
              >
                <div className="sidebar-nav-item-left">
                  <Layers size={18} className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">Categorías</span>
                </div>
                <span className="sidebar-nav-badge">{categoriesCount}</span>
              </button>
            )}

            {/* 3. Link: Marcas Cosméticas (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'brands' ? 'active' : ''}`}
                onClick={() => handleNavClick('brands')}
                aria-current={activeTab === 'brands' ? 'page' : undefined}
              >
                <div className="sidebar-nav-item-left">
                  <Tag size={18} className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">Marcas</span>
                </div>
                <span className="sidebar-nav-badge">{brandsCount}</span>
              </button>
            )}

            {/* 4. Link: Facturas & Ventas */}
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => handleNavClick('invoices')}
              aria-current={activeTab === 'invoices' ? 'page' : undefined}
            >
              <div className="sidebar-nav-item-left">
                <Receipt size={18} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">Facturas & Ventas</span>
              </div>
              <span className="sidebar-nav-badge">{invoicesCount}</span>
            </button>

            {/* 5. Link: Reporte de Ventas por Mes */}
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'monthly-sales' ? 'active' : ''}`}
              onClick={() => handleNavClick('monthly-sales')}
              aria-current={activeTab === 'monthly-sales' ? 'page' : undefined}
            >
              <div className="sidebar-nav-item-left">
                <BarChart3 size={18} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">Ventas por Mes</span>
              </div>
              <span className="sidebar-nav-badge" style={{ backgroundColor: 'var(--color-rose-soft)' }}>
                Reporte
              </span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
};
