# 10 · Configuración

[⬅ Anterior: APIs e integraciones](09-apis-and-integrations.md) · [Índice](README.md) · [Siguiente: Seguridad ➡](11-security.md)

---

## La conclusión, primero

**No hay archivo de configuración de la aplicación.** No hay `.env`, no hay `config.json`, no hay
`settings.yml`, no hay banderas de funcionalidad y no hay perfiles de entorno. `.gitignore` cubre
`.env` y `.env.*`, pero no existe ningún `.env.example` ni ningún código que lea uno: la cobertura
es preventiva, no la señal de un archivo que falte.

**Seis variables de entorno** existen en todo el repositorio, y ninguna la lee la aplicación en el
dispositivo: cuatro son de herramientas de build y dos del servidor local. Ninguna es un secreto y
ninguna es obligatoria.

Lo que sí hay son **manifiestos** —de la PWA, de Capacitor, de Tauri y de npm— y ahí es donde vive la
configuración real del producto.

---

## Variables de entorno

Se obtuvieron recorriendo `apps/web/src`, `apps/contador-cli`, `apps/empresa-operativa`, `scripts` y
`packages`. La lista es exhaustiva.

| Variable | Quién la lee | Por defecto | Obligatoria | Para qué |
| --- | --- | --- | --- | --- |
| `EMPRESA_OPERATIVA_DATA` | `apps/contador-cli/src/index.mjs` | `./.local-data` | No | Directorio de datos de la CLI |
| `PORT` | `apps/empresa-operativa/server.mjs` | `4180` | No | Puerto del servidor local |
| `HOST` | `apps/empresa-operativa/server.mjs` | `127.0.0.1` | No | Interfaz de escucha |
| `CHROME_PATH` | `scripts/lib/chrome.mjs` | Autodetección | No | Ruta a Chrome o Edge para generar PDF y capturas |
| `CAPTURE_URL` | `scripts/capture-screenshots.mjs` | `http://127.0.0.1:4180` | No | Origen desde el que se capturan las pantallas |
| `EOC_KEEP_HTML` | `scripts/lib/chrome.mjs` | *(sin definir)* | No | Depuración: conserva el HTML intermedio de un PDF e imprime su ruta |

**Ninguna contiene un secreto.** No hay claves de API, tokens, contraseñas ni cadenas de conexión en
todo el repositorio, porque no hay nada a lo que conectarse. `security.yml` lo comprueba en cada push
buscando certificados y claves privadas versionados.

> ⚠️ **`HOST` es la única variable peligrosa.** Su valor por defecto es `127.0.0.1` por una decisión
> explícita del código: son datos contables de una empresa real, y no tienen por qué quedar
> expuestos al resto de la red local porque alguien levantó la app en un café. Ponerla en `0.0.0.0`
> publica la contabilidad a **toda la red**, sin autenticación de ningún tipo, porque el servidor no
> tiene ninguna. Es la configuración incorrecta más cara de este sistema.

Precedencia del directorio de datos de la CLI, de mayor a menor:

```text
--datos DIR   →   EMPRESA_OPERATIVA_DATA   →   ./.local-data
```

`./.local-data` está en `.gitignore` a propósito: es la ruta por la que se subiría contabilidad real
al repositorio sin darse cuenta.

---

## Manifiestos

### `package.json` (raíz)

| Clave | Valor | Consecuencia |
| --- | --- | --- |
| `version` | `1.5.0` | La leen el generador de PDF y las portadas de los documentos |
| `type` | `module` | Todo el repositorio es ESM. No hay `require` |
| `private` | `true` | No se publica en npm |
| `engines.node` | `>=20` | CI prueba en 20 y 22 |
| `packageManager` | `pnpm@11.2.2` | **El gestor del repositorio.** `pnpm/action-setup` instala esa versión exacta |
| `dependencies` | **ausente** | Cero dependencias de producción, verificado en CI |
| `devDependencies` | **ausente** | No hay herramientas instalables: los scripts son Node puro |

> **`pnpm` no es una preferencia, es el contrato.** `pnpm-lock.yaml` es el lockfile válido y los tres
> workflows que instalan algo usan `pnpm install --frozen-lockfile`. Escribir `npm install` ignoraría
> el lockfile.
>
> **Hallazgo:** `apps/android/` tiene versionados **`pnpm-lock.yaml` y `package-lock.json` a la
> vez**. El workflow usa pnpm, así que el `package-lock.json` no lo consume nadie, pero su presencia
> contradice la regla del repositorio y puede inducir a alguien a instalar con npm. Se recoge en
> [15 · Riesgos](15-risks-and-technical-debt.md).

### `apps/web/src/manifest.webmanifest` — la PWA

