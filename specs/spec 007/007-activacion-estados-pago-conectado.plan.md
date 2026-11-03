# Plan de Implementación Técnica — Spec 007: Habilitación de Estados de Pago y Abonos Iniciales en Modo Conectado

## 1. Módulos y Arquitectura de la Solución

El plan técnico describe las modificaciones requeridas en los componentes del frontend y las capas de integración con Spring Boot:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend SPA (React 19)                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ QuickSaleModal.tsx                                               │  │
│  │  - Remoción de la condición `!isDemo` en la UI de pago           │  │
│  │  - Validación universal de montos para abono parcial             │  │
│  │  - Inclusión de `estadoPago` y `valorAbonado` en payload         │  │
│  │  - Selector opcional de medio de pago inicial (default EFECTIVO) │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Envía FacturaInput                 │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ services/api.ts (createFactura)                                  │  │
│  │  - Normalización: 'PARCIAL' ➔ 'ABONO_PARCIAL' para Spring Boot    │  │
│  │  - Envío de medioPagoInicial y notasPago                         │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ HTTP POST /factura/crear (JSON)    │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ MonthlySalesView.tsx                                             │  │
│  │  - Actualización del mensaje informativo de modo conectado       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Red HTTP con Cookie de Sesión
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Backend Spring Boot (Java 17 / PostgreSQL)            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ FacturaController & FacturaService                               │  │
│  │  - Ya implementado: procesa PAGADA, ABONO_PARCIAL, PENDIENTE     │  │
│  │  - Opcional: Anotación en EstadoPagoFactura para tolerar PARCIAL │  │
│  │    vía @JsonCreator en caso de requerir resiliencia dual         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Decisiones Técnicas y Estrategia de Implementación

### 2.1. Homogeneización y Mapeo del Enum de Pago
- En el frontend (`types/index.ts` y botones de `QuickSaleModal.tsx`):
  El estado visual se maneja habitualmente con `'PARCIAL'`.
- En el backend (`EstadoPagoFactura.java`):
  El valor correspondiente es `ABONO_PARCIAL`.
- **Decisión:**
  1. En `services/api.ts` (función `createFactura`), mapear explícitamente:
     ```typescript
     const estadoNormalizado = input.estadoPago === 'PARCIAL' ? 'ABONO_PARCIAL' : input.estadoPago;
     ```
  2. En el backend, para máxima robustez (Principio 12 - Compatibilidad Brownfield), asegurar que `EstadoPagoFactura.java` cuente con un método `@JsonCreator` que reconozca tanto `"PARCIAL"` como `"ABONO_PARCIAL"`, evitando errores si cualquier cliente envía una de las dos formas.

### 2.2. Desbloqueo de UI en `QuickSaleModal.tsx`
- Se reemplaza la estructura condicional:
  ```tsx
  {/* ANTES: */}
  {!isDemo ? <AlertaModoConectado /> : <SelectorDePago />}
  
  {/* DESPUÉS: */}
  <SelectorDePago />
  ```
  De modo que el bloque con las tres opciones (`Pagada`, `Abono Parcial`, `Pendiente`) y el campo de monto de abono parcial se muestre siempre.
- Al confirmar el formulario:
  ```typescript
  // ANTES:
  ...(isDemo ? { estadoPago, valorAbonado: valorAbonadoCalculado } : {})
  
  // DESPUÉS:
  estadoPago,
  valorAbonado: valorAbonadoCalculado,
  medioPagoInicial: medioPagoSeleccionado || 'EFECTIVO',
  ```
- La validación de que el abono sea mayor a cero y menor al total facturado se ejecutará siempre que el estado sea `'PARCIAL'` o `'ABONO_PARCIAL'`, eliminando la condición `isDemo`.

### 2.3. Mensajes Informativos en `MonthlySalesView.tsx`
- Actualizar el banner informativo en `MonthlySalesView.tsx`: destacar que los datos financieros, abonos y facturas se leen y registran en tiempo real en la base de datos de Dunamis Makeup a través del servidor Spring Boot.

---

## 3. Estrategia de Pruebas
1. **Frontend:**
   - Ejecución de `npm --prefix frontend run lint` (cero errores/warnings de oxlint).
   - Ejecución de `npm --prefix frontend run build` (typechecking y empaquetado de producción exitosos).
   - Ejecución de `npm --prefix frontend run test` (pruebas de `demoStore` pasando).
2. **Backend:**
   - Ejecución de `.\mvnw.cmd test-compile` y `.\mvnw.cmd test` (166+ pruebas de controladores, servicios y seguridad pasando sin fallos).
