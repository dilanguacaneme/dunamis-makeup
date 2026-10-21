import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Receipt,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  Search,
  X,
  Info,
} from 'lucide-react';
import { downloadInvoicePDF, formatCOP } from '../services/pdfGenerator';
import type { Factura, FilterPaymentStatus, EstadoPagoFactura } from '../types';

interface MonthlySalesViewProps {
  invoices: Factura[];
  isLoading: boolean;
  isDemo: boolean;
  onViewInvoiceDetails: (invoiceId: number) => void;
}

export const MonthlySalesView: React.FC<MonthlySalesViewProps> = ({
  invoices,
  isLoading,
  isDemo,
  onViewInvoiceDetails,
}) => {
  // Extract all available months (YYYY-MM) from invoices
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.fecha && inv.fecha.length >= 7) {
        monthsSet.add(inv.fecha.substring(0, 7));
      }
    });
    // Sort descending (most recent first)
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [invoices]);

  // Selected month state (defaults to most recent available or current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (availableMonths.length > 0) return availableMonths[0];
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${mm}`;
  });

  // Filters within month
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<FilterPaymentStatus>('TODOS');

  // Month label helper
  const formatMonthLabel = (yearMonth: string): string => {
    if (yearMonth === 'TODOS') return 'Histórico Consolidado';
    const parts = yearMonth.split('-');
    if (parts.length !== 2) return yearMonth;
    const [year, month] = parts;
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx] || month} ${year}`;
  };

  // Invoices filtered by month
  const monthInvoices = useMemo(() => {
    if (selectedMonth === 'TODOS') return invoices;
    return invoices.filter((inv) => inv.fecha && inv.fecha.startsWith(selectedMonth));
  }, [invoices, selectedMonth]);

  // Filtered invoices within month (by search and payment status)
  const filteredInvoices = useMemo(() => {
    return monthInvoices.filter((inv) => {
      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = (inv.cliente || '').toLowerCase().includes(q);
        const matchesId = inv.id.toString().includes(q);
        const matchesSeller = (inv.vendedorNombre || inv.vendedorUsuario || '').toLowerCase().includes(q);
        if (!matchesClient && !matchesId && !matchesSeller) return false;
      }

      // 2. Payment status
      if (paymentFilter !== 'TODOS') {
        const status = inv.estadoPago || 'SIN_REGISTRO';
        if (status !== paymentFilter) return false;
      }

      return true;
    });
  }, [monthInvoices, searchQuery, paymentFilter]);

  // Aggregate financial metrics for the selected month
  const monthlyTotals = useMemo(() => {
    let facturado = 0;
    let recaudado = 0;
    let saldo = 0;
    let pagadasCount = 0;
    let abonosCount = 0;
    let pendientesCount = 0;
    let sinRegistroCount = 0;

    monthInvoices.forEach((inv) => {
      const invTotal = inv.total || 0;
      facturado += invTotal;

      const estado: EstadoPagoFactura = inv.estadoPago || 'SIN_REGISTRO';

      if (estado === 'SIN_REGISTRO') {
        sinRegistroCount++;
        // Do NOT count as cobradas by default!
        recaudado += inv.valorAbonado || 0;
      } else if (estado === 'PAGADA') {
        pagadasCount++;
        recaudado += invTotal;
      } else if (estado === 'ABONO_PARCIAL') {
        abonosCount++;
        const valorAbonado = inv.valorAbonado !== undefined ? inv.valorAbonado : 0;
        const saldoPend =
          inv.saldoPendiente !== undefined
            ? inv.saldoPendiente
            : Math.max(0, invTotal - valorAbonado);
        recaudado += valorAbonado;
        saldo += saldoPend;
      } else if (estado === 'PENDIENTE') {
        pendientesCount++;
        saldo += invTotal;
      }
    });

    const ticketPromedio = monthInvoices.length > 0 ? Math.round(facturado / monthInvoices.length) : 0;
    const porcentajeRecaudo = facturado > 0 ? Math.min(100, Math.round((recaudado / facturado) * 100)) : 100;

    return {
      facturado,
      recaudado,
      saldo,
      ticketPromedio,
      porcentajeRecaudo,
      totalInvoices: monthInvoices.length,
      pagadasCount,
      abonosCount,
      pendientesCount,
      sinRegistroCount,
    };
  }, [monthInvoices]);

  const getPaymentBadge = (invoice: Factura) => {
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
            title="Factura emitida sin registro de pago en el backend"
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
          >
            <CheckCircle2 size={11} />
            <span>Pagada</span>
          </span>
        );
      case 'ABONO_PARCIAL':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
            <span
              className="badge-stock badge-stock-critical"
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}
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
      {/* Month Navigation & Selector Bar */}
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
              backgroundColor: 'var(--color-rose-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-rosewood)',
              flexShrink: 0,
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
                lineHeight: 1.2,
              }}
            >
              Reporte de Ventas por Mes
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              Consolidado financiero mensual, recaudo efectivo y conciliación de saldos
            </p>
          </div>
        </div>

        {/* Month Selector dropdown & pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <label
            htmlFor="monthly-sales-picker"
            style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)' }}
          >
            Periodo:
          </label>
          <select
            id="monthly-sales-picker"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-select"
            style={{
              fontWeight: 700,
              color: 'var(--color-rosewood-deep)',
              borderColor: 'var(--color-rosewood)',
              backgroundColor: 'var(--color-rose-subtle)',
              padding: '0.5rem 2rem 0.5rem 0.85rem',
              minWidth: '180px',
            }}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
            <option value="TODOS">Ver Todos los Meses</option>
          </select>
        </div>
      </div>

      {/* Connected mode vs Demo mode informative notice */}
      {!isDemo && (
        <div
          style={{
            backgroundColor: 'var(--color-accent-gold-light)',
            border: '1px solid var(--color-accent-gold-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.825rem',
            color: 'var(--color-rosewood-deep)',
          }}
        >
          <Info size={16} color="var(--color-accent-gold)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Modo Conectado:</strong> Los totales de ventas y facturas se calculan directamente a partir de los datos registrados en el servidor Spring Boot. El registro de abonos y saldos pendientes permanece activo localmente hasta que el backend incorpore las columnas de pago en base de datos.
          </span>
        </div>
      )}

      {/* KPI Financial Cards for the Selected Month */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Facturado */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Total Facturado ({formatMonthLabel(selectedMonth)})
            </span>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-rose-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-rosewood)',
              }}
            >
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div
              className="tabular-numbers"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
                lineHeight: 1.15,
              }}
            >
              {formatCOP(monthlyTotals.facturado)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {monthlyTotals.totalInvoices} {monthlyTotals.totalInvoices === 1 ? 'factura emitida' : 'facturas emitidas'}
            </span>
          </div>
        </div>

        {/* Recaudo Efectivo */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Recaudo Efectivo Cobrado
            </span>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-sage-light)',
                border: '1px solid var(--color-sage-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-sage)',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div
              className="tabular-numbers"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-sage)',
                lineHeight: 1.15,
              }}
            >
              {formatCOP(monthlyTotals.recaudado)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-sage)', fontWeight: 600 }}>
              {monthlyTotals.porcentajeRecaudo}% del total facturado
            </span>
          </div>
        </div>

        {/* Saldo Pendiente por Cobrar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Saldo Pendiente por Cobrar
            </span>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: monthlyTotals.saldo > 0 ? 'var(--color-crimson-light)' : 'var(--color-rose-subtle)',
                border: `1px solid ${monthlyTotals.saldo > 0 ? 'var(--color-crimson-border)' : 'var(--color-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: monthlyTotals.saldo > 0 ? 'var(--color-crimson)' : 'var(--color-text-muted)',
              }}
            >
              <AlertCircle size={16} />
            </div>
          </div>
          <div>
            <div
              className="tabular-numbers"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: monthlyTotals.saldo > 0 ? 'var(--color-crimson)' : 'var(--color-sage)',
                lineHeight: 1.15,
              }}
            >
              {formatCOP(monthlyTotals.saldo)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {monthlyTotals.pendientesCount + monthlyTotals.abonosCount} facturas con saldo abierto
            </span>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Ticket Promedio
            </span>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent-gold-light)',
                border: '1px solid var(--color-accent-gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent-gold)',
              }}
            >
              <CreditCard size={16} />
            </div>
          </div>
          <div>
            <div
              className="tabular-numbers"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-rosewood-deep)',
                lineHeight: 1.15,
              }}
            >
              {formatCOP(monthlyTotals.ticketPromedio)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Promedio por comprobante
            </span>
          </div>
        </div>
      </div>

      {/* Status Breakdown & Progress Bar Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-rosewood-deep)' }}>
            Conciliación de Pagos — {formatMonthLabel(selectedMonth)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-sage)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-sage)' }} />
              {monthlyTotals.pagadasCount} Pagadas
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-accent-gold)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent-gold)' }} />
              {monthlyTotals.abonosCount} Abonos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-crimson)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-crimson)' }} />
              {monthlyTotals.pendientesCount} Pendientes
            </span>
            {monthlyTotals.sinRegistroCount > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-text-muted)' }} />
                {monthlyTotals.sinRegistroCount} Sin registro
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar of Collected vs Pending */}
        <div
          style={{
            height: '10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-crimson-light)',
            overflow: 'hidden',
            display: 'flex',
          }}
          title={`${monthlyTotals.porcentajeRecaudo}% recaudado`}
        >
          <div
            style={{
              width: `${monthlyTotals.porcentajeRecaudo}%`,
              backgroundColor: 'var(--color-sage)',
              transition: 'width var(--transition-normal)',
            }}
          />
        </div>
      </div>

      {/* In-Month Search and Status Filter Controls */}
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
          padding: '0.85rem 1.25rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-subtle)',
              }}
            />
            <input
              type="text"
              placeholder="Buscar cliente, N° o vendedora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Status Dropdown Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as FilterPaymentStatus)}
            className="input-select"
            style={{ fontSize: '0.85rem', width: 'auto' }}
          >
            <option value="TODOS">Todos los estados de pago</option>
            <option value="PAGADA">Solo Pagadas</option>
            <option value="ABONO_PARCIAL">Solo Abono parcial</option>
            <option value="PENDIENTE">Solo Pendientes</option>
            <option value="SIN_REGISTRO">Solo Sin registro de pago</option>
          </select>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
          Mostrando <strong>{filteredInvoices.length}</strong> de <strong>{monthInvoices.length}</strong> facturas
        </div>
      </div>

      {/* Invoices Detailed Table for the Month */}
      {isLoading ? (
        <div className="table-responsive-wrapper">
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando reporte de ventas mensuales...
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
            No hay facturas registradas en este periodo
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '420px' }}>
            {searchQuery || paymentFilter !== 'TODOS'
              ? 'Ninguna factura coincide con los filtros aplicados en el mes seleccionado.'
              : `Aún no se han emitido facturas correspondientes a ${formatMonthLabel(selectedMonth)}.`}
          </p>
          {(searchQuery || paymentFilter !== 'TODOS') && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setPaymentFilter('TODOS');
              }}
              style={{ marginTop: '0.5rem' }}
            >
              Restablecer filtros del mes
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
                <th>Vendedor(a)</th>
                <th style={{ textAlign: 'right', width: '8.5rem' }}>Total</th>
                <th style={{ textAlign: 'right', width: '8.5rem' }}>Abonado</th>
                <th style={{ textAlign: 'right', width: '8.5rem' }}>Saldo</th>
                <th style={{ width: '9rem' }}>Estado Pago</th>
                <th style={{ textAlign: 'center', width: '9.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const estado: EstadoPagoFactura = invoice.estadoPago || 'SIN_REGISTRO';
                const isSinRegistro = estado === 'SIN_REGISTRO';
                const abonado =
                  invoice.valorAbonado !== undefined
                    ? invoice.valorAbonado
                    : estado === 'PAGADA'
                    ? invoice.total
                    : 0;
                const saldo =
                  invoice.saldoPendiente !== undefined
                    ? invoice.saldoPendiente
                    : estado === 'PENDIENTE'
                    ? invoice.total
                    : Math.max(0, invoice.total - abonado);

                return (
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
                      {invoice.telefonoCliente && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                          {invoice.telefonoCliente}
                        </div>
                      )}
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
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="tabular-numbers"
                        style={{ fontWeight: 600, color: isSinRegistro ? 'var(--color-text-muted)' : 'var(--color-sage)' }}
                      >
                        {isSinRegistro ? '—' : formatCOP(abonado)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="tabular-numbers"
                        style={{
                          fontWeight: 600,
                          color: isSinRegistro ? 'var(--color-text-muted)' : saldo > 0 ? 'var(--color-crimson)' : 'var(--color-text-muted)',
                        }}
                      >
                        {isSinRegistro ? '—' : formatCOP(saldo)}
                      </span>
                    </td>
                    <td>{getPaymentBadge(invoice)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => onViewInvoiceDetails(invoice.id)}
                          title="Ver detalle de factura"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                        >
                          <Eye size={14} />
                          <span className="sr-only">Ver detalle</span>
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => downloadInvoicePDF(invoice)}
                          title="Descargar factura en PDF"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: 'var(--color-rosewood)' }}
                        >
                          <Download size={14} />
                          <span className="sr-only">PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
