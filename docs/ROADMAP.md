# Roadmap

Estado a **2026-08-14**, versión 1.0.0.

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

## 🔜 v1.1 — lo que más falta

Ordenado por lo que hoy obliga a trabajo manual:

1. **Importador del RCV.** Hoy hay que registrar a mano lo que el SII ya tiene. Es el mayor
   ahorro de tiempo posible y también la mayor mejora de exactitud.
2. **Conciliación bancaria desde CSV.** Cargar la cartola y cruzarla con las operaciones.
3. **Adjuntar evidencia como archivo**, no sólo como referencia de texto, con hash de integridad.
4. **Reajuste del remanente** de crédito fiscal (art. 27 del D.L. 825).
5. **Feriados legales** en el cálculo de vencimientos.
6. **Recordatorios de vencimiento** en Android.

## v1.2 — contabilidad más completa

- Plan de cuentas configurable y libro mayor.
- Balance y estado de resultados educativos.
- Activo fijo y depreciaciones.
- Más códigos del F29 y proporcionalidad de IVA.
- Multi-empresa dentro del mismo entorno real.

## v1.3 — cierre anual

- Declaraciones juradas según perfil.
- Asistente de F22 / Operación Renta.
- Expediente anual con toda la evidencia del ejercicio.
- Exportaciones y servicios prestados al exterior.

## v2.0 — endurecimiento

- **Firma de código** de los instaladores de Windows (hoy SmartScreen avisa).
- **APK firmado para release** y publicación en Google Play.
- **Cifrado** del almacenamiento local y de los respaldos.
- PIN local o Windows Hello opcional.
- Actualizador firmado.
- Recuperación asistida ante corrupción de datos.

## v2.x — asistencia normativa

- Actualización de reglas asistida: diff contra la fuente oficial y aprobación humana explícita.
- Pruebas de regresión por año tributario.
- Agente local que responda usando **únicamente** reglas versionadas y fuentes citadas, capaz de
  decir "esto excede lo que sé" en lugar de improvisar.

## Reglas que ninguna versión romperá

Estas no son funcionalidades pendientes: son límites del producto.

1. **Ninguna versión enviará una declaración real sin una acción humana explícita** y sin
   verificación contra el canal oficial.
2. **Ninguna versión marcará algo como cumplido sin su evidencia.**
3. **Ninguna versión copiará automáticamente una operación del sandbox a la empresa real.**
4. **Ninguna versión enviará los datos del usuario a un servidor** sin que sea una decisión
   explícita, documentada y desactivable.
5. **Ninguna versión reescribirá una regla tributaria histórica.**
