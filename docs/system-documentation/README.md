# 📕 Documentación de sistema — Empresa Operativa Chile

Documentación técnica completa del repositorio, escrita recorriendo el código fuente.
Complementa —no reemplaza— la documentación de producto que ya vive en [`docs/`](../README.md).

---

## Qué es este sistema

**Empresa Operativa Chile** es una aplicación *local-first* que acompaña a una sociedad chilena
(SpA) desde antes de existir hasta el cierre de cada mes y de cada año: constitución con evidencia
obligatoria, registro de operaciones, IVA con remanente arrastrado, borrador del F29, obligaciones,
capital y patrimonio, capital propio tributario, patente municipal, cierre inmutable y bitácora de
auditoría *append-only*.

El mismo motor de cálculo y la misma interfaz corren en **navegador (PWA)**, **Android (APK vía
Capacitor)** y **Windows (Tauri 2)**, más una **CLI** en Node. Los datos nunca salen del
dispositivo: no hay servidor, no hay cuentas y no hay telemetría.

## Propósito de esta documentación

Dejar el sistema **auditable y transferible**: que alguien que llega hoy pueda entender qué hace
cada módulo, por qué está construido así, dónde están los riesgos y cómo se instala, prueba y
publica — sin tener que preguntar a nadie.

## Público al que se dirige

| Perfil | Por dónde empezar |
| --- | --- |
| Persona técnica nueva en el proyecto | [18 · Guía del nuevo desarrollador](18-new-developer-guide.md) |
| Auditoría técnica o revisión de código | [03 · Arquitectura](03-architecture.md) → [11 · Seguridad](11-security.md) → [15 · Riesgos](15-risks-and-technical-debt.md) |
| Dirección / decisión | [17 · Resumen ejecutivo](17-executive-summary.md) |
| Persona no técnica | [01 · Visión general](01-system-overview.md), sección final |
| Quien opera el sistema | [13 · Despliegue y operación](13-deployment-and-operations.md) y [14 · Troubleshooting](14-troubleshooting.md) |

---

## 📑 Tabla de contenidos

| # | Documento | Qué contiene | Estado |
| --- | --- | --- | --- |
| 00 | **README** (este archivo) | Portada, índice, convenciones, pendientes | ✅ |
| 01 | [Visión general del sistema](01-system-overview.md) | Qué hace, para quién, límites; explicación para persona no técnica | ✅ |
| 02 | [Instalación y ejecución](02-installation-and-execution.md) | Requisitos, instalación, ejecución en las 4 superficies, carpetas que no están | ✅ |
| 03 | [Arquitectura](03-architecture.md) | Capas, decisiones, diagramas Mermaid, regla `node:*` | ✅ |
| 04 | [Mapa del código](04-code-map.md) | Inventario jerárquico con estado aparente de cada elemento | ✅ |
| 05 | [Referencia técnica](05-technical-reference.md) | Catálogo de funciones: firma, efectos, riesgo al modificar | ✅ |
| 06 | [Explicación profunda del código](06-deep-code-explanation.md) | Flujo por flujo, módulo a módulo | ✅ |
| 07 | [Persistencia](07-database.md) | No hay base de datos: cuál es el mecanismo real y cómo se versionan las reglas | ✅ |
| 08 | [Flujo de datos](08-data-flow.md) | Del teclado al disco y de vuelta; ciclo de las reglas tributarias | ✅ |
| 09 | [APIs e integraciones](09-apis-and-integrations.md) | Se demuestra que no hay red; contratos de datos e interfaces de plataforma | ✅ |
| 10 | [Configuración](10-configuration.md) | Variables de entorno, manifiestos, CSP, capacidades Tauri | ✅ |
| 11 | [Seguridad](11-security.md) | Controles presentes y ausentes, superficie real, hallazgos | ✅ |
| 12 | [Pruebas y calidad](12-testing-and-quality.md) | 13 suites, 158 pruebas, 6 workflows, gates propios | ✅ |
| 13 | [Despliegue y operación](13-deployment-and-operations.md) | Pages, APK, instaladores Windows, release, generación de PDF | ✅ |
| 14 | [Troubleshooting](14-troubleshooting.md) | Síntoma → causa → diagnóstico → solución → riesgo | ✅ |
| 15 | [Riesgos y deuda técnica](15-risks-and-technical-debt.md) | Hallazgos clasificados. **Informativo: no se corrigió nada** | ✅ |
| 16 | [Glosario](16-glossary.md) | Términos técnicos y de dominio, para persona no técnica | ✅ |
| 17 | [Resumen ejecutivo](17-executive-summary.md) | Para decisión, con esfuerzo cuantificado | ✅ |
| 18 | [Guía del nuevo desarrollador](18-new-developer-guide.md) | Itinerario de incorporación por días | ✅ |
| 19 | [Matriz de trazabilidad](19-traceability-matrix.md) | Funcionalidad → módulo → función → datos → prueba, en una fila | ✅ |

