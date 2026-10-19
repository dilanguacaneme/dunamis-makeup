import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
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

interface SaleLineItem {
  productId: number;
  cantidad: number;
}

const QuickSaleModalContent: React.FC<QuickSaleModalContentProps> = ({
  products,
  onClose,
  onSaleSuccess,
}) => {
  const availableProducts = products.filter((p) => p.cantidad > 0);

  const [cliente, setCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [items, setItems] = useState<SaleLineItem[]>([
    {
      productId: availableProducts.length > 0 ? availableProducts[0].id : 0,
      cantidad: 1,
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAddItem = () => {
    const unusedProduct = availableProducts.find(
      (p) => !items.some((item) => item.productId === p.id)
    );
    const productIdToAdd = unusedProduct ? unusedProduct.id : availableProducts[0]?.id || 0;
    setItems((prev) => [...prev, { productId: productIdToAdd, cantidad: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemProduct = (index: number, newProductId: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, productId: newProductId, cantidad: 1 } : item))
    );
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, cantidad: Math.max(1, qty) } : item))
    );
  };

  // Calculate totals
  const totalFactura = items.reduce((acc, item) => {
    const prod = products.find((p) => p.id === item.productId);
    return acc + (prod ? prod.precio * item.cantidad : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCliente = cliente.trim();
    if (!cleanCliente) {
      setError('El nombre del cliente es obligatorio para emitir la factura.');
      return;
    }

    if (items.length === 0) {
      setError('La factura debe tener al menos un producto cosmético.');
      return;
    }

    // Verify all items are valid and have sufficient stock
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        setError('Uno de los productos seleccionados no es válido.');
        return;
      }
      if (item.cantidad <= 0) {
        setError(`La cantidad para "${prod.nombre}" debe ser mayor a cero.`);
        return;
      }
      if (item.cantidad > prod.cantidad) {
        setError(
          `Stock insuficiente para "${prod.nombre}". Existencias actuales: ${prod.cantidad} uds.`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const facturaPayload: FacturaInput = {
        cliente: cleanCliente,
        telefonoCliente: telefonoCliente.trim() || undefined,
        detalles: items.map((item) => ({
          producto: { id: item.productId },
          cantidad: item.cantidad,
        })),
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
      style={{ maxWidth: '620px' }}
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
              backgroundColor: 'var(--color-rose-soft)',
              color: 'var(--color-rosewood)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={18} />
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
              Registrar Venta / Emitir Factura
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Genera factura con cliente y descuenta stock automáticamente (POST /factura/crear)
            </span>
          </div>
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Customer Information (Requirement 1: customer name required, optional phone) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="sale-customer-name">
              Nombre del cliente <span style={{ color: 'var(--color-crimson)' }}>*</span>
            </label>
            <input
              id="sale-customer-name"
              type="text"
              className="form-input"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: Carolina Gómez"
              required
            />
            <span className="form-hint">Campo obligatorio (max 255 caracteres).</span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="sale-customer-phone">
              Teléfono de contacto <span style={{ color: 'var(--color-text-subtle)', fontWeight: 400 }}>(Opcional)</span>
            </label>
            <input
              id="sale-customer-phone"
              type="text"
              className="form-input"
              value={telefonoCliente}
              onChange={(e) => setTelefonoCliente(e.target.value)}
              placeholder="Ej: 312 456 7890"
            />
            <span className="form-hint">Número de contacto para la factura.</span>
          </div>
        </div>

        {/* Product items table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              Referencias cosméticas a facturar
            </label>
            {availableProducts.length > items.length && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleAddItem}
                style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: 'var(--color-rosewood)' }}
              >
                <Plus size={13} />
                <span>+ Agregar otra referencia</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item, idx) => {
              const currentProd = products.find((p) => p.id === item.productId);
              const maxUnits = currentProd ? currentProd.cantidad : 0;
              const lineSubtotal = currentProd ? currentProd.precio * item.cantidad : 0;

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <select
                        className="form-select"
                        value={item.productId}
                        onChange={(e) => handleUpdateItemProduct(idx, Number(e.target.value))}
                        required
                        style={{ fontSize: '0.875rem' }}
                      >
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} {p.marca ? `(${p.marca.nombre})` : ''} — {formatCOP(p.precio)} ({p.cantidad} uds.)
                          </option>
                        ))}
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ padding: '0.35rem', color: 'var(--color-crimson)' }}
                        title="Quitar de la factura"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-rose-subtle)',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Cantidad:</span>
                      <input
                        type="number"
                        min="1"
                        max={maxUnits}
                        value={item.cantidad}
                        onChange={(e) => handleUpdateItemQty(idx, Number(e.target.value))}
                        className="form-input"
                        style={{ width: '4.5rem', padding: '0.2rem 0.45rem', fontSize: '0.825rem' }}
                        required
                      />
                      <span>(Disponible: {maxUnits} uds.)</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span>Subtotal: </span>
                      <strong className="tabular-numbers" style={{ color: 'var(--color-rosewood-deep)' }}>
                        {formatCOP(lineSubtotal)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total calculation banner */}
        <div
          style={{
            backgroundColor: 'var(--color-rose-soft)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-rosewood)', fontWeight: 600, display: 'block' }}>
              Total general de la factura
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {items.length} {items.length === 1 ? 'referencia cosmética' : 'referencias cosméticas'}
            </span>
          </div>
          <span
            className="tabular-numbers"
            style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-rosewood-deep)' }}
          >
            {formatCOP(totalFactura)}
          </span>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-accent"
            disabled={isSubmitting || availableProducts.length === 0}
          >
            <Check size={16} />
            <span>{isSubmitting ? 'Emitiendo factura...' : 'Emitir factura'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
