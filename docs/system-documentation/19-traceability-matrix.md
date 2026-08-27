# 19 · Matriz de trazabilidad

[⬅ Anterior: Guía del nuevo desarrollador](18-new-developer-guide.md) · [Índice](README.md)

---

Una fila por funcionalidad, para seguirla **desde la pantalla hasta donde se guarda y hasta la prueba
que la protege**. Es la respuesta a «si cambio esto, ¿qué se rompe?» y a «esta regla, ¿está
realmente implementada?».

**Cómo leer el estado de validación:**

| Estado | Significado |
| --- | --- |
| ✅ **Verificado** | Se leyó el código **y** existe una prueba que lo fija |
| ☑️ **Verificado sin prueba** | Se leyó el código y hace lo que dice; ninguna prueba lo protege |
| ⚙️ **Verificado en CI** | No hay prueba unitaria, pero un paso de CI lo comprueba de punta a punta |
| ⚠️ **Requiere validación** | Depende de una ejecución que no se pudo hacer en esta revisión |

Las columnas de persistencia usan las claves reales del almacén, documentadas en
[07](07-database.md).

---

## 1 · Constitución de la empresa

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ver los trámites | 9 pasos con su organismo y su evidencia esperada | Vista `constitucion` | `company-operations` | `listFormationSteps()` · `FORMATION_STEPS` | `formation` + catálogo en código | `company-operations.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |
| Marcar un trámite hecho | **`done` exige `evidenceRef` no vacío** | Vista `constitucion` | `company-operations` | `updateFormationStep()` | `formation` | `workspace.test.mjs` · «un paso de constitución no puede darse por hecho sin evidencia» | [07](07-database.md) | ✅ |
| Los trámites nuevos aparecen | El catálogo vive en el código, no en los datos | Vista `constitucion` | `company-operations` | `listFormationSteps()` | Fusión en lectura | `workspace.test.mjs` · «el catálogo de pasos se amplía sin perder lo ya registrado» | [07](07-database.md) | ✅ |
| Progreso de habilitación | Porcentaje contado **sobre evidencia real** | Vista `panel` | `company-operations` | `formationProgress()` | Derivado | Indirecta | [05](05-technical-reference.md) | ☑️ |
| La ruta completa | 14 etapas en 5 fases | Vista `empezar` | `onboarding` | `PHASES`, `STAGES` | Ninguna (contenido) | `onboarding.test.mjs` (17) | [04](04-code-map.md) | ✅ |

## 2 · Ficha de la empresa y RUT

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Guardar la ficha | `mode` se reescribe siempre; `createdAt` sólo la primera vez | Vista `empresa` | `company-operations` | `saveCompany()` | `company` | Indirecta | [07](07-database.md) | ☑️ |
| Validar RUT | Dígito verificador chileno | Vista `empresa`, CLI `rut` | `company-operations` | `validateRut()` | — | `rut.test.mjs` (6) | [05](05-technical-reference.md) | ✅ |
| Régimen tributario | Decide si se admite el CPT simplificado | Vista `empresa` | `accounting-engine` | `allowsSimplifiedTaxEquity()` | `company.taxRegime` | `tax-equity.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |

## 3 · Capital y patrimonio

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Las seis magnitudes | Social, suscrito, enterado, patrimonio, CPT y base de patente **son distintos** | Vista `capital` | `company-operations` | `normalizeCapitalProfile()` | `company.capitalProfile` | `capital.test.mjs` (19) | [07](07-database.md) | ✅ |
| Capital por enterar | **Devuelve `null`, no `0`,** cuando el suscrito es desconocido | Vista `capital` | `company-operations` | `capitalPendingToPay()` | Derivado | `capital.test.mjs` | [07](07-database.md) | ✅ |
| Migrar el campo antiguo | El valor pasa a `capitalEnterado`; social y suscrito quedan `PENDING_CONFIRMATION`. **No se inventan** | Vista `capital` | `company-operations` | `normalizeCapitalProfile()` | En lectura, sin escribir | `capital.test.mjs` | [07](07-database.md) | ✅ |
| Registrar un movimiento | Fecha obligatoria, monto > 0, aporte en bienes exige bien y aportante | Vista `capital` | `company-operations` | `normalizeEquityMovement()` | `equity-movements` | `capital.test.mjs` | [07](07-database.md) | ✅ |
| Aporte ≠ préstamo | Entran por el mismo banco y son **opuestos** en patrimonio y pasivo | Vista `capital` | `company-operations` | `EQUITY_MOVEMENT_KINDS` | `equity-movements` | `capital.test.mjs` | [16](16-glossary.md) | ✅ |
| No contar dos veces | El enlace `equityMovementId` evita duplicar el capital enterado | Vista `capital` | `company-operations` | `effectiveEquityMovements()` | `transactions.equityMovementId` | `capital.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |
| Posición de capital | El mayor entre lo declarado y lo derivado de movimientos | Vista `capital` | `company-operations` | `capitalPosition()` | Derivado | `capital.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |

