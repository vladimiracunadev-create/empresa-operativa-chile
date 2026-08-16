/**
 * Glosario del sistema: una sola definición por término, en un solo lugar.
 *
 * Por qué es un módulo y no un documento: los mismos textos alimentan la vista
 * “Glosario” de la aplicación, las ayudas contextuales que aparecen junto a los
 * campos y `docs/GLOSSARY.md`, que se genera desde aquí con
 * `node scripts/build-glossary.mjs` y cuya sincronía comprueba CI. Un glosario
 * escrito a mano en tres sitios distintos se desincroniza en dos semanas; éste
 * no puede, porque sólo existe una copia.
 *
 * Cada término lleva `notToConfuseWith` porque el error caro de este dominio no
 * es no conocer una palabra: es creer que dos palabras distintas significan lo
 * mismo. Capital enterado, patrimonio contable, CPT y capital base de patente
 * son cuatro magnitudes diferentes, y confundirlas cambia la cifra que se paga.
 *
 * Módulo puro: sin `node:*`. Viaja al navegador, al APK y a Windows.
 */

export const CATEGORIES = Object.freeze([
  'Capital y patrimonio',
  'Tributación de la renta',
  'IVA y documentos',
  'Municipal',
  'Contabilidad',
  'Cumplimiento y evidencia'
]);

