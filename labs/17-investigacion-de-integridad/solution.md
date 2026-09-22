# Solución orientativa — Investigación de integridad

No existe una única conclusión correcta porque la evidencia está deliberadamente incompleta. Una respuesta competente conserva varias hipótesis y evita atribuir intención.

## Ejemplo de razonamiento

| Hecho establecido | Evidencia | Hipótesis | Contraste necesario | Conclusión provisional |
|---|---|---|---|---|
| el pago ocurrió antes de crearse el informe | cartola y metadato | respaldo tardío de servicio real / operación sin sustancia | entregables, comunicaciones y confirmación independiente | la recepción contemporánea no está acreditada |
| cuentas distintas actuaron en minutos desde el mismo contexto | logs | equipo coordinado legítimo / credenciales compartidas | MFA, dispositivo, turnos, entrevistas y permisos | la SoD nominal no demuestra independencia efectiva |
| la alerta se cerró sin fundamento | ticket | error operativo / interferencia | permisos, historial y casos comparables | falló la trazabilidad de excepciones |

## Controles esperados

- **Preventivo híbrido:** declaración de vínculos y bloqueo de autoaprobación por persona, dispositivo y beneficiario relacionado.
- **Detectivo automatizado:** cruce DTE–orden–recepción–banco–RCV con alerta por evidencia posterior y concentración de aprobaciones.
- **Correctivo manual:** reabrir excepción, preservar versiones, revisar universo de operaciones similares y corregir declaraciones sólo con asesoría competente.

## Verificación

Tomar una muestra posterior de proveedores nuevos y pagos sobre umbral; comprobar vínculo declarado, recepción anterior al pago, aprobadores independientes, excepciones con fundamento y tickets cerrados por una segunda línea. Registrar período, universo, muestra, resultado, revisor y acciones por fallos.

## Límite

La solución no determina fraude, delito tributario, corrupción ni responsabilidad personal. Esas conclusiones exigen evidencia adicional, competencia legal y debido proceso.
