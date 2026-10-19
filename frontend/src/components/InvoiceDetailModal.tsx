import React, { useState, useEffect } from 'react';
import { X, Printer, Sparkles, AlertCircle, Calendar, User, Phone } from 'lucide-react';
import { inventoryApi } from '../services/api';
import type { Factura, Usuario } from '../types';

interface InvoiceDetailModalProps {
  invoiceId: number | null;
  onClose: () => void;
  isDemo: boolean;
  currentUser: Usuario | null;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoiceId,
  onClose,
  isDemo,
  currentUser,
}) => {
  if (!invoiceId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <InvoiceDetailModalContent
        key={invoiceId}
        invoiceId={invoiceId}
        onClose={onClose}
        isDemo={isDemo}
        currentUser={currentUser}
      />
    </div>
  );
};

interface InvoiceDetailModalContentProps {
  invoiceId: number;
  onClose: () => void;
  isDemo: boolean;
  currentUser: Usuario | null;
}

const InvoiceDetailModalContent: React.FC<InvoiceDetailModalContentProps> = ({
  invoiceId,
  onClose,
  isDemo,
  currentUser,
}) => {
  const [invoice, setInvoice] = useState<Factura | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInvoice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await inventoryApi.getInvoiceById(
          invoiceId,
          isDemo,
          currentUser?.role,
          currentUser?.username
        );
        if (isMounted) setInvoice(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error al consultar la factura.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchInvoice();

    return () => {
      isMounted = false;
    };
  }, [invoiceId, isDemo, currentUser]);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-content invoice-printable-container"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-detail-title"
      style={{ maxWidth: '650px' }}
    >
      {/* Modal Header */}
      <div
        className="no-print"
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
          <div>
            <h2
              id="invoice-detail-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
              }}
            >
              Comprobante de Factura #{invoiceId}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Consultado desde GET /factura/obtener-factura-por-id/{invoiceId}
            </span>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {isLoading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando detalle de la factura...
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: 'var(--color-crimson-light)',
              border: '1px solid var(--color-crimson-border)',
              color: 'var(--color-crimson)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : invoice ? (
          <div className="printable-receipt">
            {/* Receipt Brand Banner */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: '1.25rem',
                borderBottom: '1px dashed var(--color-border)',
                marginBottom: '1.25rem',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--color-rosewood-deep)',
                  marginBottom: '0.2rem',
                }}
              >
                Dunamis Makeup
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Atelier Privado · Comprobante de Venta Oficial
              </p>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.2rem 0.75rem',
                  backgroundColor: 'var(--color-rose-soft)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-rosewood)',
                }}
              >
                Factura N° {invoice.id}
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                backgroundColor: 'var(--color-canvas)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.825rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} />
                  <span>Cliente:</span>
                </div>
                <strong style={{ color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                  {invoice.cliente}
                </strong>
                {invoice.telefonoCliente && (
                  <div style={{ color: 'var(--color-text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={12} />
                    <span>{invoice.telefonoCliente}</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ color: 'var(--color-text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} />
                  <span>Fecha & Vendedor:</span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {invoice.fecha || 'Hoy'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  Atendido por: {invoice.vendedorNombre || invoice.vendedorUsuario || 'Personal Atelier'}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.825rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.25rem', color: 'var(--color-text-muted)' }}>Producto</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center', width: '4rem', color: 'var(--color-text-muted)' }}>Cant.</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', width: '6.5rem', color: 'var(--color-text-muted)' }}>Precio Unit.</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', width: '6.5rem', color: 'var(--color-text-muted)' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.detalles && invoice.detalles.length > 0 ? (
                    invoice.detalles.map((detalle, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '0.65rem 0.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                            {detalle.producto?.nombre || 'Producto cosmético'}
                          </div>
                          {detalle.producto?.marca && (
                            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-subtle)' }}>
                              Marca: {detalle.producto.marca.nombre}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.25rem', textAlign: 'center', fontWeight: 600 }}>
                          {detalle.cantidad}
                        </td>
                        <td style={{ padding: '0.65rem 0.25rem', textAlign: 'right' }} className="tabular-numbers">
                          {formatCOP(detalle.producto?.precio || 0)}
                        </td>
                        <td style={{ padding: '0.65rem 0.25rem', textAlign: 'right', fontWeight: 600 }} className="tabular-numbers">
                          {formatCOP(detalle.subtotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Detalles de la factura procesados. Total: {formatCOP(invoice.total)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--color-rose-soft)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-rosewood-deep)' }}>
                Total Factura
              </span>
              <span
                className="tabular-numbers"
                style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-rosewood-deep)' }}
              >
                {formatCOP(invoice.total)}
              </span>
            </div>

            {/* Printable Footer */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-text-subtle)',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--color-border)',
              }}
            >
              ¡Gracias por tu compra en Dunamis Makeup! Resalta tu belleza única.
            </div>
          </div>
        ) : null}

        {/* Modal Actions */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            disabled={!invoice}
          >
            <Printer size={16} />
            <span>Imprimir factura</span>
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
