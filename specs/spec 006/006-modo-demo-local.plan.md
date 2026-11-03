# Plan de Implementación Técnica — Spec 006: Modo Demostración Local (Offline) y Paridad de Reglas de Negocio

## 1. Módulos y Arquitectura de la Solución

El plan técnico para el Nivel 6 consolida la arquitectura del cliente en modo offline y garantiza paridad 1:1 con las reglas del backend Java:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend SPA (React 19)                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ App.tsx                                                          │  │
│  │  - Estado `user`, `isDemo`, sincronización con localStorage      │  │
│  │  - Preservación del rol demo seleccionado tras recarga (F5)      │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Consume servicios de datos         │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ services/api.ts (Fachada HTTP / Demo Dispatcher)                 │  │
│  │  - Si isDemo === true: Delega directamente en `demoStore`        │  │
│  │  - Si isDemo === false: Ejecuta fetch HTTP contra Spring Boot     │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Opera sobre motor local            │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ services/demoData.ts (`DemoStore` Class)                         │  │
│  │  - Colecciones reactivas: brands, products, invoices             │  │
│  │  - Persistencia síncrona en localStorage (v3 keys)               │  │
│  │  - Validación de stock atómico, abonos y anulación con rollback  │  │
│  │  - Nombres normalizados y borrado lógico (Principio 5)           │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Tipado y validación de esquemas    │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ types/index.ts                                                   │  │
│  │  - EstadoPagoFactura: 'PENDIENTE' | 'PARCIAL' | 'PAGADA'         │  │
│  │  - DTOs homogéneos con Backend Spec 004 y 005                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Decisiones Técnicas y Estrategia de Implementación

### 2.1. Homogeneización del Modelo de Estados de Pago
- El backend en `com.dunamis.makeup.entity.EstadoPagoFactura` define:
  ```java
  public enum EstadoPagoFactura {
      PENDIENTE,
      PARCIAL,
      PAGADA
  }
  ```
- En el frontend, `types/index.ts` utilizaba `ABONO_PARCIAL | 'PENDIENTE' | 'PAGADA'`.
- **Decisión:** Unificar el enum en TypeScript a:
  ```typescript
  export type EstadoPagoFactura = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ABONO_PARCIAL';
  ```
  donde `'PARCIAL'` es el valor estándar y `'ABONO_PARCIAL'` se mantiene como alias tolerante para preservar retrocompatibilidad con facturas guardadas en clientes históricos.

### 2.2. Persistencia del Usuario y Rol Demo en `localStorage`
- Clave de storage: `dunamis_demo_user`.
- Cuando se invoque `handleToggleDemoRole`, se actualizará `user` y se persistirá en `localStorage.setItem('dunamis_demo_user', JSON.stringify(nextUser))`.
- En `checkInitialSession`:
  ```typescript
  const savedDemoUser = localStorage.getItem('dunamis_demo_user');
  const initialUser = savedDemoUser ? JSON.parse(savedDemoUser) : DEMO_ADMIN_USER;
  ```
  Esto garantiza que tras presionar F5, la usuaria permanezca exactamente en el rol que estaba auditando.

### 2.3. Paridad en Normalización de Marcas
- Al igual que en `MarcaService.java`:
  ```typescript
  const nombreNormalizado = input.nombre.trim().replace(/\s+/g, ' ');
  ```
  Se aplicará tanto en `createBrand` como en `updateBrand`.

### 2.4. Integridad Transaccional de Facturación en `demoStore`
- Validación de existencias antes de mutar cualquier cantidad: si un producto no tiene stock suficiente, ningún producto del carrito se descuenta (atomicidad emulada).
- Al anular una factura:
  - Validar que no esté previamente anulada.
  - Devolver de forma inmediata las cantidades correspondientes a cada ítem de detalle al stock de `products`.
  - Recalcular `totalProducto`.
  - Guardar productos e invoices en un solo ciclo de guardado.

### 2.5. Suite de Pruebas Unitarias para `demoStore`
- Para cumplir con el Principio 9 de la Constitución sin añadir dependencias pesadas innecesarias a `package.json`, implementaremos un script de pruebas automatizadas en `frontend/src/services/__tests__/demoStore.test.ts` ejecutable con `tsx` o `node --test` / TypeScript runner nativo, o mediante un script de verificación tipada en `npm run test:demo`.
- Validará los 15 requerimientos funcionales con aserciones rigurosas.

---

## 3. Matriz de Cobertura de Requisitos Funcionales

| Requisito | Componente / Archivo | Método / Estrategia |
|---|---|---|
| **RF-001, RF-002, RF-003** | `frontend/src/App.tsx`, `frontend/src/services/demoData.ts` | Persistencia en `localStorage` de marcas, productos, facturas, usuario demo y restablecimiento limpio en `resetToDefaults`. |
| **RF-004, RF-005, RF-006** | `frontend/src/services/demoData.ts` | `createBrand`, `updateBrand` con `.replace(/\s+/g, ' ')`, filtrado por `incluirInactivas` y validación de marca activa en productos. |
| **RF-007, RF-008, RF-009** | `frontend/src/services/demoData.ts` | Borrado lógico (`activo = false`), alerta con `umbral` numérico y validación de existencias no negativas. |
| **RF-010, RF-011** | `frontend/src/services/demoData.ts`, `frontend/src/types/index.ts` | `createInvoice` atómico y estandarización de `EstadoPagoFactura` (`PARCIAL`). |
| **RF-012, RF-013** | `frontend/src/services/demoData.ts` | `updateInvoicePayment` con desglose de `AbonoFactura`, y `cancelInvoice` con restitución de inventario. |
| **RF-014** | `frontend/src/services/demoData.ts` | Segregación por `vendedorUsuario` en `getInvoices` y `getInvoiceById`. |
| **RF-015** | `frontend/src/services/__tests__/demoStore.test.ts` | Suite de pruebas automatizadas certificando el 100% de operaciones locales. |
