# 16 · Glosario

[⬅ Anterior: Riesgos](15-risks-and-technical-debt.md) · [Índice](README.md) · [Siguiente: Resumen ejecutivo ➡](17-executive-summary.md)

---

> **Fuente de verdad de los términos del dominio:** [`docs/GLOSSARY.md`](../GLOSSARY.md), **54
> términos generados desde `packages/glossary/`**, con su definición larga, sus «no confundir con» y
> su base legal. CI falla si ese documento se desvía del paquete.
>
> Este glosario **no lo duplica**. Cubre lo que aquel no cubre: los términos **técnicos** del
> repositorio, los nombres propios del sistema y las abreviaturas de esta serie. Cuando un término
> aparece en ambos, aquí se explica lo que significa **en el código**, y se remite allá para lo que
> significa en la ley.

Las definiciones están escritas para que las entienda alguien que no programa. Cuando hace falta un
tecnicismo, se explica.

---

## Términos del dominio — dónde están

Los 54 términos contables, tributarios y municipales —capital social, capital enterado, CPT, F29,
remanente de crédito fiscal, patente municipal, UTM, DTE, RCV…— están en
[`docs/GLOSSARY.md`](../GLOSSARY.md) y dentro de la propia aplicación, en la pestaña **Glosario**,
con ayuda al pasar el cursor sobre cualquier término.

**Los seis que más se confunden**, y que son la razón de ser del producto, se distinguen así:

| Término | En una frase |
| --- | --- |
| **Capital social** | La cifra que dice el estatuto |
| **Capital suscrito** | Lo que el accionista se comprometió a pagar |
| **Capital enterado** | Lo que efectivamente pagó. **Lo único que es patrimonio** |
| **Patrimonio contable** | Lo que dice el balance: activo menos pasivo |
| **Capital propio tributario** | Lo que dice la ley tributaria, con sus propias reglas |
| **Capital base de patente** | Lo que la municipalidad usa para cobrar, que depende de la etapa del negocio |

Que sean seis cosas distintas y no un número es, literalmente, el argumento del sistema.

---

## Nombres propios del sistema

Cosas que sólo existen en este repositorio y que hay que conocer para leer el código.

| Término | Qué es |
| --- | --- |
| **Empresa Operativa Chile** | La aplicación. El mismo producto en navegador, Android, Windows y línea de comandos |
| **EMPRESA REAL** | El espacio de trabajo de la empresa de verdad. En el código, `mode: 'real'` |
| **SANDBOX** | El espacio de práctica, con datos de ejemplo. `mode: 'sandbox'`. **Nunca hay una ruta de código que copie una operación de un espacio al otro** |
| **Espacio de trabajo** (*workspace*) | Todos los datos de una empresa en un modo: ficha, operaciones, obligaciones, cierres y bitácora. En el código, `CompanyWorkspace` |
| **Motor** | `packages/` — el cálculo y la operación, sin interfaz. Viaja completo a las tres plataformas |
| **Superficie** | Cada una de las cuatro formas de usar el producto: navegador, Android, Windows y CLI |
| **El gate `node:*`** | La comprobación que **aborta el build** si algún archivo que va a viajar al dispositivo importa un módulo de Node |
| **Reglas del año** | `packages/chile-tax-rules/rules/<año>.json`: las tasas, con su fuente oficial y su fecha de verificación |
| **Bitácora** | El registro de auditoría. Se puede añadir, nunca borrar |
| **Espejo** (*mirror*) | La copia en archivos JSON que la versión de Windows mantiene en el disco |
| **Semáforo** | `healthCheck()`: el diagnóstico que **no dice «todo en orden»** cuando faltan evidencias |
| **Ruta / Empezar aquí** | Las 14 etapas de `packages/onboarding/`, desde antes de que la empresa exista |
| **Período** | Un mes, escrito `YYYY-MM`. No se guarda: se deriva de la fecha de cada operación |
| **Ejercicio** | Un año comercial. Se cierra una vez y queda congelado |

---

## Términos técnicos

Ordenados por lo que cuesta entenderlos sin explicación.

### Almacenamiento

| Término | Qué significa aquí |
| --- | --- |
| **`localStorage`** | Un almacén de texto que el navegador guarda por sitio web, en el propio dispositivo. Sobrevive a cerrar el navegador; **no** sobrevive a «borrar datos del sitio» |
| **Almacén** (*store*) | El contrato de seis funciones —leer, escribir, añadir, leer todo, respaldar, listar respaldos— que `CompanyWorkspace` usa sin saber qué hay debajo |
| **Adaptador** | Cada implementación de ese contrato: memoria, `localStorage` o archivos |
| **Espacio de nombres** (*namespace*) | El prefijo `empresa-operativa-chile:real:` que separa un modo de otro. **Es toda la barrera entre lo real y la práctica** |
| **Append-only** | «Sólo se añade». Se pueden agregar líneas, nunca borrarlas ni cambiarlas |
| **NDJSON** | Un archivo de texto con un dato JSON por línea. Permite añadir sin reescribir lo anterior |
| **Escritura atómica** | Escribir en un archivo temporal y después renombrarlo. Un corte de luz deja intacto el archivo anterior en vez de uno a medio escribir |
| **Snapshot / fotografía** | Una copia congelada de un momento. Aquí: el respaldo, el cierre mensual y el cierre anual |
| **Cuota** | El límite de espacio que el navegador da a `localStorage`, del orden de 5 a 10 MB |

