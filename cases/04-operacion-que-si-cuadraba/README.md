# Caso capstone — La operación que sí cuadraba

> **CASO EDUCATIVO SINTÉTICO.** Empresa, personas, documentos y montos son ficticios. El caso combina patrones de riesgo para aprender a investigar; no reproduce ni atribuye hechos de un expediente real.

## Situación

**Comercial Andina SpA** cerró junio de 2026 sin diferencias aritméticas. El banco concilia, los DTE aparecen en el RCV, el mayor cuadra y el F29 fue preparado con esos registros. Una compra por CLP 47.600.000, IVA incluido, corresponde a “asesoría estratégica y soporte de expansión”.

Después del cierre aparecen estas señales:

- la contraparte comparte domicilio y un apoderado con una sociedad de un gerente, vínculo no declarado;
- el informe de recepción fue creado ocho días después del pago y su metadato muestra como autor al solicitante;
- la solicitud, validación y aprobación usan credenciales distintas, pero provienen del mismo equipo y ventana horaria;
- no existe evidencia independiente del entregable;
- una regla automática alertó “proveedor nuevo + monto alto + descripción genérica”, pero el ticket se cerró como falso positivo sin fundamento;
- una denuncia interna indica que se pidió “regularizar el respaldo” después del cierre;
- el registro fue editado tras el cierre y luego reaperturado con un motivo genérico;
- el DTE, el pago, el asiento y el F29 sí coinciden numéricamente.

Nada de lo anterior prueba fraude, corrupción ni delito tributario. Sí justifica preservar evidencia, revisar sustancia, declarar conflictos y abrir una investigación independiente.

## Paquete de evidencia entregado

1. DTE y estado en RCV.
2. orden de compra, contrato e informe de recepción;
3. cartola y comprobante bancario;
4. asiento, mayor de proveedores y borrador F29;
5. log de identidades, dispositivos y aprobaciones;
6. historial del ticket de alerta;
7. bitácora del cierre, reapertura y edición;
8. ficha de contraparte y vínculos declarados;
9. denuncia interna, separada de la carpeta de acceso general;
10. política de compras y matriz de autorizaciones vigente a la fecha.

## Trabajo del estudiante

1. Preserva originales y crea copias de trabajo con inventario de custodia.
2. Reconstruye una cronología sin completar vacíos con supuestos.
3. Separa hechos establecidos, inferencias, hipótesis y afirmaciones de la denuncia.
4. Reconcilia DTE ↔ contrato ↔ recepción ↔ banco ↔ contabilidad ↔ RCV/F29.
5. Identifica vínculos y conflictos, sin concluir que una relación prueba simulación.
6. Mapea create→request→validate→approve→execute→record→reconcile→audit.
7. Evalúa si la identidad lógica representa separación humana efectiva.
8. Determina qué controles debieron prevenir, detectar y corregir la excepción.
9. Define la evidencia faltante y una vía legítima y proporcional para obtenerla.
10. Identifica competencias internas y externas sin formular una acusación automática.
11. Propone remediación con dueño, fecha, evidencia y umbral.
12. Diseña una prueba de eficacia que permita cerrar el caso o reabrirlo.

## Cronología inicial

| Fecha/hora | Evento | Fuente | Estado |
|---|---|---|---|
| 2026-06-04 10:12 | alta del proveedor | log maestro | verificado en el paquete |
| 2026-06-10 09:18 | solicitud de compra | workflow | verificado en el paquete |
| 2026-06-10 09:24 | validación | workflow | identidad registrada; independencia por comprobar |
| 2026-06-10 09:31 | aprobación | workflow | identidad registrada; independencia por comprobar |
| 2026-06-11 12:05 | pago | cartola | verificado en el paquete |
| 2026-06-12 08:00 | alerta automática | motor de reglas | verificado en el paquete |
| 2026-06-12 08:17 | cierre de alerta | ticket | fundamento ausente |
| 2026-06-30 19:00 | cierre mensual | bitácora | verificado en el paquete |
| 2026-07-08 16:42 | creación del informe de recepción | metadato | verificado; contenido por contrastar |
| 2026-07-09 11:05 | reapertura y edición | bitácora | motivo insuficiente |
| 2026-07-10 07:30 | denuncia interna | canal protegido | afirmación por contrastar |