## 4 · Operaciones

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Registrar | Tres puertas: tipo válido, fecha `YYYY-MM-DD`, **período no cerrado** | Vista `operaciones`, CLI `registrar` | `company-operations` | `addTransaction()` | `transactions` | `workspace.test.mjs`, «los tipos de operación no soportados se rechazan» | [06](06-deep-code-explanation.md) | ✅ |
| Nueve tipos | Cada uno con su `flow` y su efecto sobre el IVA | Vista `operaciones` | `company-operations` | `TRANSACTION_KINDS` | `transactions.kind` | `company-operations.test.mjs` | [07](07-database.md) | ✅ |
| Deducible y con derecho a crédito | **Por defecto `true`**: sólo un `false` explícito los desactiva | Vista `operaciones` | `company-operations` | `addTransaction()` | `transactions` | `workspace.test.mjs` · «el sandbox sembrado deja un remanente visible y un IVA no recuperable» | [07](07-database.md) | ✅ |
| Editar y borrar | **No se puede** en un período cerrado, ni mover una operación a uno cerrado | Vista `operaciones` | `company-operations` | `updateTransaction()`, `deleteTransaction()` | `transactions` | `workspace.test.mjs` · «un período cerrado es inmutable en las dos direcciones» | [07](07-database.md) | ✅ |
| Resumen del mes | 18 cifras derivadas, **nunca guardadas** | Vista `cierre`, CLI `resumen` | `company-operations` | `periodSummary()` | Derivado de `transactions` | `f29.test.mjs`, `workspace.test.mjs` | [08](08-data-flow.md) | ✅ |

## 5 · IVA, F29 y otros cálculos

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Venta / compra desde el neto | IVA 19 % del año | Vista `operaciones`, CLI `venta`/`compra` | `accounting-engine` | `saleFromNet()`, `purchaseFromNet()` | — | `accounting.test.mjs` | [05](05-technical-reference.md) | ✅ + ⚙️ |
| Honorario | Retención 15,25 % (Ley 21.133) | CLI `honorario` | `accounting-engine` | `honorariumFromGross()` | — | `accounting.test.mjs` | [05](05-technical-reference.md) | ✅ |
| **Borrador F29** | Débito − crédito − remanente | Vista `impuestos`, CLI `f29` | `accounting-engine` | `f29Basic()` 🟥 | Derivado | `f29.test.mjs` (8) | [06](06-deep-code-explanation.md) | ✅ + ⚙️ |
| **Remanente arrastrado** | El crédito que sobra un mes está disponible al siguiente | Vista `impuestos` | `company-operations` | `vatCarryForwardInto()` | Derivado de la historia completa | `workspace.test.mjs` · «el remanente de crédito fiscal viaja entre períodos» | [06](06-deep-code-explanation.md) | ✅ |
| **Sin reajuste del remanente** | Limitación declarada (art. 27, D.L. 825) | — | `company-operations` | `vatCarryForwardInto()` | — | — | [14](14-troubleshooting.md) · R-7 | ☑️ declarada |
| Vencimientos del F29 | Días 12, 20 y 28, con traslado por día inhábil | Vista `impuestos`, CLI `vencimientos` | `accounting-engine` | `f29DueDates()` | `rules.f29` | `f29.test.mjs` | [05](05-technical-reference.md) | ✅ + ⚙️ |
| PPM Pro Pyme | Tasas por tramo de UF | Vista `impuestos` | `accounting-engine` | `ppmFromSalesNet()` | `rules.ppmProPyme` | `accounting.test.mjs` | [05](05-technical-reference.md) | ✅ |
| IDPC Pro Pyme | Tasa 12,5 % | CLI `idpc` | `accounting-engine` | `idpcProPyme()` | `rules.idpcProPyme` | `accounting.test.mjs` | [05](05-technical-reference.md) | ✅ |
| Asiento contable | Un asiento por tipo de operación | CLI `asiento` | `accounting-engine` | `journal()` 🟧 | — | `accounting.test.mjs` | [05](05-technical-reference.md) | ✅ |

