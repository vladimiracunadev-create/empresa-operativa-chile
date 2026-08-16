# Patente municipal

> Última verificación de las fuentes: **16 de agosto de 2026**.
> Esta aplicación no está conectada a ninguna municipalidad. Todo lo que calcula es una estimación
> que debe contrastarse con la municipalidad competente.

## La regla

El art. 24 del D.L. N.º 3.063 de 1979 sobre Rentas Municipales fija el valor anual de la patente
entre el **2,5‰ y el 5‰ del capital propio** del contribuyente, con un mínimo de **1 UTM** y un
máximo de **8.000 UTM**.

Cada municipalidad elige su tasa **dentro de ese rango** mediante ordenanza. **No existe una tasa
nacional.** Por eso este repositorio no publica una tabla de tasas por comuna: hacerlo sería
fabricar decenas de cifras que nadie verificó, y el usuario las leería como si fueran su boleta.

> **Corrección respecto de versiones anteriores del repositorio:** hasta la v1.0.0 la regla decía
> `maxUtm: 4000`. El tope vigente son **8.000 UTM**; 4.000 era el texto anterior a la reforma de la
> Ley N.º 20.280. `scripts/validate-rules.mjs` ahora falla si alguien lo revierte.

## La bifurcación que lo cambia todo

El mismo art. 24, inciso tercero, define qué capital propio se usa:

| Situación | Base legal de la patente |
|---|---|
| **Actividades nuevas** | El capital propio **inicial declarado** por el contribuyente |
| **Ejercicios posteriores** | El capital propio **registrado en el balance terminado el 31 de diciembre inmediatamente anterior**, con los ajustes de los arts. 41 y siguientes de la LIR |

Esto responde la pregunta que la aplicación tiene que poder contestar:

> *¿Por qué la patente del año 2 no usa el capital con que constituí la SpA?*

Porque la ley cambió la base. El primer año se parte de lo declarado al iniciar actividades; desde
el segundo, la base es el capital propio tributario del cierre anterior, que incorpora las utilidades
retenidas, descuenta las pérdidas y los retiros, y normalmente no se parece al capital de constitución.

Los contribuyentes que determinan **capital propio tributario simplificado** se sujetan a esas reglas
(ver [CPT](../tax/CAPITAL-PROPIO-TRIBUTARIO.md)).

## Deducciones y sucursales

- **Inversiones en otros negocios afectos a patente** (art. 24, inciso final): se puede deducir la
  parte del capital propio invertida en ellos, acreditada mediante **certificado emitido por la
  municipalidad correspondiente**. La aplicación no la aplica sola: hay que registrarla, y deja el
  supuesto declarado en `assumptions`.
- **Sucursales** (art. 25): cuando el contribuyente opera en varias unidades, la patente total se
  paga proporcionalmente por cada una, prorrateando el capital propio **según el número de
  trabajadores** de cada unidad. La municipalidad de la casa matriz determina la distribución y la
  comunica a las demás. Se declara anualmente en mayo.

## Relación SII ↔ municipalidad

El SII pone a disposición de cada municipalidad, **dentro del mes de mayo de cada año**, el capital
propio declarado, el RUT y el código de actividad de sus contribuyentes (art. 24).

**Esta aplicación no consume esa información ni está conectada a ningún sistema oficial.** Lo que
hace es modelar el flujo y distinguir el origen de cada dato:

```
datoIngresadoPorUsuario · datoCalculado · datoImportado · datoVerificadoEnSII · datoVerificadoMunicipalidad
```

(implementado como `DATA_ORIGIN` en `packages/company-operations/capital.mjs`). La arquitectura queda
preparada para una integración futura sin inventar APIs que no existen.

## Dónde vive en el código

| Pieza | Ruta |
|---|---|
| Regla legal versionada | `packages/chile-tax-rules/rules/2026.json` → `municipalPatent` |
| Maestro municipal | `packages/chile-tax-rules/municipalities.mjs` |
| Motor | `packages/accounting-engine/municipal-patent.mjs` → `calculateMunicipalPatent(...)` |
| Orquestación | `packages/company-operations/workspace.mjs` → `municipalPatentFor(year)` |
| Interfaz | `apps/web/src/views/capital.js` |
| CLI | `contador-cli patente-municipal` |

## El maestro municipal

Cada entrada declara `municipalityId`, `name`, `commune`, `region`, `patentRate`, `rateSource`,
`effectiveFrom`, `effectiveTo`, `requirementsUrl`, `lastVerified` y `status`.

El catálogo base trae **identidad sin tasas**: todas las entradas nacen con `patentRate: null` y
`status: "UNVERIFIED"`. Una tasa sólo pasa a `VERIFIED` cuando el usuario la registra **con su fuente
y su fecha de verificación**. Mientras no lo esté, el motor usa el mínimo legal como supuesto
declarado y devuelve:

> *Tasa municipal no verificada. La cifra es una simulación y debe contrastarse con la
> municipalidad correspondiente.*

## Trazabilidad del cálculo

```
Capital base de patente             $7.500.000     ← origen legal declarado
Tasa municipal                            5,00‰    ← estado: verificada / no verificada
-----------------------------------------------
Patente calculada                      $37.500
Mínimo legal (1 UTM de $71.649)        $71.649
Máximo legal (8.000 UTM)          $573.192.000
-----------------------------------------------
Patente anual final                    $71.649     ← se aplicó el mínimo
Patente semestral estimada             $35.825
```

Cifras ilustrativas. El resultado real incluye además `baseOrigin` (qué regla se usó y por qué),
`legalBasis`, `utm` y `utmPeriod` (cuál se usó y si pertenece al período), `rulesLastVerified`,
`assumptions[]` y `warnings[]`.

## Validaciones activas

- Una tasa fuera de 2,5‰–5‰ se **rechaza** con error, no se recorta en silencio.
- Una UTM ausente o `≤ 0` se rechaza.
- Usar la UTM de un mes distinto al pedido, o de un año distinto al período, produce advertencia
  explícita: los topes van en UTM, así que arrastrar la de otro período cambia la cifra sin avisar.
- Un año comercial sin reglas verificadas **falla** en vez de calcular con las del año anterior.
- Empresa en funcionamiento sin cierre anual previo: advierte que no hay base con que determinar la patente.

## Fuentes

- D.L. N.º 3.063 de 1979, arts. 23 a 26 — <https://www.bcn.cl/leychile/navegar?idNorma=6942>
- Oficio SII N.º 1.700 de 15-06-2016 (relación art. 41 LIR ↔ art. 24 D.L. 3.063) —
  <https://www.sii.cl/pagina/jurisprudencia/adminis/2016/renta/ja1700.htm>
- UTM 2026 — <https://www.sii.cl/valores_y_fechas/utm/utm2026.htm>

Al 16-08-2026, BCN/LeyChile no respondió a las consultas automatizadas; el articulado se contrastó
contra el oficio del SII, que cita literalmente el inciso tercero del art. 24, y contra una
reproducción pública del texto. **Reverificar el enlace antes de usar la cifra en una declaración real.**
