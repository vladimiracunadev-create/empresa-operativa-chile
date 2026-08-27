# 14 · Solución de problemas

[⬅ Anterior: Despliegue y operación](13-deployment-and-operations.md) · [Índice](README.md) · [Siguiente: Riesgos ➡](15-risks-and-technical-debt.md)

---

Cada entrada sigue el mismo esquema: **síntoma → causa probable → cómo diagnosticarlo → solución →
archivos implicados → riesgo de la solución.** Las causas salen del código, no de la experiencia:
donde algo no pudo comprobarse se dice.

**Antes de nada, el comando que descarta la mitad de los problemas:**

```bash
node scripts/build-all.mjs && node --test tests/*.test.mjs
```

---

## Instalación y entorno

### La aplicación no arranca: «No existe apps/web/dist»

| | |
| --- | --- |
| **Síntoma** | `server.mjs` sale de inmediato con `No existe apps/web/dist. Ejecuta primero:` |
| **Causa** | `apps/web/dist/` **no está versionado** — está en `.gitignore`. Un clon recién hecho no lo tiene |
| **Diagnóstico** | `ls apps/web/dist/index.html` |
| **Solución** | `node scripts/build-all.mjs` |
| **Archivos** | `apps/empresa-operativa/server.mjs`, `.gitignore` |
| **Riesgo** | Ninguno |

Es el tropiezo número uno de quien llega al repositorio, y el servidor lo trata bien: imprime el
comando exacto que hay que ejecutar.

### `pnpm install` no instala nada

| | |
| --- | --- |
| **Síntoma** | «Already up to date», `node_modules` vacío o inexistente |
| **Causa** | **Correcto.** El `package.json` raíz no declara dependencias ni devDependencies |
| **Diagnóstico** | `node -p "Object.keys(require('./package.json').dependencies ?? {}).length"` → `0` |
| **Solución** | Ninguna. `pnpm install` sólo hace falta en `apps/android/` y `apps/contador-desktop/` |
| **Archivos** | `package.json` |
| **Riesgo** | Ninguno |

### Errores de sintaxis al ejecutar cualquier script

| | |
| --- | --- |
| **Síntoma** | `SyntaxError: Unexpected token`, `Cannot use import statement outside a module` |
| **Causa** | Node por debajo de 20. El repositorio usa ESM y sintaxis moderna |
| **Diagnóstico** | `node --version` |
| **Solución** | Actualizar a Node ≥ 20; CI prueba en 20 y 22 |
| **Archivos** | `package.json` (`engines.node`) |
| **Riesgo** | Ninguno |

### `npm install` deja el proyecto en un estado raro

| | |
| --- | --- |
| **Síntoma** | Versiones distintas de las del lockfile, o `node_modules` inesperado |
| **Causa** | **El gestor del repositorio es `pnpm`**, declarado en `packageManager`. `npm` ignora `pnpm-lock.yaml` |
| **Diagnóstico** | `node -p "require('./package.json').packageManager"` → `pnpm@11.2.2` |
| **Solución** | Borrar `node_modules`, usar `pnpm install --frozen-lockfile` |
| **Archivos** | `package.json`, `pnpm-lock.yaml` |
| **Riesgo** | Ninguno |

> ⚠️ `apps/android/` tiene versionados **`pnpm-lock.yaml` y `package-lock.json` a la vez**. El
> workflow usa pnpm; el `package-lock.json` no lo consume nadie, pero induce al error. Ver
> [15 · Riesgos](15-risks-and-technical-debt.md).

---

## Ejecución

### El puerto 4180 está ocupado

| | |
| --- | --- |
| **Síntoma** | `EADDRINUSE` |
| **Causa** | Otro proceso —probablemente otra instancia del propio servidor— escucha ahí |
| **Diagnóstico** | Windows: `netstat -ano \| findstr :4180`. Linux/macOS: `lsof -i :4180` |
| **Solución** | `PORT=4181 node apps/empresa-operativa/server.mjs`, o cerrar el otro proceso |
| **Archivos** | `apps/empresa-operativa/server.mjs` |
| **Riesgo** | Si se cambia el puerto, `CAPTURE_URL` deja de apuntar bien y las capturas fallan |

### La app carga en blanco, o se queda en «Cargando…»