/** @type {ReadonlyArray<{id:string,term:string,category:string,short:string,long:string,notToConfuseWith?:string[],related?:string[],legalReference?:string,source?:string,lastVerified?:string}>} */
export const TERMS = Object.freeze([
  /* ------------------------------------------------ Capital y patrimonio -- */
  {
    id: 'capital-social',
    term: 'Capital social',
    category: 'Capital y patrimonio',
    short: 'El capital que el estatuto de la sociedad declara. Es una cifra societaria, no un saldo bancario.',
    long:
      'Es lo que quedó establecido en la escritura o estatuto al constituir la sociedad, y en sus modificaciones posteriores. ' +
      'Define cuánto capital tiene la sociedad “sobre el papel” y en cuántas acciones se divide. ' +
      'Puede estar totalmente enterado, parcialmente enterado o no enterado en absoluto: el estatuto dice cuánto es, no cuánto llegó.',
    notToConfuseWith: ['capital-enterado', 'patrimonio-contable', 'cpt'],
    related: ['capital-suscrito', 'aumento-de-capital', 'spa'],
    legalReference: 'Estatuto social y sus modificaciones'
  },
  {
    id: 'capital-suscrito',
    term: 'Capital suscrito',
    category: 'Capital y patrimonio',
    short: 'La parte del capital social que un accionista se comprometió formalmente a aportar.',
    long:
      'Suscribir es comprometerse. Un accionista que suscribe $5.000.000 asumió la obligación de aportarlos en el plazo que fije el estatuto, ' +
      'aunque todavía no haya transferido un peso. Mientras no los entere, la sociedad tiene un derecho a cobrarle, no el dinero.',
    notToConfuseWith: ['capital-enterado', 'capital-por-enterar'],
    related: ['capital-social', 'accionista']
  },
  {
    id: 'capital-enterado',
    term: 'Capital enterado',
    category: 'Capital y patrimonio',
    short: 'Lo que efectivamente entró a la empresa: dinero depositado o bienes transferidos.',
    long:
      'Es la parte del capital suscrito que ya se pagó de verdad — depósito en la cuenta de la empresa, transferencia, o un bien aportado y transferido. ' +
      'Sólo el capital enterado es un activo de la empresa. Es la magnitud que la aplicación usaba antes bajo el nombre genérico “capital”, ' +
      'y sigue siendo la base de partida del primer ejercicio, pero no equivale ni al patrimonio contable ni al capital propio tributario.',
    notToConfuseWith: ['capital-social', 'capital-suscrito', 'cpt', 'capital-base-patente'],
    related: ['aporte-de-capital', 'aporte-en-bienes', 'capital-por-enterar']
  },
  {
    id: 'capital-por-enterar',
    term: 'Capital por enterar',
    category: 'Capital y patrimonio',
    short: 'Capital suscrito todavía pendiente de pago. Capital suscrito menos capital enterado.',
    long:
      'La deuda del accionista con su propia sociedad. Si el estatuto fijó un plazo para enterarlo, ese plazo corre; ' +
      'y si se dejó pasar, la situación conviene regularizarla, porque el estatuto sigue diciendo que ese capital existe. ' +
      'No es un activo disponible: es una promesa pendiente.',
    notToConfuseWith: ['capital-enterado'],
    related: ['capital-suscrito']
  },
  {
    id: 'aporte-de-capital',
    term: 'Aporte de capital',
    category: 'Capital y patrimonio',
    short: 'Dinero o bienes que el accionista entrega a la empresa a título de capital, sin esperar devolución.',
    long:
      'Aumenta el patrimonio. No genera una deuda de la empresa con el accionista y no se “devuelve” salvo mediante una disminución formal de capital. ' +
      'Es distinto de un préstamo del accionista, aunque en la cartola bancaria las dos operaciones se vean exactamente igual: un depósito.',
    notToConfuseWith: ['prestamo-del-accionista', 'ingreso-operacional'],
    related: ['capital-enterado', 'aporte-en-bienes', 'aumento-de-capital']
  },
  {
    id: 'prestamo-del-accionista',
    term: 'Préstamo del accionista',
    category: 'Capital y patrimonio',
    short: 'Dinero que el accionista presta a la empresa. Es un pasivo exigible, no capital.',
    long:
      'La empresa queda debiéndole al accionista. Aparece en el pasivo, reduce el patrimonio y reduce el capital propio tributario — ' +
      'exactamente al revés que un aporte. Por eso la aplicación obliga a decidir la naturaleza de cada depósito del dueño en vez de suponer que todo es capital: ' +
      'la misma transferencia de $2.000.000 sube o baja el CPT según qué fue realmente.',
    notToConfuseWith: ['aporte-de-capital'],
    related: ['pasivo-exigible', 'cpt', 'devolucion-de-prestamo']
  },
  {
    id: 'devolucion-de-prestamo',
    term: 'Devolución de préstamo',
    category: 'Capital y patrimonio',
    short: 'Pago con que la empresa extingue el préstamo que le hizo su accionista.',
    long:
      'Baja el activo (sale caja) y baja el pasivo en el mismo monto. No es un retiro, no es un gasto y no afecta el resultado del ejercicio: ' +
      'sólo cancela una deuda previamente reconocida.',
    notToConfuseWith: ['retiro'],
    related: ['prestamo-del-accionista']
  },
  {
    id: 'aporte-en-bienes',
    term: 'Aporte en bienes (no monetario)',
    category: 'Capital y patrimonio',
    short: 'Capital enterado con un bien —un notebook, un servidor, mobiliario— en lugar de dinero.',
    long:
      'Es capital enterado igual que el dinero, pero exige distinguir tres valores que casi nunca coinciden: el valor de aporte acordado, ' +
      'el valor contable con que queda registrado y el valor tributario. Requiere documento de respaldo e identificación del accionista aportante.',
    notToConfuseWith: ['aporte-de-capital'],
    related: ['valor-tributario', 'activo', 'capital-enterado']
  },
  {
    id: 'aumento-de-capital',
    term: 'Aumento de capital',
    category: 'Capital y patrimonio',
    short: 'Modificación societaria que eleva el capital social.',
    long:
      'Cambia la cifra del estatuto. Suele venir acompañado de nuevas suscripciones y de aportes que las enteran, pero el aumento en sí es el acto societario, ' +
      'no el depósito. Para efectos de patente municipal y de CPT, lo que mueve la aguja es el capital efectivamente enterado, no el acordado.',
    related: ['capital-social', 'disminucion-de-capital']
  },
  {
    id: 'disminucion-de-capital',
    term: 'Disminución de capital',
    category: 'Capital y patrimonio',
    short: 'Modificación societaria que reduce el capital social y suele devolver fondos al accionista.',
    long:
      'Reduce el patrimonio y, cuando implica devolución efectiva, reduce también el capital propio tributario. ' +
      'Tiene formalidades societarias y efectos tributarios propios: no es simplemente “sacar plata”.',
    notToConfuseWith: ['retiro'],
    related: ['capital-social', 'cpt']
  },
  {
    id: 'retiro',
    term: 'Retiro / distribución',
    category: 'Capital y patrimonio',
    short: 'Salida de fondos al accionista con cargo a las utilidades o al patrimonio.',
    long:
      'Reduce el patrimonio, no el resultado: no es un gasto y no rebaja la base del impuesto de la empresa. ' +
      'En el régimen Pro Pyme los retiros y distribuciones del ejercicio se restan al determinar el capital propio tributario simplificado.',
    notToConfuseWith: ['gasto-deducible', 'devolucion-de-prestamo'],
    related: ['cpt-simplificado', 'patrimonio-contable']
  },
  {
    id: 'patrimonio-contable',
    term: 'Patrimonio contable',
    category: 'Capital y patrimonio',
    short: 'Activos menos pasivos según las reglas contables. El “valor en libros” de la empresa.',
    long:
      'Sale del balance: capital enterado, más los resultados acumulados de todos los ejercicios, más o menos los ajustes contables. ' +
      'Se mueve con cada utilidad y cada pérdida. No coincide necesariamente con el capital propio tributario, porque éste último ' +
      'obliga a rebajar partidas que la contabilidad sí acepta.',
    notToConfuseWith: ['cpt', 'capital-enterado'],
    related: ['activo', 'pasivo-exigible', 'resultados-acumulados']
  },
  {
    id: 'resultados-acumulados',
    term: 'Resultados acumulados',
    category: 'Capital y patrimonio',
    short: 'Suma de las utilidades y pérdidas de todos los ejercicios que no se han retirado.',
    long:
      'Es la parte del patrimonio que la empresa generó operando, en contraste con la que el accionista puso. ' +
      'Un año con utilidad la sube; un año con pérdida la baja, y puede dejarla negativa.',
    related: ['patrimonio-contable', 'perdida-tributaria']
  },
  {
    id: 'activo',
    term: 'Activo',
    category: 'Capital y patrimonio',
    short: 'Recurso controlado por la empresa del que espera obtener beneficios.',
    long:
      'Caja y banco, cuentas por cobrar a clientes, equipamiento, software, remanente de crédito fiscal. ' +
      'Para el capital propio tributario se toman a su VALOR TRIBUTARIO, que no siempre es el valor contable ni el comercial.',
    related: ['valor-tributario', 'pasivo-exigible']
  },
  {
    id: 'pasivo-exigible',
    term: 'Pasivo exigible',
    category: 'Capital y patrimonio',
    short: 'Obligaciones con terceros que la empresa tendrá que pagar.',
    long:
      'Proveedores, impuestos por pagar, retenciones por enterar, préstamos bancarios y también los préstamos del accionista. ' +
      'Es el término que usa el art. 41 N.º 1 de la LIR: el CPT es activo menos pasivo EXIGIBLE, y el patrimonio no se cuenta como pasivo.',
    notToConfuseWith: ['patrimonio-contable'],
    related: ['cpt', 'prestamo-del-accionista'],
    legalReference: 'LIR art. 41 N.º 1'
  },
  {
    id: 'valor-tributario',
    term: 'Valor tributario',
    category: 'Capital y patrimonio',
    short: 'El valor de un activo o pasivo según las normas tributarias, que puede diferir del contable y del comercial.',
    long:
      'Un notebook aportado puede tener valor de aporte $900.000, valor contable $600.000 tras depreciación y un valor tributario distinto ' +
      'si la depreciación tributaria no coincide con la contable. La aplicación guarda los tres por separado en vez de suponerlos iguales.',
    related: ['aporte-en-bienes', 'cpt']
  },

  /* ------------------------------------------------ Tributación de renta -- */
  {
    id: 'cpt',
    term: 'Capital Propio Tributario (CPT)',
    category: 'Tributación de la renta',
    short: 'Activo menos pasivo exigible, a valores tributarios, rebajados los valores que no representan inversión efectiva.',
    long:
      'Es la medida tributaria del patrimonio. El art. 41 N.º 1 de la LIR lo define como la diferencia entre el activo y el pasivo exigible ' +
      'a la fecha de iniciación del ejercicio comercial, rebajando previamente los valores intangibles, nominales, transitorios y de orden ' +
      'que no representen inversiones efectivas. Se determina al cierre de cada ejercicio y se informa en la declaración anual de renta. ' +
      'No es el capital con que se constituyó la sociedad, y por eso el segundo año de una empresa casi nunca paga patente sobre la misma cifra que el primero.',
    notToConfuseWith: ['capital-enterado', 'patrimonio-contable', 'capital-social', 'capital-base-patente'],
    related: ['cpt-simplificado', 'articulo-41', 'f22', 'capital-base-patente'],
    legalReference: 'LIR art. 41 N.º 1',
    source: 'https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7347.htm',
    lastVerified: '2026-08-16'
  },
  {
    id: 'cpt-simplificado',
    term: 'CPT simplificado',
    category: 'Tributación de la renta',
    short: 'Forma simplificada de determinar el capital propio tributario, propia del régimen Pro Pyme General.',
    long:
      'La letra (j) del N.º 3 de la letra D) del art. 14 de la LIR permite a las Pymes determinar su capital propio sin armar el balance tributario completo: ' +
      'se suma el capital aportado formalizado y sus aumentos, las bases imponibles de primera categoría de cada año y las rentas percibidas por participaciones en otras empresas; ' +
      'se restan las disminuciones de capital, las pérdidas, las partidas del inciso segundo del art. 21 pagadas, y los retiros y distribuciones a los propietarios. ' +
      'Si el resultado es negativo, se considera $0. No aplica a cualquier contribuyente: hay que estar acogido al régimen que lo permite.',
    notToConfuseWith: ['cpt'],
    related: ['pro-pyme-general', 'cpt', 'rli'],
    legalReference: 'LIR art. 14 letra D) N.º 3 letra (j)',
    source: 'https://www.sii.cl/normativa_legislacion/circulares/2020/circu62.pdf',
    lastVerified: '2026-08-16'
  },
  {
    id: 'articulo-41',
    term: 'Artículo 41 de la LIR',
    category: 'Tributación de la renta',
    short: 'Norma que define el capital propio tributario y las reglas de corrección monetaria.',
    long:
      'Su N.º 1 es el que define el CPT. El resto del artículo regula la revalorización de activos y pasivos por corrección monetaria, ' +
      'que esta aplicación NO modela y declara como limitación.',
    related: ['cpt'],
    legalReference: 'LIR art. 41'
  },
  {
    id: 'pro-pyme-general',
    term: 'Pro Pyme General (14 D N.º 3)',
    category: 'Tributación de la renta',
    short: 'Régimen tributario para pymes con contabilidad simplificada y CPT simplificado.',
    long:
      'Tributa con impuesto de primera categoría sobre una base de ingresos percibidos menos egresos pagados, y determina el CPT simplificado de la letra (j). ' +
      'Es el perfil por defecto de esta aplicación, pero no el único: el régimen elegido cambia cómo se determina el capital propio.',
    related: ['pro-pyme-transparente', 'regimen-general', 'cpt-simplificado', 'idpc'],
    legalReference: 'LIR art. 14 letra D) N.º 3'
  },
  {
    id: 'pro-pyme-transparente',
    term: 'Pro Pyme Transparente (14 D N.º 8)',
    category: 'Tributación de la renta',
    short: 'Régimen en que la empresa no paga primera categoría y el resultado tributa directamente en los dueños.',
    long:
      'No determina el CPT simplificado de la letra (j). Si la empresa está acogida aquí, la aplicación no aplica esa fórmula y lo dice, ' +
      'en vez de calcular igual con la regla equivocada.',
    related: ['pro-pyme-general', 'cpt-simplificado'],
    legalReference: 'LIR art. 14 letra D) N.º 8'
  },
  {
    id: 'regimen-general',
    term: 'Régimen General semi integrado (14 A)',
    category: 'Tributación de la renta',
    short: 'Régimen con contabilidad completa y registros empresariales completos.',
    long:
      'Determina el capital propio tributario por el art. 41 con balance tributario completo, no por la vía simplificada. ' +
      'Requiere registros empresariales (RAI, DDAN, REX, SAC).',
    related: ['cpt', 'registros-empresariales'],
    legalReference: 'LIR art. 14 letra A)'
  },
  {
    id: 'registros-empresariales',
    term: 'Registros empresariales',
    category: 'Tributación de la renta',
    short: 'Control tributario de las rentas acumuladas y los créditos asociados (RAI, DDAN, REX, SAC).',
    long:
      'Determinan cómo tributan los retiros y distribuciones cuando llegan a los dueños. ' +
      'Su exigencia depende del régimen: el Pro Pyme General lleva una versión reducida.',
    related: ['regimen-general', 'retiro', 'cierre-anual']
  },
  {
    id: 'rli',
    term: 'Renta Líquida Imponible (RLI)',
    category: 'Tributación de la renta',
    short: 'Base sobre la que se calcula el impuesto de primera categoría del ejercicio.',
    long:
      'En el régimen Pro Pyme General se determina, en general, por ingresos percibidos menos egresos pagados, con los ajustes que la ley señala. ' +
      'Entra como sumando en la determinación del CPT simplificado.',
    related: ['idpc', 'cpt-simplificado', 'f22']
  },
  {
    id: 'idpc',
    term: 'IDPC',
    category: 'Tributación de la renta',
    short: 'Impuesto de Primera Categoría: el impuesto a la renta que paga la empresa.',
    long: 'Se calcula sobre la RLI del ejercicio y se declara en el F22. Los PPM pagados durante el año se imputan contra él.',
    related: ['rli', 'ppm', 'f22']
  },
  {
    id: 'perdida-tributaria',
    term: 'Pérdida tributaria',
    category: 'Tributación de la renta',
    short: 'Resultado negativo del ejercicio según las normas tributarias.',
    long:
      'Reduce el capital propio tributario. En el CPT simplificado se resta explícitamente. ' +
      'Un año malo no sólo significa no pagar impuesto: baja la base sobre la que se calculará la patente del año siguiente.',
    related: ['cpt-simplificado', 'resultados-acumulados']
  },
  {
    id: 'f22',
    term: 'F22',
    category: 'Tributación de la renta',
    short: 'Declaración anual de impuesto a la renta.',
    long:
      'Ahí se declara la RLI, el impuesto del ejercicio y el capital propio tributario. ' +
      'El CPT declarado en el F22 es el que el SII pone a disposición de las municipalidades para la patente.',
    related: ['cpt', 'dj', 'cierre-anual', 'patente-municipal']
  },
  {
    id: 'dj',
    term: 'DJ',
    category: 'Tributación de la renta',
    short: 'Declaración jurada informativa que acompaña a la Operación Renta.',
    long: 'No liquida impuesto: informa. Su omisión o su error genera multas propias y suele ser el origen de diferencias con el SII.',
    related: ['f22', 'cierre-anual']
  },
  {
    id: 'ppm',
    term: 'PPM',
    category: 'Tributación de la renta',
    short: 'Pago Provisional Mensual: anticipo mensual a cuenta del impuesto anual.',
    long:
      'Se calcula sobre los ingresos brutos, no sobre la utilidad, así que se paga aunque el mes cierre con pérdida. ' +
      'En la Operación Renta se imputa contra el impuesto final y, si sobró, se devuelve.',
    related: ['idpc', 'f29', 'f22']
  },

  /* -------------------------------------------------- IVA y documentos ---- */
  {
    id: 'debito-fiscal',
    term: 'Débito fiscal',
    category: 'IVA y documentos',
    short: 'IVA recargado en las ventas y servicios afectos.',
    long: 'Lo recauda la empresa para el fisco. Nunca fue ingreso suyo, aunque pase por su cuenta corriente.',
    related: ['credito-fiscal', 'f29']
  },
  {
    id: 'credito-fiscal',
    term: 'Crédito fiscal',
    category: 'IVA y documentos',
    short: 'IVA soportado en compras que cumple los requisitos para ser utilizado.',
    long:
      'Sólo es crédito si la compra es del giro, está respaldada por documento válido y la ley no lo excluye. ' +
      'Que salga plata no basta para que el IVA sea recuperable.',
    notToConfuseWith: ['gasto-deducible'],
    related: ['debito-fiscal', 'remanente-credito-fiscal', 'f29']
  },
  {
    id: 'remanente-credito-fiscal',
    term: 'Remanente de crédito fiscal',
    category: 'IVA y documentos',
    short: 'Crédito de IVA que sobró en un período y se arrastra al siguiente.',
    long:
      'Cuando el crédito supera al débito no se pierde ni se devuelve: queda disponible el mes siguiente. ' +
      'Es lo normal al partir, cuando se compra equipamiento antes de facturar.',
    related: ['credito-fiscal', 'f29']
  },
  {
    id: 'f29',
    term: 'F29',
    category: 'IVA y documentos',
    short: 'Declaración mensual que concentra IVA, PPM y retenciones.',
    long: 'Se presenta el mes siguiente al período. Su plazo depende de si se declara por internet y de si resulta con pago.',
    related: ['debito-fiscal', 'credito-fiscal', 'ppm']
  },
  {
    id: 'dte',
    term: 'DTE',
    category: 'IVA y documentos',
    short: 'Documento Tributario Electrónico: factura, boleta, nota de crédito o débito electrónica.',
    long: 'Es la evidencia primaria de una operación afecta. Sin DTE válido no hay crédito fiscal que sostener.',
    related: ['rcv', 'evidencia']
  },
  {
    id: 'rcv',
    term: 'RCV',
    category: 'IVA y documentos',
    short: 'Registro de Compras y Ventas del SII.',
    long: 'Reemplazó al libro de compras y ventas. Conciliar contra el RCV es la forma de detectar documentos que la empresa no registró — o que no reconoce.',
    related: ['dte', 'conciliacion']
  },
  {
    id: 'gasto-deducible',
    term: 'Gasto deducible',
    category: 'IVA y documentos',
    short: 'Desembolso que la ley acepta rebajar de la renta de la empresa.',
    long:
      'Debe estar vinculado al interés de la empresa y respaldado. Un gasto puede ser deducible y su IVA no ser crédito, o al revés: ' +
      'por eso son dos casillas separadas y no una sola.',
    notToConfuseWith: ['credito-fiscal', 'retiro'],
    related: ['evidencia']
  },

  /* -------------------------------------------------------- Municipal ---- */
  {
    id: 'patente-municipal',
    term: 'Patente municipal',
    category: 'Municipal',
    short: 'Tributo anual que grava el ejercicio de una actividad, calculado sobre el capital propio del contribuyente.',
    long:
      'El art. 24 del D.L. 3.063 fija su valor anual entre el 2,5‰ y el 5‰ del capital propio, con un mínimo de 1 UTM y un máximo de 8.000 UTM. ' +
      'Cada municipalidad elige su tasa dentro de ese rango por ordenanza, de modo que no existe una tasa nacional única.',
    notToConfuseWith: ['cpt'],
    related: ['capital-base-patente', 'patente-inicial', 'utm'],
    legalReference: 'D.L. N.º 3.063 de 1979, art. 24',
    source: 'https://www.bcn.cl/leychile/navegar?idNorma=6942',
    lastVerified: '2026-08-16'
  },
  {
    id: 'capital-base-patente',
    term: 'Capital base de patente',
    category: 'Municipal',
    short: 'El capital propio que legalmente corresponde usar para calcular la patente de un período determinado.',
    long:
      'No es un sinónimo de CPT ni de capital enterado: es el capital propio que la norma manda usar para ESE período. ' +
      'Para actividades nuevas, el capital propio inicial declarado por el contribuyente. Para ejercicios posteriores, ' +
      'el capital propio registrado en el balance terminado el 31 de diciembre inmediatamente anterior, con los ajustes de los arts. 41 y siguientes de la LIR, ' +
      'y descontando —cuando procede y se acredita con certificado municipal— la parte invertida en otros negocios afectos a patente.',
    notToConfuseWith: ['cpt', 'capital-enterado', 'capital-social'],
    related: ['patente-municipal', 'patente-inicial', 'inversiones-deducibles'],
    legalReference: 'D.L. N.º 3.063 de 1979, art. 24 inciso tercero',
    lastVerified: '2026-08-16'
  },
  {
    id: 'patente-inicial',
    term: 'Patente inicial',
    category: 'Municipal',
    short: 'La primera patente de una empresa, calculada sobre el capital propio inicial declarado.',
    long:
      'Es el único momento en que la base tiene relación directa con el capital con que se constituyó la sociedad. ' +
      'Desde el ejercicio siguiente la base pasa a ser el capital propio del balance anterior, y por eso la cifra cambia.',
    related: ['capital-base-patente', 'patente-municipal']
  },
  {
    id: 'inversiones-deducibles',
    term: 'Inversiones deducibles',
    category: 'Municipal',
    short: 'Parte del capital propio invertida en otros negocios afectos a patente, que puede rebajarse de la base.',
    long:
      'Evita pagar dos veces patente por el mismo capital. La deducción exige acreditarse con certificado emitido por la municipalidad correspondiente: ' +
      'la aplicación no la aplica sola, hay que registrar el certificado.',
    related: ['capital-base-patente'],
    legalReference: 'D.L. N.º 3.063 de 1979, art. 24 inciso final'
  },
  {
    id: 'prorrateo-sucursales',
    term: 'Prorrateo entre sucursales',
    category: 'Municipal',
    short: 'Reparto del capital propio entre las unidades del contribuyente según el número de trabajadores de cada una.',
    long:
      'Cuando la empresa tiene sucursales en varias comunas, la patente total se paga proporcionalmente por cada unidad. ' +
      'La municipalidad de la casa matriz determina la distribución y la comunica a las demás. Se declara anualmente en mayo.',
    related: ['patente-municipal'],
    legalReference: 'D.L. N.º 3.063 de 1979, art. 25'
  },
  {
    id: 'utm',
    term: 'UTM',
    category: 'Municipal',
    short: 'Unidad Tributaria Mensual. Cambia todos los meses.',
    long:
      'Los topes de la patente están expresados en UTM, así que el mes de la UTM que se use cambia el resultado. ' +
      'Usar la UTM de otro período es uno de los errores silenciosos más fáciles de cometer.',
    related: ['patente-municipal']
  },
  {
    id: 'oficina-virtual',
    term: 'Oficina virtual',
    category: 'Municipal',
    short: 'Domicilio comercial contratado a un tercero, sin ocupación física permanente.',
    long:
      'Sirve para acreditar domicilio ante el SII y determinar la municipalidad competente, pero no es capital ni lo reemplaza. ' +
      'Tener oficina virtual no hace que el capital sea cero ni que la patente sea cero: la base sigue siendo el capital propio que corresponda.',
    notToConfuseWith: ['capital-enterado', 'capital-base-patente'],
    related: ['domicilio-tributario', 'patente-municipal']
  },
  {
    id: 'domicilio-tributario',
    term: 'Domicilio tributario',
    category: 'Municipal',
    short: 'Dirección que la empresa declara ante el SII y que determina, junto con la actividad, la municipalidad competente.',
    long: 'Es un dato de identidad, no una magnitud patrimonial. Cambiarlo puede cambiar la municipalidad, nunca el capital.',
    related: ['oficina-virtual', 'patente-municipal']
  },

  /* ------------------------------------------------------ Contabilidad --- */
  {
    id: 'cierre-anual',
    term: 'Cierre anual',
    category: 'Contabilidad',
    short: 'Corte del ejercicio al 31 de diciembre que fija activos, pasivos, patrimonio y CPT del año.',
    long:
      'Produce una fotografía inmutable: lo que se cierra ya no se reescribe. Ese cierre es la apertura del ejercicio siguiente ' +
      'y la fuente de la base municipal del período que viene.',
    related: ['cpt', 'f22', 'expediente-anual', 'capital-base-patente']
  },
  {
    id: 'spa',
    term: 'SpA',
    category: 'Contabilidad',
    short: 'Sociedad por Acciones. Admite un accionista único con el 100 %.',
    long:
      'Es el tipo societario que esta aplicación toma como caso de referencia: un accionista, sin trabajadores al inicio, con oficina virtual. ' +
      'La aplicación no supone que siempre haya varios socios.',
    related: ['accionista', 'capital-social']
  },
  {
    id: 'accionista',
    term: 'Accionista',
    category: 'Contabilidad',
    short: 'Titular de las acciones de la sociedad.',
    long: 'Puede ser uno solo con el 100 %. Su patrimonio personal y el de la empresa son distintos, y por eso un retiro no es un gasto.',
    related: ['spa', 'retiro', 'prestamo-del-accionista']
  },
  {
    id: 'ingreso-operacional',
    term: 'Ingreso operacional',
    category: 'Contabilidad',
    short: 'Ingreso generado por la actividad propia de la empresa.',
    long:
      'Aumenta el resultado del ejercicio. Es la tercera posibilidad cuando entra dinero del dueño y no queda claro qué es: ' +
      'puede que en realidad esté pagando un servicio que la empresa le prestó.',
    notToConfuseWith: ['aporte-de-capital', 'prestamo-del-accionista'],
    related: ['rli']
  },
  {
    id: 'conciliacion',
    term: 'Conciliación',
    category: 'Contabilidad',
    short: 'Prueba de que dos fuentes independientes explican el mismo saldo.',
    long: 'Banco contra registro, RCV contra operaciones. Si no cuadran, una de las dos está incompleta y conviene saber cuál antes de cerrar.',
    related: ['rcv', 'cierre-anual']
  },

  /* --------------------------------------------- Cumplimiento y evidencia - */
  {
    id: 'evidencia',
    term: 'Evidencia',
    category: 'Cumplimiento y evidencia',
    short: 'Documento externo que respalda una cifra: folio, certificado, comprobante, cartola.',
    long:
      'La aplicación nunca da algo por acreditado sólo porque lo calculó internamente. Un cálculo es un cálculo; ' +
      'lo que prueba un hecho ante un tercero es el documento.',
    related: ['estado-del-dato', 'dte']
  },
  {
    id: 'estado-del-dato',
    term: 'Estado del dato',
    category: 'Cumplimiento y evidencia',
    short: 'Nivel de respaldo de una cifra: ESTIMADO, CALCULADO, DECLARADO, VERIFICADO o PAGADO.',
    long:
      'ESTIMADO es un supuesto; CALCULADO lo produjo el motor con datos completos; DECLARADO se presentó ante un organismo; ' +
      'VERIFICADO fue contrastado con la fuente oficial; PAGADO tiene comprobante de pago. ' +
      'Mostrar la cifra sin su estado es lo que hace que una estimación se confunda con un hecho.',
    related: ['evidencia', 'origen-del-dato']
  },
  {
    id: 'origen-del-dato',
    term: 'Origen del dato',
    category: 'Cumplimiento y evidencia',
    short: 'De dónde vino una cifra: del usuario, del motor, de un archivo importado, del SII o de la municipalidad.',
    long:
      'Esta aplicación no está conectada al SII ni a ninguna municipalidad. Distinguir el origen deja preparada esa integración futura ' +
      'sin fingir que ya existe.',
    related: ['estado-del-dato']
  },
  {
    id: 'expediente-anual',
    term: 'Expediente anual',
    category: 'Cumplimiento y evidencia',
    short: 'Carpeta exportable con todo lo que explica un ejercicio: cifras, reglas usadas, fuentes y evidencias.',
    long:
      'Debe poder revisarse años después y explicar exactamente con qué reglas se calculó cada cifra. ' +
      'Guarda la versión de las reglas tributarias, no sólo el resultado.',
    related: ['cierre-anual', 'evidencia']
  },
  {
    id: 'pending-confirmation',
    term: 'PENDING_CONFIRMATION',
    category: 'Cumplimiento y evidencia',
    short: 'Marca de un campo que la aplicación no pudo conocer y que el usuario debe confirmar.',
    long:
      'Aparece sobre todo tras migrar datos antiguos: si sólo se conocía un “capital” genérico, se conserva como capital enterado ' +
      'y el capital social y el suscrito quedan marcados así en vez de inventarse.',
    related: ['estado-del-dato']
  }
]);

const BY_ID = new Map(TERMS.map(t => [t.id, t]));

/** Devuelve un término por su id, o `null`. */
export function term(id) {
  return BY_ID.get(String(id)) ?? null;
}

/** Ids que un término declara y que no existen — usado por los tests para evitar enlaces rotos. */
export function danglingReferences() {
  const missing = [];
  for (const t of TERMS) {
    for (const key of ['related', 'notToConfuseWith']) {
      for (const ref of t[key] ?? []) {
        if (!BY_ID.has(ref)) missing.push(`${t.id}.${key} → ${ref}`);
      }
    }
  }
  return missing;
}

/** Búsqueda sin acentos ni mayúsculas sobre término, resumen y definición. */
export function searchTerms(query) {
  const q = normalize(query);
  if (!q) return [...TERMS];
  return TERMS.filter(t => normalize(`${t.term} ${t.short} ${t.long} ${t.id}`).includes(q));
}

/** Términos agrupados por categoría, en el orden declarado en `CATEGORIES`. */
export function termsByCategory() {
  return CATEGORIES.map(category => ({ category, terms: TERMS.filter(t => t.category === category) })).filter(g => g.terms.length > 0);
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('es-CL')
    .trim();
}
