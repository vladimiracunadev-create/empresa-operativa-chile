# Auditoria multijurisdiccion — fase 0

Inspeccion realizada el **2026-10-27** sobre `main` en `a544a3b80e1461881d18d92a4f7553a0b8c53c5f`.
La matriz distingue comportamiento ejecutable de documentacion aspiracional. “Parcial” no
significa habilitado para cumplimiento real.

## Linea base observada antes de modificar

- Manifest: `empresa-operativa-chile` v1.5.0, ESM, Node >=20, pnpm declarado 11.2.2, cero
  dependencias de produccion. Entorno de auditoria: Node 24.11.1 y pnpm 11.25.0.
- Arquitectura: un bundle web comun alimenta PWA, Tauri y Capacitor; reglas CL embebidas sin
  `node:*`; almacenamiento local con espacios REAL/SANDBOX separados.
- `pnpm build`: verde; 51 archivos, 7.529 KB, build `de527c61f237` en la linea base.
- Primera ejecucion de `pnpm check`/`pnpm test`: 155/159 verdes y 4 `EPERM` en `rename` atomico
  porque el temporal de Windows quedo fuera del sandbox escribible. Repeticion con `TEMP` y `TMP`
  dentro del workspace: **159/159 verdes**. No se modifico codigo para obtener ese resultado.
- Empaquetado previo: no se afirmo APK/MSI ejecutado localmente en fase 0; los workflows existentes
  separan CI, Android, desktop, Pages, release y seguridad.

## Matriz requisito/evidencia

| Requisito | Evidencia ruta/linea | Implementado | Parcial | Ausente | Prioridad | Autoridad | Fecha | Riesgo | Prueba |
|---|---|:---:|:---:|:---:|:---:|---|---|---|---|
| Motor CL 2026 falla cerrado por ano | `packages/chile-tax-rules/index.mjs:23` | Si |  |  | P0 | SII/BCN segun regla | 2026-10-27 | Una regla legacy no posee aun todo el sobre normativo nuevo. | `tests/rules.test.mjs`; `tests/jurisdictions.test.mjs:13` |
| REAL y SANDBOX separados | `packages/company-operations/workspace.mjs:131-138` | Si |  |  | P0 | Diseno interno | 2026-10-27 | Un cambio de persistencia podria romper aislamiento. | `tests/workspace.test.mjs:97` |
| Compatibilidad de respaldos v1-v4 | `packages/company-operations/workspace.mjs` | Si |  |  | P0 | Diseno interno | 2026-10-27 | Campos v4 son extensiones opcionales. | Migracion v1/v2/v3 y aislamiento REAL/SANDBOX |
| CountryPack validado | `packages/core/country-pack.mjs:54-113` | Si |  |  | P0 | Contrato interno | 2026-10-27 | Catalogos legales siguen incompletos por pais. | `tests/jurisdictions.test.mjs:8-11` |
| Registro CL/PE/MX/CO/AR/BR/ES | `packages/jurisdictions/registry.mjs:8-23` | Si |  |  | P0 | Sitios institucionales citados en cada pack | 2026-10-27 | Presencia de perfil puede confundirse con soporte legal completo. | Lista exacta de 7 packs |
| Adaptador CL sin mover formulas | `packages/jurisdictions/cl/index.mjs:5-41` | Si |  |  | P0 | SII/RES/INAPI/SUPERIR | 2026-10-27 | Solo 2026; no normaliza cada regla legacy. | CL 2026 carga; 2025 falla |
| PE piloto documental | `packages/jurisdictions/pe/index.mjs:3-17` |  | Si |  | P1 | SUNAT/SUNARP/INDECOPI | 2026-10-27 | Insolvencia y catalogos de entidad sin revisar. | PE no contiene F29 ni calcula |
| MX/CO perfiles documentales | `packages/jurisdictions/mx/index.mjs:3-13`; `co/index.mjs:3-13` |  | Si |  | P2 | SAT/SE/IMPI; DIAN/SIC | 2026-10-27 | Registro/insolvencia dependen de competencia no resuelta. | Calculos deshabilitados |
| AR no generaliza IGJ | `packages/jurisdictions/ar/index.mjs:5-13` | Si |  |  | P1 | IGJ/ARCA/INPI | 2026-10-27 | Falta resolver registro por provincia. | Scope limita IGJ a CABA |
| BR modela estado/municipio | `packages/jurisdictions/br/index.mjs:5-13` |  | Si |  | P1 | REDESIM/Receita/INPI | 2026-10-27 | Sin reglas estaduales/municipales verificadas. | Exige ambas subdivisiones |
| ES Modelo 036 documental | `packages/jurisdictions/es/index.mjs:3-15` |  | Si |  | P2 | AEAT/OEPM/CIRCE | 2026-10-27 | No hay calendario ni reglas tributarias. | ES falla cerrado |
| I18N separado del pais | `packages/i18n/locales/index.mjs:1-35`; `registry.mjs:26-36` | Si |  |  | P0 | BCP 47 / Intl | 2026-10-27 | Catalogo inicial pequeno y aun sin UI. | CL+en; MX+pt-BR |
| Ocho locales iniciales | `packages/i18n/locales/index.mjs:1` |  | Si |  | P1 | BCP 47 / Intl | 2026-10-27 | Faltan plurales, errores y glosario juridico completo. | Formato de moneda/fecha en 8 locales |
| Regla versionada con trazabilidad | `packages/core/regulatory-rules.mjs`; `packages/jurisdictions/cl/rule-envelope.mjs` | Si |  |  | P0 | Fuente propia de cada regla | 2026-10-27 | Revision humana debe renovarse al cambiar vigencia. | Fixtures legacy/sobre identicos |
| Feriados por jurisdiccion | `packages/accounting-engine/index.mjs:139-166` |  | Si |  | P0 | Calendario oficial por pais | 2026-10-27 | CL solo desplaza fin de semana y avisa revisar feriados. | `tests/f29.test.mjs:40-58` |
| Grafo de ciclo de vida no lineal | `packages/core/lifecycle.mjs` | Si |  |  | P1 | Revision legal por estado | 2026-10-27 | Disponibilidad juridica especifica siempre requiere verificacion. | Transiciones autorizadas y evidencia obligatoria |
| Estados insolvencia/reorganizacion/disolucion/termino | `packages/jurisdictions/cl/insolvency.mjs` | Si |  |  | P0 | SUPERIR/ley/tribunales/SII | 2026-10-27 | No determina elegibilidad ni presenta solicitudes. | Conceptos distintos; fail-closed |
| Flujo caja 6/12/24/36 | `packages/jurisdictions/cl/operations.mjs` | Si |  |  | P1 | Supuestos financieros, no minimo legal | 2026-10-27 | Depende de supuestos del usuario. | Cuatro horizontes exactos |
| Empresa sin ingresos/clientes | `packages/jurisdictions/cl/operations.mjs` | Si |  |  | P0 | SII segun perfil | 2026-10-27 | F22/DJ continuan sujetos al perfil. | Cero ventas con compras no es sin movimiento |
| Marca/nombre/dominio CL | `packages/jurisdictions/cl/trademarks.mjs` | Si |  |  | P1 | INAPI/NIC Chile | 2026-10-27 | Fecha exacta requiere titulo verificado. | Dominio no protege marca; renovacion no inventada |
| Expediente concursal CL | `packages/jurisdictions/cl/insolvency.mjs`; respaldo v4 | Si |  |  | P0 | SUPERIR/tribunales/profesional | 2026-10-27 | Datos permanecen locales; exige profesional. | Sin envio, firma ni elegibilidad automatica |
| Selector global accesible | `apps/web/src/views/contexto.js`; barra global en `app.js` | Si |  |  | P1 | WCAG/Intl + packs | 2026-10-27 | Prueba fisica Android pendiente de workflow/artefacto. | Pais/idioma/moneda/zona separados |
| Bundle comun incluye nueva base | `scripts/build-web.mjs:24-41` | Si |  |  | P0 | Diseno interno | 2026-10-27 | Un import `node:*` romperia WebView. | `pnpm build` + test webapp |
| Fuente unica de “Empezar aqui” | `packages/onboarding/index.mjs:42`; generador existente | Si |  |  | P0 | Diseno interno | 2026-10-27 | Editar Markdown generado manualmente crearia drift. | `pnpm check` compara generado |
| Automatizar presentacion/pago/firma | Prohibido por diseno y avisos existentes | Si |  |  | P0 | Portales oficiales/profesionales | 2026-10-27 | Exceso de autoridad del software. | Tests de avisos y ausencia de integracion |

