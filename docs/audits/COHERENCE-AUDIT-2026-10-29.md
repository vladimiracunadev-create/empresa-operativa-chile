# Auditoría de coherencia · v1.6.0 · 2026-10-29

## Alcance y fuente de verdad

Auditoría del estado actual posterior al release `v1.6.0`. Se contrastaron manifests, código,
pruebas ejecutadas, workflows, documentación, metadatos públicos de GitHub y publicación. Las
referencias fechadas de changelog, auditorías y snapshots anteriores se conservaron como historia.

- Repositorio: `vladimiracunadev-create/empresa-operativa-chile`.
- Rama y commit auditados: `main` · `3b0cbcc3e101d93677633c407b80ee96873b6795`.
- Release: [`v1.6.0`](https://github.com/vladimiracunadev-create/empresa-operativa-chile/releases/tag/v1.6.0).
- Gestor de Node: exclusivamente `pnpm@11.25.0`.

## Matriz de coherencia

| Afirmación actual | Fuente de verdad y evidencia | Resultado |
| --- | --- | --- |
| Manifests y release del corte auditado | `package.json`, Android, shell Tauri, `Cargo.toml`, `tauri.conf.json`, `APP_VERSION`, tag y release observados entonces | Coherente |
| 207 pruebas | Ejecución fresca de `pnpm check`: 207 aprobadas, 0 fallidas | Coherente tras corregir dos marcadores 204 |
| Documentos derivados | `pnpm check`: reglas, glosario (76), guía (14 etapas), atajos (12) y presentación (8 láminas) sincronizados | Coherente |
| 6 workflows | `android.yml`, `ci.yml`, `desktop.yml`, `pages.yml`, `release.yml`, `security.yml` | Coherente |
| Acciones externas fijadas | Todos los `uses:` externos emplean SHA completo; las dos referencias locales de `release.yml` reutilizan workflows del mismo commit | Coherente |
| Runtime Node | `engines`: líneas corregidas 22.23.4, 24.22.1 y 26.13.0; `.node-version`: 24.22.2 | Coherente |
| Empaquetado | Capacitor 7.6.9; Tauri CLI 2.12.4; release construye Android y Windows desde el mismo tag | Coherente |
| Seguridad observable | CodeQL: 0 alertas abiertas; Dependabot: 0 alertas abiertas; auditorías pnpm/RustSec en CI | Coherente al cierre |
| Publicación | Workflow `40903228808` exitoso; APK, MSI, NSIS, portable, manuales, SBOM CycloneDX y SHA-256 publicados | Coherente |
| GitHub Pages | Homepage pública respondió HTTP 200 y el repositorio declara Pages activo | Coherente |
| About de GitHub | Descripción actualizada a v1.6.0/207 pruebas; `zero-dependencies` sustituido por `multijurisdiction` | Coherente |

## Correcciones efectuadas

1. `README.md` y `docs/ARCHITECTURE.md` anunciaban 204 pruebas; la fuente ejecutable demostró 207.
2. El mapa de arquitectura omitía `core`, `i18n` y `jurisdictions`; ahora muestra la separación
   entre dominio, idioma y reglas legales nacionales.
3. `docs/system-documentation/` se presentaba como documentación vigente aunque sus datos
   corresponden al commit v1.5 auditado el 2026-09-22. Se preservó sin reescribir la historia y se
   rotuló explícitamente como snapshot histórico.
4. El About todavía anunciaba v1.5.0. Se sincronizó con v1.6.0 y se retiró el topic absoluto
   `zero-dependencies`: el núcleo, la CLI y la interfaz no tienen dependencias de producción, pero
   los shells de Android y Windows sí usan Capacitor y Tauri.

## Referencias históricas preservadas

Las apariciones de `1.5.0`, 159 pruebas o dependencias anteriores dentro de `CHANGELOG.md`,
auditorías fechadas, evidencia de releases y el snapshot de documentación de sistema **no son
estado actual**. Cambiarlas destruiría trazabilidad; por eso se conservaron y se aclaró su alcance.

## Límites que no deben convertirse en afirmaciones más amplias

- Los perfiles PE/MX/CO/AR/BR/ES son documentales; sus cálculos fiscales continúan desactivados.
- Un CI verde demuestra build, pruebas y comprobaciones declaradas, no certificación legal ni
  usabilidad completa en dispositivos físicos.
- Los binarios publicados no tienen firma comercial y el APK usa firma de depuración.
- El producto no presenta declaraciones, no paga impuestos y no actúa ante autoridades.

## Veredicto

Los marcadores de estado actual revisados quedan alineados con fuentes ejecutables o remotas. No
quedan incoherencias conocidas de versión, conteo de pruebas, workflows, runtime, release o About.
La documentación histórica permanece identificada como tal y no se usa para describir v1.6.0.
