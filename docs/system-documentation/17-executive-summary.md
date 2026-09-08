# 17 · Resumen ejecutivo

[⬅ Anterior: Glosario](16-glossary.md) · [Índice](README.md) · [Siguiente: Guía del nuevo desarrollador ➡](18-new-developer-guide.md)

---

*Para dirección, clientes, evaluadores y posibles colaboradores. Sin detalle técnico innecesario.*

---

## Qué es

**Empresa Operativa Chile** es una aplicación que acompaña a una sociedad chilena (SpA) a lo largo
del tiempo: desde antes de existir —cuando alguien decide crearla— hasta el cierre de cada mes y de
cada año.

No es un software contable que registra asientos. Es una herramienta de **control y evidencia**:
calcula lo que hay que pagar, avisa de lo que falta, exige el comprobante antes de dar algo por
hecho, y deja registro de todo lo que cambió.

**Corre en cuatro sitios con un solo motor de cálculo:** navegador, teléfono Android, Windows y línea
de comandos. Los datos nunca salen del dispositivo.

## Qué necesidad cubre

Llevar una empresa pequeña en Chile no falla por no saber sumar. Falla por perder el hilo: una
factura sin respaldo, un remanente de IVA que no se arrastró, un trámite que se dio por hecho sin
guardar el comprobante, un mes cerrado sin conciliar.

Su aporte diferencial es **distinguir seis magnitudes que casi todas las herramientas funden en un
solo número**: capital social, capital suscrito, capital enterado, patrimonio contable, capital
propio tributario y capital base de patente municipal. Confundirlas es lo que produce una patente mal
pagada o una declaración que no cuadra — y son cosas distintas, con momentos y bases legales
distintas.

## Quién lo utiliza

| Perfil | Para qué |
| --- | --- |
| Quien va a crear una SpA | La ruta de 14 etapas: qué decidir, qué trámite sigue, qué documento le queda |
| Quien ya tiene una SpA pequeña | Operaciones del mes, borrador del F29, obligaciones, cierre |
| Quien acompaña a varios emprendedores | El entorno de práctica para enseñar sin tocar datos reales |
| Quien estudia contabilidad y tributación chilena | Cada número lleva su norma y su fuente oficial |

## Capacidades principales

| Capacidad | Qué resuelve |
| --- | --- |
| **Constitución con evidencia** | Nueve trámites con su organismo. **No se puede marcar uno como hecho sin registrar su comprobante** |
| **Operaciones** | Ventas, compras, gastos, honorarios, aportes, préstamos del accionista, retiros e impuestos |
| **IVA con remanente arrastrado** | El crédito que sobra un mes está disponible al siguiente, como corresponde |
| **Borrador del F29** | Ayuda de control, con los tres vencimientos calculados |
| **Capital y patrimonio** | Las seis magnitudes, cada una con su momento y su evidencia |
| **Capital propio tributario** | Por el método que corresponde al régimen, con su base legal |
| **Patente municipal** | Con la base correcta según la etapa del negocio |
| **Cierre mensual y anual** | Inmutables. Reabrir exige motivo y queda registrado |
| **Bitácora de auditoría** | Toda mutación queda. **Nada se puede borrar** |
| **Respaldo portátil** | Se exporta desde el teléfono y se importa en Windows |
| **Entorno de práctica** | Separado del real. Ninguna ruta de código los mezcla |
| **Manual y glosario dentro de la app** | 54 términos con ayuda al pasar el cursor, sin conexión |

## Lo que deliberadamente NO hace

Está declarado por el propio producto, y esa franqueza es parte de su propuesta:

- **No presenta ni paga nada ante el SII.** Calcula, controla y guarda evidencia; la presentación
  ocurre en los sistemas oficiales.
- **No es asesoría tributaria.** Cuando la aplicación y el SII no coincidan, **manda el SII**.
- No importa datos del SII, ni cartolas bancarias, ni documentos electrónicos.
- El borrador F29 no cubre todos los casos: no modela exenciones, proporcionalidad de IVA, activos
  fijos ni importaciones.
