import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Producto, ProductoInput, CategoriaProducto } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ProductoInput, editingId?: number) => Promise<void>;
  editingProduct: Producto | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <ProductModalContent
        key={editingProduct ? editingProduct.id : 'new'}
        editingProduct={editingProduct}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
};

interface ProductModalContentProps {
  editingProduct: Producto | null;
  onClose: () => void;
  onSubmit: (input: ProductoInput, editingId?: number) => Promise<void>;
}

const ProductModalContent: React.FC<ProductModalContentProps> = ({
  editingProduct,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState(editingProduct ? editingProduct.nombre : '');
  const [precio, setPrecio] = useState<number | ''>(editingProduct ? editingProduct.precio : '');
  const [cantidad, setCantidad] = useState<number | ''>(editingProduct ? editingProduct.cantidad : '');
  const [categoria, setCategoria] = useState<CategoriaProducto>(editingProduct ? editingProduct.categoria : 'ROSTRO');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('Por favor indica el nombre del producto cosmético.');
      return;
    }

    if (precio === '' || Number(precio) <= 0) {
      setError('El precio unitario debe ser un valor positivo en pesos colombianos (COP).');
      return;
    }

    if (cantidad === '' || Number(cantidad) < 0) {
      setError('La cantidad en existencias no puede ser un número negativo.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(
        {
          nombre: nombre.trim(),
          precio: Math.round(Number(precio)),
          cantidad: Math.round(Number(cantidad)),
          categoria,
        },
        editingProduct ? editingProduct.id : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedTotal =
    typeof precio === 'number' && typeof cantidad === 'number'
      ? precio * cantidad
      : 0;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Header */}
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
              width: '2.1rem',
              height: '2.1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-rosewood)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} />
          </div>
          <h2
            id="product-modal-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--color-rosewood-deep)',
            }}
          >
            {editingProduct ? 'Modificar Producto' : 'Registrar Nuevo Producto'}
          </h2>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-crimson-light)',
              border: '1px solid var(--color-crimson-border)',
              color: 'var(--color-crimson)',
              fontSize: '0.85rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Nombre */}
        <div className="form-group">
          <label className="form-label" htmlFor="product-name">
            Nombre de la referencia cosmética
          </label>
          <input
            id="product-name"
            type="text"
            className="form-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Base Sérum Hidratante Glow"
            required
          />
        </div>

        {/* Categoría */}
        <div className="form-group">
          <label className="form-label" htmlFor="product-cat">
            Zona cosmética / Categoría
          </label>
          <select
            id="product-cat"
            className="form-select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaProducto)}
            required
          >
            <option value="ROSTRO">Rostro</option>
            <option value="CEJAS">Cejas</option>
            <option value="LABIOS">Labios</option>
            <option value="OJOS">Ojos</option>
          </select>
          <span className="form-hint">
            Categorías oficiales del catálogo Dunamis Makeup.
          </span>
        </div>

        {/* Grid row: Precio y Cantidad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="product-price">
              Precio unitario (COP)
            </label>
            <input
              id="product-price"
              type="number"
              min="1"
              step="1"
              className="form-input"
              value={precio}
              onChange={(e) => setPrecio(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej: 86000"
              required
            />
            <span className="form-hint">
              Valores enteros en COP (ej. 86000).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="product-qty">
              Cantidad disponible (uds.)
            </label>
            <input
              id="product-qty"
              type="number"
              min="0"
              step="1"
              className="form-input"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej: 15"
              required
            />
            <span className="form-hint">
              Unidades actuales en almacén.
            </span>
          </div>
        </div>

        {/* Total calculation indicator */}
        <div
          style={{
            backgroundColor: 'var(--color-rose-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Valoración total lote:
          </span>
          <span
            className="tabular-numbers"
            style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-rosewood-deep)' }}
          >
            {formatCOP(calculatedTotal)}
          </span>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando...'
              : editingProduct
              ? 'Actualizar producto'
              : 'Guardar en inventario'}
          </button>
        </div>
      </form>
    </div>
  );
};