## 6 · Capital propio tributario

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elegir el método | Art. 41 N.º 1, o simplificado del art. 14 D) N.º 3 (j) según régimen | Vista `capital` | `accounting-engine` | `calculateTaxEquity()` 🟥 | `rules.taxEquity` | `tax-equity.test.mjs` (17) | [06](06-deep-code-explanation.md) | ✅ |
| Elegibilidad del simplificado | **Sólo Pro Pyme General (14 D N.º 3)** | Vista `capital` | `accounting-engine` | `allowsSimplifiedTaxEquity()` 🟥 | `rules.taxEquity.eligibility` | `tax-equity.test.mjs` | [05](05-technical-reference.md) | ✅ |
| **Piso en cero** | Si el simplificado da negativo, el CPT es $0 | Vista `capital`, CLI `cpt` | `accounting-engine` | `simplified()` | `rules` · `floorZero: true` | `tax-equity.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |
| El CPT es una estimación | El que rige es el declarado en el F22 y aceptado por el SII | Vista `capital` | — | Advertencia en `rules` | `rules.taxEquity.warnings` | — | [01](01-system-overview.md) | ☑️ declarada |

## 7 · Patente municipal

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Base según etapa | Negocio nuevo → capital propio inicial. En funcionamiento → capital del balance al 31-12 anterior (art. 24, D.L. 3.063) | Vista `capital`, CLI `patente-municipal` | `accounting-engine` | `calculateMunicipalPatent()` 🟥 | `rules.municipalPatent.capitalBasis` | `municipal-patent.test.mjs` (23) | [06](06-deep-code-explanation.md) | ✅ |
| Rango legal, no tasa | 0,25 %–0,5 %. **La tasa de la comuna NO está en el repositorio** | Vista `capital` | `chile-tax-rules` | `resolveRate()` 🟧 | `municipal-profile.rate` | `municipal-patent.test.mjs` | [07](07-database.md) | ✅ |
| Tope y piso en UTM | Entre 1 y 8.000 UTM | Vista `capital` | `accounting-engine` | `calculateMunicipalPatent()` | `rules.municipalPatent` | `municipal-patent.test.mjs` | [05](05-technical-reference.md) | ✅ |
| Deducciones | Inversiones en otros negocios con patente, con certificado municipal | Vista `capital` | `accounting-engine` | `calculateMunicipalPatent()` | `municipal-profile.deductibleInvestments` | `municipal-patent.test.mjs` | [07](07-database.md) | ✅ |
| Prorrateo entre sucursales | Por número de trabajadores (art. 25) | Vista `capital` | `accounting-engine` | `calculateMunicipalPatent()` | `municipal-profile.allocatedCapital` | `municipal-patent.test.mjs` | [07](07-database.md) | ✅ |
| UTM del mes | **Cambia todos los meses**; hoy sólo hay `2026-08` | Vista `capital` | `chile-tax-rules` | `resolveUtm()` 🟧 | `rules.utm` | `municipal-patent.test.mjs` | [07](07-database.md) | ✅ |
| Catálogo de comunas | 14 comunas con su sitio oficial para verificar la tasa | Vista `capital` | `chile-tax-rules` | `normalizeMunicipality()` | `municipal-profile.commune` | Indirecta | [09](09-apis-and-integrations.md) | ☑️ |

## 8 · Obligaciones y cierres

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Registrar obligación | `type` obligatorio | Vista `obligaciones`, CLI `obligaciones` | `company-operations` | `upsertObligation()` | `obligations` | `workspace.test.mjs` | [07](07-database.md) | ✅ |
| Cumplida exige comprobante | No se marca `done` sin evidencia | Vista `obligaciones` | `company-operations` | `upsertObligation()` | `obligations` | `workspace.test.mjs` · «una obligación no puede marcarse cumplida sin comprobante» | [07](07-database.md) | ✅ |
| **Cierre mensual** | Congela el resumen y el remanente entrante | Vista `cierre`, CLI `cerrar` | `company-operations` | `closePeriod()` | `period-closes` + `closed-periods` | `workspace.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |
| **Reabrir exige motivo** | Trazabilidad por encima de inmutabilidad absoluta | Vista `cierre` | `company-operations` | `reopenPeriod()` | `closed-periods` + `audit` | `workspace.test.mjs` · «reabrir un período exige motivo y queda en la bitácora» | [06](06-deep-code-explanation.md) | ✅ |
| **Cierre anual** | Congelado con `Object.freeze`. **No se cierra dos veces** | Vista `capital` | `company-operations` | `closeFiscalYear()` | `annual-closes` | `capital.test.mjs` | [07](07-database.md) | ✅ |
| **Huella de las reglas** | El cierre guarda con qué normas se calculó, no una referencia al archivo | Vista `capital` | `company-operations` | `loadRulesVersion()` | `annual-closes.legalRulesVersion` | `capital.test.mjs` | [07](07-database.md) | ✅ |
| **Base de patente del año siguiente** | El puente entre un ejercicio y el siguiente | Vista `capital` | `company-operations` | `closeFiscalYear()` | `annual-closes.municipalPatentBaseForNextPeriod` | `capital.test.mjs` | [06](06-deep-code-explanation.md) | ✅ |
| Historial por año | **Nunca se recalcula un ejercicio cerrado** | Vista `capital` | `company-operations` | `capitalHistory()` | `annual-closes` | Parcial | [06](06-deep-code-explanation.md) | ☑️ |

