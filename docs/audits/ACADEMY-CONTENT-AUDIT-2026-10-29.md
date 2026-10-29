# Auditoría de contenido de Academia — 2026-10-29

## Conclusión

La crítica del usuario era correcta: antes de esta intervención, la pantalla Academia mostraba dos ejemplos y preguntas rápidas, mientras afirmaba que existían currículo, laboratorios y casos en carpetas externas. La aplicación publicada no permitía abrirlos. Las 70 “clases” eran sólo títulos agrupados en 17 README genéricos; los laboratorios eran consignas breves y los casos, listas de trabajo.

No correspondía describir ese estado como un programa de aprendizaje completo.

## Evidencia del estado anterior

| Superficie | Evidencia observada | Brecha |
|---|---|---|
| App | `apps/web/src/views/academia.js` mostraba venta, honorario, capital, ciclo y preguntas | Sin lector del currículo, labs o casos; sin búsqueda, progreso, práctica evaluada ni retroalimentación |
| Currículo | `curriculum/parts/*/README.md` contenía objetivo genérico, títulos y un criterio repetido | No había desarrollo por clase ni archivos de las 70 clases |
| Laboratorios | `labs/*/README.md` pedía cálculo, asiento, evidencia, formulario y riesgo | Sin datos suficientes, procedimiento, rúbrica, recuperación o pauta sustantiva |
| Casos | `cases/*/README.md` contenía una situación y lista de tareas | Sin etapas, decisiones, evidencias, rúbrica o pauta |
| Empaquetado | `scripts/build-web.mjs` no copiaba contenido de Academia | Windows, Android y PWA no podían usar las carpetas educativas |
| Afirmación | La app decía que el repositorio “incluye un currículo con laboratorios y casos completos” | La existencia en GitHub no equivalía a disponibilidad ni completitud en la app |

## Estándar adoptado

Se contrastó el diseño con los programas públicos de aprendizaje del mismo autor. El contrato usado aquí conserva su principio común —cada clase debe producir una evidencia revisable— y lo adapta a una aplicación operativa:

`observar → razonar → resolver → comprobar → aplicar`

Cada clase declara prerrequisito, contexto, cinco resultados medibles, conceptos operacionales, modelo mental, desarrollo en tres bloques, ejemplo trabajado, taller guiado, entregable, criterio de aceptación, errores con causa y corrección, tres comprobaciones y fuentes.

## Resultado implementado

| Superficie | Resultado | Verificación automática |
|---|---|---|
| Curso | 70 clases en 17 partes, 35 min orientativos | IDs únicos, campos obligatorios, profundidad serializada mínima y contenidos nucleares no duplicados |
| Rutas | 12 entradas para necesidades frecuentes | Tres secciones, ejemplo, práctica, evaluación y fuente por ruta |
| Labs | 17 laboratorios | Entradas, al menos cuatro tareas, pauta, errores y rúbrica que suma 100 |
| Casos | 4 casos de 4–6 h | Expediente, cuatro etapas, decisiones, hallazgos y rúbrica que suma 100 |
| App | Catálogo, buscador, progreso local, feedback y enlaces a SANDBOX | Prueba de imports, contenido y empaquetado de cuatro módulos de Academia |
| Documentación | 127 archivos generados desde la misma fuente que usa la app | `pnpm build:academy --check` dentro de `pnpm check` |
| Plataformas | Módulos copiados a `apps/web/dist/core/academy/` | El mismo `dist` alimenta Pages/PWA, Tauri y Capacitor |

## Límites declarados

- La profundidad pedagógica queda verificada por estructura y umbrales, pero la calidad conceptual requiere revisión editorial continua.
- Las fuentes se presentan como rutas de verificación; tasas y obligaciones se confirman para el período y perfil concreto.
- El progreso es local al dispositivo y no constituye una certificación académica.
- Academia no presenta declaraciones, firma, paga, determina derechos ni sustituye asesoría profesional.

## Prueba funcional requerida antes de publicar

1. Abrir Academia en una compilación local.
2. Buscar una clase, abrirla, leer ejemplo, taller, errores y comprobaciones.
3. Responder una ruta guiada con opción correcta e incorrecta y observar retroalimentación.
4. Marcar un elemento, recargar y comprobar persistencia local.
5. Buscar un término inexistente, comprobar mensaje vacío y recuperar borrando la búsqueda.
6. Verificar teclado, foco, lector de estado y pantalla móvil.
7. Preparar Android y confirmar que `apps/android/www/core/academy/` contiene los cuatro módulos.
8. Compilar Windows y verificar que Tauri usa el mismo `apps/web/dist`.

## Evidencia funcional ejecutada

| Flujo | Resultado observado |
|---|---|
| Carga local | La vista presenta 70 clases, 12 rutas, 17 labs, 4 casos y 2 talleres; no queda en blanco |
| Clase C01 | El desplegable muestra prerrequisito, resultados, conceptos, modelo mental, desarrollo y taller |
| Progreso | C01 cambia de `0 de 105` a `1 de 105` y conserva `1 de 105` después de recargar |
| Búsqueda degradada | `zz-sin-coincidencia` muestra `0 resultados` y el estado vacío explicativo |
| Recuperación | Buscar `conciliación` devuelve 8 resultados; limpiar restaura las 70 clases |
| Evaluación | Una opción incorrecta en A01 devuelve retroalimentación específica y revela la opción correcta |
| Catálogos | Las pestañas exponen exactamente 17 laboratorios y 4 casos |
| Pantalla pequeña | Viewport 500 × 915 conserva cabecera, progreso, pestañas desplazables, búsqueda y tarjetas legibles |
| Consola | Tras las correcciones no aparecen errores nuevos al navegar y evaluar |

Durante la primera ejecución se detectaron y corrigieron dos regresiones reales (`listOperations` y `journal.sale`, APIs inexistentes). La ayuda de capturas también se endureció: elimina el PNG anterior antes de abrir Chrome, de modo que una captura antigua ya no puede pasar como evidencia nueva si el navegador falla.

El comando protegido `pnpm app` rechazó correctamente el Node local 24.11.1 porque el baseline exige 24.22.1+. Para la prueba visual se sirvió el `dist` ya construido mediante el mismo servidor estático, sin cambiar el baseline ni instalar dependencias. Build y tests sí fueron ejecutados; este resultado de runtime se conserva como limitación del entorno local.