| | |
| --- | --- |
| **Síntoma** | Sólo el mensaje de arranque de `index.html` |
| **Causa probable** | Un módulo ES falló al cargar. El caso clásico: **un archivo del bundle importa `node:*`** |
| **Diagnóstico** | Consola del navegador. Y `grep -rl "from 'node:" apps/web/dist/` |
| **Solución** | Rehacer el build: `node scripts/build-web.mjs` **aborta** si algún archivo publicado importa `node:*` y nombra los culpables |
| **Archivos** | `scripts/build-web.mjs`, `apps/web/src/index.html` |
| **Riesgo** | Ninguno |

El estado inicial de `index.html` está pensado justo para esto: si los módulos fallan, lo que queda a
la vista es un mensaje, no una página en blanco sin explicación.

### El APK se instala pero muestra una pantalla en blanco

| | |
| --- | --- |
| **Síntoma** | La app abre, la WebView arranca, no hay contenido |
| **Causa** | **El APK se empaquetó vacío.** Es el fallo que `verify-apk.mjs` existe para atrapar |
| **Diagnóstico** | `node scripts/verify-apk.mjs ruta/al.apk` |
| **Solución** | `node scripts/build-all.mjs && node apps/android/copiar-www.mjs`, después `cap sync android` y recompilar |
| **Archivos** | `scripts/verify-apk.mjs`, `apps/android/copiar-www.mjs`, `.github/workflows/android.yml` |
| **Riesgo** | Ninguno |

**Un APK vacío compila perfectamente y deja todas las señales del build en verde.** Nunca se publique
un APK sin pasar el verificador.

### La app de Windows abre pero no ve los datos que había

| | |
| --- | --- |
| **Síntoma** | Espacio de trabajo vacío tras reinstalar |
| **Causa probable** | Cambió el `identifier` de `tauri.conf.json`, así que `app_data_dir()` apunta a otro sitio |
| **Diagnóstico** | Pestaña **Datos** de la app, que muestra `dataDir` vía `app_info()`. Comparar con el directorio anterior |
| **Solución** | Restaurar el `identifier` original, o importar un respaldo |
| **Archivos** | `apps/contador-desktop/src-tauri/tauri.conf.json`, `src/lib.rs` |
| **Riesgo** | 🟥 Cambiar el identificador **deja huérfanos** los datos existentes |

### El espejo en disco no se actualiza (Windows)

| | |
| --- | --- |
| **Síntoma** | `real.json` no cambia aunque se registren operaciones |
| **Causa probable** | El `invoke` falla; la app **sigue funcionando** con `localStorage` y sólo avisa por consola |
| **Diagnóstico** | Consola de la WebView: `No se pudo escribir el espejo en disco:` |
| **Solución** | Revisar permisos del directorio de datos; comprobar que el `payload` es JSON válido |
| **Archivos** | `apps/web/src/lib/platform.js`, `src-tauri/src/lib.rs` |
| **Riesgo** | Ninguno al diagnosticar. **Mientras dure, los datos sólo están en `localStorage`** |

El espejo es «best effort» por decisión explícita: perder la sesión por un error de escritura sería
peor que perder el espejo. La contrapartida es que el fallo es silencioso salvo en la consola.

### Los datos desaparecieron

| | |
| --- | --- |
| **Síntoma** | La app arranca vacía |
| **Causas** | Se borraron los datos del sitio; se desinstaló el APK; se abrió en otro navegador o perfil; se cambió de modo (real ↔ sandbox) |
| **Diagnóstico** | Comprobar el selector de modo. En la consola: `Object.keys(localStorage).filter(k => k.startsWith('empresa-operativa-chile'))` |
| **Solución** | Importar el último respaldo desde la pestaña **Datos** |
| **Archivos** | `apps/web/src/lib/platform.js`, `packages/company-operations/store.mjs` |
| **Riesgo** | Importar con `replace` **sustituye** el contenido. Con fusión, respeta los ejercicios cerrados |

**Sin respaldo no hay recuperación.** No hay servidor que respalde por nadie.

---

## Cálculo y reglas tributarias

### «No hay reglas verificadas para el año comercial N»

| | |
| --- | --- |
| **Síntoma** | `Error: No hay reglas verificadas para el año comercial 2027. Disponibles: 2026` |
| **Causa** | **Comportamiento correcto y deliberado.** No existe `rules/2027.json` |
| **Diagnóstico** | `ls packages/chile-tax-rules/rules/` |
| **Solución** | Crear el archivo del año, **verificando cada tasa contra su fuente oficial**, y `node scripts/build-rules.mjs` |
| **Archivos** | `packages/chile-tax-rules/index.mjs`, `rules/`, `scripts/build-rules.mjs` |
| **Riesgo** | 🟥 **Nunca** hacer que degrade al año anterior. `CONTRIBUTING.md` lo prohíbe y hay una prueba que lo fija |