## 9 · Auditoría, respaldo y salud

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Bitácora append-only** | Toda mutación queda. **No existe operación de borrado** | Vista `auditoria`, CLI `bitacora` | `company-operations` | `audit()`, `listAudit()` | `audit` (NDJSON en disco) | `workspace.test.mjs` · «toda mutación queda en la bitácora append-only» | [07](07-database.md) | ✅ |
| Exportar | Formato portátil `v2`, compatible entre las 4 superficies | Vista `datos`, CLI `exportar` | `company-operations` | `exportAll()` | Todas las claves | `workspace.test.mjs` · «exportar e importar reproduce el espacio de trabajo completo» | [09](09-apis-and-integrations.md) | ✅ |
| Importar | Rechaza archivos ajenos; acepta v1 y v2; **no pisa ejercicios cerrados** | Vista `datos` | `company-operations` | `importAll()` | Todas las claves | `workspace.test.mjs` · «importar un archivo ajeno se rechaza» | [07](07-database.md) | ✅ |
| Respaldo con nombre | Marca de tiempo ISO saneada | Vista `datos` | `company-operations` | `backup()` | `__snapshots` / `backups/` | Indirecta | [13](13-deployment-and-operations.md) | ☑️ |
| **Semáforo** | **No dice «todo en orden»** si faltan evidencias | Vista `panel` | `company-operations` | `healthCheck()` | Derivado | `workspace.test.mjs` · «el diagnóstico marca error cuando hay obligaciones vencidas» | [08](08-data-flow.md) | ✅ |

## 10 · Aislamiento real / sandbox

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Dos espacios separados** | **Ninguna ruta de código copia una operación de uno al otro** | Selector de modo | `company-operations` | `createWebStore({ namespace })` | Prefijo `…:real:` / `…:sandbox:` | `workspace.test.mjs` · «el almacén web aísla real de sandbox en el mismo origen» | [07](07-database.md) | ✅ |
| Sembrar el sandbox | **Prohibido sobre una empresa real**; idempotente si ya tiene datos | Automático | `company-operations` | `seedSandboxWorkspace()` | Todas las claves del modo sandbox | `workspace.test.mjs` · «sembrar el sandbox sobre una empresa real está prohibido» | [07](07-database.md) | ✅ |
| Modo por URL | `?modo=sandbox` — hace reproducibles las capturas | URL | `apps/web` | `applyUrlState()` | — | — | [10](10-configuration.md) | ☑️ |