📁 [`assets/diagramas/`](assets/diagramas/) · los **19 diagramas Mermaid** rasterizados a SVG para el
PDF, cacheados por hash de su contenido
📁 [`pdf/`](pdf/) · **21 PDF · 602 páginas**: uno por documento más
[`documentacion-completa.pdf`](pdf/documentacion-completa.pdf) (300 páginas), generados con
[`scripts/build-system-docs.mjs`](../../scripts/build-system-docs.mjs)

---

## Qué documento es la fuente de verdad de cada tema

Este repositorio **ya tenía** documentación buena antes de esta serie. No se duplicó ni se movió
nada. La regla es: cuando dos documentos hablan del mismo tema, manda el de la columna izquierda.

| Tema | Fuente de verdad | Qué añade `system-documentation/` |
| --- | --- | --- |
| Decisiones de arquitectura | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) | Diagramas Mermaid, capas, y el mapa corregido (ver [15](15-risks-and-technical-debt.md)) |
| Uso de la aplicación | [`docs/MANUAL.md`](../MANUAL.md) | Nada: no se duplica el manual de usuario |
| Ruta para principiantes | [`docs/EMPEZAR-AQUI.md`](../EMPEZAR-AQUI.md) (generado) | Nada |
| Términos de dominio | [`docs/GLOSSARY.md`](../GLOSSARY.md) (generado) | [16](16-glossary.md) añade los términos **técnicos** que ese no cubre |
| Tasas, plazos y su fuente legal | [`packages/chile-tax-rules/rules/2026.json`](../../packages/chile-tax-rules/rules/2026.json) y [`docs/SOURCES-2026.md`](../SOURCES-2026.md) | [07](07-database.md) y [08](08-data-flow.md) documentan el **mecanismo** que las versiona |
| Rutina mensual / anual | [`docs/RUNBOOK-MENSUAL.md`](../RUNBOOK-MENSUAL.md) · [`docs/RUNBOOK-ANUAL.md`](../RUNBOOK-ANUAL.md) | Nada |
| Capital propio tributario | [`docs/tax/CAPITAL-PROPIO-TRIBUTARIO.md`](../tax/CAPITAL-PROPIO-TRIBUTARIO.md) | [06](06-deep-code-explanation.md) explica la implementación |
| Patente municipal | [`docs/municipal/PATENTE-MUNICIPAL.md`](../municipal/PATENTE-MUNICIPAL.md) | [06](06-deep-code-explanation.md) explica la implementación |
| Capital y patrimonio | [`docs/accounting/CAPITAL-PATRIMONIO.md`](../accounting/CAPITAL-PATRIMONIO.md) | [07](07-database.md) documenta el modelo de datos |
| Postura de seguridad | [`SECURITY.md`](../../SECURITY.md) | [11](11-security.md) añade la revisión del código y los controles ausentes |
| Cómo contribuir | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | [18](18-new-developer-guide.md) añade el itinerario de lectura |
| Historia de versiones | [`CHANGELOG.md`](../../CHANGELOG.md) | Nada |
| Qué viene | [`docs/ROADMAP.md`](../ROADMAP.md) | [17](17-executive-summary.md) cuantifica el esfuerzo |