### Arquitectura

| Término | Qué significa aquí |
| --- | --- |
| **Local-first** | El producto funciona entero en el dispositivo. No hay servidor que guarde nada y no hace falta conexión |
| **PWA** | *Progressive Web App*: una web que se instala como aplicación y funciona sin conexión |
| **Service worker** | Un pequeño programa del navegador que guarda los archivos de la app para que abra sin conexión. **No toca los datos del usuario** |
| **WebView** | Un navegador incrustado dentro de otra aplicación. Es lo que muestra la app en Android y en Windows |
| **Capacitor** | La herramienta que envuelve la web en un APK de Android |
| **Tauri** | La que la envuelve en un ejecutable de Windows, con un proceso en Rust al lado |
| **IPC** | *Inter-Process Communication*: cómo la parte web habla con la parte Rust |
| **ESM** | *ECMAScript Modules*: la forma moderna y estándar de dividir JavaScript en módulos. Todo el repositorio la usa |
| **`node:*`** | Los módulos que sólo existen en Node —leer archivos, red, rutas—. **Un navegador no los tiene**, y de ahí la regla dura |
| **Bundler** | Una herramienta que junta y comprime el código antes de publicarlo. **Este proyecto no usa ninguna** |
| **Síncrono** | Que ocurre de inmediato, sin esperar. Todo el motor lo es, y por eso `localStorage` encaja |
| **Puro** (función pura) | Una función que con las mismas entradas da siempre la misma salida y no toca nada más |
| **Congelado** (`Object.freeze`) | Un objeto que ya no puede modificarse. Se usa en los cierres anuales y en los catálogos |

### Datos y cálculo

| Término | Qué significa aquí |
| --- | --- |
| **Derivar** | Calcular algo cada vez a partir de los datos, en vez de guardarlo. El período se deriva de la fecha; el resumen del mes, de las operaciones |
| **Normalizar** | Dejar un dato en su forma canónica antes de guardarlo: recortar espacios, redondear importes, poner valores por defecto |
| **Migración en lectura** | Adaptar un dato antiguo al leerlo **sin reescribirlo**. Por eso instalar esta versión sobre datos viejos no puede corromperlos |
| **`PENDING_CONFIRMATION`** | La marca con la que el sistema declara que **un dato no lo sabe**, en vez de poner un cero |
| **Invariante** | Algo que siempre debe ser cierto. El del producto: real y sandbox no se mezclan |
| **Precondición** | Lo que debe cumplirse antes de llamar a una función. Ejemplo: el período no puede estar cerrado |
| **Idempotente** | Que repetirlo no cambia el resultado. `seedSandboxWorkspace` lo es: si ya hay operaciones, no hace nada |
| **Enlace `equityMovementId`** | El campo que conecta un aporte con su movimiento de caja para que **el mismo peso no se cuente dos veces** |

### Seguridad

| Término | Qué significa aquí |
| --- | --- |
| **CSP** | *Content-Security-Policy*: una regla que le dice al navegador de dónde puede cargar cosas. Aquí, sólo del propio sitio |
| **XSS** | Inyección de marcado: que un texto escrito por alguien acabe ejecutándose como código de la página |
| **Escapar** | Convertir los caracteres peligrosos de un texto en inofensivos antes de mostrarlo |
| **Path traversal** | Usar `..` en una ruta para salir del directorio permitido y leer archivos que no se debían |
| **Superficie de ataque** | Todo aquello por donde alguien podría entrar. La de este sistema es pequeña porque no hay servidor ni red |
| **Fijar a un SHA** (*pinning*) | Anclar una herramienta a una versión exacta e inmutable, en vez de a una etiqueta que puede cambiar |
| **Telemetría** | Datos de uso que una aplicación envía a su fabricante. **Aquí no hay** |
| **Firma de código** | Un certificado que prueba quién construyó un programa. **Estos binarios no la tienen**, y está declarado |

### Desarrollo y publicación

| Término | Qué significa aquí |
| --- | --- |
| **CI** | *Integración continua*: comprobaciones automáticas en cada cambio |
| **Workflow** | Cada uno de esos procesos automáticos. Hay seis |
| **Gate** | Una comprobación que **detiene** el proceso si falla. No es un aviso |
| **Build reproducible** | Que construir dos veces produzca exactamente lo mismo. Si no, lo que se publica no es lo que se probó |
| **`buildId`** | La huella de todos los archivos publicados. Cambiarla invalida la copia guardada en el navegador |
| **Artefacto** | El archivo que produce una construcción: el APK, el instalador, el PDF |
| **Release** | Una publicación con nombre, notas y archivos descargables |
| **`SHA256SUMS.txt`** | La lista de huellas de cada archivo, para comprobar que lo descargado es lo publicado |
| **Lockfile** | El archivo que fija las versiones exactas de las dependencias. Aquí, `pnpm-lock.yaml` |
| **pnpm** | **El gestor de paquetes de este repositorio.** Escribir `npm` es un error |
| **Monorepo** | Un solo repositorio con varios paquetes y aplicaciones dentro |

