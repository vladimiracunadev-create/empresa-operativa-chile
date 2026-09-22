# Parte 15 — Auditoría y automatización

## Propósito

Convertir registros y conciliaciones en pruebas reproducibles. Esta parte no enseña a afirmar que una anomalía es fraude: enseña a detectar excepciones, medir su alcance, conservar la regla aplicada y decidir qué debe revisarse.

## Prerrequisitos

C16, C28, C38, C53–C56 y manejo básico de DTE, RCV, banco, mayor y F29.

## Modelo mental

```text
universo → regla versionada → prueba → excepción → evidencia
→ triage → investigación o corrección → nueva prueba
```

## C61 — Muestreo y pruebas

**Objetivos verificables.** Definir población, período, unidad, riesgo y criterio; escoger muestra dirigida o representativa; documentar cobertura y límites; evitar extrapolar una señal más allá de lo probado.

**Conceptos.** Universo, muestra, materialidad, riesgo, cobertura, falso positivo, falso negativo y evidencia contradictoria.

**Explicación.** Una muestra aleatoria ayuda a estimar errores distribuidos. Una muestra dirigida sirve para buscar patrones de alto riesgo: proveedor nuevo, parte relacionada, operación al cierre o excepción manual. Ninguna demuestra por sí sola intención.

**Flujo.** Definir pregunta→congelar universo→elegir método→ejecutar prueba→registrar resultado→ampliar o cerrar con limitaciones.

**Ejemplo.** Del universo de compras de junio, revisar todas las operaciones con proveedor nuevo y una muestra aleatoria del resto. Para cada una, cruzar DTE, recepción, banco, registro y RCV.

**Evidencia.** Consulta o exportación usada, hash o versión cuando corresponda, criterio de selección, tamaño del universo, muestra, papeles de trabajo y revisor.

**Señales y controles.** Muestras cambiadas después de ver resultados, exclusiones no justificadas o ausencia de población completa exigen revisión independiente y repetición reproducible.

**Errores frecuentes.** Elegir sólo expedientes fáciles; llamar “fraude” a una excepción; confundir ausencia de hallazgo con ausencia de riesgo.

**Práctica y entregable.** Diseña dos muestras para el [caso 04](../../../cases/04-operacion-que-si-cuadraba/README.md), justifica diferencias y entrega una hoja de cobertura.

**Comprobación.** ¿Qué población congelaste? ¿Qué riesgo gobierna la selección? ¿Qué no permite concluir la muestra?

**Evaluación.** Aprueba si otra persona puede reproducir selección y resultado y si los límites están explícitos.

## C62 — Alertas de inconsistencias

**Objetivos verificables.** Diseñar alertas multifuente; separar anomalía de conclusión; asignar umbral, dueño, SLA, excepción y escalamiento; medir ageing y recurrencia.

**Conceptos.** Red flag, correlación, umbral, ventana temporal, excepción, ageing, concentración y patrón.

**Modelo mental.** DTE↔operación↔contabilidad↔banco↔RCV/F29. Una coincidencia aritmética no acredita sustancia económica.

**Ejemplo.** Alertar cuando un proveedor nuevo supera el umbral, la recepción se crea después del pago y la alerta previa se cerró sin fundamento. El resultado es “revisión requerida”, nunca “persona culpable”.

**Evidencia.** Regla, datos de entrada, resultado, versión, identidad de quien resolvió y motivo contemporáneo.

**Controles.** Revisión de falsos positivos, doble aprobación de excepciones, alerta sobre alertas silenciadas y prueba periódica con casos conocidos.

**Errores frecuentes.** Umbral sin fundamento; alerta sin dueño; cierre sin evidencia; optimizar sólo para reducir volumen.

**Práctica y entregable.** Crea cinco alertas defensivas para documentos sin sustancia, con umbral y respuesta. Incluye una que combine tiempo, vínculo y flujo bancario.

**Comprobación.** ¿Qué hecho observa cada alerta? ¿Qué hipótesis abre? ¿Quién puede cerrarla y con qué evidencia?

**Evaluación.** Aprueba si las alertas son medibles, revisables y no atribuyen responsabilidad jurídica.

## C63 — Reglas versionadas

**Objetivos verificables.** Reconstruir qué regla operó; distinguir cambio normativo, ajuste de riesgo y excepción; conservar vigencia, fuente, aprobador y resultado.

**Conceptos.** Versión, fecha efectiva, fuente, migración, excepción, rollback y reproducibilidad.

**Flujo.** Propuesta→revisión→aprobación→prueba→vigencia→monitoreo→retiro. Una excepción sigue su propio flujo con dueño y vencimiento.

**Ejemplo.** La regla `proveedor_nuevo_monto_alto` cambia de CLP 20 a 15 millones. Un hallazgo debe indicar qué versión evaluó la operación, no reinterpretarla con la regla futura.

**Evidencia y controles.** Diff, caso de prueba, fuente, fecha efectiva, aprobador distinto del autor, log de ejecución y reporte de excepciones.

**Errores frecuentes.** Editar la regla sin conservar historia; aplicar retroactivamente sin explicarlo; permitir una excepción indefinida.

**Práctica y entregable.** Redacta una ficha de regla y una excepción de 15 días con control compensatorio.

**Comprobación.** ¿Puedes reproducir el resultado original? ¿La excepción expira? ¿Quién revisa al autor de la regla?

**Evaluación.** Aprueba si cada resultado puede remontarse a código/regla, datos, fuente y vigencia.

## C64 — Diseño de un contador virtual seguro

**Objetivos verificables.** Limitar autoridad de la automatización; hacer explicables cálculos y alertas; separar preparación, presentación y decisión; diseñar supervisión humana.

**Modelo mental.** Automatizar cálculo y detección; reservar a personas competentes la investigación, decisión jurídica, presentación y pago.

**Flujo seguro.** Entrada validada→cálculo reproducible→explicación→alerta→revisión humana→evidencia→acción externa separada.

**Ejemplo.** El sistema detecta crédito fiscal con recepción faltante y propone revisar. No elimina el crédito, denuncia a una persona ni presenta una rectificatoria automáticamente.

**Evidencia y controles.** Proveniencia, reglas, versión, pruebas, permisos mínimos, bitácora, respaldo, recuperación y revisión de cambios.

**Ética.** Presunción de inocencia, minimización de datos, proporcionalidad, privacidad, revisión humana y derecho a corregir información.

**Errores frecuentes.** Confundir score con verdad; ocultar límites; dar al mismo usuario capacidad de cambiar reglas y aprobar excepciones.

**Práctica y entregable.** Diseña los límites de autoridad de un agente que revisa compras y dibuja sus puntos de intervención humana.

**Comprobación.** ¿Qué puede calcular? ¿Qué puede sugerir? ¿Qué nunca puede decidir? ¿Cómo se audita un error del sistema?

**Evaluación.** Aprueba si el diseño produce evidencia útil sin sustituir debido proceso ni competencia legal.

## Fuentes y fecha

Usa [Fuentes oficiales 2026](../../../docs/SOURCES-2026.md) y [Bibliografía de integridad](../../../docs/BIBLIOGRAFIA-INTEGRIDAD.md). Marco y enlaces verificados el **22-09-2026**.

## Criterio de aprobación de la parte

El estudiante debe convertir una excepción en una prueba reproducible, explicar sus límites, preservar la versión de la regla y proponer una respuesta proporcional.
