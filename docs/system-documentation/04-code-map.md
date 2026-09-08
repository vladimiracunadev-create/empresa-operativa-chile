# 04 · Mapa del código

[⬅ Anterior: Arquitectura](03-architecture.md) · [Índice](README.md) · [Siguiente: Referencia técnica ➡](05-technical-reference.md)

---

Inventario jerárquico de los **330 archivos versionados** tras incorporar la capa v1.5. Cada elemento lleva su ubicación,
responsabilidad, dependencias, quién lo usa y su **estado aparente**.

**Estados usados en este documento:**

| Estado | Significado |
| --- | --- |
| **Activo** | En uso, con consumidores identificados |
| **Generado** | Producido por un script; no se edita a mano |
| **Legado** | Se conserva por compatibilidad; hay un camino nuevo preferido |
| **Duplicado** | Existe otra copia del mismo conocimiento |
| **Experimental** | Presente pero sin consumidores en producción |
| **No determinado** | No se pudo establecer con evidencia |

Ningún elemento del repositorio quedó marcado **Experimental**; los dos **Legado** y los dos
**Duplicado** se justifican en su fila y se recogen en
[15 · Riesgos](15-risks-and-technical-debt.md).

---

## Árbol general

```text
empresa-operativa-chile/
├── packages/                6 paquetes · el núcleo · ESM puro sin node:* (salvo node-store)
├── apps/                    5 aplicaciones · web, android, contador-desktop, empresa-operativa, contador-cli
├── scripts/                 13 scripts + 4 librerías · build, generación de docs y verificación
├── tests/                   13 suites · 158 pruebas
├── docs/                    23 documentos Markdown + assets + presentación + esta serie
├── curriculum/ labs/ cases/ material de aprendizaje: 16 partes, 16 laboratorios, 2 casos
├── data/scenarios/          1 escenario JSON para la CLI
├── .github/                 6 workflows + 3 plantillas de issue + plantilla de PR
└── raíz                     package.json, .gitignore, .gitattributes, CHANGELOG, CONTRIBUTING,
                             SECURITY, CODE_OF_CONDUCT, LICENSE, README
```

---

## 1 · `packages/` — el núcleo

### 1.1 `packages/chile-tax-rules/` — reglas versionadas por año comercial

| Elemento | Líneas | Responsabilidad | Depende de | Quién lo usa | Estado |
| --- | ---: | --- | --- | --- | --- |
| `rules/2026.json` | 138 | **Fuente de verdad de todas las tasas.** IVA, honorarios, PPM, IDPC, UTM, patente municipal (rango, base, deducciones, prorrateo), CPT (dos métodos) y F29. Cada regla con `source`, `lastVerified` y `note` | — | `build-rules.mjs`, `validate-rules.mjs`, `tests/rules.test.mjs` | Activo |
| `rules.generated.mjs` | 150 | El mismo contenido embebido como ESM, para que el navegador lo lea sin `node:fs` | `rules/*.json` | `index.mjs` | **Generado** (versionado; `linguist-generated=true`) |
| `index.mjs` | 47 | `loadRules(year)`, `availableYears()`, `ruleProvenance(year, rule)`. Falla si el año no existe | `rules.generated.mjs` | Todo el motor, todas las vistas, la CLI | Activo |
| `municipalities.mjs` | 114 | Maestro de 15 comunas: **identidad sin tasas**. `findMunicipality`, `municipalityOptions`, `normalizeMunicipality`, `RATE_STATUS`, `UNVERIFIED_RATE_WARNING` | — | `municipal-patent.mjs`, `workspace.mjs`, `capital.js` | Activo |

**La decisión que define este paquete:** el catálogo municipal trae `patentRate: null` y
`status: 'UNVERIFIED'` para las 15 comunas. Publicar una tabla nacional de tasas sería fabricar
treinta y tantas cifras que nadie verificó, y el usuario las leería como si fueran la boleta. La
tasa la aporta el usuario con su fuente y su fecha, y queda en **su** espacio de trabajo.

### 1.2 `packages/accounting-engine/` — el motor de cálculo

