<!-- GENERADO POR scripts/build-glossary.mjs — NO EDITAR A MANO. -->
<!-- Fuente de verdad: packages/glossary/index.mjs · Regenerar: node scripts/build-glossary.mjs -->

# 📖 Glosario

54 términos. Estas mismas definiciones son las que muestra la aplicación al pulsar **?** junto a cualquier campo
y las que lista la pantalla **Glosario**: hay una sola copia, en `packages/glossary/index.mjs`, y CI comprueba que este
documento no se desvíe de ella.

> Las cinco magnitudes que este sistema se niega a tratar como sinónimos:
> **capital social**, **capital enterado**, **patrimonio contable**, **capital propio tributario** y **capital base de patente**.
> Cada una tiene su momento en el tiempo, su método de cálculo, su fuente legal y su evidencia.

## Índice

- **Capital y patrimonio** — [Capital social](#capital-social) · [Capital suscrito](#capital-suscrito) · [Capital enterado](#capital-enterado) · [Capital por enterar](#capital-por-enterar) · [Aporte de capital](#aporte-de-capital) · [Préstamo del accionista](#prestamo-del-accionista) · [Devolución de préstamo](#devolucion-de-prestamo) · [Aporte en bienes (no monetario)](#aporte-en-bienes) · [Aumento de capital](#aumento-de-capital) · [Disminución de capital](#disminucion-de-capital) · [Retiro / distribución](#retiro) · [Patrimonio contable](#patrimonio-contable) · [Resultados acumulados](#resultados-acumulados) · [Activo](#activo) · [Pasivo exigible](#pasivo-exigible) · [Valor tributario](#valor-tributario)
- **Tributación de la renta** — [Capital Propio Tributario (CPT)](#cpt) · [CPT simplificado](#cpt-simplificado) · [Artículo 41 de la LIR](#articulo-41) · [Pro Pyme General (14 D N.º 3)](#pro-pyme-general) · [Pro Pyme Transparente (14 D N.º 8)](#pro-pyme-transparente) · [Régimen General semi integrado (14 A)](#regimen-general) · [Registros empresariales](#registros-empresariales) · [Renta Líquida Imponible (RLI)](#rli) · [IDPC](#idpc) · [Pérdida tributaria](#perdida-tributaria) · [F22](#f22) · [DJ](#dj) · [PPM](#ppm)
- **IVA y documentos** — [Débito fiscal](#debito-fiscal) · [Crédito fiscal](#credito-fiscal) · [Remanente de crédito fiscal](#remanente-credito-fiscal) · [F29](#f29) · [DTE](#dte) · [RCV](#rcv) · [Gasto deducible](#gasto-deducible)
- **Municipal** — [Patente municipal](#patente-municipal) · [Capital base de patente](#capital-base-patente) · [Patente inicial](#patente-inicial) · [Inversiones deducibles](#inversiones-deducibles) · [Prorrateo entre sucursales](#prorrateo-sucursales) · [UTM](#utm) · [Oficina virtual](#oficina-virtual) · [Domicilio tributario](#domicilio-tributario)
- **Contabilidad** — [Cierre anual](#cierre-anual) · [SpA](#spa) · [Accionista](#accionista) · [Ingreso operacional](#ingreso-operacional) · [Conciliación](#conciliacion)
- **Cumplimiento y evidencia** — [Evidencia](#evidencia) · [Estado del dato](#estado-del-dato) · [Origen del dato](#origen-del-dato) · [Expediente anual](#expediente-anual) · [PENDING_CONFIRMATION](#pending-confirmation)

## Capital y patrimonio

<a id="capital-social"></a>
### Capital social

**El capital que el estatuto de la sociedad declara. Es una cifra societaria, no un saldo bancario.**

Es lo que quedó establecido en la escritura o estatuto al constituir la sociedad, y en sus modificaciones posteriores. Define cuánto capital tiene la sociedad “sobre el papel” y en cuántas acciones se divide. Puede estar totalmente enterado, parcialmente enterado o no enterado en absoluto: el estatuto dice cuánto es, no cuánto llegó.

> ⚠️ **No confundir con:** [Capital enterado](#capital-enterado) · [Patrimonio contable](#patrimonio-contable) · [Capital Propio Tributario (CPT)](#cpt)

Relacionado: [Capital suscrito](#capital-suscrito) · [Aumento de capital](#aumento-de-capital) · [SpA](#spa)

<sub>Base legal: Estatuto social y sus modificaciones</sub>

<a id="capital-suscrito"></a>
### Capital suscrito

**La parte del capital social que un accionista se comprometió formalmente a aportar.**

Suscribir es comprometerse. Un accionista que suscribe $5.000.000 asumió la obligación de aportarlos en el plazo que fije el estatuto, aunque todavía no haya transferido un peso. Mientras no los entere, la sociedad tiene un derecho a cobrarle, no el dinero.

> ⚠️ **No confundir con:** [Capital enterado](#capital-enterado) · [Capital por enterar](#capital-por-enterar)

Relacionado: [Capital social](#capital-social) · [Accionista](#accionista)

<a id="capital-enterado"></a>
### Capital enterado

**Lo que efectivamente entró a la empresa: dinero depositado o bienes transferidos.**

Es la parte del capital suscrito que ya se pagó de verdad — depósito en la cuenta de la empresa, transferencia, o un bien aportado y transferido. Sólo el capital enterado es un activo de la empresa. Es la magnitud que la aplicación usaba antes bajo el nombre genérico “capital”, y sigue siendo la base de partida del primer ejercicio, pero no equivale ni al patrimonio contable ni al capital propio tributario.

> ⚠️ **No confundir con:** [Capital social](#capital-social) · [Capital suscrito](#capital-suscrito) · [Capital Propio Tributario (CPT)](#cpt) · [Capital base de patente](#capital-base-patente)

Relacionado: [Aporte de capital](#aporte-de-capital) · [Aporte en bienes (no monetario)](#aporte-en-bienes) · [Capital por enterar](#capital-por-enterar)

<a id="capital-por-enterar"></a>
### Capital por enterar

**Capital suscrito todavía pendiente de pago. Capital suscrito menos capital enterado.**

La deuda del accionista con su propia sociedad. Si el estatuto fijó un plazo para enterarlo, ese plazo corre; y si se dejó pasar, la situación conviene regularizarla, porque el estatuto sigue diciendo que ese capital existe. No es un activo disponible: es una promesa pendiente.

> ⚠️ **No confundir con:** [Capital enterado](#capital-enterado)

Relacionado: [Capital suscrito](#capital-suscrito)

<a id="aporte-de-capital"></a>
### Aporte de capital

**Dinero o bienes que el accionista entrega a la empresa a título de capital, sin esperar devolución.**

Aumenta el patrimonio. No genera una deuda de la empresa con el accionista y no se “devuelve” salvo mediante una disminución formal de capital. Es distinto de un préstamo del accionista, aunque en la cartola bancaria las dos operaciones se vean exactamente igual: un depósito.

> ⚠️ **No confundir con:** [Préstamo del accionista](#prestamo-del-accionista) · [Ingreso operacional](#ingreso-operacional)

Relacionado: [Capital enterado](#capital-enterado) · [Aporte en bienes (no monetario)](#aporte-en-bienes) · [Aumento de capital](#aumento-de-capital)

<a id="prestamo-del-accionista"></a>
### Préstamo del accionista

**Dinero que el accionista presta a la empresa. Es un pasivo exigible, no capital.**

La empresa queda debiéndole al accionista. Aparece en el pasivo, reduce el patrimonio y reduce el capital propio tributario — exactamente al revés que un aporte. Por eso la aplicación obliga a decidir la naturaleza de cada depósito del dueño en vez de suponer que todo es capital: la misma transferencia de $2.000.000 sube o baja el CPT según qué fue realmente.

> ⚠️ **No confundir con:** [Aporte de capital](#aporte-de-capital)

Relacionado: [Pasivo exigible](#pasivo-exigible) · [Capital Propio Tributario (CPT)](#cpt) · [Devolución de préstamo](#devolucion-de-prestamo)

<a id="devolucion-de-prestamo"></a>
### Devolución de préstamo

**Pago con que la empresa extingue el préstamo que le hizo su accionista.**

Baja el activo (sale caja) y baja el pasivo en el mismo monto. No es un retiro, no es un gasto y no afecta el resultado del ejercicio: sólo cancela una deuda previamente reconocida.

> ⚠️ **No confundir con:** [Retiro / distribución](#retiro)

Relacionado: [Préstamo del accionista](#prestamo-del-accionista)

<a id="aporte-en-bienes"></a>
### Aporte en bienes (no monetario)

**Capital enterado con un bien —un notebook, un servidor, mobiliario— en lugar de dinero.**

Es capital enterado igual que el dinero, pero exige distinguir tres valores que casi nunca coinciden: el valor de aporte acordado, el valor contable con que queda registrado y el valor tributario. Requiere documento de respaldo e identificación del accionista aportante.

> ⚠️ **No confundir con:** [Aporte de capital](#aporte-de-capital)

Relacionado: [Valor tributario](#valor-tributario) · [Activo](#activo) · [Capital enterado](#capital-enterado)

<a id="aumento-de-capital"></a>
### Aumento de capital

**Modificación societaria que eleva el capital social.**

Cambia la cifra del estatuto. Suele venir acompañado de nuevas suscripciones y de aportes que las enteran, pero el aumento en sí es el acto societario, no el depósito. Para efectos de patente municipal y de CPT, lo que mueve la aguja es el capital efectivamente enterado, no el acordado.

Relacionado: [Capital social](#capital-social) · [Disminución de capital](#disminucion-de-capital)

<a id="disminucion-de-capital"></a>
### Disminución de capital

**Modificación societaria que reduce el capital social y suele devolver fondos al accionista.**

Reduce el patrimonio y, cuando implica devolución efectiva, reduce también el capital propio tributario. Tiene formalidades societarias y efectos tributarios propios: no es simplemente “sacar plata”.

> ⚠️ **No confundir con:** [Retiro / distribución](#retiro)

Relacionado: [Capital social](#capital-social) · [Capital Propio Tributario (CPT)](#cpt)

<a id="retiro"></a>
### Retiro / distribución

**Salida de fondos al accionista con cargo a las utilidades o al patrimonio.**

Reduce el patrimonio, no el resultado: no es un gasto y no rebaja la base del impuesto de la empresa. En el régimen Pro Pyme los retiros y distribuciones del ejercicio se restan al determinar el capital propio tributario simplificado.

> ⚠️ **No confundir con:** [Gasto deducible](#gasto-deducible) · [Devolución de préstamo](#devolucion-de-prestamo)

Relacionado: [CPT simplificado](#cpt-simplificado) · [Patrimonio contable](#patrimonio-contable)

<a id="patrimonio-contable"></a>
### Patrimonio contable

**Activos menos pasivos según las reglas contables. El “valor en libros” de la empresa.**

Sale del balance: capital enterado, más los resultados acumulados de todos los ejercicios, más o menos los ajustes contables. Se mueve con cada utilidad y cada pérdida. No coincide necesariamente con el capital propio tributario, porque éste último obliga a rebajar partidas que la contabilidad sí acepta.

> ⚠️ **No confundir con:** [Capital Propio Tributario (CPT)](#cpt) · [Capital enterado](#capital-enterado)

Relacionado: [Activo](#activo) · [Pasivo exigible](#pasivo-exigible) · [Resultados acumulados](#resultados-acumulados)

<a id="resultados-acumulados"></a>
### Resultados acumulados

**Suma de las utilidades y pérdidas de todos los ejercicios que no se han retirado.**

Es la parte del patrimonio que la empresa generó operando, en contraste con la que el accionista puso. Un año con utilidad la sube; un año con pérdida la baja, y puede dejarla negativa.

Relacionado: [Patrimonio contable](#patrimonio-contable) · [Pérdida tributaria](#perdida-tributaria)

<a id="activo"></a>
### Activo

**Recurso controlado por la empresa del que espera obtener beneficios.**

Caja y banco, cuentas por cobrar a clientes, equipamiento, software, remanente de crédito fiscal. Para el capital propio tributario se toman a su VALOR TRIBUTARIO, que no siempre es el valor contable ni el comercial.

Relacionado: [Valor tributario](#valor-tributario) · [Pasivo exigible](#pasivo-exigible)

<a id="pasivo-exigible"></a>
### Pasivo exigible

**Obligaciones con terceros que la empresa tendrá que pagar.**

Proveedores, impuestos por pagar, retenciones por enterar, préstamos bancarios y también los préstamos del accionista. Es el término que usa el art. 41 N.º 1 de la LIR: el CPT es activo menos pasivo EXIGIBLE, y el patrimonio no se cuenta como pasivo.

> ⚠️ **No confundir con:** [Patrimonio contable](#patrimonio-contable)

Relacionado: [Capital Propio Tributario (CPT)](#cpt) · [Préstamo del accionista](#prestamo-del-accionista)

<sub>Base legal: LIR art. 41 N.º 1</sub>

<a id="valor-tributario"></a>
### Valor tributario

**El valor de un activo o pasivo según las normas tributarias, que puede diferir del contable y del comercial.**

Un notebook aportado puede tener valor de aporte $900.000, valor contable $600.000 tras depreciación y un valor tributario distinto si la depreciación tributaria no coincide con la contable. La aplicación guarda los tres por separado en vez de suponerlos iguales.

Relacionado: [Aporte en bienes (no monetario)](#aporte-en-bienes) · [Capital Propio Tributario (CPT)](#cpt)

## Tributación de la renta

<a id="cpt"></a>
### Capital Propio Tributario (CPT)

**Activo menos pasivo exigible, a valores tributarios, rebajados los valores que no representan inversión efectiva.**

Es la medida tributaria del patrimonio. El art. 41 N.º 1 de la LIR lo define como la diferencia entre el activo y el pasivo exigible a la fecha de iniciación del ejercicio comercial, rebajando previamente los valores intangibles, nominales, transitorios y de orden que no representen inversiones efectivas. Se determina al cierre de cada ejercicio y se informa en la declaración anual de renta. No es el capital con que se constituyó la sociedad, y por eso el segundo año de una empresa casi nunca paga patente sobre la misma cifra que el primero.

> ⚠️ **No confundir con:** [Capital enterado](#capital-enterado) · [Patrimonio contable](#patrimonio-contable) · [Capital social](#capital-social) · [Capital base de patente](#capital-base-patente)

Relacionado: [CPT simplificado](#cpt-simplificado) · [Artículo 41 de la LIR](#articulo-41) · [F22](#f22) · [Capital base de patente](#capital-base-patente)

<sub>Base legal: LIR art. 41 N.º 1 · Fuente: https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7347.htm · Verificado: 2026-08-16</sub>

<a id="cpt-simplificado"></a>
### CPT simplificado

**Forma simplificada de determinar el capital propio tributario, propia del régimen Pro Pyme General.**

La letra (j) del N.º 3 de la letra D) del art. 14 de la LIR permite a las Pymes determinar su capital propio sin armar el balance tributario completo: se suma el capital aportado formalizado y sus aumentos, las bases imponibles de primera categoría de cada año y las rentas percibidas por participaciones en otras empresas; se restan las disminuciones de capital, las pérdidas, las partidas del inciso segundo del art. 21 pagadas, y los retiros y distribuciones a los propietarios. Si el resultado es negativo, se considera $0. No aplica a cualquier contribuyente: hay que estar acogido al régimen que lo permite.

> ⚠️ **No confundir con:** [Capital Propio Tributario (CPT)](#cpt)

Relacionado: [Pro Pyme General (14 D N.º 3)](#pro-pyme-general) · [Capital Propio Tributario (CPT)](#cpt) · [Renta Líquida Imponible (RLI)](#rli)

<sub>Base legal: LIR art. 14 letra D) N.º 3 letra (j) · Fuente: https://www.sii.cl/normativa_legislacion/circulares/2020/circu62.pdf · Verificado: 2026-08-16</sub>

<a id="articulo-41"></a>
### Artículo 41 de la LIR

**Norma que define el capital propio tributario y las reglas de corrección monetaria.**

Su N.º 1 es el que define el CPT. El resto del artículo regula la revalorización de activos y pasivos por corrección monetaria, que esta aplicación NO modela y declara como limitación.

Relacionado: [Capital Propio Tributario (CPT)](#cpt)

<sub>Base legal: LIR art. 41</sub>

<a id="pro-pyme-general"></a>
### Pro Pyme General (14 D N.º 3)

**Régimen tributario para pymes con contabilidad simplificada y CPT simplificado.**

Tributa con impuesto de primera categoría sobre una base de ingresos percibidos menos egresos pagados, y determina el CPT simplificado de la letra (j). Es el perfil por defecto de esta aplicación, pero no el único: el régimen elegido cambia cómo se determina el capital propio.

Relacionado: [Pro Pyme Transparente (14 D N.º 8)](#pro-pyme-transparente) · [Régimen General semi integrado (14 A)](#regimen-general) · [CPT simplificado](#cpt-simplificado) · [IDPC](#idpc)

<sub>Base legal: LIR art. 14 letra D) N.º 3</sub>

<a id="pro-pyme-transparente"></a>
### Pro Pyme Transparente (14 D N.º 8)

**Régimen en que la empresa no paga primera categoría y el resultado tributa directamente en los dueños.**

No determina el CPT simplificado de la letra (j). Si la empresa está acogida aquí, la aplicación no aplica esa fórmula y lo dice, en vez de calcular igual con la regla equivocada.

Relacionado: [Pro Pyme General (14 D N.º 3)](#pro-pyme-general) · [CPT simplificado](#cpt-simplificado)

<sub>Base legal: LIR art. 14 letra D) N.º 8</sub>

<a id="regimen-general"></a>
### Régimen General semi integrado (14 A)

**Régimen con contabilidad completa y registros empresariales completos.**

Determina el capital propio tributario por el art. 41 con balance tributario completo, no por la vía simplificada. Requiere registros empresariales (RAI, DDAN, REX, SAC).

Relacionado: [Capital Propio Tributario (CPT)](#cpt) · [Registros empresariales](#registros-empresariales)

<sub>Base legal: LIR art. 14 letra A)</sub>

<a id="registros-empresariales"></a>
### Registros empresariales

**Control tributario de las rentas acumuladas y los créditos asociados (RAI, DDAN, REX, SAC).**

Determinan cómo tributan los retiros y distribuciones cuando llegan a los dueños. Su exigencia depende del régimen: el Pro Pyme General lleva una versión reducida.

Relacionado: [Régimen General semi integrado (14 A)](#regimen-general) · [Retiro / distribución](#retiro) · [Cierre anual](#cierre-anual)

<a id="rli"></a>
### Renta Líquida Imponible (RLI)

**Base sobre la que se calcula el impuesto de primera categoría del ejercicio.**

En el régimen Pro Pyme General se determina, en general, por ingresos percibidos menos egresos pagados, con los ajustes que la ley señala. Entra como sumando en la determinación del CPT simplificado.

Relacionado: [IDPC](#idpc) · [CPT simplificado](#cpt-simplificado) · [F22](#f22)

<a id="idpc"></a>
### IDPC

**Impuesto de Primera Categoría: el impuesto a la renta que paga la empresa.**

Se calcula sobre la RLI del ejercicio y se declara en el F22. Los PPM pagados durante el año se imputan contra él.

Relacionado: [Renta Líquida Imponible (RLI)](#rli) · [PPM](#ppm) · [F22](#f22)

<a id="perdida-tributaria"></a>
### Pérdida tributaria

**Resultado negativo del ejercicio según las normas tributarias.**

Reduce el capital propio tributario. En el CPT simplificado se resta explícitamente. Un año malo no sólo significa no pagar impuesto: baja la base sobre la que se calculará la patente del año siguiente.

Relacionado: [CPT simplificado](#cpt-simplificado) · [Resultados acumulados](#resultados-acumulados)

<a id="f22"></a>
### F22

**Declaración anual de impuesto a la renta.**

Ahí se declara la RLI, el impuesto del ejercicio y el capital propio tributario. El CPT declarado en el F22 es el que el SII pone a disposición de las municipalidades para la patente.

Relacionado: [Capital Propio Tributario (CPT)](#cpt) · [DJ](#dj) · [Cierre anual](#cierre-anual) · [Patente municipal](#patente-municipal)

<a id="dj"></a>
### DJ

**Declaración jurada informativa que acompaña a la Operación Renta.**

No liquida impuesto: informa. Su omisión o su error genera multas propias y suele ser el origen de diferencias con el SII.

Relacionado: [F22](#f22) · [Cierre anual](#cierre-anual)

<a id="ppm"></a>
### PPM

**Pago Provisional Mensual: anticipo mensual a cuenta del impuesto anual.**

Se calcula sobre los ingresos brutos, no sobre la utilidad, así que se paga aunque el mes cierre con pérdida. En la Operación Renta se imputa contra el impuesto final y, si sobró, se devuelve.

Relacionado: [IDPC](#idpc) · [F29](#f29) · [F22](#f22)

## IVA y documentos

<a id="debito-fiscal"></a>
### Débito fiscal

**IVA recargado en las ventas y servicios afectos.**

Lo recauda la empresa para el fisco. Nunca fue ingreso suyo, aunque pase por su cuenta corriente.

Relacionado: [Crédito fiscal](#credito-fiscal) · [F29](#f29)

<a id="credito-fiscal"></a>
### Crédito fiscal

**IVA soportado en compras que cumple los requisitos para ser utilizado.**

Sólo es crédito si la compra es del giro, está respaldada por documento válido y la ley no lo excluye. Que salga plata no basta para que el IVA sea recuperable.

> ⚠️ **No confundir con:** [Gasto deducible](#gasto-deducible)

Relacionado: [Débito fiscal](#debito-fiscal) · [Remanente de crédito fiscal](#remanente-credito-fiscal) · [F29](#f29)

<a id="remanente-credito-fiscal"></a>
### Remanente de crédito fiscal

**Crédito de IVA que sobró en un período y se arrastra al siguiente.**

Cuando el crédito supera al débito no se pierde ni se devuelve: queda disponible el mes siguiente. Es lo normal al partir, cuando se compra equipamiento antes de facturar.

Relacionado: [Crédito fiscal](#credito-fiscal) · [F29](#f29)

<a id="f29"></a>
### F29

**Declaración mensual que concentra IVA, PPM y retenciones.**

Se presenta el mes siguiente al período. Su plazo depende de si se declara por internet y de si resulta con pago.

Relacionado: [Débito fiscal](#debito-fiscal) · [Crédito fiscal](#credito-fiscal) · [PPM](#ppm)

<a id="dte"></a>
### DTE

**Documento Tributario Electrónico: factura, boleta, nota de crédito o débito electrónica.**

Es la evidencia primaria de una operación afecta. Sin DTE válido no hay crédito fiscal que sostener.

Relacionado: [RCV](#rcv) · [Evidencia](#evidencia)

<a id="rcv"></a>
### RCV

**Registro de Compras y Ventas del SII.**

Reemplazó al libro de compras y ventas. Conciliar contra el RCV es la forma de detectar documentos que la empresa no registró — o que no reconoce.

Relacionado: [DTE](#dte) · [Conciliación](#conciliacion)

<a id="gasto-deducible"></a>
### Gasto deducible

**Desembolso que la ley acepta rebajar de la renta de la empresa.**

Debe estar vinculado al interés de la empresa y respaldado. Un gasto puede ser deducible y su IVA no ser crédito, o al revés: por eso son dos casillas separadas y no una sola.

> ⚠️ **No confundir con:** [Crédito fiscal](#credito-fiscal) · [Retiro / distribución](#retiro)

Relacionado: [Evidencia](#evidencia)

## Municipal

<a id="patente-municipal"></a>
### Patente municipal

**Tributo anual que grava el ejercicio de una actividad, calculado sobre el capital propio del contribuyente.**

El art. 24 del D.L. 3.063 fija su valor anual entre el 2,5‰ y el 5‰ del capital propio, con un mínimo de 1 UTM y un máximo de 8.000 UTM. Cada municipalidad elige su tasa dentro de ese rango por ordenanza, de modo que no existe una tasa nacional única.

> ⚠️ **No confundir con:** [Capital Propio Tributario (CPT)](#cpt)

Relacionado: [Capital base de patente](#capital-base-patente) · [Patente inicial](#patente-inicial) · [UTM](#utm)

<sub>Base legal: D.L. N.º 3.063 de 1979, art. 24 · Fuente: https://www.bcn.cl/leychile/navegar?idNorma=6942 · Verificado: 2026-08-16</sub>

<a id="capital-base-patente"></a>
### Capital base de patente

**El capital propio que legalmente corresponde usar para calcular la patente de un período determinado.**

No es un sinónimo de CPT ni de capital enterado: es el capital propio que la norma manda usar para ESE período. Para actividades nuevas, el capital propio inicial declarado por el contribuyente. Para ejercicios posteriores, el capital propio registrado en el balance terminado el 31 de diciembre inmediatamente anterior, con los ajustes de los arts. 41 y siguientes de la LIR, y descontando —cuando procede y se acredita con certificado municipal— la parte invertida en otros negocios afectos a patente.

> ⚠️ **No confundir con:** [Capital Propio Tributario (CPT)](#cpt) · [Capital enterado](#capital-enterado) · [Capital social](#capital-social)

Relacionado: [Patente municipal](#patente-municipal) · [Patente inicial](#patente-inicial) · [Inversiones deducibles](#inversiones-deducibles)

<sub>Base legal: D.L. N.º 3.063 de 1979, art. 24 inciso tercero · Verificado: 2026-08-16</sub>

<a id="patente-inicial"></a>
### Patente inicial

**La primera patente de una empresa, calculada sobre el capital propio inicial declarado.**

Es el único momento en que la base tiene relación directa con el capital con que se constituyó la sociedad. Desde el ejercicio siguiente la base pasa a ser el capital propio del balance anterior, y por eso la cifra cambia.

Relacionado: [Capital base de patente](#capital-base-patente) · [Patente municipal](#patente-municipal)

<a id="inversiones-deducibles"></a>
### Inversiones deducibles

**Parte del capital propio invertida en otros negocios afectos a patente, que puede rebajarse de la base.**

Evita pagar dos veces patente por el mismo capital. La deducción exige acreditarse con certificado emitido por la municipalidad correspondiente: la aplicación no la aplica sola, hay que registrar el certificado.

Relacionado: [Capital base de patente](#capital-base-patente)

<sub>Base legal: D.L. N.º 3.063 de 1979, art. 24 inciso final</sub>

<a id="prorrateo-sucursales"></a>
### Prorrateo entre sucursales

**Reparto del capital propio entre las unidades del contribuyente según el número de trabajadores de cada una.**

Cuando la empresa tiene sucursales en varias comunas, la patente total se paga proporcionalmente por cada unidad. La municipalidad de la casa matriz determina la distribución y la comunica a las demás. Se declara anualmente en mayo.

Relacionado: [Patente municipal](#patente-municipal)

<sub>Base legal: D.L. N.º 3.063 de 1979, art. 25</sub>

<a id="utm"></a>
### UTM

**Unidad Tributaria Mensual. Cambia todos los meses.**

Los topes de la patente están expresados en UTM, así que el mes de la UTM que se use cambia el resultado. Usar la UTM de otro período es uno de los errores silenciosos más fáciles de cometer.

Relacionado: [Patente municipal](#patente-municipal)

<a id="oficina-virtual"></a>
### Oficina virtual

**Domicilio comercial contratado a un tercero, sin ocupación física permanente.**

Sirve para acreditar domicilio ante el SII y determinar la municipalidad competente, pero no es capital ni lo reemplaza. Tener oficina virtual no hace que el capital sea cero ni que la patente sea cero: la base sigue siendo el capital propio que corresponda.

> ⚠️ **No confundir con:** [Capital enterado](#capital-enterado) · [Capital base de patente](#capital-base-patente)

Relacionado: [Domicilio tributario](#domicilio-tributario) · [Patente municipal](#patente-municipal)

<a id="domicilio-tributario"></a>
### Domicilio tributario

**Dirección que la empresa declara ante el SII y que determina, junto con la actividad, la municipalidad competente.**

Es un dato de identidad, no una magnitud patrimonial. Cambiarlo puede cambiar la municipalidad, nunca el capital.

Relacionado: [Oficina virtual](#oficina-virtual) · [Patente municipal](#patente-municipal)

## Contabilidad

<a id="cierre-anual"></a>
### Cierre anual

**Corte del ejercicio al 31 de diciembre que fija activos, pasivos, patrimonio y CPT del año.**

Produce una fotografía inmutable: lo que se cierra ya no se reescribe. Ese cierre es la apertura del ejercicio siguiente y la fuente de la base municipal del período que viene.

Relacionado: [Capital Propio Tributario (CPT)](#cpt) · [F22](#f22) · [Expediente anual](#expediente-anual) · [Capital base de patente](#capital-base-patente)

<a id="spa"></a>
### SpA

**Sociedad por Acciones. Admite un accionista único con el 100 %.**

Es el tipo societario que esta aplicación toma como caso de referencia: un accionista, sin trabajadores al inicio, con oficina virtual. La aplicación no supone que siempre haya varios socios.

Relacionado: [Accionista](#accionista) · [Capital social](#capital-social)

<a id="accionista"></a>
### Accionista

**Titular de las acciones de la sociedad.**

Puede ser uno solo con el 100 %. Su patrimonio personal y el de la empresa son distintos, y por eso un retiro no es un gasto.

Relacionado: [SpA](#spa) · [Retiro / distribución](#retiro) · [Préstamo del accionista](#prestamo-del-accionista)

<a id="ingreso-operacional"></a>
### Ingreso operacional

**Ingreso generado por la actividad propia de la empresa.**

Aumenta el resultado del ejercicio. Es la tercera posibilidad cuando entra dinero del dueño y no queda claro qué es: puede que en realidad esté pagando un servicio que la empresa le prestó.

> ⚠️ **No confundir con:** [Aporte de capital](#aporte-de-capital) · [Préstamo del accionista](#prestamo-del-accionista)

Relacionado: [Renta Líquida Imponible (RLI)](#rli)

<a id="conciliacion"></a>
### Conciliación

**Prueba de que dos fuentes independientes explican el mismo saldo.**

Banco contra registro, RCV contra operaciones. Si no cuadran, una de las dos está incompleta y conviene saber cuál antes de cerrar.

Relacionado: [RCV](#rcv) · [Cierre anual](#cierre-anual)

## Cumplimiento y evidencia

<a id="evidencia"></a>
### Evidencia

**Documento externo que respalda una cifra: folio, certificado, comprobante, cartola.**

La aplicación nunca da algo por acreditado sólo porque lo calculó internamente. Un cálculo es un cálculo; lo que prueba un hecho ante un tercero es el documento.

Relacionado: [Estado del dato](#estado-del-dato) · [DTE](#dte)

<a id="estado-del-dato"></a>
### Estado del dato

**Nivel de respaldo de una cifra: ESTIMADO, CALCULADO, DECLARADO, VERIFICADO o PAGADO.**

ESTIMADO es un supuesto; CALCULADO lo produjo el motor con datos completos; DECLARADO se presentó ante un organismo; VERIFICADO fue contrastado con la fuente oficial; PAGADO tiene comprobante de pago. Mostrar la cifra sin su estado es lo que hace que una estimación se confunda con un hecho.

Relacionado: [Evidencia](#evidencia) · [Origen del dato](#origen-del-dato)

<a id="origen-del-dato"></a>
### Origen del dato

**De dónde vino una cifra: del usuario, del motor, de un archivo importado, del SII o de la municipalidad.**

Esta aplicación no está conectada al SII ni a ninguna municipalidad. Distinguir el origen deja preparada esa integración futura sin fingir que ya existe.

Relacionado: [Estado del dato](#estado-del-dato)

<a id="expediente-anual"></a>
### Expediente anual

**Carpeta exportable con todo lo que explica un ejercicio: cifras, reglas usadas, fuentes y evidencias.**

Debe poder revisarse años después y explicar exactamente con qué reglas se calculó cada cifra. Guarda la versión de las reglas tributarias, no sólo el resultado.

Relacionado: [Cierre anual](#cierre-anual) · [Evidencia](#evidencia)

<a id="pending-confirmation"></a>
### PENDING_CONFIRMATION

**Marca de un campo que la aplicación no pudo conocer y que el usuario debe confirmar.**

Aparece sobre todo tras migrar datos antiguos: si sólo se conocía un “capital” genérico, se conserva como capital enterado y el capital social y el suscrito quedan marcados así en vez de inventarse.

Relacionado: [Estado del dato](#estado-del-dato)

---

Cuando una situación dependa de interpretación, de antecedentes particulares o de reglas municipales no disponibles,
la aplicación lo dice en vez de resolverlo sola: **requiere verificación con fuente oficial, municipalidad o profesional tributario.**
