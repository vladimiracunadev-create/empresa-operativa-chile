# 09 · APIs e integraciones

[⬅ Anterior: Flujo de datos](08-data-flow.md) · [Índice](README.md) · [Siguiente: Configuración ➡](10-configuration.md)

---

## La conclusión, primero

**El sistema no expone ninguna API y no consume ningún servicio externo.** No hay endpoints REST, ni
GraphQL, ni gRPC, ni webhooks, ni claves de API, ni proveedores, ni reintentos, ni límites de tasa,
ni SDK de terceros. No hay integración con el SII, con ninguna municipalidad, con ningún banco ni
con ningún emisor de DTE.

Eso no significa que no haya **interfaces**. Hay cinco, y este documento las documenta como lo que
son: contratos con consumidores reales, aunque ninguno viaje por la red.

| # | Interfaz | Tipo | Consumidor |
| --- | --- | --- | --- |
| 1 | Servidor local de archivos | HTTP `GET`/`HEAD` sobre `127.0.0.1` | El navegador del usuario |
| 2 | Comandos Tauri | IPC proceso ↔ WebView | La aplicación de Windows |
| 3 | Puente Capacitor | Bridge nativo | La aplicación de Android |
| 4 | CLI | Línea de comandos, salida JSON | Personas y scripts |
| 5 | Contratos de datos | Formatos de archivo | Respaldos, reglas y escenarios |

---

## La demostración de que no hay red

No es una afirmación de confianza: es comprobable, y estos son los comandos.

```bash
grep -rn "fetch(\|XMLHttpRequest\|sendBeacon\|WebSocket\|EventSource" apps/web/src/ packages/
```

**Resultado real, ejecutado el 27-08-2026:** una sola coincidencia,
[`apps/web/src/sw.js:51`](../../apps/web/src/sw.js) — el `fetch` del service worker, dentro de un
manejador que **descarta explícitamente todo lo que no sea del propio origen**:

```js
if (url.origin !== self.location.origin) return;
```

Es decir: la única llamada de red del sistema sirve para cachear sus propios archivos, y se niega a
tocar nada ajeno.

**Y las cuatro barreras que lo sostienen**, cada una en una capa distinta:

| Barrera | Dónde | Qué impide |
| --- | --- | --- |
| CSP `default-src 'self'; connect-src 'self'` | Cabecera de `server.mjs` | Que el navegador acepte una conexión saliente |
| CSP en `tauri.conf.json` | `app.security.csp` | Lo mismo dentro de la WebView de Windows |
| `CapacitorHttp.enabled: false` | `capacitor.config.json` | Que el puente nativo de Android haga peticiones |
| `permissions: ["core:default"]` | `capabilities/default.json` | Que Rust exponga red, shell o FS genérico |

> **Un hueco real, y conviene decirlo aquí.** La CSP la ponen el servidor local y Tauri. **La
> versión publicada en GitHub Pages no tiene ninguna**: Pages no permite cabeceras propias y
> `apps/web/src/index.html` **no lleva** `<meta http-equiv="Content-Security-Policy">`. Se verificó
> buscando `http-equiv` en todo `apps/web/src/`: no hay ninguna coincidencia. La app sigue sin hacer
> llamadas de red, pero ahí la garantía la da sólo el código, no una política que el navegador haga
> cumplir. Se recoge en [11 · Seguridad](11-security.md) y en [15 · Riesgos](15-risks-and-technical-debt.md).

---

## 1 · Servidor local de archivos

`apps/empresa-operativa/server.mjs`, 101 líneas, `node:http` puro. **No es una API**: no hay rutas,
no hay recursos, no hay verbos de escritura. Sirve `apps/web/dist` y nada más.

| Aspecto | Valor |
| --- | --- |
| Host | `127.0.0.1` (variable `HOST`) — **nunca `0.0.0.0`** |
| Puerto | `4180` (variable `PORT`) |
| Métodos | `GET` y `HEAD`. Cualquier otro devuelve **405** con cabecera `allow` |
| Autenticación | **Ninguna.** No la necesita: sólo escucha en la interfaz de loopback |
| Formato | Estático: HTML, JS, MJS, CSS, JSON, webmanifest, SVG, PNG, ICO, PDF |
| Arranque | Si no existe `dist/index.html`, imprime la instrucción del build y sale con código 1 |

### Códigos de estado

| Código | Cuándo | Cuerpo |
| --- | --- | --- |
| `200` | El archivo existe y es un archivo regular | El archivo |
| `404` | No resuelve, no existe, o no es un archivo | `No encontrado` |
| `405` | Método distinto de `GET`/`HEAD` | `Method Not Allowed` |

### Cabeceras de respuesta

