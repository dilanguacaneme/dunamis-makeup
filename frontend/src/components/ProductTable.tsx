import React from 'react';
import { Edit2, Trash2, AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface ProductTableProps {
  products: Producto[];
  onEdit: (product: Producto) => void;
  onDelete: (product: Producto) => void;
  onQuickAdjustStock: (id: number, newCantidad: number) => void;
  updatingStockId: number | null;
}

export const ProductTable: React.FC<ProductTableProps> = ({
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
    <div className="table-responsive-wrapper">
      <table className="inventory-table">
        <thead>
          <tr>
            <th style={{ width: '4rem' }}>Ref</th>
            <th>Producto</th>
            <th style={{ width: '7rem' }}>Categoría</th>
            <th style={{ minWidth: '13rem' }}>Existencias y Nivel</th>
            <th style={{ textAlign: 'right', width: '8.5rem' }}>Precio Unit.</th>
            <th style={{ textAlign: 'right', width: '8.5rem' }}>Valor Total</th>
            <th style={{ textAlign: 'center', width: '10.5rem' }}>Ajuste y Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const initial = product.cantidadInicial || product.cantidad || 1;
            const percentage = Math.min(100, Math.max(0, Math.round((product.cantidad / initial) * 100)));
            const isCritical = product.cantidad <= initial * 0.1;
            const isWarning = !isCritical && product.cantidad <= initial * 0.25;
            const isUpdating = updatingStockId === product.id;

            return (
              <tr key={product.id}>
                {/* Ref ID */}
                <td style={{ color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                  #{product.id}
                </td>

                {/* Name */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                    {product.nombre}
                  </div>
                </td>

                {/* Category */}
                <td>{getCategoryBadge(product.categoria)}</td>

                {/* Stock Level Bar & Percentage */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span className="tabular-numbers" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {product.cantidad} / {product.cantidadInicial} uds.
                      </span>

                      {/* Stock badge */}
                      {isCritical ? (
                        <span className="badge-stock badge-stock-critical" title="Menos del 10% del stock inicial">
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

                    {/* Gauge bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '5px',
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
                </td>

                {/* Unit Price */}
                <td style={{ textAlign: 'right' }}>
                  <span className="tabular-numbers" style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                    {formatCOP(product.precio)}
                  </span>
                </td>

                {/* Total Value */}
                <td style={{ textAlign: 'right' }}>
                  <span
                    className="tabular-numbers"
                    style={{
                      fontWeight: 700,
                      color: 'var(--color-bronze-hover)',
                    }}
                  >
                    {formatCOP(product.totalProducto || product.precio * product.cantidad)}
                  </span>
                </td>

                {/* Quick Stock Stepper & Edit / Delete Actions */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                    {/* Stepper */}
                    <div className="stock-stepper" title="Ajuste rápido de unidades">
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

                    {/* Edit button */}
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onEdit(product)}
                      title="Modificar producto"
                      style={{ padding: '0.35rem' }}
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Delete button */}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