## 11 · Reglas tributarias

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Un año sin reglas lanza** | **Nunca degrada al año anterior** | Todas | `chile-tax-rules` | `loadRules()` 🟥 | `rules/<año>.json` | `rules.test.mjs` | [07](07-database.md) | ✅ |
| Años disponibles | Devuelve una **copia** del arreglo | Vista `empresa`, CLI `reglas` | `chile-tax-rules` | `availableYears()` | — | `rules.test.mjs` | [05](05-technical-reference.md) | ✅ |
| Procedencia de una tasa | Fuente oficial + fecha de verificación | Vista `academia` | `chile-tax-rules` | `ruleProvenance()` | `rules.<bloque>.source` | `rules.test.mjs` | [08](08-data-flow.md) | ✅ |
| JSON y generado sincronizados | Editar uno sin el otro **falla el build** | — | `scripts` | `build-rules.mjs --check` | — | Paso de `ci.yml` | [08](08-data-flow.md) | ⚙️ |
| Las tasas son razonables | Atrapa el error de dedo | — | `scripts` | `validate-rules.mjs` | — | Paso de `ci.yml` | [12](12-testing-and-quality.md) | ⚙️ |

## 12 · Plataformas y persistencia física

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Detectar plataforma | Tauri → Windows; Capacitor → Android; si no, navegador | — | `apps/web/lib` | `PLATFORM` | — | — | [05](05-technical-reference.md) | ☑️ |
| Espejo en disco | «Best effort» con retardo de 180 ms; **si falla, la app sigue** | Automático | `apps/web/lib` + Rust | `createPlatformStore()` → `save_workspace` | `<app_data_dir>/<mode>.json` | `lib.rs` (parcial) | [07](07-database.md) | ⚠️ |
| **Escritura atómica** | Temporal + `rename`. Un corte deja intacto el archivo anterior | — | Rust · `node-store` | `save_workspace`, `writeJsonAtomic` | — | — | [09](09-apis-and-integrations.md) | ⚠️ |
| Hidratar al arrancar | **El disco sólo repone lo que falta**: gana el dato vivo | Automático | `apps/web/lib` | `hydrateFromDisk()` | `localStorage` | — | [06](06-deep-code-explanation.md) | ⚠️ H-06 |
| `mode` no puede ser una ruta | Sin la validación sería escritura arbitraria | — | Rust | `safe_mode()` 🟧 | — | `lib.rs` · `un_modo_con_ruta_se_rechaza` | [11](11-security.md) | ⚠️ no ejecutada |
| Exportar archivo | Nombre saneado; carpeta fija y predecible | Vista `datos` | Rust | `export_file` | `Documentos/Empresa Operativa Chile` | **Ninguna** · H-09 | [09](09-apis-and-integrations.md) | ⚠️ |
| Ubicación de los datos | La app dice dónde están sus archivos | Vista `datos` | Rust | `app_info` | — | — | [09](09-apis-and-integrations.md) | ⚠️ |

## 13 · Interfaz, contenido y seguridad de presentación

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Escapado por defecto** | Toda interpolación se escapa salvo `raw()` explícito | Todas | `apps/web/lib` | `html`, `esc` | — | **Ninguna** · H-08 | [11](11-security.md) | ☑️ |
| Glosario | 54 términos, fuente única | Vista `glosario` | `glossary` | `termsByCategory()`, `searchTerms()` | — | `glossary.test.mjs` (11) | [16](16-glossary.md) | ✅ |
| Ayuda contextual | Definición al pasar el cursor | Todas | `apps/web/lib` | `terms.js` | — | `ayuda.test.mjs` (16) | [04](04-code-map.md) | ✅ |
| Atajos de teclado | 12, con buscador y ayuda | Todas | `shortcuts` | `resolveShortcut()` | — | `ayuda.test.mjs` | [05](05-technical-reference.md) | ✅ |
| Contrato de la web | El índice referencia lo que el build produce | — | `apps/web` | `index.html`, manifiesto | — | `webapp.test.mjs` (8) | [12](12-testing-and-quality.md) | ✅ |
| Mismo `appId` | Android y Windows comparten identificador | — | Configuración | — | — | `webapp.test.mjs` | [10](10-configuration.md) | ✅ |
| Funciona sin conexión | Cachea **sólo** los archivos de la app | — | `apps/web` | `sw.js` | Cache API | — | [09](09-apis-and-integrations.md) | ☑️ |

## 14 · Servidor local

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Servir la app | Sólo `GET`/`HEAD`; el resto → 405 | `http://127.0.0.1:4180` | `empresa-operativa` | `server.mjs` | — | Trabajo `servidor` de `ci.yml` | [09](09-apis-and-integrations.md) | ⚙️ |
| **No escapar de `dist/`** | Comparación **con separador** | — | `empresa-operativa` | `resolveSafe()` 🟥 | — | `ci.yml`, 3 vectores | [11](11-security.md) | ⚙️ |
| Sólo loopback | `127.0.0.1`, **nunca `0.0.0.0`** | — | `empresa-operativa` | `server.mjs` | — | — | [10](10-configuration.md) | ☑️ |
| Cabeceras de seguridad | CSP, `nosniff`, `no-referrer` | — | `empresa-operativa` | `server.mjs` | — | — | [11](11-security.md) | ☑️ |

