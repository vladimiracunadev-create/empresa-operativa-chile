# Capital Propio Tributario (CPT)

> Última verificación de las fuentes: **16 de agosto de 2026**.
> Ninguna cifra de este documento reemplaza la declaración anual de la empresa ni el criterio del SII.

## Qué es

El CPT es la medida **tributaria** del patrimonio. No es el patrimonio contable, no es el capital
enterado y no es el capital social. El art. 41 N.º 1 de la Ley sobre Impuesto a la Renta lo define
como la diferencia entre el activo y el pasivo exigible a la fecha de iniciación del ejercicio
comercial, **rebajando previamente** los valores intangibles, nominales, transitorios y de orden
—y otros que determine el Servicio— que no representen inversiones efectivas.

Se determina al cierre de cada ejercicio, se informa en el F22, y es la cifra que el SII pone a
disposición de las municipalidades para la patente del período siguiente.

## Dónde vive en el código

| Pieza | Ruta | Responsabilidad |
|---|---|---|
| Reglas versionadas | `packages/chile-tax-rules/rules/2026.json` → `taxEquity` | Métodos, fórmulas, normas, fechas de verificación |
| Motor | `packages/accounting-engine/tax-equity.mjs` | `calculateTaxEquity(...)` |
| Orquestación | `packages/company-operations/workspace.mjs` → `taxEquityFor(year)` | Arma los insumos desde las operaciones registradas |
| Interfaz | `apps/web/src/views/capital.js` | Presenta el resultado y su desglose |
| CLI | `contador-cli cpt` | El mismo motor, sin interfaz |

La regla de la casa se cumple aquí: **ninguna tasa ni fórmula está escrita en la vista**.

## Los dos métodos

### 1. Método general — art. 41 N.º 1 LIR

```
  Activos a valor tributario
− Valores intangibles, nominales, transitorios y de orden sin inversión efectiva
− Pasivos exigibles
± Ajustes tributarios
= Capital Propio Tributario
```

Es el método por defecto para todo contribuyente que **no** califique para el simplificado.

### 2. CPT simplificado — art. 14 letra D) N.º 3 letra (j) LIR

Sólo para empresas acogidas al régimen **Pro Pyme General (14 D N.º 3)**.

```
  Capital aportado formalizado (y sus aumentos)
+ Bases imponibles de primera categoría de cada año
+ Rentas percibidas por participaciones en otras empresas
− Disminuciones de capital
− Pérdidas
− Partidas del inciso segundo del art. 21 pagadas
− Retiros y distribuciones a los propietarios
= CPT simplificado    (si el resultado es negativo, se considera $0)
```

**El motor no aplica esta fórmula a quien no califica.** Si el régimen declarado es Pro Pyme
Transparente (14 D N.º 8) o Régimen General (14 A), `calculateTaxEquity` cae al art. 41 y, si se le
fuerza el método simplificado, devuelve una advertencia explícita en vez de un número plausible.

## Qué devuelve el motor

Nunca sólo un número:

```jsonc
{
  "openingCPT": null,               // CPT del cierre anterior, si existe
  "taxAssets": 7901600,
  "eligibleLiabilities": 500000,
  "nonEffectiveValues": 0,
  "positiveAdjustments": 0,
  "negativeAdjustments": 0,
  "capitalIncreases": 2400000,
  "capitalDecreases": 0,
  "calculatedCPT": 6700000,
  "calculationMethod": "simplified14D3j",
  "legalBasis": "LIR art. 14 letra D) N.º 3 letra (j)",
  "formula": "...",
  "breakdown": [ /* cada partida con su signo */ ],
  "status": "ESTIMADO",
  "assumptions": [ /* qué se supuso */ ],
  "warnings":   [ /* qué falta o qué requiere revisión */ ],
  "evidence":   [ /* norma + versión de reglas usada */ ]
}
```

`status` es siempre `ESTIMADO` cuando lo produce la aplicación. Sólo pasa a `DECLARADO` al quedar
guardado en un cierre anual, y a `VERIFICADO` cuando el usuario lo contrasta con su F22.

## Primer ejercicio

En el primer año no hay CPT de apertura. El capital propio inicial corresponde, en lo esencial, al
capital **efectivamente enterado** más los aportes en bienes a su valor tributario, menos los pasivos
exigibles a esa fecha. Un préstamo del accionista, aunque haya entrado por el mismo banco que un
aporte, **resta**: es pasivo exigible.

El capital **suscrito y no enterado no es un activo** de la empresa y no entra.

## Limitaciones declaradas

El motor no modela, y lo dice en `warnings`:

- corrección monetaria del art. 41 (revalorización de activos y pasivos);
- depreciación tributaria y su diferencia con la contable;
- reorganizaciones empresariales (división, fusión, conversión);
- activos y pasivos en moneda extranjera;
- registros empresariales completos (RAI, DDAN, REX, SAC) del régimen general.

El balance que la aplicación propone es una **estimación derivada de las operaciones registradas**:
no hay plan de cuentas, ni cuentas por cobrar/pagar, ni impuestos por pagar reconocidos hasta que se
registran como operación. En el cierre anual el usuario puede declarar activos y pasivos reales, y
entonces el snapshot marca `balanceOrigin: "declarado por el usuario"`.

## Fuentes

- LIR art. 41 N.º 1 — <https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7347.htm>
- LIR art. 14 letra D) N.º 3 letra (j) — Circular SII N.º 62 de 2020, <https://www.sii.cl/normativa_legislacion/circulares/2020/circu62.pdf>
- Regímenes tributarios — <https://www.sii.cl/destacados/modernizacion/tipos_regimenes_mt.html>

Ver también [`docs/municipal/PATENTE-MUNICIPAL.md`](../municipal/PATENTE-MUNICIPAL.md),
[`docs/accounting/CAPITAL-PATRIMONIO.md`](../accounting/CAPITAL-PATRIMONIO.md) y el
[glosario](../GLOSSARY.md#cpt).
