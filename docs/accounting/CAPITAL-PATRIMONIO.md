# Capital y patrimonio

> El problema que este módulo resuelve: hasta la v1.0.0 la ficha de empresa tenía **un solo campo
> `capital`**, rotulado “capital enterado”, y esa misma cifra se usaba para estimar la patente
> municipal. Eso trata como sinónimos cinco magnitudes que jurídica y contablemente no lo son.

## Las cinco magnitudes

| Magnitud | Qué es | De dónde sale | Cuándo cambia |
|---|---|---|---|
| **Capital social** | Lo que dice el estatuto | Escritura y sus modificaciones | Sólo con un acto societario |
| **Capital suscrito** | Lo que el accionista se comprometió a aportar | Suscripción de acciones | Al suscribir o al modificar |
| **Capital enterado** | Lo que efectivamente entró | Aportes en dinero y en bienes | Con cada aporte |
| **Patrimonio contable** | Activos − pasivos, en libros | Balance | Con cada utilidad y cada pérdida |
| **Capital Propio Tributario** | Activo − pasivo exigible a valores tributarios | Cierre del ejercicio | Una vez al año |

Y una sexta, derivada, que no es ninguna de las anteriores:

| **Capital base de patente** | El capital propio que la ley manda usar **para ese período** | Art. 24 D.L. 3.063 | Cambia de regla entre el año 1 y el año 2 |

Ninguna se deduce de otra. En el caso de referencia del sandbox las seis dan números distintos, y
hay un test (`tests/capital.test.mjs`) que **falla si alguna vez coinciden**, porque coincidir sería
la señal de que el modelo volvió a fundirlas.

## Modelo de datos

```js
capitalProfile = {
  capitalSocial,           // null si no se conoce — nunca se inventa
  capitalSuscrito,         // null si no se conoce
  capitalEnterado,         // siempre un número
  numeroAcciones,
  valorNominal,
  accionistas: [{ name, rut, sharePercent, capitalSuscrito, capitalEnterado }],
  fechaConstitucion,
  fechaInicioActividades,
  pendingConfirmation: ['capitalSocial', 'capitalSuscrito'],   // ← marca de migración
  migratedFromLegacyCapital: true
}
```

`capitalPorEnterar` **no se guarda**: se deriva (`suscrito − enterado`) y devuelve `null` —no cero—
cuando el suscrito se desconoce. Cero significaría “no falta nada”, que es una afirmación que nadie
puede hacer sin el dato.

## Migración desde el campo antiguo

Al leer una ficha que sólo tiene `capital`:

1. esa cifra pasa a `capitalEnterado`, que es lo que el campo rotulaba;
2. `capitalSocial` y `capitalSuscrito` quedan marcados `PENDING_CONFIRMATION`;
3. **no se escribe nada en el almacén**. La migración ocurre en lectura, así que instalar esta
   versión no puede corromper datos existentes: si el usuario nunca vuelve a guardar, el archivo
   original queda intacto.

La interfaz muestra la marca hasta que el usuario confirma los valores.

## Movimientos patrimoniales

El ledger explícito vive en la clave `equity-movements`. Los tipos:

| Tipo | Patrimonio | Pasivo | ¿Entera capital? |
|---|:--:|:--:|:--:|
| `initial_contribution` | ↑ | — | sí |
| `additional_contribution` | ↑ | — | sí |
| `pending_capital_paid` | ↑ | — | sí |
| `asset_contribution` | ↑ | — | sí |
| `capital_increase` | — | — | no (acto societario) |
| `capital_decrease` | ↓ | — | no |
| `shareholder_loan` | — | ↑ | **no** |
| `shareholder_loan_repayment` | — | ↓ | no |
| `withdrawal` | ↓ | — | no |

### Aporte ≠ préstamo

Es la distinción central. Si el dueño deposita $2.000.000, la aplicación **obliga** a decidir qué fue:

- **Aporte de capital** → aumenta el patrimonio y el capital enterado;
- **Préstamo del accionista** → aumenta el pasivo exigible y **reduce** el CPT;
- **Ingreso operacional** → es una venta; aumenta el resultado y puede llevar IVA;
- **Otro** → hay que definirlo antes de registrarlo.

En la cartola bancaria las cuatro se ven idénticas. En el balance, en el CPT y en la patente, no.

### Aportes en bienes

Registran `tipoActivo`, `descripcion`, `fechaAporte`, `valorAporte`, `valorContable`, `valorTributario`,
`documentoRespaldo` y `accionistaAportante`. Los tres valores se guardan por separado porque **no
tienen por qué coincidir**, y un aporte en especie no es una compra: no genera crédito fiscal de IVA.

## Sin doble conteo

Un mismo peso puede aparecer en dos ledgers: el patrimonial y el de operaciones de caja. La solución
es un enlace, no una regla implícita:

- `addEquityMovement(mv, { registerCashMovement: true })` crea la operación de caja con
  `equityMovementId` apuntando al movimiento;
- `effectiveEquityMovements()` toma el ledger explícito **más** las operaciones antiguas de tipo
  `capital` / `shareholder_loan` / `owner_withdrawal` que **no** tengan ese enlace.

Así, los aportes registrados como operación antes de que existiera el modelo societario siguen
contando, y los nuevos no cuentan dos veces. Hay tests para ambos lados.

## Cierre anual

`closeFiscalYear(year, ...)` produce un snapshot **inmutable** con:

```
fiscalYear · closingDate · assets · liabilities · accountingEquity · balanceOrigin
CPT · CPTMethod · taxEquity (con su desglose) · taxAdjustments · taxRegime
capital · capitalMovements · yearSummary
municipalPatentBaseForNextPeriod · evidence · notes
legalRulesVersion   ← la VERSIÓN de las reglas, no una referencia al archivo
createdAt
```

`legalRulesVersion` importa más de lo que parece: dentro de tres años `rules/2026.json` puede
haberse corregido, y el cierre tiene que seguir explicando con qué normas se calculó **ese día**.

El cierre no se sobrescribe nunca. Reabrirlo exige motivo y queda en la bitácora. Importar un
respaldo tampoco puede pisar un ejercicio ya cerrado.

## Estados y origen de cada cifra

```
ESTIMADO → CALCULADO → DECLARADO → VERIFICADO → PAGADO
```

Ningún cálculo interno pasa de `ESTIMADO`/`CALCULADO` por sí solo. La aplicación **nunca** marca algo
como acreditado porque lo calculó: eso lo hace la evidencia.

## Dónde vive

| Pieza | Ruta |
|---|---|
| Modelo, validaciones y migración | `packages/company-operations/capital.mjs` |
| Persistencia y orquestación | `packages/company-operations/workspace.mjs` |
| Interfaz | `apps/web/src/views/capital.js` |
| Tests | `tests/capital.test.mjs`, `tests/tax-equity.test.mjs` |

Ver también [CPT](../tax/CAPITAL-PROPIO-TRIBUTARIO.md),
[patente municipal](../municipal/PATENTE-MUNICIPAL.md) y el [glosario](../GLOSSARY.md).
