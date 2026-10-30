# 🗺️ Roadmap

<div align="center">

[![Actual](https://img.shields.io/badge/actual-v1.7.1-e8590c?style=for-the-badge)](../CHANGELOG.md)
[![Siguiente](https://img.shields.io/badge/siguiente-v1.8_·_integraciones-2f81f7?style=for-the-badge)](#-v18--integraciones-y-conciliación)

[🏠 Inicio](../README.md) · [📓 Changelog](../CHANGELOG.md) · [🏗️ Arquitectura](ARCHITECTURE.md)

</div>

---

Estado a **2026-10-30**, versión 1.7.1.

## ✅ v1.0 — publicado

- Motor tributario: IVA, PPM, honorarios, patente municipal, IDPC, asientos explicados.
- Reglas versionadas por año, cada una con fuente oficial y fecha de verificación.
- EMPRESA REAL y SANDBOX en espacios de trabajo separados.
- Constitución en 9 pasos con evidencia obligatoria.
- Operaciones, obligaciones, cierre de período inmutable y bitácora append-only.
- Remanente de crédito fiscal arrastrado entre períodos.
- Borrador F29 con IVA de documentos y los tres vencimientos calculados.
- Exportación e importación entre plataformas; CSV de operaciones y bitácora.
- **Aplicación Android (APK)**, **aplicación de Windows** (MSI, NSIS, portable) y **PWA**.
- CLI en español para cálculo y para operar un espacio de trabajo en archivos.
- Academia integrada en la app, usando el mismo motor.
- 50 pruebas; artefactos verificados por dentro en CI.

## ✅ v1.5 — gobierno y control interno

- Diez funciones de gobierno y matriz RACI desde Board hasta External Audit.
- Segregación ejecutable de request, validate, approve, execute, record, reconcile y audit.
- Procesos críticos con identidad, valor, contraparte, libro auxiliar y evidencia por etapa.
- Catálogo de controles Preventive/Detective/Corrective y Manual/Automated/Hybrid.
- Risk register, seis KRI observables y frecuencias configurables de auditoría continua.
- Whistleblowing con preservación, independencia, conflicto y escalamiento.
- Escenario de custodia digital y caso capstone de descalce.
- Respaldo portable v3 compatible en importación con v1/v2.

### Extensión de integridad posterior a v1.5

- C61–C70 desarrolladas con fraude tributario defensivo, conflictos, partes relacionadas, investigación, causa raíz y remediación.
- Caso sintético “La operación que sí cuadraba” y laboratorio de investigación.
- Investigación trazable con confidencialidad, represalia, hechos, hipótesis, evidencia faltante, separación investigador/decisor y verificación.
- Ocho KRI: se añaden casos abiertos y remediaciones vencidas.
- Fuentes oficiales y bibliografía secundaria separadas, con límites y fecha de verificación.

## ✅ v1.6 — multijurisdicción y seguridad

- País fiscal e idioma de interfaz como dimensiones independientes.
- Contrato `CountryPack`; Chile conserva sus reglas y seis países parten en modo documental.
- Grafo auditable del ciclo de vida, caja 6/12/24/36 meses, inactividad y contingencias.
- Fail-closed cuando falta una regla, vigencia, feriado, subdivisión o revisión humana.
- Capacitor y runtimes corregidos; Dependabot, auditorías pnpm/RustSec y CodeQL sin alertas abiertas.
- SBOM CycloneDX y hashes SHA-256 en los releases.

## ✅ v1.7 — Academia completa y offline

- 70 clases desarrolladas en 17 partes, con ejemplo, taller, recuperación y evaluación.
- 12 rutas guiadas, 17 laboratorios con rúbrica, 4 casos integradores y 2 talleres del motor.
- Buscador, lector enfocado, navegación anterior/siguiente y progreso local en Web/PWA, Windows y Android.
- Introducciones completas para las 17 unidades y mapa visual del currículo.
- Fuente única y 129 documentos generados; CI impide contenido vacío o desincronizado.
- Libro PDF completo de 289 páginas con las 70 clases y todos los recursos de la Academia.

## 🔜 v1.8 — integraciones y conciliación

Ordenado por lo que hoy obliga a trabajo manual:

1. **Importador del RCV.** Hoy hay que registrar a mano lo que el SII ya tiene. Es el mayor
   ahorro de tiempo posible y también la mayor mejora de exactitud.
2. **Conciliación bancaria desde CSV.** Cargar la cartola y cruzarla con las operaciones.
3. **Adjuntar evidencia como archivo**, no sólo como referencia de texto, con hash de integridad.
4. **Reajuste del remanente** de crédito fiscal (art. 27 del D.L. 825).
5. **Feriados legales** en el cálculo de vencimientos.
6. **Recordatorios de vencimiento** en Android.

## 📗 v1.9 — contabilidad más completa

- Plan de cuentas configurable y libro mayor.
- Balance y estado de resultados educativos.
- Activo fijo y depreciaciones.
- Más códigos del F29 y proporcionalidad de IVA.
- Multi-empresa dentro del mismo entorno real.

## 📘 v2.0 — operación avanzada

- Declaraciones juradas según perfil.
- Asistente de F22 / Operación Renta.
- Expediente anual con toda la evidencia del ejercicio.
- Exportaciones y servicios prestados al exterior.

## 🛡️ v2.1 — endurecimiento

- **Firma de código** de los instaladores de Windows (hoy SmartScreen avisa).
- **APK firmado para release** y publicación en Google Play.
- **Cifrado** del almacenamiento local y de los respaldos.
- PIN local o Windows Hello opcional.
- Actualizador firmado.
- Recuperación asistida ante corrupción de datos.

## 🤖 v2.x — asistencia normativa

- Actualización de reglas asistida: diff contra la fuente oficial y aprobación humana explícita.
- Pruebas de regresión por año tributario.
- Agente local que responda usando **únicamente** reglas versionadas y fuentes citadas, capaz de
  decir "esto excede lo que sé" en lugar de improvisar.

## ⛔ Reglas que ninguna versión romperá

Estas no son funcionalidades pendientes: son límites del producto.

1. **Ninguna versión enviará una declaración real sin una acción humana explícita** y sin
   verificación contra el canal oficial.
2. **Ninguna versión marcará algo como cumplido sin su evidencia.**
3. **Ninguna versión copiará automáticamente una operación del sandbox a la empresa real.**
4. **Ninguna versión enviará los datos del usuario a un servidor** sin que sea una decisión
   explícita, documentada y desactivable.
5. **Ninguna versión reescribirá una regla tributaria histórica.**
