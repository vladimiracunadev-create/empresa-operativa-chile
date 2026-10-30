# 🤖 Unidad 15 — Auditoría y automatización

> **4 clases · 140 minutos orientativos · Nivel Control y decisión**

[← Volver al currículo completo](../../README.md)

## Qué vas a aprender

Diseñarás automatizaciones que comprueban, alertan y explican, pero se detienen cuando la norma, el dato o la vigencia no están verificados.

## Por qué esta unidad importa

Automatizar una suposición sólo produce errores más rápidos. Las reglas deben conservar fuente, versión, revisión y pruebas históricas.

## Antes de empezar

Poder reconstruir una cifra desde su documento y su regla.

**Caso conductor.** El sistema automatiza comprobaciones, pero debe fallar cerrado frente a normas incompletas o vencidas.

## Preguntas que podrás responder

- ¿Qué puede comprobarse automáticamente?
- ¿Cuándo debe fallar cerrado?
- ¿Cómo se conserva el cambio de una regla?

## Mapa de contenidos

| Paso | Clase | Pregunta práctica | Resultado |
|---:|---|---|---|
| 1 | [C61 — Muestreo y pruebas](classes/C61.md) | Muestrear no es mirar al azar sin criterio. Se define población, riesgo, cobertura y excepción; partidas críticas pueden revisarse al 100%. | Seleccionar evidencia según riesgo y objetivo. |
| 2 | [C62 — Alertas de inconsistencias](classes/C62.md) | Una alerta indica condición observable, severidad, evidencia y acción. No debe acusar fraude ni incumplimiento legal sin investigación. | Diseñar alertas accionables y no alarmistas. |
| 3 | [C63 — Reglas versionadas](classes/C63.md) | Una regla legal necesita país, período, fuente, revisión y estado. Actualizar una tasa no reescribe años cerrados; se crea una versión nueva y pruebas. | Conservar vigencia, fuente y cambios históricos. |
| 4 | [C64 — Diseño de un contador virtual seguro](classes/C64.md) | El sistema calcula y organiza evidencia; no firma, presenta, paga ni decide elegibilidad. Datos incompletos devuelven un estado observable y una ruta de verificación. | Definir qué automatizar y dónde fallar cerrado. |

## Cómo se conectan las clases

**1. Muestreo y pruebas.** Muestrear no es mirar al azar sin criterio. Se define población, riesgo, cobertura y excepción; partidas críticas pueden revisarse al 100%. La evidencia principal será: población, criterio, muestra, excepciones.

**2. Alertas de inconsistencias.** Una alerta indica condición observable, severidad, evidencia y acción. No debe acusar fraude ni incumplimiento legal sin investigación. La evidencia principal será: regla, dato, severidad, acción.

**3. Reglas versionadas.** Una regla legal necesita país, período, fuente, revisión y estado. Actualizar una tasa no reescribe años cerrados; se crea una versión nueva y pruebas. La evidencia principal será: fuente, vigencia, revisor, diff, prueba.

**4. Diseño de un contador virtual seguro.** El sistema calcula y organiza evidencia; no firma, presenta, paga ni decide elegibilidad. Datos incompletos devuelven un estado observable y una ruta de verificación. La evidencia principal será: contrato, estados, fuentes, tests, auditoría.

## Producto final de la unidad

Regla versionada con prueba, alerta accionable y caso REQUIERE_VERIFICACION.

El producto no es una tarea decorativa: debe permitir reconstruir la decisión, sus datos, su evidencia, lo que falta verificar y la acción siguiente.

## Recorrido en la aplicación

Practica en SANDBOX mediante: **Auditoría** → **Reglas** → **Bitácora**.

## Fuentes de orientación

- Política de reglas del repositorio
- Fuentes oficiales versionadas

## Criterio de dominio

La unidad queda dominada cuando las evidencias de todas sus clases cumplen sus criterios de aceptación y puedes explicar, sin copiar la pauta, cómo una decisión cambia el registro, la caja, la obligación y la evidencia.
