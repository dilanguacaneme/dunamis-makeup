import React from 'react';
import { Edit2, Trash2, AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface ProductGridProps {
  products: Producto[];
  onEdit: (product: Producto) => void;
  onDelete: (product: Producto) => void;
  onQuickAdjustStock: (id: number, newCantidad: number) => void;
  updatingStockId: number | null;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onEdit,
  onDelete,
  onQuickAdjustStock,
  updatingStockId,
}) => {
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {products.map((product) => {
        const initial = product.cantidadInicial || product.cantidad || 1;
        const percentage = Math.min(100, Math.max(0, Math.round((product.cantidad / initial) * 100)));
        const isCritical = product.cantidad <= initial * 0.1;
        const isWarning = !isCritical && product.cantidad <= initial * 0.25;
        const isUpdating = updatingStockId === product.id;

        return (
          <div
            key={product.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: isCritical ? '1px solid var(--color-crimson-border)' : '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
              position: 'relative',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            {/* Top row: Category + Ref */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {getCategoryBadge(product.categoria)}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
                Ref #{product.id}
              </span>
            </div>

            {/* Product Title & Unit Price */}
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--color-plum)',
                  lineHeight: 1.3,
                  marginBottom: '0.4rem',
                  minHeight: '2.6rem',
                }}
              >
                {product.nombre}
              </h3>
              <div
                className="tabular-numbers"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--color-bronze-hover)',
                }}
              >
                {formatCOP(product.precio)}
              </div>
            </div>

            {/* Stock Level Bar */}
            <div
              style={{
                backgroundColor: '#FAF7F4',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                }}
              >
                <span className="tabular-numbers" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {product.cantidad} / {product.cantidadInicial} uds.
                </span>

                {isCritical ? (
                  <span className="badge-stock badge-stock-critical">
                    <AlertCircle size={11} />
                    <span>Crítico ({percentage}%)</span>
                  </span>
                ) : isWarning ? (
                  <span className="badge-stock badge-stock-warning">
                    <span>Bajo ({percentage}%)</span>
                  </span>
                ) : (
                  <span className="badge-stock badge-stock-healthy">
                    <CheckCircle size={11} />
                    <span>Óptimo ({percentage}%)</span>
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--color-cashmere)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: isCritical
                      ? 'var(--color-crimson)'
                      : isWarning
                      ? 'var(--color-bronze)'
                      : 'var(--color-sage)',
                    transition: 'width 250ms ease-out',
                  }}
                />
              </div>
            </div>

            {/* Bottom Row: Stepper and actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: '0.75rem',
              }}
            >
              <div className="stock-stepper">
                <button
                  type="button"
                  className="stock-stepper-btn"
                  disabled={product.cantidad <= 0 || isUpdating}
                  onClick={() => onQuickAdjustStock(product.id, Math.max(0, product.cantidad - 1))}
                  title="Restar 1 unidad"
                >
                  <Minus size={12} />
                </button>
                <span className="stock-stepper-value tabular-numbers">
                  {product.cantidad}
                </span>
                <button
                  type="button"
                  className="stock-stepper-btn"
                  disabled={isUpdating}
                  onClick={() => onQuickAdjustStock(product.id, product.cantidad + 1)}
                  title="Sumar 1 unidad"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => onEdit(product)}
                  title="Modificar producto"
                  style={{ padding: '0.35rem' }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => onDelete(product)}
                  title="Eliminar producto"
                  style={{ padding: '0.35rem', color: 'var(--color-crimson)' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