| Elemento | Líneas | Responsabilidad | Depende de | Quién lo usa | Estado |
| --- | ---: | --- | --- | --- | --- |
| `index.mjs` | 305 | Operaciones elementales (`saleFromNet`, `purchaseFromNet`, `honorariumFromGross`, `ppmFromSalesNet`), `f29Basic`, `f29DueDates`, `municipalPatent`, `idpcProPyme`, `journal`, `simulateScenario`, `clp` | `chile-tax-rules` | Vistas `panel`, `impuestos`, `obligaciones`, `academia`; CLI; `workspace.mjs` | Activo |
| `tax-equity.mjs` | 235 | Capital propio tributario por dos métodos: art. 41 N.º 1 y simplificado 14 D N.º 3 (j). `calculateTaxEquity`, `allowsSimplifiedTaxEquity` | `chile-tax-rules` | `workspace.mjs`, vista `capital`, CLI | Activo |
| `municipal-patent.mjs` | 229 | Patente municipal con la bifurcación del art. 24: empresa nueva vs. en funcionamiento. `calculateMunicipalPatent` | `chile-tax-rules`, `municipalities.mjs` | `workspace.mjs`, vista `capital`, CLI | Activo |

**Nota sobre duplicidad funcional aparente.** `index.mjs` exporta `municipalPatent()` y
`municipal-patent.mjs` exporta `calculateMunicipalPatent()`. **No es un duplicado por descuido**: el
propio código lo documenta. `municipalPatent()` es una estimación rápida que aplica una tasa a la
cifra que le pasen —la usan la CLI y los laboratorios para enseñar el tope mínimo— y **no decide qué
capital corresponde usar**. `calculateMunicipalPatent()` sí lo decide. Marcado **Activo** con
propósito distinto, no duplicado.

### 1.3 `packages/company-operations/` — el motor operativo

| Elemento | Líneas | Responsabilidad | Depende de | Quién lo usa | Estado |
| --- | ---: | --- | --- | --- | --- |
| `workspace.mjs` | **1.349** | **El orquestador central.** Clase `CompanyWorkspace`: ficha, capital, gobierno, procesos críticos, riesgos, auditoría, períodos, respaldo y diagnóstico. Más `seedSandboxWorkspace()` | `governance.mjs`, `capital.mjs`, motores contables y reglas | Todas las vistas vía `state.js`; `index.mjs`; CLI | Activo |
| `governance.mjs` | 185 | RACI, SoD, siete etapas, controles, riesgos, KRI y frecuencias de auditoría | — | `workspace.mjs`, vista `control-interno` | **Crítico** |
| `capital.mjs` | 371 | Modelo societario: `EQUITY_MOVEMENT_KINDS` (9 tipos), `DATA_STATUS` (5), `DATA_ORIGIN` (5), `normalizeCapitalProfile`, `validateCapitalProfile`, `capitalPendingToPay`, `normalizeEquityMovement`, `summarizeEquityMovements` | — | `workspace.mjs`, vista `capital` | Activo |
| `store.mjs` | 84 | `createMemoryStore()` y `createWebStore({namespace})`. Define el contrato de seis métodos | — | `platform.js`, pruebas | Activo |
| `node-store.mjs` | 95 | Almacén de disco. Escritura atómica (temporal + `rename`) y bitácora NDJSON *append-only* | `node:fs`, `node:path` | `index.mjs` (Node) — **nunca** el navegador | Activo |
| `rut.mjs` | 43 | RUT chileno: `cleanRut`, `rutCheckDigit` (módulo 11), `validateRut` | — | Vista `empresa`, CLI | Activo |
| `index.mjs` | 57 | Entrada de Node y exportaciones del marco de gobierno | `workspace.mjs`, `node-store.mjs`, `governance.mjs` | CLI, pruebas | Activo |

### 1.4 Paquetes de contenido

