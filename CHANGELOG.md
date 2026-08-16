# 📓 Changelog

<div align="center">

[![Versión](https://img.shields.io/badge/versión_actual-1.2.0-e8590c?style=for-the-badge)](https://github.com/vladimiracunadev-create/empresa-operativa-chile/releases/latest)
[![Formato](https://img.shields.io/badge/formato-Keep_a_Changelog-7c5cff?style=for-the-badge)](https://keepachangelog.com/es-ES/1.1.0/)
[![SemVer](https://img.shields.io/badge/versionado-SemVer-2f81f7?style=for-the-badge)](https://semver.org/lang/es/)

[🏠 Inicio](README.md) · [📘 Manual](docs/MANUAL.md) · [🗺️ Roadmap](docs/ROADMAP.md) · [🤝 Contribuir](CONTRIBUTING.md)

</div>

---

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Versionado según [SemVer](https://semver.org/lang/es/).

## [1.2.0] — 2026-08-16

Una ruta para quien nunca ha creado una empresa.

El manual describe **pantallas**, y eso sirve cuando ya sabes qué quieres hacer. No sirve para quien
abre la aplicación por primera vez y su pregunta es *«no sé por dónde empezar»*. Esa persona necesita
otra cosa: una secuencia en el tiempo, con la decisión de cada punto, el papel que le va a quedar y
cómo sabe que terminó.

### ✨ Añadido

- **Pantalla “Empezar aquí”** (`apps/web/src/views/empezar.js`), primera en la navegación y la única
  ordenada por **tiempo** en vez de por función. **14 etapas** en 5 fases —antes de existir, hacerla
  nacer, habilitarla, operar mes a mes, cerrar el año—, cada una con:
  la pregunta que te estás haciendo, por qué importa, qué necesitas tener antes, las **alternativas**
  de cada decisión con sus riesgos, **qué documento te queda y quién lo emite**, los errores típicos,
  y cómo sabes que terminaste.
- **Ventanas vinculadas:** cada etapa tiene un botón que abre la pantalla donde se hace, y muestra el
  estado real del trámite (pendiente / en trámite / hecho) leído del espacio de trabajo, no de una
  lista paralela. Arriba, un bloque **“Por dónde sigues”** apunta a la primera etapa sin terminar.
- **Sección “Qué cubre este sistema y qué no”**, con los vacíos declarados y qué significa cada uno
  para el usuario: remuneraciones, comercio exterior, inventario, activo fijo y depreciación,
  corrección monetaria, reorganizaciones, registros empresariales completos, término de giro,
  conexión con el SII y tasas municipales por comuna.
- **[`docs/EMPEZAR-AQUI.md`](docs/EMPEZAR-AQUI.md)**, generado desde el mismo módulo con
  `node scripts/build-guide.mjs`. CI comprueba la sincronía, igual que con el glosario: si el
  documento y la pantalla se editaran por separado, en un mes mandarían a la gente a sitios distintos.
- **Índice “Si sólo tienes una pregunta”** con las doce dudas más frecuentes de quien recién parte,
  cada una enlazada a la etapa que la responde.
- Sección de errores caros y **cuándo dejar de leer y llamar a un contador**.

### 🔁 Cambiado

- El manual de usuario abre con un aviso que remite a la guía nueva cuando la pregunta es
  “no sé por dónde empezar”.
- `npm run check` valida también la sincronía de la guía.

### 🧪 Pruebas

De 120 a **131**. Las nuevas comprueban que la guía no prometa pantallas inexistentes, que cubra los
nueve trámites de constitución sin dejar ninguno huérfano, que toda etapa de trámite diga qué
documento queda, y que la lista de limitaciones no se quede corta.

## [1.1.0] — 2026-08-16

Capital, Capital Propio Tributario y patente municipal dejan de ser el mismo número.

Hasta aquí la ficha de empresa tenía **un solo campo `capital`**, rotulado “capital enterado”, y esa
misma cifra se usaba para estimar la patente municipal de cualquier año. Eso trata como sinónimos
seis magnitudes que jurídica y contablemente no lo son, y produce una cifra plausible y equivocada
—que es el peor resultado posible en una herramienta de cumplimiento—.

### ✨ Añadido

- **Módulo Capital y Patrimonio** (`apps/web/src/views/capital.js`, vista nueva): capital social,
  suscrito, enterado y por enterar como campos separados; accionistas (admite uno solo al 100 %);
  número de acciones y valor nominal; fechas de constitución e inicio de actividades.
- **Ledger de movimientos patrimoniales** (`packages/company-operations/capital.mjs`): aporte
  inicial, aporte posterior, capital pendiente enterado, aumento y disminución de capital, aporte en
  bienes, **préstamo del accionista**, devolución del préstamo y retiro/distribución. Cada tipo
  declara su efecto sobre el patrimonio y sobre el pasivo.
- **Aporte ≠ préstamo.** Un depósito del dueño obliga a declarar su naturaleza —aporte de capital,
  préstamo del accionista, ingreso operacional u otro— en vez de registrarse automáticamente como
  capital. Dos tipos de operación nuevos: `shareholder_loan` y `shareholder_loan_repayment`, con sus
  asientos explicados.
- **Aportes en bienes** con `tipoActivo`, valor de aporte, **valor contable y valor tributario por
  separado**, documento de respaldo y accionista aportante.
- **Motor de Capital Propio Tributario** (`packages/accounting-engine/tax-equity.mjs`):
  `calculateTaxEquity(...)` con los dos métodos —art. 41 N.º 1 de la LIR y **CPT simplificado** del
  art. 14 letra D) N.º 3 letra (j)—. Devuelve el desglose partida a partida, el método, la base
  legal, los supuestos, las advertencias y la evidencia. **Nunca devuelve sólo un número.**
- **Motor de patente municipal** (`packages/accounting-engine/municipal-patent.mjs`):
  `calculateMunicipalPatent(...)` distingue `NEW_BUSINESS` de `ESTABLISHED_BUSINESS`, aplica las
  deducciones por inversiones en otros negocios afectos a patente (art. 24 inciso final) y el
  prorrateo entre sucursales (art. 25), y explica de dónde salió cada peso.
- **Maestro municipal extensible** (`packages/chile-tax-rules/municipalities.mjs`) con identidad de
  comunas y **cero tasas inventadas**: todas nacen `UNVERIFIED` y sólo pasan a `VERIFIED` cuando el
  usuario registra la tasa con su fuente y su fecha de verificación.
- **Cierre anual** con snapshot inmutable: activos, pasivos, patrimonio contable, CPT y su método,
  ajustes, régimen, movimientos de capital, base municipal del período siguiente, evidencias y **la
  versión de las reglas legales** con que se calculó. Reabrirlo exige motivo; importar un respaldo
  no puede pisarlo.
- **Expediente anual exportable** en JSON, con empresa, ejercicio, patente, municipalidad y bitácora.
- **Historial por año** de capital, patrimonio, CPT, base y patente. Un ejercicio cerrado nunca se
  recalcula: se muestra lo que quedó guardado.
- **Glosario del sistema** (`packages/glossary/index.mjs`): 54 términos con resumen, definición
  pedagógica, base legal y —lo decisivo en este dominio— **con qué no hay que confundirlos**. Tres
  consumidores desde una sola copia: la vista **Glosario** con búsqueda insensible a tildes, las
  ayudas contextuales `?` junto a cada campo, y `docs/GLOSSARY.md` generado con
  `node scripts/build-glossary.mjs`. CI comprueba la sincronía.
- **Simulador educativo** en SANDBOX: escenarios de capital inicial ($500.000 / $1.000.000 /
  $5.000.000) mostrando el efecto en la patente y el choque contra el mínimo legal.
- **Caso de referencia completo** en el sandbox: SpA de desarrollo de software, un accionista al
  100 %, sin trabajadores, oficina virtual, notebook aportado al capital, préstamo del accionista y
  el ejercicio 2026 entero hasta el cierre y la base municipal de 2027.
- **Estados y origen del dato**: `ESTIMADO · CALCULADO · DECLARADO · VERIFICADO · PAGADO` y
  `usuario · calculado · importado · sii · municipalidad`, para no presentar una estimación interna
  como un hecho acreditado.
- **Indicadores nuevos en el panel**: capital enterado, CPT del último cierre, patente del período y
  estado del cierre anual.
- **Comandos de CLI**: `patente-municipal`, `cpt` y `glosario`.
- **Documentación nueva**: [`docs/accounting/CAPITAL-PATRIMONIO.md`](docs/accounting/CAPITAL-PATRIMONIO.md),
  [`docs/tax/CAPITAL-PROPIO-TRIBUTARIO.md`](docs/tax/CAPITAL-PROPIO-TRIBUTARIO.md),
  [`docs/municipal/PATENTE-MUNICIPAL.md`](docs/municipal/PATENTE-MUNICIPAL.md) y
  [`docs/guides/OFICINA-VIRTUAL.md`](docs/guides/OFICINA-VIRTUAL.md).

### 🛠️ Corregido

- **Tope de la patente municipal: 4.000 → 8.000 UTM.** El art. 24 del D.L. 3.063 fija el máximo en
  8.000 UTM; el repositorio traía el texto anterior a la Ley N.º 20.280. `scripts/validate-rules.mjs`
  ahora falla si alguien lo revierte.
- **La patente ya no se estima con `capital enterado × tasa mínima` para cualquier año.** La base
  legal cambia entre el primer ejercicio y los siguientes, y ahora el motor lo refleja.
- Se unificó el `idNorma` de BCN del D.L. 3.063, que aparecía con dos valores distintos en el
  repositorio (6942 en las reglas y 7054 en las fuentes).

### 🔁 Cambiado

- El campo `capital` de la ficha **se conserva** y se mantiene sincronizado con el capital enterado,
  para no romper respaldos, exportaciones ni vistas anteriores. El formulario de la ficha ya no lo
  edita: lo gobierna el módulo de capital.
- Formato de respaldo **v2** (añade capital, movimientos patrimoniales, cierres anuales y ficha
  municipal). Los respaldos **v1 se siguen importando** sin cambios.
- `validate-rules.mjs` pasa de comprobar cuatro tasas a validar también el rango y los topes de la
  patente, los dos métodos de CPT y que **toda** regla declare fuente y fecha de verificación.

### 🔒 Migración

Una ficha antigua con sólo `capital` migra **en lectura**: esa cifra pasa a `capitalEnterado`, y
`capitalSocial` y `capitalSuscrito` quedan marcados `PENDING_CONFIRMATION` en vez de inventarse.
La migración **no escribe en el almacén**, así que instalar esta versión no puede alterar datos
existentes: si el usuario nunca vuelve a guardar, el archivo original queda intacto.

### 🧪 Pruebas

De 50 a **119**. Las nuevas protegen distinciones, no aritmética: que un préstamo del accionista
nunca sume capital enterado, que el CPT simplificado no se aplique a quien no califica, que la base
de la patente cambie entre el año 1 y el año 2, que un CPT negativo se lleve a $0 como manda la ley,
que una tasa fuera del rango legal se rechace, que la UTM de otro período se declare, y que las
cinco magnitudes del caso de referencia sean **cinco números distintos**.

## [1.0.0] — 2026-08-14

Primera versión distribuible. El proyecto pasa de prototipo con tres interfaces distintas a
**un producto con una sola interfaz en Android, Windows y navegador**.

### ✨ Añadido

- **Aplicación Android (APK)** con Capacitor 7. Empaqueta la misma interfaz que la web.
- **Aplicación de Windows** con Tauri 2: instalador MSI, instalador NSIS y ejecutable portable.
- **Aplicación web / PWA** instalable, con service worker y funcionamiento sin conexión,
  publicada en GitHub Pages.
- **Interfaz nueva completa** (`apps/web`): 10 vistas, sistema de diseño propio, tema claro y
  oscuro, navegación adaptada a móvil con barra inferior, atajos de teclado y modo impresión.
- **Arrastre del remanente de crédito fiscal** entre períodos (`vatCarryForwardInto`). Antes se
  perdía: la aplicación cobraba un IVA que legalmente no correspondía.
- **F29 con IVA de documentos.** El borrador usa los montos reales registrados en lugar de
  derivar siempre neto × 19 %, que ignora exenciones, notas de crédito y redondeos del emisor.
- **Cálculo de los tres vencimientos del F29** con traslado por fin de semana declarado.
- **Trazabilidad de reglas:** cada tasa declara `source` y `lastVerified`, con
  `ruleProvenance()` para consultarlo.
- **Exportación e importación** de respaldos en un formato común a las tres plataformas, más
  exportación de operaciones y bitácora a CSV.
- **Reapertura de períodos** con motivo obligatorio registrado en la bitácora.
- **Diagnóstico operativo** (`healthCheck`) que señala evidencias faltantes y obligaciones vencidas.
- **Validación de RUT** con dígito verificador (módulo 11).
- **CLI reescrita** en español, con comandos de cálculo y de espacio de trabajo sobre archivos.
- **Generador de iconos sin dependencias** (`scripts/build-icons.mjs`): PNG, ICO y el juego
  completo de densidades de Android, rasterizados y comprimidos con `node:zlib`.
- **Verificador de APK** (`scripts/verify-apk.mjs`): abre el ZIP y cuenta lo que lleva dentro.
- **Workflows:** CI en Ubuntu y Windows, Android, Windows, Release, Pages y Seguridad
  (CodeQL + detección de datos reales commiteados). Todas las acciones fijadas a un SHA.
- **Manual de usuario ilustrado** ([`docs/MANUAL.md`](docs/MANUAL.md) y
  [`docs/MANUAL.pdf`](docs/MANUAL.pdf)): 17 capítulos, 28 páginas, con las pantallas reales del
  producto y tres diagramas propios.
- **Capturas reproducibles** (`scripts/capture-screenshots.mjs`): la app acepta su estado por URL
  (`?modo=`, `?tema=`, `?periodo=`, `#vista`) y las 15 imágenes del manual se regeneran con un
  comando, así que no envejecen en silencio cuando cambia la interfaz.
- **Generador de PDF sin dependencias** (`scripts/build-manual-pdf.mjs`): Markdown → HTML con las
  imágenes embebidas → impresión con Chrome.
- **Navegación por URL:** `#impuestos` abre esa vista directamente, lo que hace funcionar los
  accesos directos del manifiesto PWA y permite enlazar a una pantalla desde la documentación.
- **Documentación:** README nuevo, `docs/ARCHITECTURE.md`, código de conducta, plantillas de
  incidencia y de pull request, este changelog.
- 40 pruebas nuevas (de 10 a 50).

### 🐛 Corregido

- **La aplicación de escritorio no compilaba.** `src-tauri/src/lib.rs` usaba
  `format!("{\"id\":\"{}\"}", id)` con llaves sin escapar: error de compilación en dos sitios.
  Nunca se había podido generar un instalador.
- **La navegación de la app de escritorio no funcionaba:** los botones de la barra lateral no
  tenían ningún manejador asociado.
- **Path traversal en el servidor local.** La comprobación era
  `full.startsWith(path.join(__dirname, 'public'))`, que deja pasar un directorio hermano
  llamado `public-privado`. Ahora se compara con el separador incluido y hay pruebas en CI.
- **Se podían borrar operaciones de un período cerrado.** El cierre bloqueaba las altas pero no
  las bajas, de modo que un período "cerrado" podía cambiar de saldo.
- **El F29 ignoraba el IVA realmente registrado** y lo recalculaba desde el neto.
- **El catálogo de trámites de constitución quedaba congelado** en los datos: una empresa creada
  antes de añadir un paso nuevo no lo veía nunca.
- **El texto escrito por el usuario se insertaba sin escapar** en tablas y bitácora.
- **Las cifras desaparecían en las tarjetas estrechas.** `table { min-width: 520px }` desbordaba
  cualquier tabla dentro de una tarjeta angosta, y el desplazamiento horizontal escondía justo la
  columna de montos: el borrador del F29 mostraba los conceptos sin sus importes. El ancho mínimo
  pasa a aplicarse sólo a las tablas de muchas columnas.

### ♻️ Cambiado

- El servidor local (`apps/empresa-operativa`) pasa a servir únicamente archivos estáticos;
  escucha en `127.0.0.1` en lugar de en todas las interfaces y envía cabeceras CSP.
- El motor de `company-operations` se separó en `workspace.mjs` (sin `node:*`) más almacenes
  conectables de memoria, navegador y disco.
- El sandbox se siembra con **dos meses** de operaciones, para que el remanente de crédito
  fiscal y un IVA no recuperable sean visibles desde el primer arranque.
- Versión unificada en `package.json`, `tauri.conf.json`, `Cargo.toml` y la aplicación, con una
  prueba que lo verifica.

### 🗑️ Eliminado

- **`apps/contador-web`** y **`apps/contador-desktop/ui`**: dos interfaces paralelas que
  duplicaban parcialmente la aplicación y ya no compartían su API. La nueva `apps/web` las
  sustituye en las tres plataformas.
- **SQLite y `rusqlite`** del shell de Windows. Obligaban a mantener dos implementaciones del
  motor contable —JavaScript y Rust— que acabarían dando resultados distintos. Ver
  [`docs/product/WINDOWS-APP.md`](docs/product/WINDOWS-APP.md).
- **`MANIFEST.sha256.json`**: hashes de archivos que en parte ya no existían. La verificación de
  integridad pasa al `SHA256SUMS.txt` que acompaña a cada release, que sí se genera con el
  artefacto que se publica.

### 🔐 Seguridad

- CSP `default-src 'self'` en el servidor local y en la aplicación de Windows.
- La ventana de Tauri declara únicamente `core:default`; todo el acceso a disco pasa por cuatro
  comandos que validan sus argumentos contra una lista cerrada.
- Escritura atómica del espejo en disco (temporal + `rename`).
- CI verifica que no se hayan commiteado respaldos de contabilidad real, certificados digitales
  ni claves privadas.
- CI verifica que el motor siga con cero dependencias de producción.

## [0.2.0] — 2026-08-09

- Motor tributario inicial (IVA, PPM, honorarios, patente municipal, IDPC).
- Separación EMPRESA REAL / SANDBOX con persistencia local por archivos.
- Operaciones, obligaciones, cierre de período, bitácora de auditoría y respaldos.
- Academia: currículo, 16 laboratorios y casos integrales.
- Andamiaje de Tauri para Windows.

[1.0.0]: https://github.com/vladimiracunadev-create/empresa-operativa-chile/releases/tag/v1.0.0
