# Control interno, segregación de funciones y auditoría

Este marco amplía Empresa Operativa Chile más allá del cumplimiento tributario. Su objetivo es que una falla técnica, financiera o humana no pueda permanecer invisible durante años. Funciona para bancos, fintech, e-commerce, marketplaces, tesorería, medios de pago, inventarios y activos digitales.

> El sistema registra decisiones, evidencia y excepciones. No reemplaza el juicio profesional contable, la función de auditoría ni las obligaciones legales de cada industria.

## Modelo de gobierno

| Función | Mandato | Independencia mínima |
|---|---|---|
| Board | Apetito de riesgo, supervisión y rendición de cuentas | Recibe directamente a Internal Audit |
| Management | Diseña y opera el sistema de control | No evalúa en exclusiva su propio desempeño |
| Finance | Política financiera, análisis y conciliación | Distinta de quien ejecuta pagos |
| Accounting | Registro, libro auxiliar y cierre | Distinta de aprobación y ejecución |
| Treasury | Liquidez, bancos, pagos y custodia | No aprueba ni concilia su propia ejecución |
| Technology | Sistemas, cambios y disponibilidad | Accesos privilegiados sujetos a aprobación y logs |
| Security | Identidades, monitoreo y respuesta | Puede bloquear y escalar sin autorización operativa |
| Compliance | Normativa, triage y conflictos | Canal independiente hacia Board |
| Internal Audit | Aseguramiento continuo sobre diseño y operación | Sin responsabilidades operativas |
| External Audit | Opinión o revisión independiente | Sin diseñar ni operar el control auditado |

La matriz RACI ejecutable está en `packages/company-operations/governance.mjs` y se muestra en **Control → Control interno**. La persona *Accountable* conserva la rendición de cuentas; la *Responsible* ejecuta; *Consulted* participa antes de decidir; *Informed* recibe el resultado.

## Segregación de funciones (SoD)

La unidad mínima no es “un pago”, sino siete capacidades separables:

| Capacidad | Función habilitada | Incompatibilidades obligatorias |
|---|---|---|
| Create / Request | Management, Finance, Treasury o Technology | No puede aprobar ni ejecutar su propia solicitud |
| Validate | Finance, Security o Compliance | No puede ser quien solicitó |
| Approve | Board o Management | No puede solicitar, validar ni ejecutar |
| Execute | Treasury o Technology | No puede solicitar ni aprobar |
| Record | Accounting | No puede aprobar ni ejecutar |
| Reconcile | Finance | No puede ejecutar ni registrar |
| Audit | Internal Audit o External Audit | No puede haber participado en ninguna etapa anterior |

El motor rechaza un salto de etapa, una función no habilitada, una evidencia vacía o la reutilización de una persona en etapas incompatibles.

## Flujo con evidencia

```text
Solicitud → Validación → Aprobación → Ejecución → Registro → Conciliación → Auditoría
```

Toda operación crítica conserva, como mínimo:

```text
process_id · requester · approver · executor · value · timestamp · evidence · status
```

Además puede identificar moneda/unidad, contraparte, activo, categoría y libro auxiliar. Cada transición agrega actor, función, fecha y referencia de evidencia; nunca reemplaza la evidencia de la etapa anterior.

## Marco de controles

Cada control se clasifica en dos ejes:

- **Preventive / Detective / Corrective:** evita, descubre o remedia una desviación.
- **Manual / Automated / Hybrid:** persona, sistema o combinación responsable de ejecutarlo.

También registra objetivo, dueño, frecuencia, evidencia esperada y estado (`effective`, `failed` o `remediation`). Un control automatizado sigue necesitando dueño, monitoreo de fallos y evidencia legible.

## Auditoría continua

La configuración inicial propone:

| Actividad | Frecuencia inicial | Propósito |
|---|---:|---|
| Daily reconciliation | 1 día | Detectar descalces antes de acumularlos |
| Weekly review | 7 días | Revisar excepciones, KRI y acciones privilegiadas |
| Monthly close | 30 días | Congelar registros y documentar pendientes |
| Quarterly control review | 90 días | Evaluar diseño, operación y remediación |
| Annual external review | 365 días | Obtener una mirada independiente |

Son valores configurables en días, no promesas de calendario. La empresa debe adaptarlos a volumen, materialidad, regulación y horario de corte.

## Whistleblowing y escalamiento

1. **Report:** captura del hecho y preservación de evidencia; admite anonimato.
2. **Triage:** alcance, urgencia, riesgo de represalia y canal competente.
3. **Investigation:** investigador identificable e independiente.
4. **Conflict of interest:** declaración explícita antes de investigar.
5. **Evidence preservation:** ubicación, custodio, fecha y, cuando corresponda, hash.
6. **Escalation:** Compliance, Internal Audit, Board o autoridad según gravedad.
7. **Resolution:** decisión, remediación y seguimiento sin borrar el reporte original.

El sistema impide que una persona nominada investigue su propia denuncia y deja cada cambio en la bitácora append-only.

## Libro auxiliar y conciliación

Un libro auxiliar detalla una cuenta de control: clientes, proveedores, bancos, inventario o wallets, por ejemplo. La conciliación compara ese detalle con fuentes independientes y explica diferencias. En custodia, la conciliación mínima es de tres vías:

```text
obligación con clientes ↔ libro auxiliar interno ↔ saldo de banco/wallet/exchange
```

Esta comparación detecta descalces; no determina por sí sola reconocimiento, medición, deterioro, presentación ni revelación contable.

## Escenario de custodia digital

```text
clientes → depósitos → empresa custodial → wallets/exchanges → conciliación
```

La empresa debe probar, por activo y contraparte, que las obligaciones con clientes coinciden con el libro auxiliar y con activos controlados. Las claves, movimientos privilegiados y cambios de whitelist requieren SoD, logs y revisión independiente. “Saldo total suficiente” no explica titularidad, restricciones, activos prestados ni diferencias por corte.

## Risk register y KRI

Cada riesgo registra `risk`, `probability`, `impact`, `owner`, `control`, `residual risk`, `KRI` y `status`. Probabilidad e impacto usan escala 1–5; la prioridad inicial es P×I, pero no reemplaza materialidad ni requisitos regulatorios.

La aplicación calcula seis KRI observables:

- transacciones ejecutadas sin conciliar;
- transferencias ejecutadas sin aprobación;
- acciones privilegiadas no auditadas;
- conciliaciones antiguas;
- contrapartes desconocidas;
- controles fallidos.

Un KRI no es un control: es una señal para decidir. Cada organización debe fijar umbral, ventana, fuente, dueño y respuesta.

## Operación en la aplicación

1. Abre **Control → Control interno**.
2. Registra controles y riesgos antes de iniciar una operación material.
3. Pulsa **Solicitar operación** y completa contraparte, libro auxiliar y evidencia.
4. Haz avanzar el proceso con personas distintas. El sistema mostrará la única etapa permitida.
5. Revisa KRI y bitácora. Configura las frecuencias de auditoría.
6. Usa Whistleblowing para preservar y escalar hechos fuera del flujo normal.

Los datos permanecen separados entre EMPRESA REAL y SANDBOX y forman parte del respaldo portable v3.