| Cabecera | Valor | Por qué |
| --- | --- | --- |
| `content-type` | Según extensión; `charset=utf-8` **sólo** en los formatos textuales | Declararlo en un PNG o un PDF es ruido |
| `cache-control` | `no-cache` | La app se actualiza al recargar |
| `content-security-policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'` | Convierte cualquier dependencia externa futura en un error visible |
| `x-content-type-options` | `nosniff` | |
| `referrer-policy` | `no-referrer` | |

`frame-ancestors 'self'` y no `'none'` está comentado en el código: la aplicación muestra la guía
ilustrada dentro de un marco del **mismo** origen. Sigue impidiendo que un sitio externo la enmarque.

### La función que importa: `resolveSafe(urlPath)`

Es el único punto del sistema que traduce entrada de red a una ruta del disco, y por eso es
🟥 **crítica**. Decodifica, normaliza y **exige el separador** al comparar:

```js
if (full !== distDir && !full.startsWith(distDir + path.sep)) return null;
```

El `+ path.sep` no es cosmético: sin él, un directorio hermano llamado `dist-privado` pasaría el
filtro. CI lo prueba en cada push con tres vectores —`/../../package.json`, la variante
`%2e%2e%2f` y la mixta `..%2f`— y falla si alguno devuelve 200.

**Ejemplo seguro:**

```bash
curl -sf http://127.0.0.1:4180/core/accounting-engine/index.mjs -o motor.mjs
curl -s -o /dev/null -w '%{http_code}\n' 'http://127.0.0.1:4180/%2e%2e%2f%2e%2e%2fpackage.json'
```

La segunda línea debe imprimir `404`.

---

## 2 · Comandos Tauri (IPC)

`apps/contador-desktop/src-tauri/src/lib.rs`. Cuatro comandos y ni uno más; la lista se declara en
`invoke_handler` y **la capacidad concede sólo `core:default`**, así que no hay red, ni shell, ni
sistema de archivos genérico.

Se invocan desde la WebView con `globalThis.__TAURI__.core.invoke(nombre, args)`.

### `load_workspace(mode) → Option<String>`

| Campo | Valor |
| --- | --- |
| **Parámetros** | `mode: String` — `real` o `sandbox` |
| **Retorno** | El contenido del espejo, o `null` la primera vez |
| **Errores** | `modo desconocido: <x>`; error de E/S como texto |
| **Efectos** | Crea el directorio de datos si no existe |
| **Quién lo llama** | `hydrateFromDisk()`, una sola vez al arrancar |

### `save_workspace(mode, payload) → ()`

| Campo | Valor |
| --- | --- |
| **Parámetros** | `mode: String`; `payload: String` — JSON serializado del volcado de `localStorage` |
| **Retorno** | Nada |
| **Errores** | `payload inválido: <detalle>` si no parsea; `modo desconocido`; errores de E/S |
| **Efectos** | Escribe `<app_data_dir>/<mode>.json` de forma **atómica**: temporal + `rename` |
| **Quién lo llama** | La envoltura de `createPlatformStore`, 180 ms después de cada escritura |

**Dos decisiones defensivas explícitas en el código:** el JSON se valida **antes** de tocar el disco
—si la WebView manda basura, mejor fallar que pisar un espejo bueno—, y la escritura es atómica —un
corte de luz deja el archivo anterior intacto en vez de un JSON truncado.

### `export_file(filename, contents) → String`

| Campo | Valor |
| --- | --- |
| **Parámetros** | `filename: String`; `contents: String` |
| **Retorno** | Ruta absoluta donde quedó el archivo |
| **Errores** | `nombre de archivo inválido` |
| **Efectos** | Escribe en `Documentos/Empresa Operativa Chile`, creándola si hace falta |

**El nombre viene de la WebView, así que se sanea:** se toma sólo el componente final del path, y se
rechaza vacío o empezando por punto. Sin diálogo nativo a propósito — una carpeta fija y predecible
es justamente lo que se quiere de un respaldo.

### `app_info() → JSON`

Devuelve `{ version, dataDir }`. Alimenta la pestaña **Datos**, que es donde la aplicación le dice a
la persona dónde están sus archivos.

### El contrato de seguridad de esta interfaz

| Control | Implementación | Prueba |
| --- | --- | --- |
| `mode` no puede ser una ruta | `safe_mode()` con `match` sobre dos literales | `un_modo_con_ruta_se_rechaza` en `lib.rs` |
| `filename` no puede escapar | `file_name()` + rechazo de vacío y oculto | `REQUIERE VALIDACIÓN`: sin prueba propia |
| El payload no corrompe el espejo | `serde_json::from_str` antes de escribir | `REQUIERE VALIDACIÓN`: sin prueba propia |
| Superficie mínima | `permissions: ["core:default"]` | Declarativo |

Las dos pruebas de Rust existentes (`solo_se_aceptan_los_dos_modos`, `un_modo_con_ruta_se_rechaza`)
**no se ejecutaron** en esta máquina por falta de toolchain; las corre `desktop.yml` con
`cargo test --release`.