| Elemento | Líneas | Responsabilidad | Consumidores | Estado |
| --- | ---: | --- | --- | --- |
| `glossary/index.mjs` | 654 | **54 términos** en 6 categorías, con `notToConfuseWith`, `related`, `legalReference`. `term()`, `searchTerms()`, `termsByCategory()`, `danglingReferences()` | Vista `glosario`, ayudas contextuales (`terms.js`), buscador `Ctrl+K`, `build-glossary.mjs` → `docs/GLOSSARY.md` | Activo |
| `onboarding/index.mjs` | 624 | **14 etapas** en **5 fases**, `COVERAGE` (9 cubiertas / 10 no cubiertas), **12** `FIRST_QUESTIONS`. `stage()`, `stagesByPhase()`, `danglingReferences()` | Vista `empezar`, `build-guide.mjs` → `EMPEZAR-AQUI.{md,html,pdf}`, `lib/diagrams.mjs`, `capture-screenshots.mjs` | Activo |
| `shortcuts/index.mjs` | 186 | **12 atajos** en 3 grupos. `resolveShortcut(event, {typing})`, `shortcutsByGroup()`, `keysFor()` | `lib/shortcuts.js`, `build-shortcuts.mjs` → `docs/ATAJOS-DE-TECLADO.md` | Activo |

Los tres comparten el mismo patrón —**datos en el código, documento generado, sincronía comprobada
en CI**— y es la razón de que la documentación de este repositorio no pueda contradecir al producto.

---

## 2 · `apps/` — las superficies

### 2.1 `apps/web/src/` — la única interfaz del producto

| Elemento | Líneas | Responsabilidad | Estado |
| --- | ---: | --- | --- |
| `app.js` | 249 | Router, shell, barra lateral, cambio de modo/tema/período, arranque, instalación de atajos, registro del service worker. `APP_VERSION` | Activo |
| `index.html` | 32 | Documento base | Activo |
| `app.css` | 785 | Hoja de estilos completa, con tema claro y oscuro | Activo |
| `sw.js` | 62 | Service worker: caché de la propia app. **No** intercepta datos del usuario. `CACHE` con `__BUILD_ID__` sustituido en el build | Activo |
| `manifest.webmanifest` | 24 | Manifiesto PWA: 4 iconos y 2 accesos directos (`#operaciones`, `#impuestos`) | Activo |
| `lib/dom.js` | 183 | `html` (escapa toda interpolación por defecto), `raw`, `esc`, formateo CLP/fecha/período, `toast`, `attempt`, `openModal`, `confirmAction` | Activo |
| `lib/state.js` | 66 | Estado global, dos `CompanyWorkspace` vivos (real y sandbox), preferencias en `localStorage`, `selectablePeriods()` | Activo |
| `lib/platform.js` | 150 | Detección de plataforma, `createPlatformStore`, `hydrateFromDisk`, `saveTextFile`, `pickTextFile`, `openExternal` | Activo |
| `lib/shortcuts.js` | 225 | Oyente global único, buscador de comandos (`Ctrl+K`), diálogo de ayuda | Activo |
| `lib/terms.js` | 144 | Ayudas contextuales: `termChip`, `termWord`, `mountTerms`, globo flotante colgado del `body` | Activo |
| `icons/icon.svg` | — | Icono fuente; los PNG los genera `build-icons.mjs` | Activo |

**Las 14 vistas.** Cada una exporta `{ id, label, title, icon, render() }` y opcionalmente
`mount(root, rerender)` y `badge()`. Una prueba verifica los cinco campos en las catorce.

| Vista | Líneas | Qué resuelve | Estado |
| --- | ---: | --- | --- |
| `empezar.js` | 267 | Las 14 etapas ordenadas por *tiempo*, con el estado real de los trámites | Activo |
| `panel.js` | 218 | Indicadores del período, `healthCheck()`, próximos vencimientos | Activo |
| `operaciones.js` | 273 | Alta, edición, borrado y filtrado de operaciones; propone el IVA sin pisar lo escrito | Activo |
| `impuestos.js` | 184 | Borrador F29 con remanente arrastrado; lista de control persistida en el período | Activo |
| `obligaciones.js` | 155 | Calendario de cumplimiento con comprobante obligatorio | Activo |
| `cierre.js` | 146 | Cierre mensual con lista de 5 puntos declarada | Activo |
| `constitucion.js` | 102 | Los 9 trámites con autoridad, evidencia y enlace oficial | Activo |
| `empresa.js` | 190 | Ficha de la empresa; valida el RUT con `validateRut` | Activo |
| `capital.js` | **694** | La vista más grande: seis magnitudes, ledger patrimonial, CPT, patente y cierre anual | Activo |
| `auditoria.js` | 92 | Bitácora, con buscador que conserva el cursor | Activo |
| `datos.js` | 179 | Exportar, importar, respaldos, CSV | Activo |
| `academia.js` | 254 | Explicaciones que usan el mismo motor que calcula | Activo |
| `glosario.js` | 95 | Los 54 términos, buscables | Activo |
| `ayuda.js` | 187 | Los manuales en un marco del mismo origen; atajos | Activo |

