# Plan de PR pequenos para la expansion multijurisdiccion

Fecha: **2026-10-27**. Cada PR debe mantener `pnpm check`, `pnpm test` y `pnpm build` verdes; las
pruebas de empaquetado se ejecutan cuando la superficie correspondiente cambia.

| PR | Alcance | Prueba de aceptacion | Reversion |
|---:|---|---|---|
| 1 | Fase 0: matriz, contrato neutral, registro, perfiles documentales e i18n base. | CL 2026 conserva resultados; otros paises fallan cerrado; pais e idioma son independientes. | Retirar modulos nuevos; sin migracion. |
| 2 | ✅ Metadatos de reglas CL en contrato versionado, sin alterar formulas. | Fixtures de cada calculo legacy antes/despues identicos. | Volver al adaptador directo. |
| 3 | ✅ Contexto jurisdiccional como extension del respaldo v4. | Importacion v1/v2/v3 sin perdida; REAL/SANDBOX aislados. | Ignorar campos opcionales nuevos. |
| 4 | ✅ Selector global responsive; idioma separado de pais fiscal. | Selector presente en todas las vistas; CL+en y MX+pt-BR. | Ocultar selector y conservar defaults CL/es-CL. |
| 5 | ✅ Flujo de caja CL 6/12/24/36 e inactividad con estados no equivalentes. | Cero ventas con compras no es “sin movimiento”; F29 exige perfil probado. | Desactivar modulo sin tocar operaciones. |
| 6 | ✅ Expediente de liquidez/insolvencia CL orientativo. | Elegibilidad `REQUIRES_VERIFICATION`; sin envio ni firma. | Exportar evidencia y retirar UI. |
| 7 | ✅ Piloto documental PE. Revision profesional de cada caso sigue pendiente. | RUC/SUNAT, nunca F29; calculos apagados. | Mantener `DOCUMENTARY_ONLY`. |
| 8 | ✅ Perfiles documentales MX/CO/AR/BR/ES y requisitos subnacionales. | CABA no se generaliza; BR requiere subdivision; ES no calcula. | Desactivar cada pack de forma independiente. |
| 9 | 🔄 E2E Web/Windows/Android, manuales y release evidence. | Gates locales y workflows de plataforma ligados al commit final. | Revertir integracion UI, no contratos estables. |

Ningun PR cambia simultaneamente formulas chilenas, persistencia y UI. Esa separacion permite
atribuir una regresion y revertirla sin perder datos.
