## Qué cambia

<!-- Qué problema resuelve. Si hay una incidencia, enlázala: Closes #123 -->

## Cómo lo comprobaste

<!-- Comandos ejecutados, casos probados, plataformas donde lo verificaste. -->

## Lista de control

- [ ] `pnpm check` pasa en verde
- [ ] Los comentarios nuevos explican **por qué**, no qué
- [ ] Ningún archivo que viaje al navegador o al APK importa `node:*`
- [ ] No se sube contabilidad real, certificados ni claves

### Si tocaste una regla tributaria

- [ ] El cambio está en `packages/chile-tax-rules/rules/<año>.json`
- [ ] La regla declara `source` (URL oficial) y `lastVerified`
- [ ] Regeneré el módulo embebido: `node scripts/build-rules.mjs`
- [ ] No reescribí una regla de un año histórico
- [ ] Hay una prueba que demuestra el nuevo comportamiento

**Fuente oficial:** <!-- URL -->

### Si tocaste la interfaz

- [ ] Interpolé con la plantilla `html` de `lib/dom.js` (escapa por defecto)
- [ ] Se ve bien en móvil y en escritorio, en tema claro y oscuro
- [ ] Sin dependencias ni recursos externos

### Si tocaste reglas de integridad

<!-- Evidencia obligatoria, inmutabilidad de períodos cerrados, bitácora append-only,
     separación real/sandbox. Estas reglas no se relajan: explica por qué es necesario. -->
