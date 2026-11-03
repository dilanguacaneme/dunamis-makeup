import React from 'react';
import { Edit2, Trash2, AlertCircle, CheckCircle, Minus, Plus, RotateCcw } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface ProductGridProps {
  products: Producto[];
  onEdit: (product: Producto) => void;
  onDelete: (product: Producto) => void;
  onQuickAdjustStock: (id: number, newCantidad: number) => void;
  updatingStockId: number | null;
  isAdmin?: boolean;
  onReactivate?: (product: Producto) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onEdit,
  onDelete,
  onQuickAdjustStock,
  updatingStockId,
  isAdmin = true,
  onReactivate,
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
        const isAgotado = product.cantidad <= 0;
        const isUpdating = updatingStockId === product.id;

        return (
          <div
            key={product.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: isAgotado ? '1px solid var(--color-crimson-border)' : '1px solid var(--color-border)',
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
            {/* Top row: Category + Brand + Ref */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                {getCategoryBadge(product.categoria)}
                {product.marca && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--color-rosewood-deep)',
                      backgroundColor: 'var(--color-rose-soft)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {product.marca.nombre}
                  </span>
                )}
                {product.activo === false && (
                  <span className="badge-status badge-inactive" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                    Inactivo
                  </span>
                )}
              </div>
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

            {/* Stock Level Card (Units only, no ratios, marks zero as Agotado) */}
            <div
              style={{
                backgroundColor: isAgotado ? 'var(--color-crimson-light)' : '#FAF7F4',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                border: `1px solid ${isAgotado ? 'var(--color-crimson-border)' : 'var(--color-border-subtle)'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    Existencias:
                  </span>
                  <span
                    className="tabular-numbers"
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: isAgotado ? 'var(--color-crimson)' : 'var(--color-text-main)',
                    }}
                  >
                    {product.cantidad} unidades
                  </span>
                </div>

                {isAgotado ? (
                  <span className="badge-stock badge-stock-critical" title="Producto agotado (GET /producto/acabarse)">
                    <AlertCircle size={11} />
                    <span>Agotado</span>
                  </span>
                ) : (
                  <span className="badge-stock badge-stock-healthy">
                    <CheckCircle size={11} />
                    <span>Disponible</span>
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row: Admin Stepper and actions */}
            {isAdmin && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: '0.75rem',
                }}
              >
                {product.activo === false ? (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => onReactivate && onReactivate(product)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    title="Reactivar producto en inventario activo"
                  >
                    <RotateCcw size={13} />
                    <span>Reactivar</span>
                  </button>
                ) : (
                  <div className="stock-stepper">
                    <button
                      type="button"
                      className="stock-stepper-btn"
                      disabled={product.cantidad <= 0 || isUpdating}
                      onClick={() => onQuickAdjustStock(product.id, Math.max(0, product.cantidad - 1))}
                      title="Restar 1 unidad (no permite valores negativos)"
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
                )}

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
                  {product.activo !== false && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onDelete(product)}
                      title="Eliminar o desactivar producto"
                      style={{ padding: '0.35rem', color: 'var(--color-crimson)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