---

## Datos del análisis

| Campo | Valor |
| --- | --- |
| Repositorio | `empresa-operativa-chile` |
| Rama analizada | `main` |
| Commit analizado | `2b0e006ba02c406346f08a23c739c81b89c93b0a` |
| Fecha del commit | 2026-08-17 |
| Versión del manifiesto | `1.5.0` (`package.json`) |
| Fecha del análisis | 2026-08-27 |
| Archivos versionados | 330 al incorporar la capa v1.5 |
| Archivos de código analizados | 72 (`.mjs`, `.js`, `.rs`) — 13.251 líneas |
| Suites de prueba | 13 · **158 pruebas, todas verdes** |
| Workflows de CI | 6 |
| Dependencias de producción | **0** |

## Convenciones usadas

| Marcador | Significado |
| --- | --- |
| *(sin marcador)* | Hecho verificado leyendo el repositorio, con archivo y símbolo citados |
| `INFERENCIA` | Conclusión razonada a partir del código, no afirmación literal del repositorio |
| `REQUIERE VALIDACIÓN` | Depende de una ejecución real, de un servicio externo o de una decisión humana |
| `NO DOCUMENTADO EN EL REPOSITORIO` | Existe en el código y nadie lo explica |
| `NO IDENTIFICADO` | Se buscó y no hay evidencia en ningún sentido |

Otras reglas de escritura de esta serie:

- **Identificadores en su forma original.** `f29Basic`, `capitalEnterado`, `rules/2026.json` y
  `EMPRESA_OPERATIVA_DATA` se citan sin traducir, para que buscar el término en el repositorio
  encuentre exactamente lo que el documento dice.