### 2.2 `apps/empresa-operativa/` — servidor local estático

| Elemento | Líneas | Responsabilidad | Estado |
| --- | ---: | --- | --- |
| `server.mjs` | 101 | Sirve `apps/web/dist` en `127.0.0.1:4180`. `resolveSafe()` bloquea el escape de directorio; cabeceras CSP, `nosniff`, `no-referrer` | Activo |
| `start-windows.bat` | 30 | Lanzador de doble clic. CRLF forzado por `.gitattributes` | Activo |
| `start-windows.ps1` | 20 | Lanzador PowerShell equivalente | Activo |

### 2.3 `apps/android/` — envoltorio Capacitor 7

| Elemento | Responsabilidad | Estado |
| --- | --- | --- |
| `capacitor.config.json` | `appId: cl.vladimiracuna.empresaoperativa`, `webDir: www`, `allowMixedContent: false`, `webContentsDebuggingEnabled: false`, `CapacitorHttp` **desactivado** | Activo |
| `copiar-www.mjs` (74) | Copia `dist` a `www` y **cuenta** vistas y núcleo antes de seguir; aplica iconos si el proyecto Android existe | Activo |
| `package.json` (21) | 4 dependencias Capacitor + CLI. Versión `1.5.0`, sincronizada por una prueba | Activo |
| `res-icons/` | 15 PNG + 1 XML de icono adaptativo, en 6 densidades (`mipmap-mdpi` … `mipmap-xxxhdpi`) | Activo |
| `pnpm-lock.yaml` (792) | Lockfile válido | Activo |
| `package-lock.json` (1.186) | Lockfile de **npm** | **Duplicado** — ver nota |

> **Nota sobre `apps/android/package-lock.json`.** El repositorio declara `pnpm@11.2.2` como gestor
> y los workflows ejecutan `pnpm install --frozen-lockfile`, que lee `pnpm-lock.yaml`. El
> `package-lock.json` no lo consume nada en el repositorio: es un residuo de una instalación con
> npm. Registrado en [15 · Riesgos](15-risks-and-technical-debt.md); **no se eliminó**, porque
> borrarlo es un cambio funcional.

### 2.4 `apps/contador-desktop/` — shell Tauri 2 (Windows)

| Elemento | Líneas | Responsabilidad | Estado |
| --- | ---: | --- | --- |
| `src-tauri/src/lib.rs` | 135 | Cuatro comandos: `load_workspace`, `save_workspace`, `export_file`, `app_info`. `safe_mode()` valida el modo. Dos pruebas Rust | Activo |
| `src-tauri/src/main.rs` | 6 | Punto de entrada; sin consola en release | Activo |
| `src-tauri/build.rs` | 1 | `tauri_build::build()` | Activo |
| `src-tauri/Cargo.toml` | 31 | `tauri 2`, `serde`, `serde_json`. **Sin base de datos embebida** — el comentario explica por qué se quitó `rusqlite` | Activo |
| `src-tauri/tauri.conf.json` | 49 | Ventana, CSP, bundle MSI + NSIS, `identifier` igual al `appId` de Android | Activo |
| `src-tauri/capabilities/default.json` | 7 | **`permissions: ["core:default"]` y nada más.** Sin red, sin shell, sin FS genérico | Activo |
| `package.json` | 15 | Sólo `@tauri-apps/cli`. **`version: "1.5.0"`** | Activo y sincronizado |

> **Nota sobre la versión.** `apps/contador-desktop/package.json` declara `1.0.0`, mientras
> `package.json` raíz, `tauri.conf.json`, `Cargo.toml`, `app.js` y `apps/android/package.json`
> declaran `1.5.0`. La prueba de versión también cubre Android, su lockfile y el package del shell de escritorio.
> comprueba cinco de esos seis sitios y **no** incluye éste. Como ese `package.json` sólo sirve para
> invocar el CLI de Tauri —que toma la versión de `tauri.conf.json`— el desfase no afecta al binario
> producido. Registrado en [15 · Riesgos](15-risks-and-technical-debt.md).

