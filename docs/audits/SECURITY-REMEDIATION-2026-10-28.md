# Remediación de seguridad — 2026-10-28

Estado: **implementada en `main`; release 1.6.0 en preparación**.

Este documento registra hechos ejecutados. No certifica que el producto sea
invulnerable ni reemplaza la revisión continua de nuevas alertas.

## Resultado

| Área | Antes | Remediación | Evidencia |
| --- | --- | --- | --- |
| Android / Capacitor | APK 1.5.0 afectado por CVE-2026-103922 | APK retirado; `@capacitor/*` fijado en 7.6.9 | [PR #3](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/3), advisory oficial GHSA-rvm3-566m-v7fv |
| Node.js | Baselines sin fijar a las líneas corregidas de octubre de 2026 | 22.23.4, 24.22.2 y 26.13.0; `.node-version` en 24.22.2 | [PR #4](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/4) |
| Java / Rust / pnpm | Versiones móviles o parcialmente declaradas | Temurin 21.0.13+9, Rust 1.99.1 y pnpm 11.25.0 fijados | [PR #4](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/4) |
| Tauri | CLI 2.11.4 | CLI 2.12.4; instaladores Windows compilados y ejecutable iniciado en CI | [PR #6](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/6) |
| Dependencias | Sin actualización ni auditoría continua | Dependabot semanal, `pnpm audit`, RustSec y dependency review | [PR #5](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/5) |
| Migraciones mayores | Dependabot podía proponer Capacitor 8 automáticamente | Grupo Capacitor limitado a `minor` y `patch`; los PR mayores #7, #9 y #10 se cerraron | [PR #8](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/8) |
| Análisis estático | 14 alertas CodeQL abiertas | 0 alertas abiertas en `main`: temporales exclusivos, sin TOCTOU y atributos HTML completos | [PR #11](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/11) |

## Gates observados

- `pnpm check`: **207/207 pruebas** después de la remediación CodeQL.
- `pnpm build`: correcto; Web/PWA generada con 75 archivos.
- Android: APK generado, abierto como ZIP y verificado por contenido en CI.
- Windows: MSI, NSIS y portable generados; el portable permaneció vivo tras el arranque de control.
- `main`: CI, Seguridad y Pages verdes en el commit `ea0660b2a554f831f4c279a856baffa99bcb250f`.
- GitHub Code Scanning: **0 alertas abiertas** para `refs/heads/main` al cerrar esta auditoría.
- GitHub Dependabot: sin alertas abiertas no justificadas; la excepción `glib` corresponde a la cadena GTK/Linux no publicada y quedó documentada como `not_used`.

## Fuentes primarias

- Capacitor: <https://github.com/ionic-team/capacitor/security/advisories/GHSA-rvm3-566m-v7fv>
- Node.js, security releases de octubre de 2026: <https://nodejs.org/pt/blog/vulnerability/october-2026-security-releases>
- Rust 1.99.1: <https://blog.rust-lang.org/2026/10/15/Rust-1.99.1/>
- Cargo CVE-2026-5223: <https://blog.rust-lang.org/2026/05/25/cve-2026-5223/>
- Temurin, cambio de cadena de confianza de octubre de 2026: <https://adoptium.net/en-GB/news/2026/10/temurin-october-2026-emudhra>
- RustSec / `cargo-audit`: <https://github.com/rustsec/rustsec/tree/main/cargo-audit>

## Riesgos que permanecen

- Los binarios de Windows y el APK no usan certificados de distribución del propietario; SmartScreen y Android muestran advertencias.
- El APK de CI usa firma de depuración y no es un artefacto para Google Play.
- Una auditoría sin alertas hoy no cubre vulnerabilidades publicadas en el futuro; Dependabot y los workflows semanales deben permanecer activos.
- Capacitor 8 requiere una migración de plataforma separada, no una actualización automática.
