# 🎤 Presentación del producto

> 🧭 [Volver al proyecto](../README.md) · [Empezar aquí](EMPEZAR-AQUI.md) · [Manual](MANUAL.md) · [Glosario](GLOSSARY.md)

Este documento es la **fuente única** de la presentación: de aquí salen, sin escribirse dos veces,
los formatos que se publican en cada despliegue.

| Formato | Para qué sirve | Dónde |
|---|---|---|
| 🖥️ **Diapositivas (HTML)** | Proyectar desde el navegador, sin instalar nada | [presentacion.html](presentacion/presentacion.html) |
| 🎞️ **Diapositivas (PDF)** | Proyectar sin conexión y repartir | [PRESENTACION.pdf](presentacion/PRESENTACION.pdf) |
| 🧾 **Pauta del expositor (PDF)** | Guion hablado, tiempos y qué se ve en pantalla | [PAUTA.pdf](presentacion/PAUTA.pdf) |

**Cómo se estructura cada diapositiva.** Cada sección numerada de abajo es una diapositiva: el encabezado
es su título, el cuerpo es **lo que se ve proyectado** (letra grande, poco texto) y la cita final
(`> **Pauta · N min.**`) es **lo que dice quien expone** — no aparece en pantalla, sólo en la pauta impresa.
Los minutos se suman solos para calcular la duración de la charla.

**Para generarlo todo:**

```bash
npm run presentacion
```

---

## 1 · Empresa Operativa Chile

**Crear, operar y controlar una empresa chilena a través del tiempo.**

- Acompaña a una SpA **desde antes de existir** hasta el cierre de su segundo ejercicio.
- La misma interfaz y el mismo motor en **Android, Windows y navegador**.
- Los datos **no salen del dispositivo**: sin servidor, sin cuentas, sin telemetría.
- Código MIT · cero dependencias de producción.

> **Pauta · 2 min.** Preséntate y presenta el producto en una frase. Esto no es una calculadora de
> impuestos: es el sistema operativo de una empresa pequeña, que además enseña mientras se usa.
> Aclara el encuadre antes de que alguien lo pregunte: **no presenta ni paga nada ante el SII**; calcula,
> explica y guarda evidencia. Menciona ya la licencia y el cero-telemetría: con público institucional,
> ese dato cambia la conversación desde el primer minuto.

## 2 · El problema que resuelve

**Llevar una empresa pequeña en Chile no falla por no saber sumar. Falla por perder el hilo.**

- Una factura que nunca se respaldó.
- Un remanente de IVA que no se arrastró y se perdió.
- Un trámite que se dio por hecho sin guardar el comprobante.
- Un mes que se cerró sin conciliar y que nadie puede reconstruir un año después.

> **Pauta · 3 min.** Esta es la lámina que conecta con quien ha llevado una empresa chica. No hables de
> software todavía: describe la experiencia. La contabilidad no se rompe por un error aritmético, se rompe
> por acumulación de huecos pequeños. Pregunta al público si alguien ha tenido que reconstruir un año
> anterior sin respaldos — suele haber alguien asintiendo. Ahí introduce la idea central: el producto no
> intenta tranquilizar, intenta **detectar el hueco**.

## 3 · El principio: se niega a mentir

**Una aplicación de cumplimiento que se marca sola las tareas como hechas da tranquilidad, no cumplimiento.**

- Un trámite **no** se marca como hecho sin su evidencia: folio, certificado o comprobante.
- Un período cerrado es **inmutable en las dos direcciones**: no se agrega y no se borra.
- La bitácora es **append-only**: no existe operación de borrado.
- Cuando falta un dato, la app lo **dice**; no rellena con un supuesto plausible.

> **Pauta · 4 min.** Este es el corazón del producto y conviene detenerse. Cuenta el caso del capital:
> hasta hace poco había un solo campo llamado «capital» que además se usaba para estimar la patente
> municipal. Era cómodo y era falso — capital social, capital enterado, patrimonio contable, capital propio
> tributario y capital base de patente son cinco cosas distintas. Corregirlo obligó a rehacer el modelo, y
> hay una prueba automatizada que **falla si esos cinco números coinciden**. Ese es el estándar: preferimos
> un error visible a una cifra plausible y equivocada.

## 4 · Las reglas son datos, con fuente y fecha

**Ninguna tasa está escrita en el código: viven en `rules/<año>.json` con su fuente oficial.**

| | Regla | Por qué |
|:---:|---|---|
| 1 | Nunca se reescribe una regla histórica | Recalcular un período antiguo devuelve lo que se declaró entonces |
| 2 | Pedir un año sin reglas **falla** | Un cálculo plausible con la tasa equivocada no se ve y no avisa |
| 3 | El JSON y el módulo embebido no pueden desincronizarse | Si no, se edita una tasa y se publica un APK que calcula con la anterior |

