# Plan de PR pequenos para la expansion multijurisdiccion

Fecha: **2026-10-27**. Cada PR debe mantener `pnpm check`, `pnpm test` y `pnpm build` verdes; las
pruebas de empaquetado se ejecutan cuando la superficie correspondiente cambia.

| PR | Alcance | Prueba de aceptacion | Reversion |
|---:|---|---|---|
| 1 | Fase 0: matriz, contrato neutral, registro, perfiles documentales e i18n base. | CL 2026 conserva resultados; otros paises fallan cerrado; pais e idioma son independientes. | Retirar modulos nuevos; sin migracion. |
| 2 | Envolver metadatos de reglas CL en el contrato versionado sin alterar formulas. | Fixtures de cada calculo legacy antes/despues son identicos. | Volver al adaptador directo. |
| 3 | Persistir contexto jurisdiccional como extension opcional del respaldo v3. | Importacion v1/v2/v3 sin perdida; REAL/SANDBOX aislados. | Ignorar campos opcionales nuevos. |
| 4 | Selector global accesible y responsive; idioma separado de pais fiscal. | Teclado, lector de pantalla y viewport movil; CL+en y MX+pt-BR. | Ocultar selector y conservar defaults CL/es-CL. |
| 5 | Flujo de caja CL 6/12/24/36 e inactividad con estados no equivalentes. | Cero ventas con compras no se llama “sin movimiento”; no se inventan F29/F22/DJ. | Desactivar modulo sin tocar operaciones. |
| 6 | Expediente de liquidez/insolvencia CL, solo orientativo. | Siempre `REQUIRES_VERIFICACION` para elegibilidad; nunca envia solicitudes. | Exportar evidencia y retirar UI. |
| 7 | Piloto documental PE con revision legal humana registrada. | RUC/SUNAT, nunca F29; calculos siguen apagados. | Volver perfil a `DOCUMENTARY_ONLY`. |
| 8 | Perfiles MX/CO/AR/BR/ES y resolucion subnacional. | CABA no se generaliza; BR exige estado/municipio; ES sin reglas no calcula. | Desactivar cada pack de forma independiente. |
| 9 | E2E Web/Windows/Android, manuales generados y release evidence. | Artefactos contienen los mismos modulos y pasan los workflows de plataforma. | Revertir integracion UI, no los contratos estables. |

Ningun PR cambia simultaneamente formulas chilenas, persistencia y UI. Esa separacion permite
atribuir una regresion y revertirla sin perder datos.