Un cálculo con la tasa del año equivocado **no falla**: devuelve un número plausible que aparece
meses después como una diferencia con el SII. Que esto lance es la garantía más importante del
sistema.

### CI falla: «Las reglas embebidas no están sincronizadas»

| | |
| --- | --- |
| **Síntoma** | `build-rules.mjs --check` en rojo |
| **Causa** | Se editó `rules/<año>.json` sin regenerar, o se editó `rules.generated.mjs` a mano |
| **Diagnóstico** | `node scripts/build-rules.mjs --check` |
| **Solución** | `node scripts/build-rules.mjs` y commitear el generado |
| **Archivos** | `rules/<año>.json`, `rules.generated.mjs` |
| **Riesgo** | Editar el generado a mano deja el sistema calculando con tasas que ningún JSON respalda |

### La patente municipal sale distinta de la que cobra el municipio

| | |
| --- | --- |
| **Síntoma** | Diferencia con el aviso de la municipalidad |
| **Causa** | **La tasa concreta de una comuna NO está en el repositorio.** El archivo guarda el **rango legal** (0,25 %–0,5 %); cada municipalidad fija la suya por ordenanza. Además, la base cambia según la etapa del negocio |
| **Diagnóstico** | Ficha municipal de la app: comuna, tasa y su estado. `node apps/contador-cli/src/index.mjs patente-municipal --etapa funcionamiento --cpt N` |
| **Solución** | Verificar la tasa con la municipalidad y registrarla en la ficha |
| **Archivos** | `rules/2026.json` (`municipalPatent`), `packages/accounting-engine/municipal-patent.mjs` |
| **Riesgo** | Ninguno |

El propio archivo de reglas lo advierte, y también que **BCN/LeyChile no respondió el 16-08-2026**:
reverificar el enlace antes de usar la cifra en una declaración real.

### El F29 de la app no cuadra con la propuesta del SII

| | |
| --- | --- |
| **Síntoma** | Diferencia con el formulario oficial |
| **Causa** | **Limitación declarada.** `f29Basic` es una simulación educativa básica: no modela exenciones, proporcionalidad de IVA, activos fijos, importaciones ni regímenes especiales. Tampoco **reajusta** el remanente (art. 27 del D.L. 825) |
| **Diagnóstico** | Comparar contra el RCV y la propuesta oficial. Revisar `rejectedVat` y las operaciones con `vatCreditEligible: false` |
| **Solución** | Conciliar. **Manda el SII** |
| **Archivos** | `packages/accounting-engine/index.mjs`, `rules/2026.json` (`warnings`) |
| **Riesgo** | Ninguno |

### El CPT sale en cero

| | |
| --- | --- |
| **Síntoma** | Capital propio tributario simplificado = 0 |
| **Causa probable** | **Comportamiento correcto**: el método del art. 14 D) N.º 3 (j) tiene **piso en cero**. Si el resultado es negativo, el CPT se considera $0 |
| **Diagnóstico** | `node apps/contador-cli/src/index.mjs cpt --regimen "Pro Pyme General (14 D N.º 3)" ...` y revisar los componentes |
| **Solución** | Ninguna si es correcto. Si no lo es, revisar retiros, pérdidas y disminuciones de capital |
| **Archivos** | `packages/accounting-engine/tax-equity.mjs`, `rules/2026.json` |
| **Riesgo** | Ninguno |

### El capital enterado no cuadra con lo aportado

| | |
| --- | --- |
| **Síntoma** | Cifras distintas entre la ficha y los movimientos |
| **Causa probable** | Un aporte registrado **dos veces**: como movimiento patrimonial y como operación de caja **sin enlazar** |
| **Diagnóstico** | Buscar operaciones de tipo `capital` con `equityMovementId: null` |
| **Solución** | Registrar el movimiento con `registerCashMovement: true`, que crea la operación **enlazada** |
| **Archivos** | `packages/company-operations/workspace.mjs` (`addEquityMovement`, `effectiveEquityMovements`) |
| **Riesgo** | Corregir a mano en un período cerrado no se puede: hay que reabrirlo con motivo |

### «Capital social», «suscrito» y «enterado» aparecen como pendientes

