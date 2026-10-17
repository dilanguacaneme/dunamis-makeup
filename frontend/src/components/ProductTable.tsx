import React from 'react';
import { Edit2, Trash2, AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import type { Producto, CategoriaProducto } from '../types';

interface ProductTableProps {
  products: Producto[];
  onEdit: (product: Producto) => void;
  onDelete: (product: Producto) => void;
  onQuickAdjustStock: (id: number, newCantidad: number) => void;
  updatingStockId: number | null;
  isAdmin?: boolean;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onQuickAdjustStock,
  updatingStockId,
  isAdmin = true,
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
            <th style={{ width: '8.5rem' }}>Marca</th>
            <th style={{ width: '7rem' }}>Categoría</th>
            <th style={{ minWidth: '10rem' }}>Existencias</th>
            <th style={{ textAlign: 'right', width: '8.5rem' }}>Precio Unit.</th>
            <th style={{ textAlign: 'right', width: '8.5rem' }}>Valor Total</th>
            {isAdmin && <th style={{ textAlign: 'center', width: '10.5rem' }}>Ajuste y Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isAgotado = product.cantidad <= 0;
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

                {/* Brand */}
                <td>
                  {product.marca ? (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--color-rosewood-deep)',
                        backgroundColor: 'var(--color-rose-soft)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-block',
                      }}
                    >
                      {product.marca.nombre}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                      Sin marca
                    </span>
                  )}
                </td>

                {/* Category */}
                <td>{getCategoryBadge(product.categoria)}</td>

                {/* Stock - Units only, no ratios, marks zero as Agotado */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      className="tabular-numbers"
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: isAgotado ? 'var(--color-crimson)' : 'var(--color-text-main)',
                      }}
                    >
                      {product.cantidad} uds.
                    </span>

                    {isAgotado ? (
                      <span className="badge-stock badge-stock-critical" title="Existencias en cero (GET /producto/acabarse)">
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

                {/* Admin Stock Stepper & Edit / Delete Actions */}
                {isAdmin && (
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                      {/* Stepper with strict non-negative check */}
                      <div className="stock-stepper" title="Ajuste rápido de existencias">
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
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