## Conclusiones de fase 0

La base chilena es funcional y probada, pero no existe aun un modelo legal multijurisdiccional
persistido ni una UI para seleccionarlo. Esta entrega crea el limite tecnico que impide reutilizar
tasas chilenas por cambio de etiqueta. No declara “soportado” ningun pais documental y no cambia
ninguna formula CL.

Las siguientes brechas P0 son: envolver reglas CL sin alterar resultados, clasificar meses sin
actividad/sin movimiento con evidencia, modelar conceptos concursales separados y mantener
compatibilidad de respaldos cuando el contexto jurisdiccional se persista.

## Evidencia posterior a la fase 1 base

- `pnpm check`: **173/173 pruebas**, generados sincronizados y reglas 2026 validadas.
- `pnpm build`: verde; 63 archivos, 7.553 KB, build reproducible local
  `67094cab2864`.
- `pnpm android:prepare`: verde; 64 archivos, 15 vistas y 26 modulos del nucleo copiados al
  proyecto Capacitor.
- `pnpm desktop:build`: no ejecutable en esta maquina porque `cargo` no esta instalado. Tauri
  termino antes de compilar al fallar `cargo metadata`; no se afirma un instalador Windows local.
- Migracion de datos: ninguna. Reglas y formulas CL: sin cambios.

## Cierre técnico del Prompt Maestro V3 · 2026-10-28

La revisión literal final se documenta en `docs/audits/MASTER-PROMPT-V3-CROSSWALK.md`. Después de
releer el prompt completo se cerraron las brechas restantes de contrato CountryPack, matriz de
obligaciones/costos, vigencia y conflicto normativo, plurales/glosario i18n, continuidad de
administrador, colaboradores, gastos y garantías personales.

- `pnpm check`: **201/201 pruebas**, generados sincronizados y reglas 2026 validadas.
- `pnpm build`: 75 archivos; el navegador recibe 36 módulos del núcleo mediante el bundle común.
- `pnpm android:prepare`: 76 archivos, 17 vistas y 36 módulos del núcleo.
- Migración: respaldo v4; importación v1/v2/v3 y fixture de producto v1.5 sin pérdida de operaciones,
  cierres, comprobantes, auditoría ni aislamiento REAL/SANDBOX.
- Países extranjeros: siguen `DOCUMENTARY_ONLY`, con cálculos apagados. No se declara cobertura total.
- Fórmulas CL legacy: sin cambios; los sobres de metadatos se comparan con los valores originales.