---

## Abreviaturas y siglas

| Sigla | Significado | Contexto |
| --- | --- | --- |
| **SII** | Servicio de Impuestos Internos | La autoridad tributaria de Chile. **Cuando la app y el SII no coincidan, manda el SII** |
| **BCN** | Biblioteca del Congreso Nacional | Fuente del texto legal (LeyChile) |
| **LIR** | Ley sobre Impuesto a la Renta | |
| **D.L. 3.063** | Decreto Ley sobre Rentas Municipales, de 1979 | Su art. 24 rige la patente municipal |
| **CPT** | Capital Propio Tributario | Ver [`GLOSSARY.md`](../GLOSSARY.md) |
| **IDPC** | Impuesto de Primera Categoría | |
| **PPM** | Pago Provisional Mensual | |
| **IVA** | Impuesto al Valor Agregado | |
| **UTM** | Unidad Tributaria Mensual | **Cambia todos los meses** |
| **UF** | Unidad de Fomento | |
| **DTE** | Documento Tributario Electrónico | |
| **RCV** | Registro de Compras y Ventas | |
| **RES** | Registro de Empresas y Sociedades | Donde se constituye la sociedad |
| **SpA** | Sociedad por Acciones | El tipo societario que modela el sistema |
| **APK** | El archivo instalable de Android | |
| **MSI / NSIS** | Los dos formatos de instalador de Windows | |
| **CLI** | *Command-Line Interface* | La versión de línea de comandos |
| **ESM** | *ECMAScript Modules* | |
| **IPC** | *Inter-Process Communication* | |
| **CSP** | *Content-Security-Policy* | |
| **PWA** | *Progressive Web App* | |
| **SVG / PNG** | Formatos de imagen: vectorial y de mapa de bits | |
| **NDJSON** | *Newline-Delimited JSON* | |

---

## Convenciones de esta serie

| Marcador | Significado |
| --- | --- |
| *(sin marcador)* | Hecho verificado leyendo el repositorio, con archivo y símbolo citados |
| `INFERENCIA` | Conclusión razonada a partir del código, no afirmación literal del repositorio |
| `REQUIERE VALIDACIÓN` | Depende de una ejecución real, de un servicio externo o de una decisión humana |
| `NO DOCUMENTADO EN EL REPOSITORIO` | Existe en el código y nadie lo explica |
| `NO IDENTIFICADO` | Se buscó y no hay evidencia en ningún sentido |
| 🟥 🟧 🟨 🟩 | Crítico · Alto · Medio · Bajo |
| **H-nn** | Hallazgo de [15 · Riesgos](15-risks-and-technical-debt.md) |
| **R-n** / **V-n** | Riesgo asumido / Decisión que requiere validación humana |
| **P1 · P2 · P3** | Prioridad: antes del próximo release · próximo ciclo · cuando toque |

---

## Estados que aparecen en los datos

| Estado | Dónde | Qué significa |
| --- | --- | --- |
| `pending` · `in_progress` · `done` · `blocked` | Pasos de constitución y obligaciones | `done` **exige evidencia** |
| `real` · `sandbox` | Modo del espacio de trabajo | |
| `DECLARADO` · resto de `DATA_STATUS` | Movimientos patrimoniales | Distingue lo declarado de lo confirmado |
| `usuario` · resto de `DATA_ORIGIN` | Movimientos patrimoniales | De dónde vino el dato |
| `estimado por la aplicación` · `declarado por el usuario` | `balanceOrigin` en un cierre anual | **Nunca se presenta una estimación como un dato declarado** |
| `ESTIMADO` | Base de patente del año siguiente | Es una proyección, no una liquidación |
| `baseline` | `status` del archivo de reglas | Línea base operativa y educativa |
| `info` · `warn` · `error` | Observaciones del semáforo | |

---

## Nombres históricos

| Nombre | Estado |
| --- | --- |
| `company.capital` | **Campo heredado.** Hoy se mantiene sincronizado con `capitalProfile.capitalEnterado` para no romper vistas ni respaldos antiguos |
| `formatVersion: 1` | Formato de respaldo anterior. **Se sigue importando**: romper los respaldos que la gente ya tiene guardados sería peor que limpiar el formato |
| `contador-cli`, `contador-desktop` | Nombres de directorio anteriores al nombre actual del producto. Siguen así porque cambiarlos rompería rutas, workflows y enlaces |

---

[⬅ Anterior: Riesgos](15-risks-and-technical-debt.md) · [Índice](README.md) · [Siguiente: Resumen ejecutivo ➡](17-executive-summary.md)
