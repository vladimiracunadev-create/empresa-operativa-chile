# Continuidad, inactividad e insolvencia

## Estados de actividad

`NO_TAX_START`, `NO_MOVEMENT`, `ZERO_SALES_WITH_MOVEMENT`, `OPERATING` y
`REQUIRES_VERIFICATION` son resultados distintos. Cero ventas con compras, honorarios, oficina u otro
movimiento nunca se muestra como “sin movimiento”. F22 y declaraciones juradas no se infieren desde una
sola cifra mensual.

## Caja

La proyección usa caja inicial, ingresos estimados y costos recurrentes/variables proporcionados por el
usuario. Entrega 6, 12, 24 y 36 meses. Es una simulación: una reserva recomendada es política interna,
no mínimo legal.

## Inactividad

Los umbrales SII producen `LEGAL_THRESHOLD_SIGNAL`. La app conserva evidencia y remite a la fuente; no
declara que la sociedad desapareció. Se deben revisar acciones del SII, seis meses posteriores, activos o
utilidades pendientes, diferencias, deudas, resolución y vías de revisión.

## Liquidez e insolvencia

Una brecha de caja es una alerta, no un diagnóstico concursal. El expediente local agrupa referencias a
bienes, gravámenes, acreedores, vencimientos, juicios, trabajadores, cartolas y carpeta tributaria. El campo
de elegibilidad permanece `REQUIRES_VERIFICATION`, `submitted` y `signed` permanecen `false`.

Deuda, insolvencia, reorganización, liquidación concursal, disolución societaria y término de giro son
conceptos diferentes. La aplicación no clasifica a una SpA sin trabajadores como elegible para un proceso
simplificado.

## Recuperación y reversión

- Un fallo de validación conserva el dato anterior.
- Los campos pueden quedar “No determinado”; cero no sustituye evidencia faltante.
- Retirar la vista no altera operaciones ni cierres: los contratos de respaldo v4 son extensiones opcionales.
- Respaldos v1/v2/v3 se importan con el default histórico Chile/es-CL, sin modificar el archivo original.