| | |
| --- | --- |
| **Síntoma** | La app marca campos en `pendingConfirmation` |
| **Causa** | **Correcto.** Se migró desde el campo antiguo `capital`: ese valor pasó a `capitalEnterado` y la app **no inventa** el social ni el suscrito |
| **Diagnóstico** | `getCapitalProfile().pendingConfirmation` |
| **Solución** | Confirmar cada cifra contra el estatuto. Confirmarla la saca de la lista |
| **Archivos** | `packages/company-operations/capital.mjs` |
| **Riesgo** | Ninguno |

---

## Operaciones y cierres

### «El período YYYY-MM está cerrado»

| | |
| --- | --- |
| **Síntoma** | Error al agregar, editar o borrar una operación |
| **Causa** | **Correcto.** Un período cerrado es inmutable en las dos direcciones |
| **Diagnóstico** | `isPeriodClosed(period)`, o la vista de cierre |
| **Solución** | Reabrir el período **indicando el motivo**, que queda en la bitácora |
| **Archivos** | `workspace.mjs` (`addTransaction`, `closePeriod`, `reopenPeriod`) |
| **Riesgo** | Reabrir queda registrado para siempre. Es lo correcto, pero deja rastro |

### «Reabrir un período exige indicar el motivo»

Correcto por diseño: la trazabilidad importa más que la inmutabilidad absoluta. Pasar un texto no
vacío como segundo argumento.

### «Un paso sólo puede marcarse como realizado si registras su evidencia»

| | |
| --- | --- |
| **Síntoma** | Error al marcar un trámite como hecho |
| **Causa** | **Correcto.** La app no da por cumplido un trámite ante un organismo externo porque alguien marcó una casilla |
| **Solución** | Registrar folio, certificado o comprobante en `evidenceRef` |
| **Archivos** | `workspace.mjs` (`updateFormationStep`) |
| **Riesgo** | Ninguno |

### El semáforo nunca dice «todo en orden»

| | |
| --- | --- |
| **Síntoma** | `healthCheck` siempre devuelve observaciones |
| **Causa** | **Deliberado.** El objetivo es detectar el hueco, no tranquilizar |
| **Diagnóstico** | Revisar los `code` devueltos: `company.missing`, `formation.pending`, `evidence.missing`, `vat.rejected`, `obligations.overdue` |
| **Solución** | Resolver cada observación; las de nivel `error` primero |
| **Archivos** | `workspace.mjs` (`healthCheck`) |
| **Riesgo** | Ninguno |

### «El archivo no es un respaldo válido de esta aplicación»

| | |
| --- | --- |
| **Síntoma** | Falla la importación |
| **Causa** | Falta `format: empresa-operativa-chile/backup`, o `formatVersion` no es 1 ni 2 |
| **Diagnóstico** | Abrir el JSON y mirar las dos primeras claves |
| **Solución** | Usar un respaldo exportado por la propia aplicación |
| **Archivos** | `workspace.mjs` (`importAll`, `exportAll`) |
| **Riesgo** | Ninguno |

### El sandbox no se siembra

| | |
| --- | --- |
| **Síntoma** | El entorno de práctica sale vacío, o `seedSandboxWorkspace` lanza |
| **Causas** | (a) Se llamó en modo `real` → **lanza, correctamente**; (b) el sandbox ya tiene operaciones → retorno temprano sin sembrar |
| **Diagnóstico** | `ws.mode` y `ws.listTransactions().length` |
| **Solución** | Usar `--sandbox`; para resembrar, vaciar antes el espacio de práctica |
| **Archivos** | `workspace.mjs` (`seedSandboxWorkspace`) |
| **Riesgo** | Vaciar el sandbox pierde lo que hubiera en él |

---

## Documentación y build

### CI falla: «El glosario / la guía / los atajos no están sincronizados»

| | |
| --- | --- |
| **Síntoma** | Uno de los `--check` en rojo |
| **Causa** | Se editó a mano un documento **generado**. La fuente es el paquete, no el `.md` |
| **Diagnóstico** | El propio comando `--check` dice cuál |
| **Solución** | Editar el paquete (`packages/glossary`, `onboarding`, `shortcuts`) y regenerar |
| **Archivos** | `scripts/build-glossary.mjs`, `build-guide.mjs`, `build-shortcuts.mjs` |
| **Riesgo** | Regenerar **sobrescribe** el `.md`: los cambios hechos a mano se pierden |

### CI falla: «El build no es reproducible»

