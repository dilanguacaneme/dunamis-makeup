# Especificación 007: Habilitación de Estados de Pago y Abonos Iniciales en Modo Conectado

## 1. Propósito y Contexto
- **QUÉ:** Habilitar de forma completa e integrada la selección de estados de pago (`PAGADA`, `ABONO_PARCIAL`, `PENDIENTE`) y el registro del abono financiero inicial en el modal de ventas rápidas (`QuickSaleModal.tsx`) tanto en modo conectado con el backend Spring Boot (`isDemo === false`) como en modo demostración (`isDemo === true`):
  1. Eliminar la restricción condicional `!isDemo` en `QuickSaleModal.tsx` que bloqueaba visual y funcionalmente la selección de pagos en modo conectado.
  2. Garantizar que el payload emitido hacia `POST /factura/crear` transmita siempre `estadoPago`, `valorAbonado`, `medioPagoInicial` y `notasPago` sin importar si la aplicación corre en modo demostración o conectada a Spring Boot.
  3. Homogeneizar el contrato de datos del enum `EstadoPagoFactura`: garantizar que la selección en UI de abono parcial (`PARCIAL`) se serialice y comunique de forma transparente y compatible con el enum del backend (`ABONO_PARCIAL`).
  4. Homogeneizar las validaciones de negocio en el cliente para que apliquen universalmente (validación de que un abono parcial sea estrictamente mayor a 0 y menor al total facturado).
  5. Actualizar los mensajes informativos obsoletos en `MonthlySalesView.tsx` y en el propio modal de venta, eliminando afirmaciones que sugerían la falta de soporte de cobros en base de datos.
- **POR QUÉ:** El backend Spring Boot ya cuenta con la infraestructura completa y validada de persistencia de pagos y abonos (entidad `Factura`, entidad `AbonoFactura`, DTOs de solicitud/respuesta y pruebas de integración pasando con éxito). Mantener las opciones de pago bloqueadas en el frontend cuando el backend está activo representa una deuda técnica y una inconsistencia de cara al usuario final, forzándolo a utilizar el modo demo para probar estados de pago que el backend real ya procesa y audita.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Habilitación del Selector de Pago en Ventas Rápidas
- **RF-001 (Ubiquitous):** El componente `QuickSaleModal` deberá presentar activas y seleccionables las modalidades de pago (`PAGADA`, `ABONO_PARCIAL` / `PARCIAL` y `PENDIENTE`) con sus respectivos indicadores visuales y colores de estado, sin importar si el sistema opera en modo conectado con Spring Boot o en modo demostración local.
  - *Por qué:* Elimina la disparidad funcional entre el modo demo y el modo conectado a PostgreSQL.

- **RF-002 (Event-driven):** Al seleccionar la modalidad **"Abono Parcial"**, `QuickSaleModal` desplegará el campo numérico para ingresar el valor abonado por el cliente, precalculando inicialmente el 50% del total de la venta o permitiendo su edición manual, tanto en modo conectado como en modo demostración.
  - *Por qué:* Facilita la venta a crédito con anticipo en tiempo real.

- **RF-003 (Event-driven):** Cuando la usuaria intente confirmar la venta con estado **"Abono Parcial"**:
  - Si el monto abonado es menor o igual a cero, el formulario deberá rechazar el envío mostrando el mensaje: *"El valor abonado debe ser mayor a cero. Para ventas sin anticipo elige 'Pendiente'."*
  - Si el monto abonado es mayor o igual al total facturado, el formulario deberá rechazar el envío mostrando el mensaje: *"El valor abonado cubre el total. En este caso selecciona 'Pagada'."*
  - Esta validación aplicará indistintamente en modo demo y en modo conectado.
  - *Por qué:* Protege la coherencia contable y evita errores 400 Bad Request desde el backend.

---

### Envío de Datos y Compatibilidad de Contratos (Frontend ↔ Backend)
- **RF-004 (Ubiquitous):** Al emitir una factura, `QuickSaleModal` deberá construir el objeto `FacturaInput` incluyendo obligatoriamente `estadoPago` y `valorAbonado` calculados, sin excluir dichos atributos cuando `isDemo` sea falso.
  - *Por qué:* Garantiza que el backend Spring Boot reciba la instrucción financiera explícita enviada por la vendedora.

- **RF-005 (Ubiquitous):** La capa de comunicación (`api.ts` o el transformador de DTOs en el frontend) deberá mapear consistentemente el valor de UI `'PARCIAL'` hacia `'ABONO_PARCIAL'` al enviar el cuerpo JSON hacia el endpoint `POST /factura/crear`, y el backend deberá tolerar o aceptar dicho estado sin generar discrepancias de deserialización.
  - *Por qué:* Garantiza la interoperabilidad estricta según el Principio 2 de la Constitución.

- **RF-006 (Ubiquitous):** Opcionalmente, el modal de ventas o la API deberán permitir enviar el medio de pago inicial (`EFECTIVO`, `TRANSFERENCIA`, `NEQUI`, `DAVIPLATA`, `TARJETA`) asociándolo al abono inicial de la factura, predeterminando `EFECTIVO` si no se especifica.
  - *Por qué:* Permite trazar contablemente la vía de ingreso del anticipo o liquidación total.

---

### Saneamiento de Mensajes y Coherencia en Vistas
- **RF-007 (Ubiquitous):** Se deberá retirar el bloque de advertencia obsoleta en `QuickSaleModal` que indicaba: *"El servidor Spring Boot actual registra la venta... pero aún no dispone de columnas para almacenar estados de pago"*.
  - *Por qué:* Dicha advertencia ya no corresponde a la realidad del backend.

- **RF-008 (Ubiquitous):** En `MonthlySalesView.tsx`, se actualizará la nota informativa de modo conectado para reflejar que tanto las ventas como los abonos y saldos pendientes están sincronizados y registrados directamente en el servidor Spring Boot.
  - *Por qué:* Brinda claridad y confianza a las administradoras en la operación del sistema.

---

### Calidad y Regresión
- **RF-009 (Ubiquitous):** Las modificaciones en el frontend no deberán introducir advertencias ni errores en el linter (`npm run lint`), deberán compilar limpiamente con TypeScript (`npm run build`), y deberán pasar la suite de pruebas unitarias (`npm test`).
  - *Por qué:* Cumplimiento del Principio 6 de la Constitución.

- **RF-010 (Ubiquitous):** El backend mantendrá la totalidad de sus pruebas unitarias y de integración pasando con éxito (`.\mvnw.cmd test-compile` y `.\mvnw.cmd test`), confirmando cero regresión.
  - *Por qué:* Cumplimiento del Principio 8 de la Constitución.

---

## 3. Casos Límite y Consideraciones de Error
1. **Factura totalmente pagada en modo conectado:** Al seleccionar `PAGADA`, el backend debe recibir `estadoPago = PAGADA`, `valorAbonado = total` y generar un abono por el valor total.
2. **Factura pendiente en modo conectado:** Al seleccionar `PENDIENTE`, el backend debe recibir `estadoPago = PENDIENTE`, `valorAbonado = 0.0` y `saldoPendiente = total`.
3. **Factura con abono parcial en modo conectado:** Al seleccionar `PARCIAL`, se debe enviar `estadoPago = ABONO_PARCIAL`, registrar el abono inicial y calcular `saldoPendiente = total - valorAbonado`.
4. **Resiliencia ante facturas históricas en backend:** Facturas previas creadas sin estado explícito deben seguir leyéndose con su estado por defecto (`PAGADA` o saldo calculado) sin generar excepciones en `FacturaResponse`.