- **Las cifras se contaron.** Ningún «unos cuantos» ni «aproximadamente»: cada número de estos
  documentos salió de un comando, y el comando está registrado en
  [12 · Pruebas y calidad](12-testing-and-quality.md#comandos-ejecutados-y-su-salida-real).
- **Cada diagrama lleva texto debajo** que explica qué muestra **y qué no**. Ningún diagrama es
  necesario para entender el documento.
- **Cada documento se lee solo.** Hay enlaces al resto, pero no se supone que se hayan leído.

---

## ✅ Qué se verificó ejecutando

No es una lista de intenciones: cada fila se ejecutó y su salida está en
[12 · Pruebas y calidad](12-testing-and-quality.md#comandos-ejecutados-y-su-salida-real).

| Comprobación | Resultado |
| --- | --- |
| Las 158 pruebas | ✅ `pass 158 · fail 0` en la verificación v1.5 |
| Los 5 gates de sincronía documental | ✅ los cinco en verde |
| `validate-rules.mjs` | ✅ reglas 2026 validadas |
| Build completo | ✅ 49 archivos, build `630ed69fe514` |
| Build **reproducible** | ✅ dos builds seguidos, `build-info.json` idéntico |
| La CLI (4 comandos, valores exactos) | ✅ |
| El servidor local sirve la app | ✅ |
| Los 3 vectores de *path traversal* | ✅ los tres → **404** |
| Método no permitido | ✅ `POST /` → **405** |
| Sin secretos, respaldos reales ni certificados versionados | ✅ ninguna coincidencia |
| Ausencia de llamadas de red | ✅ una sola, en `sw.js`, al propio origen |
| Los 401 enlaces relativos de esta serie y del README raíz | ✅ **0 rotos** |
| Las 9 anclas internas | ✅ **0 rotas** |
| Los 19 diagramas Mermaid compilan | ✅ |
| Ningún diagrama se imprime ilegible en A4 | ✅ tras partir el ER y reorientar cuatro |
| Maquetado al ancho exacto de una A4 (688 px) | ✅ **0 tablas desbordadas**, 0 imágenes fuera de caja, 0 imágenes rotas |
| Los 21 PDF se generan | ✅ 602 páginas |

## ⚠️ Pendientes de validar

Lo que esta documentación **no pudo verificar**, y por qué. Se declara aquí en vez de esconderse.

| Pendiente | Por qué no se pudo verificar | Cómo se validaría |
| --- | --- | --- |
| Compilación del APK de Android | Requiere JDK 21, SDK de Android y Gradle; no se ejecutó en esta máquina | Ejecutar el workflow `android.yml` (`workflow_dispatch`) y revisar la salida de `verify-apk.mjs` |
| Compilación de los instaladores de Windows | Requiere toolchain de Rust estable y `@tauri-apps/cli`; no se ejecutó | Ejecutar `desktop.yml` o `pnpm desktop:build` en una máquina con Rust |
| Pruebas del backend Rust (`cargo test`) | Sin toolchain de Rust en la máquina de análisis | `cargo test --release` en `apps/contador-desktop/src-tauri` |
| Publicación en GitHub Pages | No se disparó ningún despliegue | Revisar la última ejecución de `pages.yml` en el repositorio |
| Que el APK publicado sea el verificado | Depende del release, no del código | `sha256sum` del APK descargado contra `SHA256SUMS.txt` del release |
| Vigencia de las tasas tributarias 2026 | Depende de las fuentes oficiales del SII y de BCN/LeyChile, no del repositorio | Reabrir cada `source` de `rules/2026.json` — el propio archivo advierte que BCN no respondió el 16-08-2026 |
| Comportamiento real en WebView de Android antigua | No se probó en dispositivo | Instalar el APK en un Android 6–8 y comprobar `crypto.randomUUID` y el arranque |
| Que el espejo de disco de Windows repone correctamente tras un corte | No se ejecutó la app de escritorio | Cerrar la app a la fuerza durante una escritura y volver a abrirla |
| Contenido de los archivos binarios versionados (PNG, PDF, SVG) | Se verificó su existencia, tamaño y número de páginas, no su contenido visual completo | Inspección visual manual |

Además, todo lo marcado `REQUIERE VALIDACIÓN` dentro de cada documento pertenece a esta lista.

---

## Cómo regenerar los PDF

```bash
node scripts/build-system-docs.mjs               # todos + el consolidado
node scripts/build-system-docs.mjs --only 03     # sólo el documento 03, para iterar rápido
node scripts/build-system-docs.mjs --no-diagrams # sin rasterizar Mermaid, más rápido
```

**Requisitos:** Chrome o Edge (se autodetecta; si no, `CHROME_PATH`) y, para los diagramas,
`@mermaid-js/mermaid-cli` global — `pnpm add -g @mermaid-js/mermaid-cli`. **Si falta `mmdc` el
generador no falla**: deja los diagramas como bloques de código y lo avisa.

El generador lee la versión de `package.json` y el commit con `git rev-parse --short HEAD`: la
portada de cada PDF nunca se escribe a mano. Además **calcula si algún diagrama sale ilegible** en
A4 y lo dice con nombre y factor de reducción. El detalle está en
[13 · Despliegue y operación](13-deployment-and-operations.md#generación-de-los-pdf-de-esta-documentación).

> ⚠️ Estos PDF **no se generan en CI**, a diferencia del glosario, la guía y la presentación:
> hay que regenerarlos a mano cuando cambie el Markdown. Está registrado como
> [H-17](15-risks-and-technical-debt.md).

---

> Recordatorio heredado del proyecto y que esta documentación repite: la aplicación **no presenta
> ni paga nada ante el SII** y **no es asesoría tributaria**. Cuando la aplicación y el SII no
> coincidan, **manda el SII**.