### 2.5 `apps/contador-cli/` — línea de comandos

| Elemento | Líneas | Responsabilidad | Estado |
| --- | ---: | --- | --- |
| `src/index.mjs` | 323 | **23 comandos** en dos familias: **cálculo puro**, 15 contando `ayuda` (no tocan disco), y **espacio de trabajo**, 8 (archivos en `--datos`) | Activo |

---

## 3 · `scripts/` — build, generación y verificación

| Script | Líneas | Responsabilidad | `--check` | Quién lo ejecuta | Estado |
| --- | ---: | --- | :---: | --- | --- |
| `build-all.mjs` | 29 | Orquesta reglas → iconos → web | — | `pnpm build`, `pnpm start`, CI, todos los workflows | Activo |
| `build-rules.mjs` | 65 | `rules/*.json` → `rules.generated.mjs` | ✅ | `pnpm check`, CI | Activo |
| `build-icons.mjs` | 335 | PNG a mano con `node:zlib`, sin dependencias | — | `build-all` | Activo |
| `build-web.mjs` | 128 | Compone `apps/web/dist`, embarca manuales y presentación, **aborta si hay `node:*`**, calcula `buildId` | — | `build-all` | Activo |
| `build-glossary.mjs` | 90 | `packages/glossary` → `docs/GLOSSARY.md` | ✅ | `pnpm check`, CI | Activo |
| `build-guide.mjs` | 407 | `packages/onboarding` → `EMPEZAR-AQUI.{md,html,pdf}` + 2 diagramas SVG | ✅ (sólo el `.md`) | `pnpm check`, CI, `pnpm docs` | Activo |
| `build-shortcuts.mjs` | 86 | `packages/shortcuts` → `docs/ATAJOS-DE-TECLADO.md` | ✅ | `pnpm check`, CI | Activo |
| `build-manual.mjs` | 115 | `docs/MANUAL.md` → `MANUAL.pdf` (densidad 2) y `MANUAL.html` (densidad 1) | — | `pnpm manual`, `pnpm docs` | Activo |
| `build-presentation.mjs` | 317 | `docs/presentacion.md` → 4 artefactos: diapositivas y pauta, en HTML y PDF | ✅ | `pnpm check`, CI | Activo |
| `check-presentation.mjs` | 121 | Abre los PDF, **cuenta páginas** y compara con lo que anuncian 5 archivos del repositorio | — | `pnpm check`, CI | Activo |
| `validate-rules.mjs` | 48 | Valida los **valores** de las tasas del año en curso | — | `pnpm check`, CI | Activo |
| `verify-apk.mjs` | 124 | Abre el APK como ZIP leyendo el directorio central a mano; 12 comprobaciones | — | `android.yml`, `pnpm android:verify` | Activo |
| `capture-screenshots.mjs` | 115 | Recaptura las pantallas con Chrome headless, en dos densidades | — | `pnpm capturas`, `pnpm docs` | Activo |
| **`build-system-docs.mjs`** | — | **Nuevo en esta serie.** Genera los PDF de `docs/system-documentation/` | `--only` | Manual | Activo |

### `scripts/lib/` — librerías compartidas

| Elemento | Líneas | Responsabilidad | Usado por | Estado |
| --- | ---: | --- | --- | --- |
| `chrome.mjs` | 101 | `findBrowser()` (Chrome o Edge), `screenshot()`, `printPdf()`. Perfil desechable para que las capturas sean reproducibles | `build-manual`, `build-guide`, `build-presentation`, `capture-screenshots`, `build-system-docs` | Activo |
| `markdown.mjs` | 223 | Conversor Markdown → HTML suficiente para **este** repositorio; `embedFrom()` embebe imágenes como data URI | Los mismos | Activo |
| `print-style.mjs` | 174 | `PRINT_CSS` (A4) y `SCREEN_CSS` (claro/oscuro), compartidos para que manual y guía parezcan del mismo producto | `build-manual`, `build-guide`, `build-system-docs` | Activo |
| `diagrams.mjs` | 229 | Genera 2 diagramas SVG **desde los datos** de `packages/onboarding` | `build-guide` | Activo |

