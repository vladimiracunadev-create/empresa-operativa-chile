# Ciclo de vida controlado por la aplicación

El ciclo ya no es una lista lineal. `packages/core/lifecycle.mjs` define un grafo auditable que puede
volver desde operación a empresa sin clientes, entrar en alerta de liquidez, recuperarse o pasar a una
ruta jurídica que siempre exige verificación profesional.

Estados: planificación; constituida sin actividad; activa sin clientes; operación; alerta de liquidez;
negociación voluntaria; recuperación; reestructuración extrajudicial o judicial; reorganización concursal;
liquidación concursal; disolución societaria; término tributario; suspensión temporal; y contingencia del
administrador. La disponibilidad jurídica de cada estado depende del país: el grafo no trasplanta una figura
chilena a otra jurisdicción.

Cada transición registra fecha, país/subdivisión, responsable, obligaciones, condiciones de entrada/salida,
evidencia, fuentes, advertencias, historial y fallo recuperable. Las transiciones de riesgo devuelven
`REQUIRES_VERIFICATION`; la aplicación no adjudica derechos ni presenta solicitudes.

## Expediente mínimo de constitución
- borrador societario;
- certificado/estatuto vigente;
- RUT;
- domicilio y contrato de oficina virtual;
- inicio de actividades;
- actividades económicas;
- régimen tributario;
- habilitación DTE;
- patente municipal;
- cuenta bancaria;
- políticas contables iniciales.
