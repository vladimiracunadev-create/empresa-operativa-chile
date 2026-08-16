# 🤝 Contribuir

<div align="center">

[![Pruebas](https://img.shields.io/badge/pruebas-131_verdes-2e8b57?style=for-the-badge)](tests/)
[![Dependencias](https://img.shields.io/badge/dependencias-0-2f81f7?style=for-the-badge)](package.json)
[![Reglas](https://img.shields.io/badge/toda_tasa-con_fuente_oficial-8957e5?style=for-the-badge)](docs/SOURCES-2026.md)

[🏠 Inicio](README.md) · [🏗️ Arquitectura](docs/ARCHITECTURE.md) · [🔐 Seguridad](SECURITY.md) · [📜 Código de conducta](CODE_OF_CONDUCT.md)

</div>

---

Gracias por el interés. Este proyecto calcula impuestos de empresas reales, así que las reglas
son un poco más estrictas de lo habitual — y todas tienen un motivo concreto.

## 🚀 Antes de nada

```bash
npm run check    # sincronía de reglas + validación + 131 pruebas
npm run build    # deja apps/web/dist listo
```

No hace falta `npm install` para trabajar en el motor, la web ni la CLI: no hay dependencias
de producción, y CI falla si aparece alguna.

## 🏛️ Cambiar una regla tributaria

Es el cambio más delicado del repositorio. Una tasa equivocada no rompe nada visiblemente:
produce números plausibles que aparecen meses después como una diferencia con el SII.

Toda modificación debe incluir, sin excepción:

1. **Vigencia** — a qué año comercial aplica.
2. **Fuente oficial primaria** (`source`), enlazable y verificable.
3. **Fecha de verificación** (`lastVerified`), el día en que abriste esa fuente.
4. **El cambio en `packages/chile-tax-rules/rules/<año>.json`.**
5. **Regenerar el módulo embebido:** `node scripts/build-rules.mjs`.
6. **Una prueba** que demuestre el nuevo comportamiento.
7. **Nota de migración** si rompe un escenario existente.

### Nunca reescribas una regla histórica

Un año nuevo es un **archivo nuevo**. `rules/2026.json` describe cómo se calculaba en 2026 y
debe seguir describiéndolo para siempre: es lo que permite recalcular un período antiguo y
obtener lo que se declaró entonces, no lo que se declararía hoy.

### Nunca hagas que un año faltante degrade a otro

`loadRules(2027)` sin `rules/2027.json` **debe fallar**. Devolver silenciosamente las reglas de
2026 sería el peor error posible de este sistema.

## 📅 Añadir un año

```bash
cp packages/chile-tax-rules/rules/2026.json packages/chile-tax-rules/rules/2027.json
# editar valores, source y lastVerified de cada regla
node scripts/build-rules.mjs
npm test
```

Las pruebas de `tests/rules.test.mjs` exigen que **toda** regla numérica del año nuevo declare
fuente y fecha de verificación. Si falta una, el año no entra.

## ⚙️ Tocar el motor operativo

`packages/company-operations/workspace.mjs` corre en el navegador, en Android y en Windows.

- **No importes `node:*` ahí.** Ni en `store.mjs`, `rut.mjs`, `accounting-engine/` o
  `chile-tax-rules/`. El build falla y una prueba lo comprueba, pero conviene saber por qué:
  ese import deja la pantalla en blanco dentro del APK sin ningún error visible.
- Lo que necesite disco va en `node-store.mjs` o `index.mjs`, que sólo carga Node.
- Toda mutación tiene que dejar una línea en la bitácora (`this.audit(...)`).

## 🎨 Tocar la interfaz

- Una vista por archivo en `apps/web/src/views/`, exportando
  `{ id, label, title, icon, render() }` y opcionalmente `mount(root, rerender)` y `badge()`.
- Registrarla en `NAV` dentro de `apps/web/src/app.js`. Hay una prueba que lo verifica.
- **Interpola siempre con la plantilla `html`** de `lib/dom.js`, que escapa por defecto. Los
  datos los escribe el usuario y después se muestran en tablas y en la bitácora.
- Sin dependencias externas ni recursos remotos: la CSP los bloquea y el APK debe funcionar
  sin conexión.

## 🔐 Reglas de integridad que no se negocian

Si una propuesta relaja alguna de estas, la respuesta será que no, aunque el código esté bien:

- un trámite o una obligación **no** puede marcarse cumplida sin evidencia;
- un período cerrado **no** admite altas, bajas ni modificaciones;
- reabrir un período **exige** un motivo escrito;
- la bitácora **no** expone ninguna operación de borrado o edición;
- el sandbox **nunca** escribe en la empresa real.

## 🧪 Pruebas

Runner nativo de Node, sin framework:

```bash
node --test tests/*.test.mjs
```

Escribe la prueba describiendo la **regla de negocio**, no la implementación. Compara:

```js
test('un período cerrado es inmutable en las dos direcciones', ...)   // sí
test('closePeriod pushea a closed-periods.json', ...)                 // no
```

## 🚫 Datos

**Nunca** subas al repositorio contabilidad real, respaldos exportados de EMPRESA REAL,
certificados digitales, claves privadas ni cartolas. El workflow de seguridad los busca en cada
push, pero el filtro de verdad eres tú. Para datos de prueba está `data/scenarios/`.

Ver [`SECURITY.md`](SECURITY.md).

## ✍️ Estilo

- Español en el código de usuario, los mensajes de error y la documentación.
- Comentarios que expliquen **por qué**, no qué. El qué ya está en el código.
- Mensajes de error escritos para una persona que no programó esto.

## 📬 Pull requests

Explica qué problema resuelve y cómo lo comprobaste. Si toca una tasa, incluye el enlace a la
fuente oficial en la descripción. CI debe quedar en verde antes de la revisión.
