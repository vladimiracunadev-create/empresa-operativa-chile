# Evidencia de release — cierre multijurisdicción

Fecha de verificación: **2026-10-28**  
Producto: **Empresa Operativa Chile 1.5.0**  
Pull request: [#2](https://github.com/vladimiracunadev-create/empresa-operativa-chile/pull/2)  
Commit funcional verificado: `7c0e8ecea75e639b7c0dc3d9c49b2651baf64190`  
Rama verificada: `codex/multijurisdiction-completion`

## 1. Identidad y alcance

Esta evidencia corresponde al cierre técnico del alcance trazado en
[`MASTER-PROMPT-V3-CROSSWALK.md`](./MASTER-PROMPT-V3-CROSSWALK.md). El motor Chile conserva sus
reglas preexistentes; Perú, México, Colombia, Argentina, Brasil y España se exponen como perfiles
documentales con cálculo legal desactivado. No se declara soporte tributario integral para esos países.

La verificación cubre código, datos de reglas versionadas, migraciones, Web/PWA, contenido del APK,
compilación y arranque básico del ejecutable Windows. No equivale a certificación jurídica, prueba en
un dispositivo Android físico, publicación en tiendas ni presentación real ante una autoridad.

## 2. Matriz de afirmaciones

| Afirmación | Evidencia | Resultado |
|---|---|---|
| País fiscal e idioma son dimensiones independientes | Pruebas de contexto/i18n y selector global; escenarios CL+en, PE+es, MX+pt-BR | ✅ Verificado |
| Un país sin regla aprobada no produce cálculo | `CountryPack`, estados regulatorios y pruebas `NOT_IMPLEMENTED`/`DRAFT`/`STALE`/`DISPUTED` | ✅ Fail closed |
| Chile mantiene compatibilidad | Fixtures legacy, reglas 2026 y 201 pruebas Node | ✅ Verificado |
| REAL y SANDBOX permanecen separados | Migración de respaldo v1–v4 y pruebas de aislamiento | ✅ Verificado |
| La documentación generada nace de sus fuentes | Gates de reglas, glosario, guía, atajos y presentación | ✅ Sin drift |
| Android contiene la aplicación, no solo un contenedor | Inspección ZIP del APK: 17 vistas, 36 módulos, reglas, recursos y bytecode | ✅ Verificado en CI |
| Windows empaqueta y el portable inicia | MSI, NSIS y portable; proceso vivo después de 12 segundos | ✅ Verificado en CI |
| Los perfiles extranjeros calculan obligaciones locales completas | Calculadoras permanecen desactivadas hasta revisión profesional | ⛔ No se afirma |

## 3. Gates locales

Ejecutados sobre el commit funcional antes de publicar la evidencia:

| Comando | Resultado observado |
|---|---|
| `pnpm check` | ✅ 201/201 pruebas; fuentes generadas sincronizadas |
| `pnpm test` | ✅ Incluido en la batería Node, 201/201 |
| `pnpm build` | ✅ 75 archivos, 7.626 KB, build `353ddbdb2f6d` |
| `pnpm android:prepare` | ✅ 76 archivos, 17 vistas y 36 módulos del núcleo copiados |

Una primera ejecución restringida de `pnpm check` produjo cuatro errores `EPERM` al renombrar
temporales. La misma revisión, repetida fuera de ese aislamiento y con un directorio temporal del
workspace, pasó completa. Se clasifica como incidente del entorno de ejecución, no como fallo del
producto.

## 4. Gates remotos

Todos los workflows siguientes terminaron en `success` y apuntan al commit funcional exacto:

| Workflow | Run | Cobertura relevante | Resultado |
|---|---|---|---|
| CI | [40780483927](https://github.com/vladimiracunadev-create/empresa-operativa-chile/actions/runs/40780483927) | Node 20/22 en Ubuntu, Node 22 en Windows, build reproducible, servidor local y workflows | ✅ |
| Seguridad | [40780483968](https://github.com/vladimiracunadev-create/empresa-operativa-chile/actions/runs/40780483968) | CodeQL, ausencia de datos reales/credenciales y cero dependencias de producción | ✅ |
| Android | [40780504747](https://github.com/vladimiracunadev-create/empresa-operativa-chile/actions/runs/40780504747) | Capacitor, Gradle, contenido interno del APK y publicación del artefacto | ✅ |
| Windows | [40780505079](https://github.com/vladimiracunadev-create/empresa-operativa-chile/actions/runs/40780505079) | Rust, Tauri, MSI/NSIS/portable y prueba de arranque | ✅ |

Pruebas Rust de Windows: **2 aprobadas, 0 fallidas**. El ejecutable portable arrancó y permaneció
en ejecución durante la comprobación automatizada.

## 5. Artefactos

### Android

- Artefacto: `EmpresaOperativaChile-android` (ID `12856772228`).
- Archivo principal: `EmpresaOperativaChile-android.apk`.
- APK: 8,4 MB; SHA-256 `546eafe680f1757ab204d2855164a47c0ae496aeb293228cf5acf85ffa9f0042`.
- ZIP del artefacto: 8.405.886 bytes; SHA-256 `8b992ba49e952a9a949190624d94e0da5dd40794728f44161b0ca870d6cdcb74`.
- Verificación interna: índice, arranque, CSS, manifiesto PWA, 17 vistas, 36 módulos del núcleo,
  seis iconos, manifiesto Android, recursos, `classes.dex` y reglas tributarias.
- Es un APK de depuración; no es un binario firmado para Google Play.

### Windows

- Artefacto: `EmpresaOperativaChile-windows` (ID `12857276738`).
- ZIP del artefacto: 17.194.838 bytes; SHA-256
  `4de2d5117f02ae7bbe2be838eef17f653b39a988ab4927a3a63c7943572a155b`.
- Portable, 7,22 MB: `a6c73a560d781c840dd2f780281c0089483b8001cc20021bd44e2319e89d15db`.
- Instalador NSIS, 5,32 MB: `5cd18ad13c1fddbef949e9e85aee198b57008a9cb63cef337416370a23f1c619`.
- MSI, 5,77 MB: `7a61746bc10f7ddbe56c32c362a033e2c0f8d53041a2717d606798fc9ad5ac4d`.

Los artefactos expiran el **2026-11-11** según la retención de 14 días del workflow.

## 6. Verificación funcional y visual

La vista de continuidad se capturó de nuevo desde un servidor limpio después de detectar y descartar
una instancia anterior que seguía ocupando el puerto inicial. Se revisaron las capturas de escritorio
y móvil: el recorrido pedagógico, la matriz de costos y las advertencias son legibles; en móvil, la
barra de etapas usa desplazamiento horizontal intencional.

Evidencias: [`continuidad.png`](../assets/capturas/continuidad.png) y
[`movil-continuidad.png`](../assets/capturas/movil-continuidad.png).

## 7. Incidentes y advertencias

- GitHub Actions advierte que algunas acciones aún declaran Node.js 20 y están siendo forzadas a
  Node.js 24; no hizo fallar los runs, pero corresponde actualizar esas acciones cuando exista una
  versión fijable y validada.
- Android informó deprecación de `setup-java@v4` y migración de `ubuntu-latest` a Ubuntu 26.04.
- La verificación Windows demuestra compilación y arranque básico, no una sesión manual extensa ni
  instalación en todas las ediciones de Windows.
- No se ejecutaron trámites reales, pagos, declaraciones, firmas, cobros ni envíos a organismos.

## 8. No comprobado y riesgo residual

- Dispositivo Android físico, permisos del fabricante, instalación desde origen desconocido y ciclo
  completo bajo presión de memoria.
- Firma de producción, Google Play, Microsoft Store, reputación SmartScreen o certificado comercial.
- Integración con portales de autoridades, porque el producto solo orienta y conserva evidencia.
- Revisión profesional país por país de todas las obligaciones: los perfiles no CL continúan
  `DOCUMENTARY_ONLY` y sin tasas activas.
- Aplicabilidad de una regla a un contribuyente real: siempre depende de hechos y evidencia del caso.

## 9. Veredicto

**APTO para integración técnica en `main`**, condicionado a que los checks del commit documental y
del commit de integración permanezcan verdes. La evidencia respalda compatibilidad, fail-closed,
empaquetado y ausencia de regresiones observables; no certifica cumplimiento jurídico de una empresa
real ni habilita automáticamente ningún beneficio, régimen o procedimiento concursal.