- No publica la tasa de patente de ninguna comuna: guarda el rango legal y remite a la
  municipalidad.

## Tecnologías

| Aspecto | Elección |
| --- | --- |
| Lenguaje | JavaScript moderno (ESM) y Rust para el proceso de escritorio |
| **Dependencias de producción** | **Cero.** Comprobado automáticamente en cada cambio |
| Interfaz | Sin framework, sin bundler |
| Almacenamiento | En el propio dispositivo. Sin base de datos y sin servidor |
| Empaquetado | Capacitor (Android) y Tauri 2 (Windows) |
| Pruebas | Runner nativo de Node — **158 pruebas, sin framework externo** |
| Automatización | 6 procesos de integración continua |

**Cero dependencias de producción** no es una anécdota: significa que no hay una cadena de terceros
que pueda romperse, quedar sin mantenimiento o introducir una vulnerabilidad. Es el argumento de
sostenibilidad del proyecto.

## Arquitectura, en un párrafo

Un solo motor de cálculo en `packages/`, y tres envoltorios que lo llevan al navegador, a Android y a
Windows. La restricción que lo sostiene está automatizada: **nada de lo que viaja al dispositivo
puede depender de módulos de servidor, y el proceso de construcción se detiene si alguien lo
intenta**. Las tasas y plazos tributarios no están en el código: viven en un archivo por año, cada
cifra con su fuente oficial y su fecha de verificación, y **pedir un año que no existe produce un
error en vez de un cálculo con las tasas del año pasado**.

## Estado actual

| Indicador | Valor · verificado el 27-08-2026 |
| --- | --- |
| Versión | 1.5.0 |
| Archivos versionados | 330 al incorporar la capa v1.5 |
| Código propio | 13.251 líneas |
| Pruebas | **153, todas en verde** |
| Duración de la suite | 0,64 segundos |
| Superficies funcionando | 4 |
| Dependencias de producción | **0** |
| Procesos automáticos | 6 |
| Documentos de producto previos | 74 archivos en `docs/` |
| Defectos de cálculo encontrados en esta revisión | **Ninguno** |

## Fortalezas

1. **El producto se niega a mentir.** No marca un trámite como hecho sin evidencia, no modifica un
   período cerrado, no dice «todo en orden» si faltan respaldos, y no publica tasas que nadie
   verificó. Es poco común y es difícil de imitar.
2. **Cada número tiene procedencia.** Fuente oficial y fecha de verificación, y un cierre anual se
   lleva dentro la huella de las reglas con que se calculó — de modo que dentro de tres años seguirá
   explicando con qué normas se hizo.
3. **Verifica el resultado, no sólo el proceso.** Antes de publicar, abre el instalable y **cuenta lo
   que hay dentro**. Un paquete vacío se construye sin errores; esa comprobación es la que evita
   publicarlo.
4. **Cero dependencias de producción**, con comprobación automática que impide que deje de ser
   cierto por descuido.
5. **Un solo motor para cuatro superficies**, con la regla que lo garantiza automatizada.
6. **Documentación generada desde el propio sistema**: glosario, guía y atajos se producen desde el
   código, y el proceso falla si el documento se desvía.
7. **Privacidad por arquitectura, no por promesa.** No hay servidor al que enviar nada. Se verificó:
   en todo el código hay **una sola llamada de red**, y sirve para guardar los propios archivos de la
   aplicación.

## Riesgos

Del análisis salieron 22 hallazgos. **Ninguno es un defecto de cálculo.** Los que importan para una
decisión:

