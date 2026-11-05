// Polyfill localStorage in Node test environment before importing demoData
const store = new Map<string, string>();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as Storage;
}

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoStore, DEMO_ADMIN_USER, DEMO_SELLER_USER } from '../demoData.ts';

describe('Pruebas Unitarias - demoStore (Modo Demostración Local - Spec 006)', () => {
  beforeEach(() => {
    store.clear();
    demoStore.resetToDefaults();
  });

  describe('1. Gestión de Marcas (RF-004, RF-005, RF-006)', () => {
    it('debe listar solo marcas activas por defecto y todas con incluirInactivas=true', () => {
      const activas = demoStore.getBrands(false);
      assert.ok(activas.length >= 4);
      assert.ok(activas.every((b) => b.activa !== false));

      // Desactivar una marca
      demoStore.updateBrand(1, { activa: false });
      const activasDespues = demoStore.getBrands(false);
      const todas = demoStore.getBrands(true);

      assert.equal(activasDespues.length, activas.length - 1);
      assert.equal(todas.length, activas.length);
    });

    it('debe crear marca normalizando espacios múltiples y validando unicidad case-insensitive', () => {
      const nueva = demoStore.createBrand({ nombre: '   Vogue    Cosmetics   ' });
      assert.equal(nueva.nombre, 'Vogue Cosmetics');
      assert.equal(nueva.activa, true);

      // Intento de duplicado con variación de mayúsculas/espacios
      assert.throws(
        () => demoStore.createBrand({ nombre: 'vogue cosmetics' }),
        /Ya existe una marca con ese nombre/
      );
    });

    it('debe rechazar crear marca con nombre vacío o solo espacios', () => {
      assert.throws(
        () => demoStore.createBrand({ nombre: '    ' }),
        /El nombre de la marca es obligatorio/
      );
    });
  });

  describe('1.1. Gestión de Categorías (Spec 008)', () => {
    it('debe listar solo categorías activas por defecto y todas con incluirInactivas=true', () => {
      const activas = demoStore.getCategories(false);
      assert.ok(activas.length >= 6);

      // Desactivar una categoría
      demoStore.updateCategory(1, { activa: false });
      const activasDespues = demoStore.getCategories(false);
      const todas = demoStore.getCategories(true);

      assert.equal(activasDespues.length, activas.length - 1);
      assert.equal(todas.length, activas.length);
    });

    it('debe crear categoría normalizando espacios múltiples y validando unicidad case-insensitive', () => {
      const nueva = demoStore.createCategory({ nombre: '   Skin   Care   Premium   ' });
      assert.equal(nueva.nombre, 'Skin Care Premium');
      assert.equal(nueva.activa, true);

      // Duplicado case-insensitive
      assert.throws(
        () => demoStore.createCategory({ nombre: 'skin care premium' }),
        /Ya existe una categoría con ese nombre/
      );
    });

    it('debe rechazar crear categoría con nombre vacío o solo espacios', () => {
      assert.throws(
        () => demoStore.createCategory({ nombre: '    ' }),
        /El nombre de la categoría es obligatorio/
      );
    });

    it('debe actualizar categoría y rechazar duplicados en edición', () => {
      const cat = demoStore.createCategory({ nombre: 'Uñas' });
      demoStore.updateCategory(cat.id, { nombre: 'Uñas y Manicure', activa: true });
      const actualizada = demoStore.getCategories(true).find((c) => c.id === cat.id);
      assert.equal(actualizada?.nombre, 'Uñas y Manicure');

      assert.throws(
        () => demoStore.updateCategory(cat.id, { nombre: 'Ojos' }),
        /Ya existe una categoría con ese nombre/
      );
    });

    it('debe rechazar crear producto si la categoría está inactiva', () => {
      demoStore.updateCategory(2, { activa: false }); // Ojos inactiva

      assert.throws(
        () =>
          demoStore.createProduct({
            nombre: 'Sombra Test',
            precio: 20000,
            cantidad: 5,
            categoriaId: 2,
            marca: { id: 1 },
          }),
        /La categoría seleccionada no existe o está inactiva/
      );
    });
  });

  describe('2. Gestión de Productos e Inventario (RF-007, RF-008, RF-009)', () => {
    it('debe crear producto asociado a una marca activa y recalcular totalProducto', () => {
      const prod = demoStore.createProduct({
        nombre: 'Labial Matte Test',
        precio: 25000,
        cantidad: 10,
        categoria: 'LABIOS',
        marca: { id: 1 },
      });

      assert.ok(prod.id > 0);
      assert.equal(prod.nombre, 'Labial Matte Test');
      assert.equal(prod.totalProducto, 250000);
      assert.equal(prod.activo, true);
    });

    it('debe rechazar crear producto si la marca está inactiva', () => {
      demoStore.updateBrand(1, { activa: false });

      assert.throws(
        () =>
          demoStore.createProduct({
            nombre: 'Producto Marca Inactiva',
            precio: 30000,
            cantidad: 5,
            categoria: 'ROSTRO',
            marca: { id: 1 },
          }),
        /La marca seleccionada no existe o está inactiva/
      );
    });

    it('debe rechazar existencias negativas en creación y actualización', () => {
      assert.throws(
        () =>
          demoStore.createProduct({
            nombre: 'Producto Negativo',
            precio: 20000,
            cantidad: -5,
            categoria: 'OJOS',
            marca: { id: 2 },
          }),
        /Las existencias deben ser cero o más/
      );

      assert.throws(
        () => demoStore.updateProduct(1, { cantidad: -1 }),
        /Las existencias no pueden ser negativas/
      );
    });

    it('debe aplicar borrado lógico (activo=false) si el producto tiene historial de facturación (Principio 5)', () => {
      // El producto ID 10 está en facturas de demostración iniciales
      const prodBorrado = demoStore.deleteProduct(10);
      assert.equal(prodBorrado.activo, false);

      // Comprobar que getProducts(false) no lo incluye
      const activos = demoStore.getProducts(false);
      assert.ok(!activos.some((p) => p.id === 10));

      // Pero getProducts(true) sí lo conserva
      const todos = demoStore.getProducts(true);
      assert.ok(todos.some((p) => p.id === 10 && p.activo === false));
    });

    it('debe filtrar productos por agotarse con umbral configurable y rechazar umbral negativo', () => {
      const agotados = demoStore.getLowStockProducts(0);
      assert.ok(agotados.length >= 1);
      assert.ok(agotados.every((p) => p.cantidad <= 0));

      const umbral5 = demoStore.getLowStockProducts(5);
      assert.ok(umbral5.length >= agotados.length);
      assert.ok(umbral5.every((p) => p.cantidad <= 5));

      assert.throws(
        () => demoStore.getLowStockProducts(-1),
        /El umbral no puede ser negativo/
      );
    });
  });

  describe('3. Facturación Atómica y Ciclo Transaccional (RF-010, RF-011)', () => {
    it('debe crear factura, descontar stock de forma atómica y calcular totales', () => {
      const prod1 = demoStore.getProductById(1)!;
      const stockInicial = prod1.cantidad;

      const factura = demoStore.createInvoice({
        cliente: 'Cliente Prueba Atómica',
        telefonoCliente: '3001234567',
        detalles: [{ producto: { id: 1 }, cantidad: 1 }],
        estadoPago: 'PAGADA',
      }, DEMO_ADMIN_USER);

      assert.ok(factura.id >= 1000);
      assert.equal(factura.estadoPago, 'PAGADA');
      assert.equal(factura.valorAbonado, factura.total);
      assert.equal(factura.saldoPendiente, 0);

      // Verificar que el stock se descontó
      const prod1Actualizado = demoStore.getProductById(1)!;
      assert.equal(prod1Actualizado.cantidad, stockInicial - 1);
    });

    it('debe rechazar la venta si algún producto carece de stock sin descontar productos previos (Atomicidad)', () => {
      const prod2 = demoStore.getProductById(2)!;
      const stockInicialProd2 = prod2.cantidad;

      // El producto 4 tiene stock 0 (Agotado)
      assert.throws(
        () =>
          demoStore.createInvoice({
            cliente: 'Cliente Fallo Transaccional',
            detalles: [
              { producto: { id: 2 }, cantidad: 2 }, // tiene stock
              { producto: { id: 4 }, cantidad: 1 }, // NO tiene stock
            ],
          }, DEMO_ADMIN_USER),
        /Stock insuficiente/
      );

      // Verificar que el producto 2 NO fue descontado (rollback en memoria)
      const prod2Despues = demoStore.getProductById(2)!;
      assert.equal(prod2Despues.cantidad, stockInicialProd2);
    });

    it('debe rechazar facturar un producto inactivo', () => {
      demoStore.deleteProduct(10); // Desactivado por borrado lógico

      assert.throws(
        () =>
          demoStore.createInvoice({
            cliente: 'Cliente Inactivo',
            detalles: [{ producto: { id: 10 }, cantidad: 1 }],
          }, DEMO_ADMIN_USER),
        /porque está inactivo/
      );
    });
  });

  describe('4. Abonos, Pagos y Anulación de Facturas (RF-012, RF-013)', () => {
    it('debe registrar abonos, actualizar saldo y transicionar a PAGADA al completar saldo', () => {
      // Factura 1002 es PARCIAL con total 90000, abonado 50000, saldo 40000
      const invParcial = demoStore.getInvoiceById(1002);
      assert.equal(invParcial.estadoPago, 'PARCIAL');
      assert.equal(invParcial.saldoPendiente, 40000);

      // Abono parcial de 20000
      const actualizada = demoStore.updateInvoicePayment(1002, 20000, 'TRANSFERENCIA', 'Abono 1');
      assert.equal(actualizada.valorAbonado, 70000);
      assert.equal(actualizada.saldoPendiente, 20000);
      assert.equal(actualizada.estadoPago, 'PARCIAL');

      // Abono final de 20000 transiciona a PAGADA
      const finalizada = demoStore.updateInvoicePayment(1002, 20000, 'NEQUI', 'Saldo total');
      assert.equal(finalizada.valorAbonado, 90000);
      assert.equal(finalizada.saldoPendiente, 0);
      assert.equal(finalizada.estadoPago, 'PAGADA');
      assert.equal(finalizada.abonos?.length, 2);
    });

    it('debe rechazar sobrepagos en abonos', () => {
      // Saldo pendiente en 1002 es 40000
      assert.throws(
        () => demoStore.updateInvoicePayment(1002, 45000, 'EFECTIVO'),
        /supera el saldo pendiente/
      );
    });

    it('debe anular factura y restituir automáticamente el stock de los productos', () => {
      const inv = demoStore.getInvoiceById(1001);
      const prodId = inv.detalles![0].producto.id;
      const cantVendida = inv.detalles![0].cantidad;

      const prodAntes = demoStore.getProductById(prodId)!;
      const stockAntes = prodAntes.cantidad;

      const anulada = demoStore.cancelInvoice(1001, 'Cliente desistió de la compra', DEMO_ADMIN_USER);
      assert.equal(anulada.anulada, true);
      assert.equal(anulada.motivoAnulacion, 'Cliente desistió de la compra');

      // Stock restituido
      const prodDespues = demoStore.getProductById(prodId)!;
      assert.equal(prodDespues.cantidad, stockAntes + cantVendida);

      // Rechazar re-anulación
      assert.throws(
        () => demoStore.cancelInvoice(1001, 'Intento duplicado', DEMO_ADMIN_USER),
        /ya se encuentra anulada/
      );

      // Rechazar abonos en factura anulada
      assert.throws(
        () => demoStore.updateInvoicePayment(1001, 10000, 'EFECTIVO'),
        /No es posible registrar abonos en una factura anulada/
      );
    });
  });

  describe('5. Segregación RBAC de Facturas (RF-014)', () => {
    it('vendedor solo puede consultar sus propias facturas', () => {
      const facturasVendedor = demoStore.getInvoices('VENDEDOR', 'caterin');
      assert.ok(facturasVendedor.length > 0);
      assert.ok(facturasVendedor.every((f) => f.vendedorUsuario === 'caterin'));

      // Intentar ver factura de Maryuri siendo Caterin
      assert.throws(
        () => demoStore.getInvoiceById(1001, 'VENDEDOR', 'caterin'),
        /No tienes autorización para ver esta factura/
      );

      // Administrador puede ver todas
      const facturasAdmin = demoStore.getInvoices('ADMIN', 'maryuri');
      assert.ok(facturasAdmin.length > facturasVendedor.length);
    });

    it('vendedor no puede anular facturas', () => {
      assert.throws(
        () => demoStore.cancelInvoice(1002, 'Vendedora intenta anular', DEMO_SELLER_USER),
        /Acceso denegado: solo los administradores pueden anular facturas/
      );
    });
  });

  describe('6. Resiliencia y Restablecimiento (RF-001, RF-003)', () => {
    it('resetToDefaults debe restablecer todas las colecciones a los valores semilla', () => {
      demoStore.createBrand({ nombre: 'Marca Temporal' });
      demoStore.createProduct({
        nombre: 'Producto Temporal',
        precio: 10000,
        cantidad: 5,
        categoria: 'LABIOS',
        marca: { id: 1 },
      });

      demoStore.resetToDefaults();

      const marcas = demoStore.getBrands(true);
      assert.ok(!marcas.some((m) => m.nombre === 'Marca Temporal'));

      const productos = demoStore.getProducts(true);
      assert.ok(!productos.some((p) => p.nombre === 'Producto Temporal'));
    });
  });
});
