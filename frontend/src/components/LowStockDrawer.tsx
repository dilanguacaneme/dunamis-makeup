import React from 'react';
import { X, AlertTriangle, PackagePlus, CheckCircle2 } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface LowStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockProducts: Producto[];
  onRestockProduct: (product: Producto, additionalQty: number) => void;
}

export const LowStockDrawer: React.FC<LowStockDrawerProps> = ({
  isOpen,
  onClose,
  lowStockProducts,
  onRestockProduct,
}) => {
  if (!isOpen) return null;

  const getCategoryBadge = (cat: CategoriaProducto) => {
    switch (cat) {
      case 'ROSTRO':
        return <span className="badge-category badge-rostro">Rostro</span>;
      case 'CEJAS':
        return <span className="badge-category badge-cejas">Cejas</span>;
      case 'LABIOS':
        return <span className="badge-category badge-labios">Labios</span>;
      case 'OJOS':
        return <span className="badge-category badge-ojos">Ojos</span>;
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="Panel de productos por acabarse"
      >
        {/* Drawer Header */}
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
                borderRadius: '50%',
                backgroundColor: 'var(--color-crimson-light)',
                color: 'var(--color-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--color-plum)',
                  lineHeight: 1.2,
                }}
              >
                Reposición Urgente
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Productos con existencias ≤ 10% del stock inicial
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            aria-label="Cerrar panel"
            style={{ padding: '0.4rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {lowStockProducts.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircle2 size={36} color="var(--color-sage)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                Sin alertas activas
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
                Todas las referencias se encuentran con existencias suficientes por encima del umbral de seguridad.
              </p>
            </div>
          ) : (
            lowStockProducts.map((p) => {
              const initial = p.cantidadInicial || 1;
              const percentage = Math.round((p.cantidad / initial) * 100);
              const neededToInitial = Math.max(0, initial - p.cantidad);

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-crimson-border)',
                    padding: '1rem',
                    boxShadow: 'var(--shadow-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <div style={{ marginBottom: '0.25rem' }}>{getCategoryBadge(p.categoria)}</div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                        {p.nombre}
                      </h4>
                    </div>
                    <span
                      className="tabular-numbers"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-crimson-light)',
                        color: 'var(--color-crimson)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {percentage}% rest.
                    </span>
                  </div>

                  {/* Stock metrics */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-rose-subtle)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span>
                      Disponible: <strong className="tabular-numbers" style={{ color: 'var(--color-crimson)' }}>{p.cantidad} uds.</strong>
                    </span>
                    <span>
                      Inicial: <span className="tabular-numbers">{p.cantidadInicial} uds.</span>
                    </span>
                  </div>

                  {/* Quick Reorder Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onRestockProduct(p, 5)}
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                      title="Sumar 5 unidades al inventario"
                    >
                      <PackagePlus size={14} />
                      <span>+5 uds.</span>
                    </button>
                    {neededToInitial > 0 && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onRestockProduct(p, neededToInitial)}
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        title={`Restablecer al stock inicial de ${p.cantidadInicial} unidades`}
                      >
                        <PackagePlus size={14} />
                        <span>Completar dotación (+{neededToInitial})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