| Riesgo | Impacto | Estado |
| --- | --- | --- |
| Si el almacenamiento del navegador se llena, **una operación puede no guardarse sin aviso** | Pérdida de un dato del usuario | Corregible en horas |
| La versión web pública **no tiene una de las protecciones** que sí tienen las otras tres | Menor margen ante un descuido futuro | Corregible en minutos |
| Un documento de arquitectura **afirma cifras que ya no son ciertas** | Erosiona la confianza de quien llega | Corregible en minutos |
| **Los datos no están cifrados** en el dispositivo | Quien acceda al equipo desbloqueado ve la contabilidad | **Declarado** por el proyecto; en su hoja de ruta |
| **Los instaladores no están firmados** | El sistema operativo mostrará un aviso | **Declarado**; requiere presupuesto |
| **Depende de una sola persona** | Continuidad | Estructural |
| **El mecanismo de tasas por año nunca se ha usado con dos años** | Se sabrá en el primer cambio de año | A validar en su momento |

**Los cinco arreglos prioritarios suman menos de una jornada de trabajo** y cierran el único riesgo
de pérdida de datos y el único hueco de seguridad no declarado.

## La dependencia que no es técnica

La única obligación recurrente del producto es **humana y anual**: antes de cada año comercial hay
que crear el archivo de tasas de ese año verificando **cada cifra contra su fuente oficial**. El
sistema está construido para fallar ruidosamente si no se hace —no calcula con las tasas del año
anterior—, así que el riesgo no es un cálculo equivocado: es que la aplicación deje de servir hasta
que alguien haga ese trabajo.

El propio archivo de 2026 registra que una de sus fuentes legales **no respondió el 16 de agosto de
2026** y pide reverificarla antes de usar la cifra en una declaración real. Que el sistema documente
lo que no pudo comprobar dice bastante sobre cómo está hecho.

## Oportunidades de mejora

| Oportunidad | Por qué |
| --- | --- |
| Cifrado local y bloqueo por PIN | Cierra la brecha declarada más visible |
| Firma de código y APK de publicación | Elimina las advertencias del sistema operativo y abre Google Play |
| Segundo año de tasas | Convierte una promesa de diseño en un hecho comprobado |
| Pruebas de interfaz | La única parte sin cobertura |
| Importar el registro de compras y ventas del SII | El paso que más trabajo manual ahorraría |
| Un segundo mantenedor | Es hoy el mayor riesgo de continuidad |

El propio [`docs/ROADMAP.md`](../ROADMAP.md) ya ordena las tres primeras, y cierra con una sección
que conviene leer: **las reglas que ninguna versión romperá**.

## Próximos pasos recomendados

| # | Paso | Plazo | Esfuerzo |
| --- | --- | --- | --- |
| 1 | Aplicar los cinco arreglos prioritarios de [15 · Riesgos](15-risks-and-technical-debt.md) | Antes del próximo release | < 1 jornada |
| 2 | **Reverificar las tasas de 2026** contra sus fuentes oficiales | Antes de la Operación Renta 2027 | 1 jornada |
| 3 | Preparar el archivo de tasas de 2027 | Antes de enero de 2027 | 1–2 jornadas |
| 4 | Decidir sobre cifrado local y firma de código | Próximo ciclo | Decisión + presupuesto |
| 5 | Primeras pruebas de interfaz, empezando por el escapado de texto | Próximo ciclo | 2–3 jornadas |
| 6 | Integrar la generación de esta documentación en la automatización | Cuando haya margen | 1 jornada |

**El paso 2 es el único que no puede esperar por razones ajenas al equipo**: las fechas tributarias
las pone el calendario, no el proyecto.

## Conclusión

Un producto pequeño, cuidadosamente construido y honesto sobre sus límites. Su calidad no está en la
cantidad de funcionalidad, sino en el rigor: **cada cifra tiene procedencia, cada afirmación tiene
evidencia, y el sistema prefiere fallar antes que dar un número plausible y equivocado.**

Los riesgos abiertos son conocidos, están acotados y la mayoría ya estaban declarados por el propio
proyecto antes de esta revisión. El que más pesa no es técnico: es que todo esto lo sostiene una
persona.

---

[⬅ Anterior: Glosario](16-glossary.md) · [Índice](README.md) · [Siguiente: Guía del nuevo desarrollador ➡](18-new-developer-guide.md)
