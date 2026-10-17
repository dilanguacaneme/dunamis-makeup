import React, { useState } from 'react';
import { X, ShoppingBag, Check } from 'lucide-react';
import type { Producto, FacturaInput } from '../types';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Producto[];
  onSaleSuccess: (saleInput: FacturaInput) => Promise<void>;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaleSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <QuickSaleModalContent
        products={products}
        onClose={onClose}
        onSaleSuccess={onSaleSuccess}
      />
    </div>
  );
};

interface QuickSaleModalContentProps {
  products: Producto[];
  onClose: () => void;
  onSaleSuccess: (saleInput: FacturaInput) => Promise<void>;
}

const QuickSaleModalContent: React.FC<QuickSaleModalContentProps> = ({
  products,
  onClose,
  onSaleSuccess,
}) => {
  const availableProducts = products.filter((p) => p.cantidad > 0);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>(
    availableProducts.length > 0 ? availableProducts[0].id : ''
  );
  const [cantidad, setCantidad] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentProduct = products.find((p) => p.id === Number(selectedProductId));
  const maxStock = currentProduct ? currentProduct.cantidad : 0;
  const subtotal = currentProduct ? currentProduct.precio * cantidad : 0;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId || !currentProduct) {
      setError('Debes seleccionar un producto cosmético para la venta.');
      return;
    }

    if (cantidad <= 0) {
      setError('La cantidad a vender debe ser de al menos 1 unidad.');
      return;
    }

    if (cantidad > maxStock) {
      setError(`Stock insuficiente. Solo quedan ${maxStock} unidades disponibles.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const facturaPayload: FacturaInput = {
        detalles: [
          {
            producto: { id: currentProduct.id },
            cantidad,
          },
        ],
      };
      await onSaleSuccess(facturaPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al emitir la factura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
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
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-rose-soft)',
              color: 'var(--color-rosewood)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={16} />
          </div>
          <div>
            <h2
              id="sale-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
              }}
            >
              Registrar Venta / Factura
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Conexión con endpoint backend: /factura/crear
            </span>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
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

        {/* Product Select */}
        <div className="form-group">
          <label className="form-label" htmlFor="sale-product">
            Producto a vender
          </label>
          <select
            id="sale-product"
            className="form-select"
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(Number(e.target.value));
              setCantidad(1);
            }}
            required
          >
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {formatCOP(p.precio)} ({p.cantidad} uds. disponibles)
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad y Stock Restante */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sale-qty">
              Cantidad a facturar
            </label>
            <input
              id="sale-qty"
              type="number"
              min="1"
              max={maxStock}
              className="form-input"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Stock actual en tienda
            </label>
            <div
              style={{
                padding: '0.6rem 0.85rem',
                backgroundColor: '#FAF7F4',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
                color: 'var(--color-text-main)',
                fontWeight: 600,
              }}
            >
              {maxStock} unidades
            </div>
          </div>
        </div>

        {/* Total calculation indicator */}
        <div
          style={{
            backgroundColor: 'var(--color-rose-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-rosewood)', fontWeight: 600, display: 'block' }}>
              Total a facturar
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {cantidad} uds. × {currentProduct ? formatCOP(currentProduct.precio) : '$0'}
            </span>
          </div>
          <span
            className="tabular-numbers"
            style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-rosewood-deep)' }}
          >
            {formatCOP(subtotal)}
          </span>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-accent" disabled={isSubmitting || maxStock === 0}>
            <Check size={16} />
            <span>{isSubmitting ? 'Registrando...' : 'Emitir factura'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
