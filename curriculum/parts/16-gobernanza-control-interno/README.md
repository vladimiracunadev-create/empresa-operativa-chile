# Parte 16 — Gobernanza, control interno y auditoría continua

## Propósito

Diseñar una empresa donde una falla técnica, financiera, tributaria o humana deje señales, sea investigada con independencia y produzca una remediación verificable.

## Prerrequisitos

C16, C28, C38, C53–C64 y lectura de [Control interno](../../../docs/CONTROL-INTERNO.md).

## Objetivos verificables

Al terminar, el estudiante puede distinguir hechos e hipótesis, mapear responsabilidades funcionales, identificar conflictos y concentración de funciones, preservar evidencia, proponer controles y demostrar que una remediación funcionó.

## Modelo mental

```text
DOCUMENTO → OPERACIÓN → REGISTRO → BANCO → IMPUESTO → CONTROL
→ ALERTA → INVESTIGACIÓN → RESPONSABILIDAD → REMEDIACIÓN
```

## C65 — Gobierno corporativo, integridad y RACI

**Conceptos.** Tono desde la dirección, accountability, interés de la empresa, conflicto, parte relacionada, independencia, abstención y trazabilidad.

**Explicación.** RACI aclara quién ejecuta y quién responde, pero no resuelve un conflicto. Una decisión material debe registrar alternativas, información considerada, vínculos, abstenciones, fundamento y revisión.

**Flujo.** Declarar vínculo→evaluar conflicto→abstener/mitigar→decidir de forma independiente→documentar→revisar.

**Ejemplo.** Un proveedor relacionado puede contratarse si la operación es legítima y se gestiona el conflicto; ocultar el vínculo impide evaluar independencia y condiciones.

**Evidencia, alertas y controles.** Registro de intereses, acta contemporánea, comparación de condiciones, aprobador independiente y revisión de cambios. Alertan declaraciones tardías, beneficiarios opacos y aprobadores repetidos.

**Práctica.** Construye un RACI y registro de conflictos para el caso 04.

**Comprobación.** ¿Quién responde? ¿Quién debe abstenerse? ¿Qué prueba que la decisión fue informada?

**Entregable y evaluación.** Matriz RACI más ficha de decisión. Aprueba si separa cargo, persona, interés y revisión.

## C66 — Segregación de funciones

**Conceptos y flujo.** create→request→validate→approve→execute→record→reconcile→audit. Examina personas, credenciales, dispositivos, privilegios y capacidad de alterar evidencia.

**Ejemplo.** Tres cuentas desde el mismo equipo no prueban tres personas independientes. Un administrador capaz de modificar exportaciones puede debilitar una conciliación aunque no figure como conciliador.

**Evidencia y controles.** Matriz de incompatibilidades, MFA, logs, delegaciones, vacaciones, acceso privilegiado y revisión fuera de línea. Para equipos pequeños: límite, aprobación externa y revisión posterior independiente.

**Errores frecuentes.** Segregar nombres sin segregar capacidades; ignorar reemplazos; permitir que quien ejecuta produzca la única evidencia.

**Práctica, comprobación y entregable.** Dibuja SoD nominal y real del caso 04. Explica qué control compensatorio usarías si sólo existen tres personas.

**Evaluación.** Aprueba si identifica concentraciones técnicas y humanas y asigna controles compensatorios verificables.

## C67 — Diseño y clasificación de controles

**Conceptos.** Preventive/Detective/Corrective y Manual/Automated/Hybrid; diseño, operación, dueño, evidencia, frecuencia, umbral, excepción y remediación.

**Modelo.** Objetivo→riesgo→control→evidencia→excepción→escalamiento→remediación→verificación.

**Ejemplo.** Antes de usar crédito fiscal, cruzar DTE, orden, recepción, banco y RCV. Una excepción requiere fundamento, aprobador y vencimiento.

**Señales.** Control sin dueño, evidencia autogenerada, alerta cerrada sin fundamento, excepción permanente y control automático sin monitoreo.

**Práctica y entregable.** Diseña un control de cada naturaleza para una operación sin sustancia suficiente.

**Comprobación.** ¿Qué riesgo reduce? ¿Cómo sabes que operó? ¿Qué ocurre si falla?

**Evaluación.** Aprueba si otra persona puede ejecutar, revisar y probar el control.

## C68 — Libros auxiliares, conciliación, documentos y custodia

**Conceptos.** Cuenta de control, fuente independiente, corte, sustancia económica, cadena de custodia y evidencia contradictoria.