| | |
| --- | --- |
| **Síntoma** | El `build-info.json` cambia entre dos builds seguidos |
| **Causa** | Algo depende del reloj o del orden del sistema de archivos |
| **Diagnóstico** | El paso imprime el `diff` |
| **Solución** | Localizar la fuente de no determinismo (marcas de tiempo, orden de `readdir` sin ordenar) |
| **Archivos** | `scripts/build-web.mjs` |
| **Riesgo** | 🟧 Si no es reproducible, **el artefacto que se publica no es el que se probó** |

### CI falla: «Estas acciones no están fijadas a un SHA»

Fijar la acción a un SHA de 40 caracteres, con la etiqueta como comentario al lado. Es el estilo del
repositorio y el paso lo exige.

### «No se encontró Chrome ni Edge. Define CHROME_PATH.»

| | |
| --- | --- |
| **Síntoma** | Falla la generación de PDF o de capturas |
| **Causa** | La autodetección no encontró el navegador |
| **Solución** | `CHROME_PATH="/ruta/al/chrome" node scripts/build-manual.mjs` |
| **Archivos** | `scripts/lib/chrome.mjs` |
| **Riesgo** | Ninguno. No afecta a la aplicación |

### «X.pdf salió vacío o demasiado pequeño»

| | |
| --- | --- |
| **Síntoma** | `printPdf` lanza |
| **Causa** | Las imágenes no se embebieron, o el documento quedó por debajo del suelo de tamaño |
| **Diagnóstico** | `EOC_KEEP_HTML=1` conserva el HTML intermedio e imprime su ruta; abrirlo en el navegador muestra qué falta |
| **Solución** | Comprobar que existen las imágenes referenciadas. En documentos legítimamente cortos, bajar `minBytes` en la llamada |
| **Archivos** | `scripts/lib/chrome.mjs` |
| **Riesgo** | Bajar el suelo para todos desactivaría la comprobación donde sí sirve |

### Los diagramas Mermaid salen como bloques de código en el PDF

| | |
| --- | --- |
| **Síntoma** | El PDF muestra el texto del diagrama, y la consola avisó |
| **Causa** | `mmdc` no está instalado. **El generador no falla a propósito** |
| **Diagnóstico** | `mmdc --version` |
| **Solución** | `pnpm add -g @mermaid-js/mermaid-cli` y regenerar |
| **Archivos** | `scripts/build-system-docs.mjs` |
| **Riesgo** | Ninguno |

### Un diagrama sale ilegible en el PDF

| | |
| --- | --- |
| **Síntoma** | Aviso: `mide N px y en A4 se reduce al X %` |
| **Causa** | El diagrama es más ancho de lo que cabe legible en una A4 |
| **Solución** | Partirlo por dominio, o cambiar la orientación a `TB`. Es lo que se hizo con el diagrama entidad-relación de [07](07-database.md) |
| **Archivos** | `scripts/build-system-docs.mjs` |
| **Riesgo** | Ninguno |

---

## Diagnóstico general

| Qué quieres saber | Comando |
| --- | --- |
| ¿Está todo sano? | `node scripts/build-all.mjs && node --test tests/*.test.mjs` |
| ¿Coinciden reglas y generado? | `node scripts/build-rules.mjs --check` |
| ¿Son razonables las tasas? | `node scripts/validate-rules.mjs` |
| ¿Qué reglas hay y de cuándo? | `node apps/contador-cli/src/index.mjs reglas` |
| ¿El motor calcula bien? | `node apps/contador-cli/src/index.mjs f29 --ventas-netas 1000000 --compras-netas 300000` |
| ¿Qué dice mi espacio de trabajo? | `node apps/contador-cli/src/index.mjs resumen --periodo 2026-08` |
| ¿Qué pasó y cuándo? | `node apps/contador-cli/src/index.mjs bitacora --limite 100` |
| ¿El APK sirve? | `node scripts/verify-apk.mjs ruta/al.apk` |
| ¿Hay algo que importe `node:*` en el bundle? | `grep -rl "from 'node:" apps/web/dist/` |
| ¿Cuál es el build publicado? | `cat apps/web/dist/build-info.json` |

**La bitácora es la primera herramienta de diagnóstico del producto**, no la última: registra toda
mutación con su fecha, su modo y su detalle, y no se puede borrar.

---

[⬅ Anterior: Despliegue y operación](13-deployment-and-operations.md) · [Índice](README.md) · [Siguiente: Riesgos ➡](15-risks-and-technical-debt.md)
