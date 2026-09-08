# Caso capstone — El descalce que nadie vio

## Situación

**Operadora Horizonte SpA** procesa pagos de comercios, mantiene saldos de clientes y conserva parte de la liquidez en bancos y parte en custodios de activos digitales. Durante el cierre aparece un descalce equivalente a CLP 84.000.000 entre el libro auxiliar de clientes y los activos disponibles.

La organización creció rápido. La misma jefatura solicita y aprueba transferencias; Treasury ejecuta y descarga cartolas; Accounting registra totales semanales; Technology administra accesos privilegiados y puede modificar exportaciones; Compliance recibe denuncias a través de Management; Internal Audit revisa una muestra anual. Hay conciliaciones con antigüedad de 43 días, contrapartes con nombres inconsistentes y tres controles automáticos fallidos que no generaron ticket.

No se sabe todavía si el origen es fraude, error de corte, duplicación, activo restringido, comisión no registrada, pérdida de claves o una combinación. El objetivo no es adivinar: es construir evidencia suficiente para separar hipótesis.

## Evidencia disponible

- libro auxiliar de clientes al cierre;
- extractos de dos bancos;
- saldos y movimientos de tres wallets/exchanges;
- log de accesos privilegiados;
- tickets de transferencias;
- mayor contable y cuentas de control;
- configuración y resultados de controles automáticos;
- denuncia anónima que menciona una whitelist modificada;
- actas del Board y matriz de autorizaciones.

## Trabajo del estudiante

Evalúa por separado y luego conecta:

1. **Tecnología:** integridad de logs, identidades, accesos privilegiados, cambios, interfaces y disponibilidad de evidencia.
2. **Contabilidad:** mayor, libros auxiliares, corte, reconocimiento, restricciones, comisiones y conciliaciones.
3. **Gobernanza:** apetito, información al Board, autoridad, independencia y rendición de cuentas.
4. **Personas:** concentración de privilegios, reemplazos, incentivos, conflictos y canal de denuncias.
5. **Procesos:** recorrido request→audit, puntos sin evidencia, operaciones fuera de flujo y excepciones.
6. **Auditoría:** cobertura, frecuencia, calidad de evidencia, seguimiento y acceso directo al Board.
7. **Riesgos:** registro, P×I, dueño, controles, residual, KRI, umbrales y respuesta.

## Entregables

- cronología verificable del descalce y mapa de hipótesis;
- conciliación de tres vías por activo y contraparte;
- matriz RACI y SoD rediseñada;
- inventario de controles Preventive/Detective/Corrective y Manual/Automated/Hybrid;
- risk register priorizado con KRI y umbrales;
- plan de preservación de evidencia e investigación independiente;
- calendario configurable de revisión diaria, semanal, mensual, trimestral y anual;
- diseño objetivo y plan de transición 30/60/90 días;
- criterios que demuestren que el descalce se resolvió sin ocultar diferencias.

## Criterio de aprobación

No basta con cuadrar CLP 84.000.000 mediante un asiento. La propuesta debe explicar el origen con evidencia, aislar conflictos, proteger la investigación, corregir el libro auxiliar cuando corresponda y rediseñar el sistema para que una recurrencia sea visible dentro del umbral definido.

Practica el flujo en SANDBOX desde **Control interno**, usando una persona distinta en cada etapa y adjuntando referencias sintéticas, nunca datos reales.
