import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Sparkles,
  AlertCircle,
  Calendar,
  User,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { inventoryApi } from '../services/api';
import { downloadInvoicePDF, formatCOP } from '../services/pdfGenerator';
import type { Factura, Usuario, EstadoPagoFactura } from '../types';

interface InvoiceDetailModalProps {
  invoiceId: number | null;
  onClose: () => void;
  isDemo: boolean;
  currentUser: Usuario | null;
  onInvoiceUpdated?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoiceId,
  onClose,
  isDemo,
  currentUser,
  onInvoiceUpdated,
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
        onInvoiceUpdated={onInvoiceUpdated}
      />
    </div>
  );
};

interface InvoiceDetailModalContentProps {
  invoiceId: number;
  onClose: () => void;
  isDemo: boolean;
  currentUser: Usuario | null;
  onInvoiceUpdated?: () => void;
}

const InvoiceDetailModalContent: React.FC<InvoiceDetailModalContentProps> = ({
  invoiceId,
  onClose,
  isDemo,
  currentUser,
  onInvoiceUpdated,
}) => {
  const [invoice, setInvoice] = useState<Factura | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Partial payment form state (Demo mode support)
  const [abonoInput, setAbonoInput] = useState<number | ''>('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    downloadInvoicePDF(invoice);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || abonoInput === '' || Number(abonoInput) <= 0) return;

    try {
      setIsRecordingPayment(true);
      setError(null);
      const updated = await inventoryApi.recordInvoicePayment(
        invoice.id,
        Number(abonoInput),
        isDemo
      );
      setInvoice(updated);
      setAbonoInput('');
      setPaymentSuccessMsg(`Abono de ${formatCOP(Number(abonoInput))} registrado exitosamente.`);
      setTimeout(() => setPaymentSuccessMsg(null), 4000);
      if (onInvoiceUpdated) onInvoiceUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el abono.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const isSinRegistro = !invoice?.estadoPago || invoice.estadoPago === 'SIN_REGISTRO';
  const estadoPago: EstadoPagoFactura = isSinRegistro ? 'SIN_REGISTRO' : (invoice?.estadoPago || 'PAGADA');
  const valorAbonado = isSinRegistro
    ? (invoice?.valorAbonado !== undefined ? invoice.valorAbonado : null)
    : (invoice?.valorAbonado !== undefined
      ? invoice.valorAbonado
      : estadoPago === 'PAGADA'
      ? invoice?.total || 0
      : 0);
  const saldoPendiente = isSinRegistro
    ? null
    : (invoice?.saldoPendiente !== undefined
      ? invoice.saldoPendiente
      : Math.max(0, (invoice?.total || 0) - (valorAbonado || 0)));

  return (
    <div
      className="modal-content invoice-printable-container"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-detail-title"
      style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
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
          flexShrink: 0,
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
              Detalle oficial, descarga en PDF y control de pagos
            </span>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
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
                Atelier Privado · Comprobante Oficial de Venta
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.75rem',
                    backgroundColor: 'var(--color-rose-soft)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-rosewood)',
                  }}
                >
                  Factura N° {invoice.id}
                </span>

                {/* Payment Status Pill */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor:
                      estadoPago === 'SIN_REGISTRO'
                        ? 'var(--color-rose-subtle)'
                        : estadoPago === 'PAGADA'
                        ? 'var(--color-sage-light)'
                        : estadoPago === 'ABONO_PARCIAL'
                        ? 'var(--color-accent-gold-light)'
                        : 'var(--color-crimson-light)',
                    color:
                      estadoPago === 'SIN_REGISTRO'
                        ? 'var(--color-text-muted)'
                        : estadoPago === 'PAGADA'
                        ? 'var(--color-sage)'
                        : estadoPago === 'ABONO_PARCIAL'
                        ? 'var(--color-accent-gold)'
                        : 'var(--color-crimson)',
                    border: `1px solid ${
                      estadoPago === 'SIN_REGISTRO'
                        ? 'var(--color-border)'
                        : estadoPago === 'PAGADA'
                        ? 'var(--color-sage-border)'
                        : estadoPago === 'ABONO_PARCIAL'
                        ? 'var(--color-accent-gold-border)'
                        : 'var(--color-crimson-border)'
                    }`,
                  }}
                >
                  {estadoPago === 'SIN_REGISTRO' && <HelpCircle size={12} />}
                  {estadoPago === 'PAGADA' && <CheckCircle2 size={12} />}
                  {estadoPago === 'ABONO_PARCIAL' && <Clock size={12} />}
                  {estadoPago === 'PENDIENTE' && <AlertTriangle size={12} />}
                  <span>
                    {estadoPago === 'SIN_REGISTRO'
                      ? 'Sin registro de pago'
                      : estadoPago === 'PAGADA'
                      ? 'Pagada'
                      : estadoPago === 'ABONO_PARCIAL'
                      ? 'Abono Parcial'
                      : 'Pendiente'}
                  </span>
                </span>
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                  <span>Fecha & Atención:</span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {invoice.fecha || 'Hoy'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  Por: {invoice.vendedorNombre || invoice.vendedorUsuario || 'Personal Atelier'}
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
                          <div style={{ fontWeight: 600, color: 'var(--color-rosewood-deep)' }}>
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

            {/* Payment & Balance Ledger Box (Requirement 5) */}
            <div
              style={{
                backgroundColor: 'var(--color-canvas)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Total Factura:
                </span>
                <span className="tabular-numbers" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-rosewood-deep)' }}>
                  {formatCOP(invoice.total)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Valor Abonado:
                </span>
                <span
                  className="tabular-numbers"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: isSinRegistro ? 'var(--color-text-muted)' : 'var(--color-sage)',
                  }}
                >
                  {isSinRegistro ? 'Sin registrar' : formatCOP(valorAbonado || 0)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Saldo Pendiente:
                </span>
                <span
                  className="tabular-numbers"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: isSinRegistro ? 'var(--color-text-muted)' : (saldoPendiente || 0) > 0 ? 'var(--color-crimson)' : 'var(--color-sage)',
                  }}
                >
                  {isSinRegistro ? 'Por conciliar' : formatCOP(saldoPendiente || 0)}
                </span>
              </div>
            </div>

            {/* Notice for invoices with no payment record */}
            {isSinRegistro && (
              <div
                style={{
                  backgroundColor: 'var(--color-rose-subtle)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <HelpCircle size={15} color="var(--color-rosewood)" style={{ flexShrink: 0 }} />
                <span>
                  Esta factura no cuenta con estado de pago registrado en el backend Spring Boot. Los abonos y cobros requieren soporte en la base de datos.
                </span>
              </div>
            )}

            {/* Payment Success Feedback */}
            {paymentSuccessMsg && (
              <div
                style={{
                  backgroundColor: 'var(--color-sage-light)',
                  border: '1px solid var(--color-sage-border)',
                  color: 'var(--color-sage)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <CheckCircle2 size={15} />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {/* Payment Registration in Demo Mode */}
            {!isSinRegistro && saldoPendiente && saldoPendiente > 0 && isDemo && (
              <form
                onSubmit={handleRecordPayment}
                className="no-print"
                style={{
                  backgroundColor: 'var(--color-accent-gold-light)',
                  border: '1px solid var(--color-accent-gold-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-rosewood-deep)', display: 'block' }}>
                    Registrar nuevo abono para saldar cuenta
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Saldo actual por cobrar: {formatCOP(saldoPendiente)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <input
                    type="number"
                    min="1"
                    max={saldoPendiente}
                    value={abonoInput}
                    onChange={(e) => setAbonoInput(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Hasta ${formatCOP(saldoPendiente)}`}
                    className="form-input"
                    style={{ width: '8.5rem', padding: '0.3rem 0.5rem', fontSize: '0.825rem', backgroundColor: '#FFFFFF' }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isRecordingPayment || abonoInput === ''}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <PlusCircle size={13} />
                    <span>{isRecordingPayment ? 'Registrando...' : 'Abonar'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Connected Mode Notice (Requirement 5) */}
            {!isDemo && !isSinRegistro && saldoPendiente !== null && saldoPendiente > 0 && (
              <div
                className="no-print"
                style={{
                  backgroundColor: 'var(--color-rose-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertCircle size={15} color="var(--color-rosewood)" style={{ flexShrink: 0 }} />
                <span>
                  El backend actual registra el total general. La persistencia de abonos multi-dispositivo requiere actualización de base de datos en Spring Boot.
                </span>
              </div>
            )}

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

        {/* Modal Actions (Requirement 4: PDF download option) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border-subtle)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Download PDF button (Requirement 4) */}
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownloadPDF}
              disabled={!invoice}
              title="Descargar comprobante en PDF para el cliente"
            >
              <Download size={15} />
              <span>Descargar PDF</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
              disabled={!invoice}
              title="Imprimir comprobante"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
          </div>

          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