## Matriz “qué falló”

Completa sin usar “culpable”, “corrupto” o “fraude probado”.

| Evento | Evidencia | Riesgo | Control esperado | Control observado | Brecha | Responsable funcional | Acción |
|---|---|---|---|---|---|---|---|
| Alta de contraparte | ficha y fuentes de vínculo | parte relacionada no declarada | declaración y revisión independiente | ficha incompleta | vínculo no evaluado | Compliance / Compras | verificar vínculo y bloquear aprobación en conflicto |
| Aprobaciones | logs de identidad y dispositivo | SoD sólo aparente | personas y sesiones independientes | cuentas distintas, contexto coincidente | independencia sin demostrar | Management / Security | revisar identidades, accesos y delegaciones |
| Recepción | informe y metadatos | evidencia posterior o no independiente | aceptación contemporánea del área usuaria | documento creado después del pago | sustancia no acreditada | área usuaria / Finanzas | obtener entregables y confirmación independiente |
| Alerta | regla y ticket | excepción silenciada | fundamento, aprobador y vencimiento | cierre sin fundamento | trazabilidad de excepción ausente | dueño del control | reabrir, escalar y revisar universo comparable |
| Cierre | bitácora | cambios posteriores no justificados | reapertura nominativa y revisión | motivo genérico | control de cambios débil | Accounting / Finance | preservar versiones y aprobar corrección |

## Hipótesis que deben competir

- servicio real con documentación tardía y conflicto no declarado;
- error de alta de contraparte y evidencia insuficiente;
- excepción urgente aprobada fuera del flujo, pero no documentada;
- operación sin sustancia usada para obtener gasto o crédito fiscal improcedente;
- control automatizado defectuoso o interferido;
- combinación de fallas de proceso, identidad y supervisión.

La investigación debe buscar evidencia que confirme y que contradiga cada hipótesis.

## Entregables

- cronología con fuente, zona horaria y nivel de certeza;
- matriz “qué falló” completa;
- tabla hecho/evidencia/hipótesis/contraste/conclusión;
- mapa SoD real y lógico;
- evaluación tributaria defensiva, sin instrucciones para evadir controles;
- plan de custodia, privacidad y accesos;
- registro de conflictos y separación investigador/decisor;
- plan 30/60/90 con controles preventivos, detectivos y correctivos;
- prueba de eficacia y vía de revisión.

## Criterios de evaluación

| Criterio | Insuficiente | Competente |
|---|---|---|
| Hecho vs. hipótesis | trata alertas como culpabilidad | etiqueta cada afirmación y reconoce límites |
| Evidencia | usa sólo DTE y contabilidad | reconcilia fuentes independientes y custodia originales |
| SoD | mira cargos nominales | evalúa personas, credenciales, dispositivos y capacidad de alterar evidencia |
| Tributación | afirma delito por una inconsistencia | identifica riesgos y remite la calificación a evidencia y autoridad competente |
| Remediación | corrige el asiento o sanciona sin causa raíz | corrige dato, proceso, acceso, supervisión y recurrencia |
| Cierre | declara “resuelto” por decisión interna | prueba eficacia, documenta revisión y conserva incertidumbres |

## Fuentes

- [Integridad, fraude y respuesta institucional](../../docs/INTEGRIDAD-INVESTIGACION.md).
- [Control interno](../../docs/CONTROL-INTERNO.md).
- [Fuentes oficiales 2026](../../docs/SOURCES-2026.md), verificadas el 22-09-2026 para este caso.
- [Bibliografía secundaria](../../docs/BIBLIOGRAFIA-INTEGRIDAD.md).
