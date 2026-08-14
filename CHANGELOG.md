# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Versionado según [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-08-14

Primera versión distribuible. El proyecto pasa de prototipo con tres interfaces distintas a
**un producto con una sola interfaz en Android, Windows y navegador**.

### Añadido

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
- **Documentación:** README nuevo, `docs/ARCHITECTURE.md`, código de conducta, plantillas de
  incidencia y de pull request, este changelog.
- 40 pruebas nuevas (de 10 a 50).

### Corregido

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

### Cambiado

- El servidor local (`apps/empresa-operativa`) pasa a servir únicamente archivos estáticos;
  escucha en `127.0.0.1` en lugar de en todas las interfaces y envía cabeceras CSP.
- El motor de `company-operations` se separó en `workspace.mjs` (sin `node:*`) más almacenes
  conectables de memoria, navegador y disco.
- El sandbox se siembra con **dos meses** de operaciones, para que el remanente de crédito
  fiscal y un IVA no recuperable sean visibles desde el primer arranque.
- Versión unificada en `package.json`, `tauri.conf.json`, `Cargo.toml` y la aplicación, con una
  prueba que lo verifica.

### Eliminado

- **`apps/contador-web`** y **`apps/contador-desktop/ui`**: dos interfaces paralelas que
  duplicaban parcialmente la aplicación y ya no compartían su API. La nueva `apps/web` las
  sustituye en las tres plataformas.
- **SQLite y `rusqlite`** del shell de Windows. Obligaban a mantener dos implementaciones del
  motor contable —JavaScript y Rust— que acabarían dando resultados distintos. Ver
  [`docs/product/WINDOWS-APP.md`](docs/product/WINDOWS-APP.md).
- **`MANIFEST.sha256.json`**: hashes de archivos que en parte ya no existían. La verificación de
  integridad pasa al `SHA256SUMS.txt` que acompaña a cada release, que sí se genera con el
  artefacto que se publica.

### Seguridad

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