## 15 · Integridad del artefacto

| Funcionalidad | Regla de negocio | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Nada con `node:*` viaja** | El build **aborta** | — | `scripts` | `build-web.mjs` | — | Gate del build | [03](03-architecture.md) | ⚙️ |
| **El APK lleva la app dentro** | 12 comprobaciones abriendo el ZIP | — | `scripts` | `verify-apk.mjs` | — | Paso de `android.yml` | [13](13-deployment-and-operations.md) | ⚠️ sin APK que probar |
| La interfaz está completa | Se cuenta **antes** de sellarla en el binario | — | CI | `desktop.yml` | — | Paso del workflow | [13](13-deployment-and-operations.md) | ⚠️ |
| El ejecutable arranca | Vive más de 12 segundos | — | CI | `desktop.yml` | — | Paso del workflow | [13](13-deployment-and-operations.md) | ⚠️ |
| **Build reproducible** | Dos builds seguidos deben coincidir | — | CI | `ci.yml` | `build-info.json` | Paso del workflow | [12](12-testing-and-quality.md) | ⚙️ **reproducido en esta revisión** |
| Cero dependencias | Es un gate, no un aviso | — | CI | `security.yml` | `package.json` | Paso del workflow | [11](11-security.md) | ⚙️ |
| Sin datos reales | El riesgo nº 1 del modelo de amenazas | — | CI | `security.yml` | — | Paso del workflow | [11](11-security.md) | ⚙️ **comprobado en esta revisión** |
| Acciones fijadas a SHA | Una etiqueta móvil puede cambiar bajo los pies | — | CI | `ci.yml` | — | Paso del workflow | [12](12-testing-and-quality.md) | ⚙️ |
| Documentación sincronizada | 5 gates `--check` | — | `scripts` | `build-*.mjs --check` | — | Pasos de `ci.yml` | [12](12-testing-and-quality.md) | ⚙️ **ejecutados en esta revisión** |

---

## Cobertura de la matriz

**88 filas de funcionalidad**, con 91 marcas de estado: tres filas llevan dos, porque además de su
prueba las cubre un paso de CI.

| Estado | Marcas | Lectura |
| --- | --- | --- |
| ✅ Verificado con prueba | **56** | La lógica de negocio y de cálculo está protegida |
| ⚙️ Verificado en CI | **13** | Integridad del artefacto, reglas y servidor |
| ☑️ Verificado sin prueba | **13** | Presentación, plataforma y utilidades |
| ⚠️ Requiere validación | **9** | Todo lo que exige compilar, empaquetar o ejecutar en un dispositivo |

Cifras contadas sobre este mismo archivo, no estimadas.

**Dónde se concentran los ⚠️:** en el backend de escritorio y en el empaquetado — exactamente lo que
no se pudo ejecutar en la máquina de análisis por falta de Rust, JDK y SDK de Android. No es un vacío
de pruebas: es un límite de esta revisión, y los workflows que lo cubren existen.

**Dónde se concentran los ☑️:** en la interfaz. Coincide con [H-07](15-risks-and-technical-debt.md) y
[H-08](15-risks-and-technical-debt.md), y confirma desde otro ángulo que ahí está el hueco de
cobertura.

---

## Cómo usar esta matriz

| Pregunta | Cómo responderla |
| --- | --- |
| «Voy a cambiar X, ¿qué se rompe?» | Busca la función en la columna **Función**; su fila da la vista, el almacenamiento y la prueba |
| «¿Esta regla está implementada?» | Búscala en **Regla de negocio**; si tiene ✅, hay una prueba que la fija |
| «¿Qué protege esta prueba?» | Busca el nombre en **Prueba** |
| «¿Dónde acaba este dato?» | Columna **Persistencia**, y después [07](07-database.md) |
| «¿Qué no está probado?» | Filtra por ☑️ y ⚠️ |
| «¿Dónde se explica esto?» | Columna **Documento** |

---

[⬅ Anterior: Guía del nuevo desarrollador](18-new-developer-guide.md) · [Índice](README.md)
