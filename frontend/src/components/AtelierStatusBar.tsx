import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface AtelierStatusBarProps {
  totalInventory: number;
  products: Producto[];
  lowStockProducts: Producto[];
  onOpenLowStockDrawer: () => void;
  onSelectCategory: (cat: CategoriaProducto) => void;
}

export const AtelierStatusBar: React.FC<AtelierStatusBarProps> = ({
  totalInventory,
  products,
  lowStockProducts,
  onOpenLowStockDrawer,
  onSelectCategory,
}) => {
  // Format Colombian Pesos COP
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group counts by category
  const categories: CategoriaProducto[] = ['ROSTRO', 'CEJAS', 'LABIOS', 'OJOS'];
  const categoryLabels: Record<CategoriaProducto, string> = {
    ROSTRO: 'Rostro',
    CEJAS: 'Cejas',
    LABIOS: 'Labios',
    OJOS: 'Ojos',
  };

  const countByCategory = categories.reduce<Record<CategoriaProducto, number>>(
    (acc, cat) => {
      acc[cat] = products.filter((p) => p.categoria === cat).length;
      return acc;
    },
    { ROSTRO: 0, CEJAS: 0, LABIOS: 0, OJOS: 0 }
  );

  const totalSKUs = products.length;
  const criticalCount = lowStockProducts.length;

  return (
    <section
      aria-label="Resumen de inventario y estado general"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        alignItems: 'center',
      }}
    >
      {/* 1. Total Valuation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-text-muted)' }}>
          <TrendingUp size={16} color="var(--color-bronze)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            Valoración total del inventario
          </span>
        </div>
        <div
          className="tabular-numbers"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.85rem',
            fontWeight: 700,
            color: 'var(--color-plum)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {formatCOP(totalInventory)}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Cálculo sobre <strong style={{ color: 'var(--color-text-main)' }}>{totalSKUs}</strong> referencias registradas
        </div>
      </div>

      {/* 2. Category Distribution */}
      <div
        style={{
          borderLeft: '1px solid var(--color-border-subtle)',
          paddingLeft: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-text-muted)' }}>
          <Layers size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            Distribución por zona cosmética
          </span>
        </div>

        {/* Proportional distribution chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {categories.map((cat) => {
            const count = countByCategory[cat];
            const badgeClass =
              cat === 'ROSTRO'
                ? 'badge-rostro'
                : cat === 'CEJAS'
                ? 'badge-cejas'
                : cat === 'LABIOS'
                ? 'badge-labios'
                : 'badge-ojos';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`badge-category ${badgeClass}`}
                title={`Filtrar por ${categoryLabels[cat]}`}
                style={{
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                <span>{categoryLabels[cat]}</span>
                <span
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.05rem 0.4rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Reorder Alert Pulse */}
      <div
        style={{
          borderLeft: '1px solid var(--color-border-subtle)',
          paddingLeft: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {criticalCount > 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-crimson-light)',
              border: '1px solid var(--color-crimson-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={20} color="var(--color-crimson)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-crimson)', lineHeight: 1.2 }}>
                  {criticalCount} {criticalCount === 1 ? 'producto crítico' : 'productos críticos'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7E2021' }}>
                  Existencias en o por debajo del 10%
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenLowStockDrawer}
              style={{
                backgroundColor: 'var(--color-crimson)',
                color: '#FFFFFF',
                fontSize: '0.775rem',
                fontWeight: 600,
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              Revisar alerta
            </button>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--color-sage-light)',
              border: '1px solid var(--color-sage-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <CheckCircle2 size={20} color="var(--color-sage)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-sage)' }}>
                Niveles de stock óptimos
              </div>
              <div style={{ fontSize: '0.75rem', color: '#2B5040' }}>
                Todas las referencias superan el umbral de reposición
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
