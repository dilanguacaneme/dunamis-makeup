import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Calendar,
  Eye,
  Download,
  ShoppingBag,
  Receipt,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { downloadInvoicePDF, formatCOP } from '../services/pdfGenerator';
import type { Factura, Usuario, FilterPaymentStatus, EstadoPagoFactura } from '../types';

interface InvoiceHistoryViewProps {
  invoices: Factura[];
  isLoading: boolean;
  user: Usuario;
  onOpenSaleModal: () => void;
  onViewInvoiceDetails: (invoiceId: number) => void;
}

export const InvoiceHistoryView: React.FC<InvoiceHistoryViewProps> = ({
  invoices,
  isLoading,
  user,
  onOpenSaleModal,
  onViewInvoiceDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<FilterPaymentStatus>('TODOS');

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Customer, ID, or seller search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesClient = (inv.cliente || '').toLowerCase().includes(query);
        const matchesId = inv.id.toString().includes(query);
        const matchesSeller = (inv.vendedorNombre || inv.vendedorUsuario || '')
          .toLowerCase()
          .includes(query);
        if (!matchesClient && !matchesId && !matchesSeller) return false;
      }

      // 2. Date filter
      if (dateFilter) {
        if (inv.fecha !== dateFilter) return false;
      }

      // 3. Payment status filter
      if (paymentFilter !== 'TODOS') {
        const status = inv.estadoPago || 'SIN_REGISTRO';
        if (status !== paymentFilter) return false;
      }

      return true;
    });
  }, [invoices, searchQuery, dateFilter, paymentFilter]);

  // Totals calculations
  const totalFacturadoSum = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [filteredInvoices]);

  const totalRecaudadoSum = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => {
      const estado: EstadoPagoFactura = inv.estadoPago || 'SIN_REGISTRO';
      if (estado === 'SIN_REGISTRO') {
        return sum + (inv.valorAbonado || 0); // Do NOT count as cobradas by default!
      }
      if (estado === 'PAGADA') {
        return sum + (inv.total || 0);
      }
      if (estado === 'ABONO_PARCIAL') {
        return sum + (inv.valorAbonado !== undefined ? inv.valorAbonado : 0);
      }
      return sum;
    }, 0);
  }, [filteredInvoices]);

  const saldoPendienteSum = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => {
      const estado: EstadoPagoFactura = inv.estadoPago || 'SIN_REGISTRO';
      if (estado === 'SIN_REGISTRO') {
        return sum; // Do not count as pending debt without record
      }
      if (estado === 'PENDIENTE') {
        return sum + (inv.total || 0);
      }
      if (estado === 'ABONO_PARCIAL') {
        const abonado = inv.valorAbonado !== undefined ? inv.valorAbonado : 0;
        return sum + (inv.saldoPendiente !== undefined ? inv.saldoPendiente : Math.max(0, (inv.total || 0) - abonado));
      }
      return sum;
    }, 0);
  }, [filteredInvoices]);

  const isSeller = user.role === 'VENDEDOR';

  const getPaymentStatusBadge = (invoice: Factura) => {
    const estado: EstadoPagoFactura = invoice.estadoPago || 'SIN_REGISTRO';
    const abonado = invoice.valorAbonado !== undefined ? invoice.valorAbonado : estado === 'PAGADA' ? invoice.total : 0;
    const saldo = invoice.saldoPendiente !== undefined ? invoice.saldoPendiente : Math.max(0, invoice.total - abonado);

    switch (estado) {
      case 'SIN_REGISTRO':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-rose-subtle)',
              border: '1px solid var(--color-border)',
              padding: '0.15rem 0.55rem',
              borderRadius: 'var(--radius-full)',
            }}
            title="Esta factura no tiene estado de pago registrado en el backend"
          >
            <HelpCircle size={11} />
            <span>Sin registro de pago</span>
          </span>
        );
      case 'PAGADA':
        return (
          <span
            className="badge-stock badge-stock-healthy"
            style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}
            title="Pagada en su totalidad"
          >
            <CheckCircle2 size={11} />
            <span>Pagada</span>
          </span>
        );
      case 'ABONO_PARCIAL':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-accent-gold)',
                backgroundColor: 'var(--color-accent-gold-light)',
                border: '1px solid var(--color-accent-gold-border)',
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
              }}
              title={`Abonado: ${formatCOP(abonado)} · Saldo: ${formatCOP(saldo)}`}
            >
              <Clock size={11} />
              <span>Abono parcial</span>
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-crimson)', fontWeight: 600 }}>
              Saldo: {formatCOP(saldo)}
            </span>
          </div>
        );
      case 'PENDIENTE':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
            <span
              className="badge-stock badge-stock-critical"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}
              title="Pendiente de cobro"
            >
              <AlertTriangle size={11} />
              <span>Pendiente</span>
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-crimson)', fontWeight: 600 }}>
              Saldo: {formatCOP(invoice.total)}
            </span>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header bar of invoices view */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-rose-soft)',
              color: 'var(--color-rosewood)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-rosewood-deep)',
                }}
              >
                Historial de Facturas & Ventas
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isSeller ? 'var(--color-sage-light)' : 'var(--color-rose-subtle)',
                  color: isSeller ? 'var(--color-sage)' : 'var(--color-rosewood)',
                  border: `1px solid ${isSeller ? 'var(--color-sage-border)' : 'var(--color-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <UserCheck size={11} />
                <span>{isSeller ? 'Mis ventas autorizadas' : 'Visibilidad global admin'}</span>
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              {isSeller
                ? 'Visualizando únicamente las facturas emitidas bajo tu usuario.'
                : 'Registro centralizado de todas las ventas emitidas en el sistema Dunamis Makeup.'}
            </p>
          </div>
        </div>

        {/* Quick sale CTA (Contextual to sales) */}
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenSaleModal}
          title="Registrar una nueva venta o factura"
        >
          <ShoppingBag size={16} />
          <span>+ Registrar venta / Factura</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1rem 1.25rem',
        }}
      >
        {/* Search, payment and date inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-subtle)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, N° factura o vendedor..."
              style={{
                paddingLeft: '2.35rem',
                paddingRight: searchQuery ? '2.2rem' : '0.85rem',
                height: '2.45rem',
                backgroundColor: 'var(--color-canvas)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Borrar búsqueda"
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-subtle)',
                  padding: '0.2rem',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Status Filter (Requirement 5) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label htmlFor="inv-payment-filter" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Pago:
            </label>
            <select
              id="inv-payment-filter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as FilterPaymentStatus)}
              className="form-select"
              style={{
                padding: '0.3rem 0.65rem',
                height: '2.45rem',
                fontSize: '0.825rem',
                backgroundColor: paymentFilter !== 'TODOS' ? 'var(--color-rose-soft)' : '#FFFFFF',
                borderColor: paymentFilter !== 'TODOS' ? 'var(--color-rosewood)' : 'var(--color-border)',
                color: paymentFilter !== 'TODOS' ? 'var(--color-rosewood-deep)' : 'var(--color-text-main)',
                fontWeight: paymentFilter !== 'TODOS' ? 600 : 500,
              }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PAGADA">Pagadas</option>
              <option value="ABONO_PARCIAL">Abono parcial</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="SIN_REGISTRO">Sin registro de pago</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--color-canvas)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <Calendar size={15} color="var(--color-text-muted)" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.825rem',
                color: 'var(--color-text-main)',
                backgroundColor: 'transparent',
              }}
              title="Filtrar por fecha específica"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                title="Quitar filtro de fecha"
                style={{ color: 'var(--color-text-subtle)', padding: '0.15rem' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filtered stats summary pills */}
        <div
          style={{
            backgroundColor: 'var(--color-rose-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            fontSize: '0.8rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            Facturas: <strong style={{ color: 'var(--color-text-main)' }}>{filteredInvoices.length}</strong>
          </div>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)' }} />
          <div>
            Total:{' '}
            <strong className="tabular-numbers" style={{ color: 'var(--color-rosewood-deep)', fontWeight: 700 }}>
              {formatCOP(totalFacturadoSum)}
            </strong>
          </div>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)' }} />
          <div>
            Recaudado:{' '}
            <strong className="tabular-numbers" style={{ color: 'var(--color-sage)', fontWeight: 700 }}>
              {formatCOP(totalRecaudadoSum)}
            </strong>
          </div>
          {saldoPendienteSum > 0 && (
            <>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)' }} />
              <div>
                Por cobrar:{' '}
                <strong className="tabular-numbers" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
                  {formatCOP(saldoPendienteSum)}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="table-responsive-wrapper">
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando historial de facturas...
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Receipt size={32} color="var(--color-rosewood)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-rosewood-deep)' }}>
            {invoices.length === 0 ? 'No se han registrado facturas todavía' : 'No se encontraron facturas'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '420px' }}>
            {invoices.length === 0
              ? 'Cuando registres una venta, el comprobante y el descuento de existencias quedarán registrados aquí.'
              : 'Ninguna factura coincide con los filtros de búsqueda, estado de pago o fecha seleccionada.'}
          </p>
          {invoices.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
                setPaymentFilter('TODOS');
              }}
              style={{ marginTop: '0.5rem' }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{ width: '5.5rem' }}>N° Factura</th>
                <th style={{ width: '7rem' }}>Fecha</th>
                <th>Cliente</th>
                <th style={{ width: '8.5rem' }}>Teléfono</th>
                <th>Vendedor(a)</th>
                <th style={{ width: '9rem' }}>Estado Pago</th>
                <th style={{ textAlign: 'right', width: '9rem' }}>Total</th>
                <th style={{ textAlign: 'center', width: '9.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-rosewood)' }}>
                    #{invoice.id}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                    {invoice.fecha || '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-rosewood-deep)' }}>
                      {invoice.cliente}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                    {invoice.telefonoCliente || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-main)', fontSize: '0.825rem' }}>
                    {invoice.vendedorNombre || invoice.vendedorUsuario || 'Personal'}
                  </td>
                  <td>{getPaymentStatusBadge(invoice)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      className="tabular-numbers"
                      style={{ fontWeight: 700, color: 'var(--color-rosewood-deep)' }}
                    >
                      {formatCOP(invoice.total)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onViewInvoiceDetails(invoice.id)}
                        title="Ver detalle del comprobante"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={14} />
                        <span>Detalle</span>
                      </button>

                      {/* Download PDF button (Requirement 4) */}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => downloadInvoicePDF(invoice)}
                        title="Descargar factura en PDF para el cliente"
                        style={{ padding: '0.35rem', color: 'var(--color-rosewood)' }}
                        aria-label={`Descargar factura #${invoice.id} en PDF`}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