---

## 3 · Puente Capacitor (Android)

`apps/android/capacitor.config.json`. La aplicación **es** la web: no hay código Java ni Kotlin
propio.

| Clave | Valor | Consecuencia |
| --- | --- | --- |
| `appId` | `cl.vladimiracuna.empresaoperativa` | El mismo identificador que Windows — hay una prueba que lo verifica |
| `webDir` | `www` | Lo llena `copiar-www.mjs` desde `apps/web/dist` |
| `android.allowMixedContent` | `false` | Nada de contenido inseguro |
| `android.captureInput` | `true` | Teclado gestionado por la WebView |
| `android.webContentsDebuggingEnabled` | `false` | **La WebView no es inspeccionable en el APK publicado** |
| `server.androidScheme` | `https` | El origen es `https://localhost`, lo que habilita las APIs que exigen contexto seguro |
| `plugins.CapacitorHttp.enabled` | **`false`** | El puente HTTP nativo está apagado |

El **único plugin** que la aplicación usa en tiempo de ejecución es `Browser`, y sólo para una cosa:

```js
if (PLATFORM === 'android' && globalThis.Capacitor?.Plugins?.Browser) {
  globalThis.Capacitor.Plugins.Browser.open({ url });
}
```

Abrir un portal oficial **fuera** de la app, para no dejar a la persona atrapada dentro de la
WebView. No se le pasa ningún dato del usuario: sólo la URL pública.

---

## 4 · La CLI como interfaz

`apps/contador-cli/src/index.mjs`. Es la interfaz más parecida a una API que tiene el sistema:
**entrada por argumentos, salida JSON por `stdout`, errores por `stderr`, código de salida
significativo**. Se puede encadenar con `jq` sin ceremonia.

### Contrato general

| Aspecto | Valor |
| --- | --- |
| Salida correcta | `JSON.stringify(valor, null, 2)` por `stdout` |
| Error | `error: <mensaje>` por `stderr`, **código 1** |
| Comando desconocido | Ayuda por `stderr`, código 1 |
| RUT inválido | JSON con `valid: false` **y `exitCode = 1`** — el único comando que informa por las dos vías |
| Excepción del motor | Capturada en el `try` global y convertida en `error: <mensaje>` |
| Año | `--anio`, por defecto 2026. Un año sin reglas **falla**, no degrada |

### Comandos de cálculo — no tocan el disco

| Comando | Argumentos | Devuelve |
| --- | --- | --- |
| `venta` | `--neto` | Neto, IVA y total |
| `compra` | `--neto` | Idem, del lado del crédito |
| `honorario` | `--bruto` | Bruto, retención y líquido |
| `f29` | `--ventas-netas --compras-netas [--remanente] [--honorarios]` | Borrador del F29 |
| `vencimientos` | `--periodo YYYY-MM` | Los tres vencimientos |
| `patente` | `--capital [--tasa] [--utm]` | Estimación rápida sobre una cifra dada |
| `patente-municipal` | `--etapa nueva\|funcionamiento` + capital, CPT, deducciones, tasa, UTM | Patente decidiendo la base según el art. 24 |
| `cpt` | `--regimen` + activos, pasivos, movimientos, base imponible… | CPT por el método que corresponda |
| `idpc` | `--ingresos --gastos [--ajustes]` | IDPC Pro Pyme |
| `asiento` | `--tipo --monto` | Asiento contable |
| `escenario` | `archivo.json` | Simulación completa |
| `rut` | `76.123.456-7` | Validación con dígito verificador |
| `reglas` | `[--anio]` | El objeto de reglas completo |
| `glosario` | `[término]` | Términos por categoría, o la búsqueda |

### Comandos de espacio de trabajo — escriben en disco

| Comando | Argumentos | Efecto |
| --- | --- | --- |
| `registrar` | `--fecha --tipo --descripcion --neto [--iva] [--documento] [--rut] [--pagado]` | Alta de operación. Si no se da `--iva`, lo calcula con la tasa del año |
| `operaciones` | `[--periodo]` | Lista |
| `resumen` | `--periodo` | `periodSummary` + remanente entrante + borrador F29 |
| `obligaciones` | — | Lista |
| `cerrar` | `--periodo` | Cierra el mes con `checklist: { cli: true }` |
| `bitacora` | `[--limite 50]` | Últimas líneas de auditoría |
| `exportar` | `[--salida archivo.json]` | Respaldo por `stdout` o a archivo |
| `importar` | `archivo.json [--fusionar]` | Restaura; sin `--fusionar` reemplaza |

**Opciones globales:** `--sandbox` (trabaja sobre el entorno de práctica, sembrándolo si hace falta)
y `--datos DIR`.

### Dónde escribe

