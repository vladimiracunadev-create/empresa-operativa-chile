# Módulos operativos

## 1. Asistente de creación de empresa
- Decisiones previas: tipo societario, nombre, accionista, capital, objeto, administración, domicilio y giros.
- Checklist para Registro de Empresas y Sociedades.
- Registro de RUT y certificados una vez emitidos.
- Inicio de actividades SII.
- Régimen tributario.
- Facturación electrónica.
- Patente municipal.
- Cuenta bancaria.

## 2. Maestro de empresa
Razón social, RUT, domicilio, oficina virtual, representante, actividades, régimen, municipalidad y cuentas bancarias.
El capital ya no vive aquí como un único número: tiene su propio módulo (ver 2b).

## 2b. Capital y patrimonio
Módulo propio, porque son magnitudes distintas y confundirlas cambia lo que se paga.

- **Constitución:** capital social, capital suscrito, capital enterado, capital por enterar, número de acciones,
  valor nominal, accionistas (admite uno solo al 100 %), fecha de constitución e inicio de actividades.
- **Movimientos patrimoniales:** aporte inicial, aporte posterior, capital pendiente enterado, aumento y disminución
  de capital, aporte en bienes, préstamo del accionista, devolución del préstamo, retiro/distribución.
- **Situación actual:** activos, pasivos exigibles, patrimonio contable y CPT estimado con su desglose.
- **Municipalidad:** comuna, tasa con su fuente y fecha de verificación, capital propio inicial declarado,
  inversiones deducibles, capital asignado por prorrateo, UTM del período.
- **Historial por año** y **cierre anual** con snapshot inmutable.
- **Simulador educativo** (sólo SANDBOX) con escenarios de capital inicial.

Detalle: [`docs/accounting/CAPITAL-PATRIMONIO.md`](../accounting/CAPITAL-PATRIMONIO.md),
[`docs/tax/CAPITAL-PROPIO-TRIBUTARIO.md`](../tax/CAPITAL-PROPIO-TRIBUTARIO.md),
[`docs/municipal/PATENTE-MUNICIPAL.md`](../municipal/PATENTE-MUNICIPAL.md).

## 3. Operaciones
Ventas, compras, gastos, honorarios, activos, aportes, retiros, préstamos del accionista, impuestos y movimientos bancarios.
Un depósito del dueño obliga a declarar su naturaleza —aporte, préstamo, ingreso operacional u otro— porque el efecto sobre
el patrimonio, el CPT y la patente es distinto en cada caso.

## 4. Documentos y evidencias
DTE, boletas, contratos, cartolas, certificados, comprobantes SII, patente y respaldos.

## 5. Contabilidad
Plan de cuentas, asientos, libro diario, mayor, balance y conciliaciones. El motor debe poder explicar cada asiento.

## 6. Impuestos
RCV, IVA, PPM, retenciones, borrador F29, control de diferencias con SII, impuestos anuales y F22.

## 7. Calendario de cumplimiento
Obligación, período, fecha de vencimiento, estado, monto, comprobante, fuente de regla y responsable.

## 8. Cierre mensual
Checklist, conciliaciones, snapshot, bloqueo y reapertura controlada futura.

## 9. Cierre anual
Inventario de obligaciones, DJ, renta, capital propio tributario, registros empresariales y expediente anual.

Produce un **snapshot inmutable** con activos, pasivos, patrimonio contable, CPT y su método, ajustes tributarios,
régimen, movimientos de capital, base municipal del período siguiente, evidencias y la **versión de las reglas legales**
con que se calculó. Ese snapshot es la apertura del ejercicio siguiente y el origen de la base de la patente del año 2.
Reabrirlo exige motivo y queda en la bitácora; importar un respaldo no puede pisarlo.

## 10. Auditoría
Toda mutación relevante deja actor, fecha, acción, datos anteriores/nuevos y evidencia.

## 11. Backup
Respaldos locales y exportación cifrada en una etapa posterior.

## 12. Academia
Tutorial contextual: cada pantalla ofrece "¿Por qué?", laboratorio y sandbox, sin mezclarse con producción.
Incluye el ciclo temporal completo (constitución → capital → patente inicial → operación → cierre → CPT → patente siguiente)
y una tabla que muestra las cinco magnitudes de capital una al lado de la otra, calculadas con el mismo motor que opera la empresa.

## 13. Glosario
Fuente única de definiciones en `packages/glossary/index.mjs`, con tres consumidores:

- la vista **Glosario** de la aplicación, con búsqueda insensible a tildes;
- las **ayudas contextuales** (`?`) junto a cada campo de las pantallas;
- `docs/GLOSSARY.md`, generado con `node scripts/build-glossary.mjs`.

CI comprueba que el documento no se desvíe del módulo. Cada término declara categoría, resumen, definición pedagógica,
base legal cuando la tiene y —lo más importante de este dominio— **con qué no hay que confundirlo**.
