import { jsPDF } from 'jspdf';
import type { Factura } from '../types';

export const formatCOP = (val: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);
};

export const downloadInvoicePDF = (invoice: Factura): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Banner (Palo de rosa profundo)
  doc.setFillColor(58, 27, 40); // #3A1B28
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Brand Name & Crest
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DUNAMIS MAKEUP', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(242, 223, 229); // #F2DFE5 (Rose soft)
  doc.text('Atelier Cosmético & Control de Inventario', margin, 20);

  // Invoice Number Badge in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`FACTURA #${invoice.id}`, pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(242, 223, 229);
  const fechaStr = invoice.fecha || new Date().toISOString().split('T')[0];
  doc.text(`Fecha: ${fechaStr}`, pageWidth - margin, 21, { align: 'right' });

  // 2. Client & Transaction Information Card
  let currentY = 40;
  doc.setFillColor(250, 244, 246); // #FAF4F6 (Canvas)
  doc.setDrawColor(232, 213, 220); // #E8D5DC (Border)
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  // Customer column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 73, 96); // #944960 (Rosewood)
  doc.text('DATOS DEL CLIENTE', margin + 5, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(58, 27, 40); // #3A1B28
  doc.text(invoice.cliente || 'Cliente de Mostrador', margin + 5, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 79, 91); // #6B4F5B
  doc.text(
    `Teléfono: ${invoice.telefonoCliente ? invoice.telefonoCliente : 'No registrado'}`,
    margin + 5,
    currentY + 20
  );

  // Seller column
  const midX = margin + contentWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 73, 96);
  doc.text('DATOS DE LA VENTA', midX, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(58, 27, 40);
  const vendedor = invoice.vendedorNombre || invoice.vendedorUsuario || 'Personal Atelier';
  doc.text(`Atendido por: ${vendedor}`, midX, currentY + 14);

  // Payment status badge
  const isSinRegistro = !invoice.estadoPago || invoice.estadoPago === 'SIN_REGISTRO';
  const estadoLabel = isSinRegistro
    ? 'Sin registro de pago'
    : invoice.estadoPago === 'PAGADA'
    ? 'Pagada en su totalidad'
    : invoice.estadoPago === 'ABONO_PARCIAL'
    ? 'Abono Parcial'
    : 'Pendiente de Pago';

  doc.text(`Estado del pago: ${estadoLabel}`, midX, currentY + 20);

  // 3. Products Table Header
  currentY += 34;
  doc.setFillColor(242, 223, 229); // #F2DFE5 (Rose soft)
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.setDrawColor(232, 213, 220);
  doc.line(margin, currentY + 8, margin + contentWidth, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(58, 27, 40);
  doc.text('PRODUCTO COSMÉTICO', margin + 4, currentY + 5.5);
  doc.text('CANT.', margin + 95, currentY + 5.5, { align: 'center' });
  doc.text('PRECIO UNIT.', margin + 130, currentY + 5.5, { align: 'right' });
  doc.text('SUBTOTAL', margin + contentWidth - 4, currentY + 5.5, { align: 'right' });

  // 4. Line Items
  currentY += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const detalles = invoice.detalles || [];
  if (detalles.length === 0) {
    doc.setTextColor(107, 79, 91);
    doc.text('Detalles procesados. Total general registrado.', margin + 4, currentY + 6);
    currentY += 10;
  } else {
    detalles.forEach((det, idx) => {
      // Row background zebra
      if (idx % 2 === 1) {
        doc.setFillColor(253, 248, 250);
        doc.rect(margin, currentY - 1, contentWidth, 8.5, 'F');
      }

      doc.setTextColor(58, 27, 40);
      const prodName = det.producto?.nombre || 'Producto cosmético';
      const truncatedName = prodName.length > 45 ? `${prodName.substring(0, 43)}...` : prodName;
      doc.text(truncatedName, margin + 4, currentY + 4.5);

      doc.text(String(det.cantidad), margin + 95, currentY + 4.5, { align: 'center' });
      doc.text(formatCOP(det.producto?.precio || 0), margin + 130, currentY + 4.5, {
        align: 'right',
      });
      doc.setFont('helvetica', 'bold');
      doc.text(formatCOP(det.subtotal), margin + contentWidth - 4, currentY + 4.5, {
        align: 'right',
      });
      doc.setFont('helvetica', 'normal');

      // Divider line
      doc.setDrawColor(240, 228, 233);
      doc.line(margin, currentY + 7.5, margin + contentWidth, currentY + 7.5);
      currentY += 8.5;
    });
  }

  // 5. Payment & Totals Summary Box
  currentY += 4;
  const summaryBoxWidth = 85;
  const summaryX = margin + contentWidth - summaryBoxWidth;

  doc.setFillColor(250, 244, 246);
  doc.setDrawColor(232, 213, 220);
  doc.roundedRect(summaryX, currentY, summaryBoxWidth, 34, 2, 2, 'FD');

  // Total Factura
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(148, 73, 96);
  doc.text('TOTAL FACTURA:', summaryX + 5, currentY + 8);
  doc.setFontSize(11);
  doc.setTextColor(58, 27, 40);
  doc.text(formatCOP(invoice.total), summaryX + summaryBoxWidth - 5, currentY + 8, {
    align: 'right',
  });

  // Divider
  doc.setDrawColor(232, 213, 220);
  doc.line(summaryX + 5, currentY + 11, summaryX + summaryBoxWidth - 5, currentY + 11);

  if (isSinRegistro) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(107, 79, 91);
    doc.text('Detalle de Cobro:', summaryX + 5, currentY + 17);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin registro en backend', summaryX + summaryBoxWidth - 5, currentY + 17, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Conciliación:', summaryX + 5, currentY + 24);
    doc.text('Pendiente por verificar', summaryX + summaryBoxWidth - 5, currentY + 24, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 79, 91);
    doc.text('ESTADO: SIN REGISTRO DE PAGO', summaryX + 5, currentY + 30);
  } else {
    // Valor Abonado
    const abonado =
      invoice.valorAbonado !== undefined
        ? invoice.valorAbonado
        : invoice.estadoPago === 'PAGADA'
        ? invoice.total
        : 0;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 79, 91);
    doc.text('Valor Abonado:', summaryX + 5, currentY + 17);
    doc.setTextColor(45, 99, 76); // Sage
    doc.setFont('helvetica', 'bold');
    doc.text(formatCOP(abonado), summaryX + summaryBoxWidth - 5, currentY + 17, {
      align: 'right',
    });

    // Saldo Pendiente
    const saldo =
      invoice.saldoPendiente !== undefined
        ? invoice.saldoPendiente
        : Math.max(0, invoice.total - abonado);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 79, 91);
    doc.text('Saldo Pendiente:', summaryX + 5, currentY + 24);
    doc.setTextColor(saldo > 0 ? 155 : 45, saldo > 0 ? 29 : 99, saldo > 0 ? 54 : 76);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCOP(saldo), summaryX + summaryBoxWidth - 5, currentY + 24, {
      align: 'right',
    });

    // Estado Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 73, 96);
    doc.text(`ESTADO: ${estadoLabel.toUpperCase()}`, summaryX + 5, currentY + 30);
  }

  // 6. Footer Notes
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(142, 115, 127);
  doc.text(
    '¡Gracias por tu compra en Dunamis Makeup! Resalta tu belleza única.',
    pageWidth / 2,
    280,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 160, 170);
  doc.text(
    `Documento generado electrónicamente · Dunamis Makeup Atelier · Factura #${invoice.id}`,
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // Trigger browser download
  const cleanCliente = (invoice.cliente || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Factura_Dunamis_${invoice.id}_${cleanCliente}.pdf`);
};