---

## 4 · `tests/` — 13 suites, 158 pruebas

| Suite | Líneas | Pruebas | Qué protege |
| --- | ---: | ---: | --- |
| `accounting.test.mjs` | 9 | 6 | Aritmética básica: IVA, retención, F29, patente mínima, IDPC, asiento de retiro |
| `f29.test.mjs` | 66 | 8 | IVA declarado vs. derivado, remanente, vencimientos y traslado de fin de semana |
| `rules.test.mjs` | 44 | 4 | JSON ≡ módulo generado; toda regla con fuente y fecha; año faltante lanza |
| `rut.test.mjs` | 39 | 6 | Dígito verificador módulo 11 y formatos aceptados |
| `capital.test.mjs` | 178 | 19 | Migración del campo `capital` antiguo, validaciones societarias, agregación de movimientos |
| `tax-equity.test.mjs` | 177 | 17 | Los dos métodos de CPT, el piso en cero, el rechazo del método a quien no califica |
| `municipal-patent.test.mjs` | 211 | 23 | La bifurcación del art. 24, topes, deducciones, prorrateo, UTM y tasa no verificada |
| `workspace.test.mjs` | 146 | 14 | Inmutabilidad del período, remanente entre períodos, evidencia obligatoria, respaldo |
| `company-operations.test.mjs` | 34 | 4 | Aislamiento real/sandbox sobre disco real |
| `glossary.test.mjs` | 93 | 11 | Referencias no rotas, unicidad de ids, categorías declaradas |
| `onboarding.test.mjs` | 189 | 17 | Etapas, fases, referencias a vistas y a trámites, cobertura declarada |
| `ayuda.test.mjs` | 160 | 16 | Atajos únicos, comportamiento al escribir, contenido de la vista de ayuda |
| `webapp.test.mjs` | 115 | 8 | **La regla `node:*`**, router completo, versión sincronizada, manifiesto PWA |

Recuento verificado con `node --test tests/*.test.mjs`: `tests 153 · pass 153 · fail 0`.

---

## 5 · `.github/` — automatización

| Elemento | Líneas | Disparadores | Estado |
| --- | ---: | --- | --- |
| `workflows/ci.yml` | 189 | `push`/`PR` a main, manual | Activo |
| `workflows/security.yml` | 95 | `push`/`PR` a main, cron lunes 06:00 UTC, manual | Activo |
| `workflows/pages.yml` | 58 | `push` a main, manual | Activo |
| `workflows/android.yml` | 99 | Manual y `workflow_call` | Activo |
| `workflows/desktop.yml` | 152 | Manual y `workflow_call` | Activo |
| `workflows/release.yml` | 121 | Etiqueta `v*`, manual | Activo |
| `ISSUE_TEMPLATE/error.yml` | 67 | Reporte de error | Activo |
| `ISSUE_TEMPLATE/mejora.yml` | 51 | Propuesta de mejora | Activo |
| `ISSUE_TEMPLATE/regla-tributaria.yml` | 69 | **Cambio de regla tributaria** — el formulario exige fuente oficial | Activo |
| `ISSUE_TEMPLATE/config.yml` | 11 | Configuración del selector | Activo |
| `pull_request_template.md` | — | Plantilla de PR | Activo |

---

## 6 · `docs/` — documentación previa a esta serie

23 documentos Markdown. Los cuatro **generados** no se editan a mano; CI falla si se desvían.