Por orden de precedencia: `--datos DIR` → variable de entorno **`EMPRESA_OPERATIVA_DATA`** →
`./.local-data` relativo al directorio actual. Ese último valor por defecto está cubierto por
`.gitignore`, lo que no es casualidad: es la ruta por la que se subiría contabilidad real sin darse
cuenta.

**Ejemplos seguros** (cifras inventadas, ningún dato real):

```bash
node apps/contador-cli/src/index.mjs venta --neto 100000
node apps/contador-cli/src/index.mjs f29 --ventas-netas 1000000 --compras-netas 300000
node apps/contador-cli/src/index.mjs rut 76.000.000-0
node apps/contador-cli/src/index.mjs registrar --sandbox --tipo sale --fecha 2026-07-18 --neto 100000
node apps/contador-cli/src/index.mjs resumen --sandbox --periodo 2026-07
```

Las cuatro primeras familias las ejercita CI en cada push, comprobando valores concretos:
`"iva": 19000`, `"valid": true`, `"vatPayable": 133000` y que los vencimientos caigan en `2026-09`.

---

## 5 · Contratos de datos

Formatos de archivo con consumidores fuera del proceso que los escribe. Son APIs, aunque el
transporte sea un archivo.

### Respaldo — `empresa-operativa-chile/backup`

| Campo | Valor |
| --- | --- |
| `format` | `empresa-operativa-chile/backup` — **su ausencia rechaza el archivo** |
| `formatVersion` | `1` o `2`. Cualquier otro valor lanza |
| `mode`, `exportedAt` | Procedencia |
| Datos | `company`, `formation`, `transactions`, `obligations`, `closedPeriods`, `periodCloses`, `equityMovements`, `annualCloses`, `municipalProfile`, `audit` |

**Es el contrato que hace portables las cuatro superficies.** Un respaldo exportado desde Android se
importa en Windows, y la CLI lee lo que produjo el teléfono. La compatibilidad hacia atrás con v1 es
deliberada: romper los respaldos que la gente ya tiene guardados sería peor que limpiar el formato.

### Reglas — `rules/<año>.json`, `schemaVersion: 2`

Documentado en [07 · Persistencia](07-database.md#estructura-de-rulesañojson). Su contrato con el
resto del sistema es `loadRules`, `availableYears` y `ruleProvenance`.

### Escenario de simulación — `data/scenarios/*.json`

Entrada de `simulateScenario()` y del comando `escenario`. Hay **un** archivo en el repositorio.

### `build-info.json`

Lo genera `build-web.mjs` y lo consume la pestaña **Datos** para mostrar qué versión se está usando.
CI lo compara entre dos builds seguidos para verificar que el build es reproducible.

---

## Integraciones externas

**Ninguna, en el sentido técnico.** Lo que sí existe es una lista de **enlaces salientes** a portales
oficiales, que la aplicación abre en el navegador del sistema sin pasarles ningún dato:

| Destino | Para qué | Dónde está declarado |
| --- | --- | --- |
| `sii.cl` (10 URL distintas) | Inicio de actividades, regímenes, IVA, UTM, honorarios, F29, factura electrónica, circular 62 de 2020 | `FORMATION_STEPS`, `rules/2026.json`, glosario |
| `registrodeempresasysociedades.cl` | Constituir la sociedad | `FORMATION_STEPS` |
| `bcn.cl/leychile` | D.L. 3.063 sobre Rentas Municipales | `rules/2026.json` |
| 14 sitios municipales | Consultar la tasa de la comuna | `packages/chile-tax-rules/municipalities.mjs` |

**Todos son destinos de lectura para la persona, no endpoints que el software consulte.** La
aplicación nunca los llama: los ofrece.

Y una nota que el propio archivo de reglas se encarga de dejar clara: el flujo por el que el SII
comunica a las municipalidades el capital propio declarado **está modelado como conocimiento**, no
implementado como integración. `rules/2026.json` lo dice literalmente: esta aplicación no está
conectada al SII ni a ninguna municipalidad — sólo modela el flujo.

---

## Lo que no existe

`NO IDENTIFICADO` — se buscó y no hay evidencia en ningún sentido:

- Endpoints REST/GraphQL/gRPC propios, versionado de API, OpenAPI o esquema publicado.
- Webhooks, colas, reintentos, *backoff*, circuit breakers, límites de tasa.
- Autenticación de API, tokens, claves, OAuth, firma de peticiones.
- SDK o cliente de terceros. **Cero dependencias de producción**, verificado en CI en cada push.
- Integración con SII, municipalidades, bancos, emisores de DTE o pasarelas de pago.
- Telemetría, analítica, informe de errores o comprobación de actualizaciones.

---

[⬅ Anterior: Flujo de datos](08-data-flow.md) · [Índice](README.md) · [Siguiente: Configuración ➡](10-configuration.md)
