# Contrato CountryPack y limites de la fase 1

Fecha de contrato: **2026-10-27**. Este documento describe codigo ejecutable; no declara que los
siete paises tengan calculadoras ni cobertura legal completa.

## Separacion obligatoria

La aplicacion mantiene cuatro decisiones independientes:

1. `country`: jurisdiccion fiscal ISO 3166-1 alfa-2.
2. `subdivision`: estado, provincia, comunidad autonoma o municipio cuando corresponda.
3. `locale`: idioma y convenciones de interfaz BCP 47.
4. `currency` y `timeZone`: moneda ISO 4217 y zona IANA del contexto que se muestra.

Cambiar `locale` nunca cambia `country`. En particular, `MX + pt-BR` sigue resolviendo SAT/RFC y
`CL + en` sigue cargando exclusivamente reglas chilenas. Las pruebas de
`tests/jurisdictions.test.mjs` hacen fallar el build si se mezclan esas dimensiones.

## Forma validada

`packages/core/country-pack.mjs` valida al cargar cada perfil:

```js
{
  country, subdivisions, supportedLocales, currency, timeZone,
  legalEntities, agencies, identifiers, forms, procedures, rules,
  supportedScenarios,
  capabilities: {
    documentaryGuidance,
    taxCalculations: { enabled, mode, reason }
  },
  verification: { state, checkedAt, reviewedBy }
}
```

No se permiten agencias esenciales omitidas. Registro empresarial, impuestos, marcas e
insolvencia siempre deben aparecer; si aun no se investigaron, deben quedar explicitamente en
`REQUIRES_HUMAN_REVIEW`, no como un objeto vacio que parezca completo.

Estados de perfil: `VERIFIED`, `PARTIAL_VERIFIED`, `DOCUMENTARY_ONLY`, `DRAFT`, `STALE` y
`REQUIRES_HUMAN_REVIEW`. Un perfil documental no puede habilitar calculos tributarios.

## Reglas normativas

`packages/core/regulatory-rules.mjs` exige, como minimo:

- pais, subdivision, tipo de entidad y regimen;
- vigencia, ano comercial y version de regla;
- URL HTTPS, titulo, publicacion y fecha de comprobacion;
- estado de revision, aprobador, alcance, supuestos, excepciones y confianza;
- referencia a la version sustituida cuando exista.

Una regla solo pasa `requireComputableRule` si esta `VERIFIED`, tiene aprobador y coincide con el
contexto completo solicitado. `DRAFT`, `STALE`, `DISPUTED`, `NOT_IMPLEMENTED` y
`REQUIRES_HUMAN_REVIEW` fallan cerrado.

## Cobertura real de esta entrega

| Pais | Perfil | Calculo tributario | Alcance real |
|---|---|---:|---|
| CL | `PARTIAL_VERIFIED` | Solo adaptador legacy 2026 | Conserva el motor existente sin reinterpretarlo. |
| PE | `DOCUMENTARY_ONLY` | Deshabilitado | Piloto de autoridades/RUC; no calcula tributos. |
| MX, CO, AR, BR, ES | `DOCUMENTARY_ONLY` | Deshabilitado | Directorio institucional inicial; no calcula tasas, plazos ni elegibilidad. |

La interfaz web aun no expone selectores. Los modulos ya viajan en el bundle comun que empaquetan
Web, Tauri y Capacitor para que la integracion posterior use una sola fuente.

## Compatibilidad y reversion

- El respaldo v4 agrega contexto jurisdiccional y ciclo de vida como extensiones; importa v1/v2/v3 y mantiene la separacion REAL/SANDBOX.
- No mueve ni reescribe `packages/chile-tax-rules`; CL se consume mediante adaptador.
- No modifica APIs de `accounting-engine` ni `company-operations`.
- Reversion: retirar las entradas nuevas de `scripts/build-web.mjs` y los directorios
  `packages/core`, `packages/i18n` y `packages/jurisdictions`. No existe migracion de datos que
  revertir.