> **Pauta · 4 min.** Muestra un fragmento de regla si tienes pantalla: cada una declara `source` y
> `lastVerified`. Cuenta el hallazgo concreto: el tope legal de la patente municipal estaba en 4.000 UTM,
> que es el texto **anterior** a la Ley 20.280; el vigente son 8.000. Se corrigió y se añadió una validación
> que falla si alguien lo revierte. Ese es el tipo de error que un repositorio con reglas versionadas
> encuentra y uno con números mágicos no.

## 5 · Enseña mientras operas

**El objetivo no es que aprendas contabilidad para usar el sistema, sino que el sistema te enseñe mientras opera la empresa.**

- **Empezar aquí:** 14 etapas ordenadas por tiempo, con la decisión de cada punto y el documento que queda.
- **Glosario de 54 términos**, con lo que **no** hay que confundir con qué; se explica al pasar el cursor.
- Cada cifra responde **«¿de dónde salió este número?»** con su desglose y su base legal.
- Estados explícitos: `ESTIMADO · CALCULADO · DECLARADO · VERIFICADO · PAGADO`.

> **Pauta · 4 min.** Aquí conviene una demostración corta y concreta. Abre Capital y patrimonio y muestra
> las seis cifras una al lado de la otra; despliega «¿Cómo llegamos a este valor?» del capital propio
> tributario. Insiste en el último punto: la aplicación **nunca** presenta un cálculo propio como acreditado.
> Una estimación interna dice que lo es. Si el público es docente, menciona que la academia usa el motor
> real, así que si cambia una tasa la explicación cambia sola.

## 6 · Qué NO hace, dicho antes de que lo pregunten

**Un vacío declarado se puede trabajar; uno silencioso se descubre tarde y caro.**

- **No** presenta ni paga nada ante el SII ni ante ninguna municipalidad.
- **No** está conectada a ningún sistema oficial, y no lo simula.
- **No** publica tasas municipales por comuna: no existe una tasa nacional, y no se inventan.
- **No** cubre remuneraciones, comercio exterior, inventario ni corrección monetaria — y lo dice en pantalla.

> **Pauta · 4 min.** Esta lámina genera confianza, no dudas. Explica por qué está en la presentación y no
> escondida en un anexo: quien evalúa una herramienta de cumplimiento necesita saber dónde termina. Lo de
> las tasas municipales es un buen ejemplo para el público: la ley fija un rango de 2,5‰ a 5‰ y cada
> municipalidad elige la suya, así que publicar una tabla nacional sería fabricar decenas de cifras que
> nadie verificó. La app pide la tasa con su fuente y su fecha, y hasta entonces marca la cifra como simulación.

## 7 · Cómo se verifica que esto es cierto

**Un build en verde no es prueba de un artefacto correcto: hay que abrir el binario y contar lo que lleva dentro.**

- El **APK se abre en CI** y se cuentan las vistas, los módulos del motor y las reglas que contiene.
- El ejecutable de Windows **arranca en CI** y se comprueba que sigue vivo pasados 12 segundos.
- El build es **reproducible**: dos compilaciones seguidas tienen que dar el mismo identificador.
- Documentación **generada**: glosario, guía y atajos se comprueban contra su fuente en cada commit.

> **Pauta · 4 min.** Este es el argumento para un público técnico. La afirmación fuerte: un APK vacío
> compila perfectamente y su checksum cuadra — por eso el pipeline lo descomprime y cuenta el contenido.
> Lo mismo con la documentación: el glosario que ve el usuario y el que está en el repositorio no pueden
> divergir porque uno se **genera** del otro y CI lo verifica. Si alguien pregunta por dependencias:
> cero en producción, y hay una comprobación que falla si aparece una.

## 8 · Dónde está y cómo se prueba

**Abierto, instalable y sin registro: se prueba en un minuto.**

- 🌐 **Navegador / PWA** — funciona sin conexión, instalable, con datos de práctica listos.
- 📱 **Android (APK)** · 💻 **Windows** (instalador, MSI y portable) · ⌨️ **CLI** para scripts.
- **SANDBOX** integrado: una empresa ficticia completa para practicar sin tocar datos reales.
- Manual, guía ilustrada y atajos **dentro de la propia aplicación**.

> **Pauta · 3 min.** Cierra invitando a probarlo ahí mismo: la demo pública abre sin instalar nada y el
> sandbox ya viene con un año completo de operaciones, cierre anual incluido. Recuerda que EMPRESA REAL y
> SANDBOX son almacenes distintos y que ninguna ruta de código copia datos de uno al otro. Deja el enlace
> del sitio en pantalla y ofrece resolver preguntas concretas: es cuando aparecen los casos reales del público.
