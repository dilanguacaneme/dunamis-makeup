import React, { useState, useMemo } from 'react';
import { Search, X, Calendar, Eye, Printer, ShoppingBag, Receipt, UserCheck } from 'lucide-react';
import type { Factura, Usuario } from '../types';

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

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Customer or ID search
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

      return true;
    });
  }, [invoices, searchQuery, dateFilter]);

  const totalFilteredSum = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [filteredInvoices]);

  const isSeller = user.role === 'VENDEDOR';

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

        {/* Quick sale CTA */}
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenSaleModal}
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
        }}
      >
        {/* Search & date inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px' }}>
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
                backgroundColor: '#FFFFFF',
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

          {/* Date Picker Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FFFFFF', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
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

        {/* Filtered stats pill */}
        <div
          style={{
            backgroundColor: 'var(--color-rose-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.825rem',
          }}
        >
          <div>
            Facturas: <strong style={{ color: 'var(--color-text-main)' }}>{filteredInvoices.length}</strong>
          </div>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)' }} />
          <div>
            Total facturado:{' '}
            <strong className="tabular-numbers" style={{ color: 'var(--color-rosewood-deep)', fontWeight: 700 }}>
              {formatCOP(totalFilteredSum)}
            </strong>
          </div>
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
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-plum)' }}>
            {invoices.length === 0 ? 'No se han registrado facturas todavía' : 'No se encontraron facturas'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '420px' }}>
            {invoices.length === 0
              ? 'Cuando registres una venta, el comprobante y el descuento de existencias quedarán registrados aquí.'
              : 'Ninguna factura coincide con el término de búsqueda o la fecha seleccionada.'}
          </p>
          {invoices.length > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
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
                <th style={{ width: '7.5rem' }}>Fecha</th>
                <th>Cliente</th>
                <th style={{ width: '9.5rem' }}>Teléfono</th>
                <th>Vendedor(a)</th>
                <th style={{ textAlign: 'right', width: '9.5rem' }}>Total Factura</th>
                <th style={{ textAlign: 'center', width: '8.5rem' }}>Acciones</th>
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
                    <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                      {invoice.cliente}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                    {invoice.telefonoCliente || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-main)', fontSize: '0.825rem' }}>
                    {invoice.vendedorNombre || invoice.vendedorUsuario || 'Personal'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      className="tabular-numbers"
                      style={{ fontWeight: 700, color: 'var(--color-rosewood-deep)' }}
                    >
                      {formatCOP(invoice.total)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onViewInvoiceDetails(invoice.id)}
                        title="Ver detalle de la factura"
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={14} />
                        <span>Detalle</span>
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onViewInvoiceDetails(invoice.id)}
                        title="Imprimir comprobante"
                        style={{ padding: '0.35rem', color: 'var(--color-rosewood)' }}
                      >
                        <Printer size={14} />
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