| Clave | Valor | Por qué importa |
| --- | --- | --- |
| `start_url` / `scope` | `./index.html` / `./` | **Relativos**: la app funciona igual en la raíz de un dominio y en un subdirectorio de Pages |
| `display` | `standalone` | Sin barra de navegador |
| `lang` | `es-CL` | |
| `background_color` / `theme_color` | `#0b0f16` | Coinciden con el `theme-color` de `index.html` |
| `icons` | 4 entradas: SVG, 192, 512 y maskable 512 | Una prueba verifica que existan los archivos que el manifiesto promete |
| `shortcuts` | `#operaciones` y `#impuestos` | Mantener pulsado el icono en Android; funcionan gracias a `applyUrlState()` |

### `apps/android/capacitor.config.json`

Documentado en [09 · APIs e integraciones](09-apis-and-integrations.md#3--puente-capacitor-android).
Lo esencial: `CapacitorHttp` apagado, depuración de la WebView apagada, contenido mixto prohibido,
esquema `https`.

### `apps/contador-desktop/src-tauri/tauri.conf.json`

| Clave | Valor | Consecuencia |
| --- | --- | --- |
| `productName` | `Empresa Operativa Chile` | Nombre del ejecutable y del instalador |
| `version` | `1.5.0` | **Duplicado del `package.json` raíz**, protegido por una prueba |
| `identifier` | `cl.vladimiracuna.empresaoperativa` | Determina `app_data_dir()`. Cambiarlo **deja los datos existentes huérfanos** |
| `build.frontendDist` | `../../web/dist` | La interfaz embebida es la misma que la web |
| `app.withGlobalTauri` | `true` | Expone `globalThis.__TAURI__`, que es como `platform.js` detecta Windows |
| `app.windows[0]` | 1320×860, mínimo 940×620, centrada | |
| `app.security.csp` | `default-src 'self'; … connect-src 'self' ipc: http://ipc.localhost; form-action 'none'; base-uri 'none'` | `ipc:` es lo único añadido respecto del servidor: sin eso, la WebView no podría hablar con Rust |
| `bundle.targets` | `msi`, `nsis` | Más el portable, que sale del `target/release` |
| `bundle.windows.wix.language` | `es-ES` | |
| `bundle.windows.nsis` | Español e inglés, `installMode: both` | Instalación por usuario o por máquina |

**Diferencia entre las dos CSP, y por qué existe:** la del servidor incluye `frame-ancestors 'self'`
—necesaria porque la guía ilustrada se muestra en un marco del mismo origen— y la de Tauri incluye
`connect-src ipc: http://ipc.localhost`, sin la cual no habría comunicación con el proceso Rust.
Ninguna de las dos admite un origen externo.

### `apps/contador-desktop/src-tauri/capabilities/default.json`

Nueve líneas y una decisión: `"permissions": ["core:default"]`. Sin `fs`, sin `shell`, sin `http`,
sin `dialog`. Todo el acceso a disco pasa por los cuatro comandos de `lib.rs`, que validan sus
argumentos. Es el archivo de configuración más importante del sistema desde el punto de vista de
seguridad, y ocupa menos que este párrafo.

### `Cargo.toml`

`rust-version = "1.77"` como mínimo declarado. CI instala el canal `stable`.

### `.gitattributes` y `.gitignore`

`.gitignore` cubre tres familias, y la tercera es la que importa:

1. **Dependencias**: `node_modules/`, `.pnpm-store/`.
2. **Artefactos de build**: `apps/web/dist/`, `apps/android/www/`, `apps/android/android/`,
   `src-tauri/target/`, `src-tauri/gen/`, `dist/`, `artefactos/`.
3. **Datos operativos locales**: `.local-data/`, `private-data/`, `real-company-data/`, `*.sqlite*`,
   `empresa-operativa-real-*.json` y `.csv`.

El comentario del propio archivo lo dice: **nunca subir contabilidad real**. Es la misma preocupación
que `security.yml` y que `SECURITY.md`.

---

## Configuración de CI

Los seis workflows no leen ningún secreto del repositorio. Usan sólo el `GITHUB_TOKEN` implícito,
con permisos declarados **por trabajo** y al mínimo:

| Workflow | `permissions` por defecto | Elevaciones |
| --- | --- | --- |
| `ci.yml` | `contents: read` | Ninguna |
| `android.yml` | `contents: read` | Ninguna |
| `desktop.yml` | `contents: read` | Ninguna |
| `pages.yml` | `contents: read` | `pages: write`, `id-token: write` en el trabajo de publicación |
| `release.yml` | `contents: read` | `contents: write` sólo en el trabajo `publicar` |
| `security.yml` | `contents: read` | `security-events: write` en CodeQL |

**Todas las acciones están fijadas a un SHA de 40 caracteres**, y hay un paso en `ci.yml` que falla
si alguien añade una sin fijar. Una etiqueta móvil puede cambiar de contenido bajo los pies; un SHA
no.

`package-manager-cache: false` aparece en `ci.yml` y `pages.yml` con su razón escrita al lado: el
proyecto no tiene dependencias, y con el caché activo `setup-node` invoca el gestor declarado en
`packageManager` sólo para calcular la ruta del store — lo que rompe el trabajo dos veces, porque
pnpm 11 no arranca en Node 20 y en Windows el paso de guardado falla porque ese store no existe. Es
exactamente el problema que arreglaron los dos últimos commits del repositorio.

---

## Diferencias entre entornos

**No hay entornos.** No hay `development`, `staging` ni `production`, ni ninguna variable que los
distinga. Lo que existe es **una separación de datos dentro de la aplicación**, que es una cosa
distinta y más útil:

| | EMPRESA REAL | SANDBOX |
| --- | --- | --- |
| Prefijo de almacén | `empresa-operativa-chile:real` | `empresa-operativa-chile:sandbox` |
| Se siembra con datos de ejemplo | Nunca — `seedSandboxWorkspace` **lanza** si el modo no es sandbox | Sí, si está vacío |
| Se puede seleccionar por URL | `?modo=real` | `?modo=sandbox` |
| Espejo en Windows | `real.json` | `sandbox.json` |

**No hay ninguna ruta de código que copie una operación de un modo al otro.** La separación se
consigue dando a cada modo su propio almacén, y es el invariante central del producto.

Lo más parecido a una configuración de entorno son tres parámetros de URL, que existen sobre todo
para que las capturas del manual se generen de forma reproducible:

| Parámetro | Valores | Efecto |
| --- | --- | --- |
| `#vista` | `panel`, `operaciones`, `impuestos`, … | Abre esa vista directamente |
| `?modo` | `real`, `sandbox` | Elige el espacio de trabajo |
| `?tema` | `claro`, `oscuro` | Fuerza el tema |
| `?periodo` | `YYYY-MM` | Sitúa el período |

---

## La versión, y el único punto donde se puede desincronizar

`1.5.0` se declara en los manifests de raíz, Android, escritorio, Tauri, Cargo y en la interfaz:

| Archivo | Clave | Quién la usa |
| --- | --- | --- |
| `package.json` | `version` | Generadores de documentos, portadas de PDF |
| `apps/contador-desktop/src-tauri/tauri.conf.json` | `version` | Instaladores, `app_info()` |

Hoy coinciden — se comprobó. **No hay ninguna comprobación en CI que lo garantice**, así que un bump
que olvide el segundo archivo produciría instaladores rotulados con una versión distinta de la que
dice la documentación. Se recoge en [15 · Riesgos](15-risks-and-technical-debt.md).

`REQUIERE VALIDACIÓN`: la versión que muestra la aplicación de escritorio sale de
`app.package_info().version`, es decir de `tauri.conf.json`, no de `package.json`. No se ejecutó la
app para confirmarlo visualmente.

---

## Consecuencias de una configuración incorrecta

| Cambio | Consecuencia | Gravedad |
| --- | --- | --- |
| `HOST=0.0.0.0` | La contabilidad queda servida a toda la red local, sin autenticación | 🟥 Crítica |
| Cambiar `identifier` en `tauri.conf.json` | `app_data_dir()` cambia y **los datos existentes quedan huérfanos** | 🟥 Crítica |
| Editar `rules.generated.mjs` a mano | CI falla en `build-rules.mjs --check`. Si se ignorase, el sistema calcularía con tasas que ningún JSON respalda | 🟥 Crítica |
| Añadir un permiso a `capabilities/default.json` | Amplía la superficie de la app de escritorio en silencio | 🟧 Alta |
| Poner `webContentsDebuggingEnabled: true` | La WebView del APK publicado queda inspeccionable | 🟧 Alta |
| Añadir una dependencia de producción | `security.yml` falla. Es un gate, no un aviso | 🟨 Media |
| Cambiar `start_url` a una ruta absoluta | La PWA deja de funcionar en el subdirectorio de GitHub Pages | 🟨 Media |
| Desincronizar las dos `version` | Instaladores rotulados con una versión que no es | 🟨 Media |
| `PORT` ocupado | El servidor no arranca; ver [14 · Troubleshooting](14-troubleshooting.md) | 🟩 Baja |
| `CHROME_PATH` mal | Fallan los generadores de PDF, no la aplicación | 🟩 Baja |

---

## Lo que no existe

`NO IDENTIFICADO` — se buscó y no hay evidencia en ningún sentido:

- `.env`, `.env.example`, `config.json`, `settings.yml` o equivalente.
- Banderas de funcionalidad (*feature flags*), interruptores de despliegue progresivo.
- Configuración remota o descargada en tiempo de ejecución.
- Secretos de repositorio en los workflows, más allá del `GITHUB_TOKEN` implícito.
- Certificado de firma de código para Windows o Android — su ausencia está **declarada** en
  `SECURITY.md` y en las notas de cada release, no oculta.

---

[⬅ Anterior: APIs e integraciones](09-apis-and-integrations.md) · [Índice](README.md) · [Siguiente: Seguridad ➡](11-security.md)
