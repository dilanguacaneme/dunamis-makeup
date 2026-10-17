import React, { useState } from 'react';
import { X, AlertTriangle, PackagePlus, CheckCircle2 } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface LowStockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockProducts: Producto[];
  onRestockProduct: (product: Producto, additionalQty: number) => void;
  isAdmin?: boolean;
}

export const LowStockDrawer: React.FC<LowStockDrawerProps> = ({
  isOpen,
  onClose,
  lowStockProducts,
  onRestockProduct,
  isAdmin = true,
}) => {
  const [customQtyMap, setCustomQtyMap] = useState<Record<number, number>>({});

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

  const handleCustomRestock = (product: Producto) => {
    const qty = customQtyMap[product.id] || 10;
    if (qty > 0) {
      onRestockProduct(product, qty);
      setCustomQtyMap((prev) => ({ ...prev, [product.id]: 10 }));
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="Panel de productos agotados"
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
                Productos Agotados
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Referencias con 0 unidades en inventario (GET /producto/acabarse)
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
                Sin productos agotados
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
                Todas las referencias cuentan con unidades disponibles en almacén.
              </p>
            </div>
          ) : (
            lowStockProducts.map((p) => {
              const customQty = customQtyMap[p.id] ?? 10;

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        {getCategoryBadge(p.categoria)}
                        {p.marca && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--color-rosewood-deep)',
                              backgroundColor: 'var(--color-rose-soft)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {p.marca.nombre}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                        {p.nombre}
                      </h4>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-crimson-light)',
                        color: 'var(--color-crimson)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Agotado
                    </span>
                  </div>

                  {/* Stock metric: units only, no ratios */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-crimson-light)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span>Existencias actuales:</span>
                    <strong className="tabular-numbers" style={{ color: 'var(--color-crimson)', fontSize: '0.9rem' }}>
                      {p.cantidad} unidades
                    </strong>
                  </div>

                  {/* Restock Actions */}
                  {isAdmin ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onRestockProduct(p, 5)}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                          title="Añadir 5 unidades de stock"
                        >
                          <PackagePlus size={13} />
                          <span>+5 uds.</span>
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => onRestockProduct(p, 10)}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                          title="Añadir 10 unidades de stock"
                        >
                          <PackagePlus size={13} />
                          <span>+10 uds.</span>
                        </button>
                      </div>

                      {/* Custom restock input */}
                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <input
                          type="number"
                          min="1"
                          value={customQty}
                          onChange={(e) =>
                            setCustomQtyMap((prev) => ({
                              ...prev,
                              [p.id]: Math.max(1, Number(e.target.value)),
                            }))
                          }
                          className="form-input"
                          style={{ width: '4.5rem', padding: '0.25rem 0.45rem', fontSize: '0.8rem' }}
                          title="Cantidad personalizada a reabastecer"
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleCustomRestock(p)}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        >
                          <PackagePlus size={13} />
                          <span>Reabastecer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', textAlign: 'right' }}>
                      Reabastecimiento gestionado por administración
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