| Documento | Origen | Estado |
| --- | --- | --- |
| `GLOSSARY.md` (588) | `packages/glossary/index.mjs` | **Generado** |
| `EMPEZAR-AQUI.md` (801) · `.html` (578) · `.pdf` | `packages/onboarding/index.mjs` | **Generado** |
| `ATAJOS-DE-TECLADO.md` (65) | `packages/shortcuts/index.mjs` | **Generado** |
| `presentacion/*.html` y `*.pdf` | `docs/presentacion.md` | **Generado** |
| `MANUAL.html` (581) · `MANUAL.pdf` | `docs/MANUAL.md` | **Generado** |
| `ARCHITECTURE.md` (168) | Escrito a mano | Activo (con drift — ver [15](15-risks-and-technical-debt.md)) |
| `MANUAL.md` (975) | Escrito a mano | Activo |
| `SOURCES-2026.md` (81) | Escrito a mano | Activo |
| `README.md` (63) | Escrito a mano | Activo (con drift) |
| `ROADMAP.md` (84) | Escrito a mano | Activo (con drift) |
| `RUNBOOK-MENSUAL.md` (43) · `RUNBOOK-ANUAL.md` (24) | Escrito a mano | Activo |
| `DECISION-TREE.md` (27) · `ACCOUNTING-POLICIES.md` (12) | Escrito a mano | Activo |
| `product/` (6 documentos) | Escrito a mano | Activo |
| `accounting/CAPITAL-PATRIMONIO.md` · `tax/CAPITAL-PROPIO-TRIBUTARIO.md` · `municipal/PATENTE-MUNICIPAL.md` · `guides/OFICINA-VIRTUAL.md` | Escrito a mano | Activo |
| `assets/capturas/` (19 PNG) · `assets/compacto/` (16 PNG) | `capture-screenshots.mjs` | **Generado** |
| `assets/diagramas/` (5 SVG) | 2 por `lib/diagrams.mjs`, 3 a mano | Mixto |

---

## 7 · Material de aprendizaje

| Directorio | Contenido | Consumidores | Estado |
| --- | --- | --- | --- |
| `curriculum/` | `curriculum.yaml` (244 líneas) + **16 partes** con su README | Lectura humana | Activo |
| `labs/` | **16 laboratorios**, cada uno con `README.md` y `solution.md` | Lectura humana | Activo |
| `cases/` | **2 casos** integrales | Lectura humana | Activo |
| `data/scenarios/` | 1 escenario JSON para `pnpm cli escenario` | CLI | Activo |
| `academy/README.md` | Índice del material | Lectura humana | Activo |

> **Hallazgo verificado.** Ninguna prueba y ningún script del repositorio **lee** `curriculum/`,
> `labs/`, `cases/` ni `academy/`. El único lugar del código que los menciona es
> `apps/web/src/views/academia.js:238`, y es una cadena de texto que los nombra al lector — no una
> lectura de archivo. `data/scenarios/*.json` sólo lo consume la CLI si el usuario le pasa la ruta a
> mano; **ninguna prueba lo ejecuta**. Comprobado con
> `grep -rn "labs/\|curriculum/\|cases/\|academy/\|data/scenarios" scripts/ tests/ packages/ apps/`.
> Es material de lectura, no material verificado: si la solución de un laboratorio deja de coincidir
> con lo que el motor calcula, nada lo detecta. Registrado en
> [15 · Riesgos](15-risks-and-technical-debt.md).

---

## 8 · Raíz del repositorio

| Archivo | Responsabilidad | Estado |
| --- | --- | --- |
| `package.json` | Versión `1.5.0`, `type: module`, `engines.node >= 20`, `packageManager: pnpm@11.2.2`, 21 scripts, **cero `dependencies`** | Activo |
| `pnpm-lock.yaml` | Lockfile raíz | Activo |
| `.gitignore` | Excluye `node_modules`, artefactos de build y **datos operativos reales** | Activo |
| `.gitattributes` | `eol=lf` global, CRLF para `.bat`/`.ps1`, binarios sin conversión, `linguist-generated` y `linguist-documentation` | Activo |
| `README.md` (490) | Portada del proyecto | Activo (con drift) |
| `CHANGELOG.md` (367) | Keep a Changelog + SemVer | Activo |
| `CONTRIBUTING.md` | Reglas para cambiar una tasa; el documento más importante para un colaborador nuevo | Activo |
| `SECURITY.md` | Modelo de amenazas y qué no subir nunca | Activo |
| `CODE_OF_CONDUCT.md` · `LICENSE` (MIT) | — | Activo |

---

[⬅ Anterior: Arquitectura](03-architecture.md) · [Índice](README.md) · [Siguiente: Referencia técnica ➡](05-technical-reference.md)