**Flujo.** DTE↔orden/contrato↔recepción↔banco↔auxiliar/mayor↔RCV/F29. En custodia: obligación con clientes↔auxiliar↔activo controlado.

**Ejemplo.** Un pago y un DTE coinciden, pero el entregable no existe y la recepción fue creada después. La aritmética cuadra; la sustancia sigue abierta.

**Controles.** Confirmación independiente, evidencia contemporánea, corte, acceso restringido, originales preservados y copias de trabajo.

**Errores frecuentes.** Tratar el DTE como prueba total; reemplazar originales; alterar metadatos; conciliar totales sin contraparte ni titularidad.

**Práctica y entregable.** Realiza la prueba de cinco vías del caso 04 y un inventario de custodia.

**Comprobación.** ¿Qué fuente es independiente? ¿Qué contradice la hipótesis? ¿Qué falta preservar?

**Evaluación.** Aprueba si la conciliación explica diferencias sin ocultarlas y conserva trazabilidad.

## C69 — Risk register, KRI, excepciones y auditoría continua

**Conceptos.** Riesgo inherente/residual, P×I, KRI, umbral, ageing, recurrencia, control fallido y aseguramiento independiente.

**Explicación.** Un KRI prioriza atención; no decide culpabilidad. Los casos abiertos y remediaciones vencidas son señales de capacidad de respuesta institucional.

**Ejemplo.** Medir operaciones sin conciliar, transferencias sin aprobación, contrapartes desconocidas, controles fallidos, casos abiertos y remediaciones vencidas.

**Controles.** Umbral aprobado, fuente, ventana, dueño, respuesta, escalamiento y revisión de falsos positivos. Auditoría evalúa diseño y operación sin asumir funciones operativas.

**Práctica y entregable.** Añade al risk register del caso 04 tres KRI con umbral y respuesta.

**Comprobación.** ¿Qué conducta incentiva el indicador? ¿Puede manipularse? ¿Quién revisa al dueño?

**Evaluación.** Aprueba si cada KRI conduce a una acción trazable y no se confunde con un control.

## C70 — Whistleblowing, investigación independiente y remediación

**Conceptos.** Canal, confidencialidad, no represalia, triage, minimización, preservación, investigador, decisor, conflicto, conclusión, revisión y remediación.

**Método.** Hecho→evidencia→hipótesis→contraste→conclusión. Luego: causa raíz→control fallido→responsabilidad funcional→remediación→verificación.

**Ejemplo.** Una denuncia afirma que se “regularizó” respaldo. Se conserva como afirmación del reportante hasta contrastarla con mensajes, metadatos, versiones y testimonios legítimamente obtenidos.

**Debido proceso.** Presunción de inocencia, proporcionalidad, privacidad, acceso restringido, separación investigación/decisión y vía de revisión. Una conclusión debe declarar límites.

**Errores frecuentes.** Investigar desde la cuenta de la persona señalada; exponer identidad innecesariamente; buscar sólo confirmación; cerrar al implementar el control sin probar eficacia.

**Práctica y entregable.** Completa el [Lab 17](../../../labs/17-investigacion-de-integridad/README.md) y registra un caso en SANDBOX con hechos, hipótesis, evidencia faltante, investigador y decisor distintos.

**Comprobación.** ¿Qué sabes? ¿Qué sospechas? ¿Qué falta? ¿Quién decide? ¿Cómo se revisa? ¿Qué prueba que no se repite?

**Evaluación.** Aprueba si la conclusión es proporcional a evidencia, la custodia es trazable y la remediación tiene prueba de eficacia.

## Capstones

- [El descalce que nadie vio](../../../cases/03-descalce-custodia/README.md): custodia, conciliación y crecimiento.
- [La operación que sí cuadraba](../../../cases/04-operacion-que-si-cuadraba/README.md): sustancia, conflicto, alerta ignorada e investigación.

## Fuentes y fecha

- [Integridad, fraude y respuesta institucional](../../../docs/INTEGRIDAD-INVESTIGACION.md).
- [Fuentes oficiales 2026](../../../docs/SOURCES-2026.md).
- [Bibliografía secundaria](../../../docs/BIBLIOGRAFIA-INTEGRIDAD.md).

Fuentes y marco revisados el **22-09-2026**.

## Criterio de aprobación de la parte

El estudiante debe responder qué ocurrió, qué se sabe, qué se sospecha, qué evidencia falta, qué control falló, quién tenía responsabilidad funcional, cómo se remedia y cómo se verifica la no recurrencia, sin sustituir investigación jurídica ni debido proceso.
