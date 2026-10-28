# Cruce de aceptación · Prompt Maestro V3

Fecha de cierre técnico: **2026-10-28**. Este documento relee el prompt completo y separa lo
implementado de lo que, por diseño jurídico, permanece sujeto a verificación humana. Un perfil
`DOCUMENTARY_ONLY` no significa soporte legal integral.

| Sección | Resultado ejecutable | Evidencia principal | Límite deliberado |
|---|---|---|---|
| A · auditoría previa | Cumplida | `MULTIJURISDICTION-GAP-ANALYSIS.md`, línea base y plan de PR | La evidencia histórica no se reescribe como estado actual. |
| B · ciclo de vida | Cumplida | `packages/core/lifecycle.mjs`, respaldo v4 y UI Continuidad | Suspensión, sucesión y concurso siempre requieren revisar la jurisdicción. |
| C · país ≠ idioma | Cumplida | contexto jurisdiccional, ocho locales, siete CountryPack y selector global | La UI completa sigue priorizando español; el catálogo estructurado ya permite ampliarla sin mezclar reglas. |
| C · contrato CountryPack | Cumplida | agencias, entidades, identificadores, formularios, procedimientos, evidencias, alertas, rutas, calendario, redondeo y capacidades | Catálogos documentales extranjeros no son exhaustivos. |
| D · normas versionadas | Cumplida | sobre regulatorio, vigencia, propuestas DRAFT, `supersedes`, diff, conflicto `DISPUTED` y explicación de cálculo | Ningún scraping o LLM puede activar una regla. |
| E · países iniciales | Cumplida en alcance documental | CL operativo; PE/MX/CO/AR/BR/ES con cálculos apagados | No se afirma equivalencia societaria ni cobertura legal total. |
| F · INAPI | Cumplida | checklist, dominio ≠ marca, renovación decenal sin inventar fecha | Fecha exacta exige título y portal INAPI. |
| F · costos/periodicidad | Cumplida | catálogo CL: pago único, mensual, condicional, semestral, anual y decenal; costo desconocido ≠ cero | Contratos privados y tasas variables exigen datos del usuario. |
| F · cero ingresos/inactividad | Cumplida | clasificación mensual, F29 por perfil, F22/DJ no inferidos, caja 6/12/24/36 y umbrales 6/36 | No diagnostica término de giro automático. |
| F · insolvencia | Cumplida | conceptos separados, seis rutas orientativas, alerta y expediente local | No decide elegibilidad, no firma y no presenta solicitudes. |
| F · administrador/sucesión | Cumplida en alcance informativo | checklist sin identidades públicas ni adjudicación de derechos | Herederos, legitimarios, acciones y poderes exigen abogado. |
| F · colaboradores/PI | Cumplida en alcance informativo | señales de subordinación, contrato de proyecto y advertencia de propiedad intelectual | No clasifica automáticamente una relación laboral. |
| F · gastos/garantías | Cumplida en alcance informativo | frontera personal/empresarial y exposición por garantía personal | Deducibilidad y responsabilidad final requieren profesional. |
| G · pedagogía/UX | Cumplida | barra de cinco pasos, niveles, estados semánticos, costos y recuperación; diseño responsive | No se promete rectificación universal. |
| H · escenarios | Cumplida por pruebas automatizadas y gates de plataforma | `tests/multijurisdiction-completion.test.mjs`, CI, APK y Tauri | Una prueba física en dispositivo real no se infiere del empaquetado. |
| I · fases y entrega | Cumplida | rama `codex/`, PR, pruebas, capturas, docs, reversión y evidencia de release | Revisión legal profesional futura renueva fuentes; no amplía cálculos extranjeros. |

## Criterios finales

- Chile conserva sus valores legacy mediante fixtures antes/después; no se cambiaron fórmulas por
  la expansión.
- País fiscal, constitución, residencia, operación, idioma, moneda y zona horaria son dimensiones
  separadas.
- Los países sin reglas aprobadas fallan cerrado y no reciben tasas o formularios chilenos.
- Las reglas calculables declaran fuente, jurisdicción, vigencia, versión y revisión; los costos
  desconocidos permanecen `null`/`NO_DETERMINADO`.
- Deuda, insolvencia, reorganización, liquidación, disolución y término tributario no se tratan como
  sinónimos.
- Respaldo v4 mantiene compatibilidad v1/v2/v3 y aislamiento REAL/SANDBOX.
- La documentación generada se valida desde sus fuentes; `docs/EMPEZAR-AQUI.md` no se editó a mano.

## Riesgo residual aceptado

Los perfiles PE/MX/CO/AR/BR/ES son deliberadamente documentales. Completar calendarios, obligaciones
y procedimientos esenciales exige investigación y aprobación profesional por país y subdivisión;
hasta entonces el motor devuelve `NOT_IMPLEMENTED`, `DOCUMENTARY_ONLY` o
`REQUIRES_HUMAN_REVIEW`. Ese límite es un criterio de seguridad cumplido, no una calculadora pendiente
que deba aproximarse.
