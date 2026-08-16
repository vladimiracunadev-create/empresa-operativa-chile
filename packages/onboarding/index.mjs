/**
 * La ruta: qué hacer, en qué orden, desde antes de que la empresa exista.
 *
 * Por qué existe este módulo y no sólo un documento: el manual describe
 * PANTALLAS —esta hace esto, aquel botón hace aquello— y eso sirve cuando ya
 * sabes qué quieres hacer. No sirve para alguien que abre la aplicación por
 * primera vez y no sabe por dónde empezar. Esa persona necesita otra cosa: una
 * secuencia, con la pregunta que se está haciendo en cada momento, qué necesita
 * tener a mano, qué decisión tiene que tomar, qué papel le va a quedar y cómo
 * sabe que terminó.
 *
 * Como el glosario, vive en un solo sitio y tiene dos consumidores: la vista
 * “Empezar aquí” de la aplicación —donde cada etapa tiene un botón que abre la
 * ventana correspondiente y muestra tu avance real— y `docs/EMPEZAR-AQUI.md`,
 * que se genera con `node scripts/build-guide.mjs` y cuya sincronía comprueba
 * CI. Escribir la ruta dos veces sería garantizar que en un mes digan cosas
 * distintas.
 *
 * Sobre el tono: quien lee esto puede no haber visto nunca un balance. No se
 * asume nada. Cuando algo depende de antecedentes propios o de la comuna, se
 * dice que hay que verificarlo en vez de resolverlo por él.
 *
 * Módulo puro: sin `node:*`.
 */

/** Fases de la vida de la empresa, en orden. */
export const PHASES = Object.freeze([
  { id: 'antes', label: 'Antes de existir', hint: 'Decisiones que se toman en papel, sin trámites todavía.' },
  { id: 'nacer', label: 'Hacerla nacer', hint: 'Los trámites que convierten la decisión en una empresa real.' },
  { id: 'habilitar', label: 'Habilitarla para operar', hint: 'Lo que falta para poder facturar y cobrar legalmente.' },
  { id: 'operar', label: 'Operar mes a mes', hint: 'La rutina que se repite mientras la empresa viva.' },
  { id: 'anual', label: 'Cerrar el año', hint: 'Lo que ocurre una vez al año y define el año siguiente.' }
]);

/**
 * Las etapas de la ruta.
 *
 * `formationStep` enlaza con el catálogo de trámites de
 * `company-operations/workspace.mjs`, para que la vista pueda mostrar si ya lo
 * hiciste sin mantener dos listas de estado.
 */
export const STAGES = Object.freeze([
  /* ------------------------------------------------ antes de existir ---- */
  {
    id: 'decidir',
    phase: 'antes',
    title: 'Decidir qué empresa vas a crear',
    question: 'No sé por dónde empezar. ¿Qué es lo primero?',
    why:
      'Lo primero no es un trámite: es una decisión. Todo lo que viene después —el tipo de sociedad, cuánto capital pones, dónde ' +
      'la domicilias, qué régimen tributario eliges— depende de qué vas a hacer y con quién. Tomarte una tarde aquí ahorra ' +
      'modificaciones societarias caras después.',
    needs: [
      'Saber qué actividad vas a realizar y cómo vas a cobrar por ella.',
      'Saber si vas a estar solo o con otras personas.',
      'Una idea de cuánto dinero o bienes puedes poner al principio.'
    ],
    decisions: [
      {
        question: '¿Qué tipo de empresa?',
        options: [
          {
            label: 'SpA (Sociedad por Acciones)',
            whenItFits: 'Admite un accionista único al 100 %. Es flexible para entrar socios después. Es el caso que esta aplicación toma como referencia.',
            watchOut: 'Exige llevar contabilidad y cumplir obligaciones mensuales aunque no factures nada.'
          },
          {
            label: 'EIRL (Empresa Individual de Responsabilidad Limitada)',
            whenItFits: 'Una sola persona, estructura más simple.',
            watchOut: 'No admite socios: si más adelante entra alguien, hay que transformarla.'
          },
          {
            label: 'Ltda. (Sociedad de Responsabilidad Limitada)',
            whenItFits: 'Varias personas con vínculo de confianza.',
            watchOut: 'Ceder derechos exige el acuerdo de los demás socios y una modificación societaria.'
          },
          {
            label: 'Persona natural con inicio de actividades',
            whenItFits: 'Actividades pequeñas o boletas de honorarios, sin crear una empresa.',
            watchOut: 'No hay separación entre tu patrimonio y el de la actividad. Esta aplicación está pensada para una empresa, no para este caso.'
          }
        ],
        note:
          'La elección tiene consecuencias tributarias y de responsabilidad que dependen de tu situación. Si dudas, es exactamente el ' +
          'momento de preguntarle a un contador: cuesta mucho menos que corregirlo después.'
      },
      {
        question: '¿Solo o con socios?',
        options: [
          { label: 'Un solo dueño al 100 %', whenItFits: 'Lo más común al partir. La SpA y la EIRL lo permiten.', watchOut: 'Todo lo que saques de la empresa para ti es un retiro, y tiene efectos: revisa la etapa de operación.' },
          { label: 'Con socios', whenItFits: 'Cuando el aporte de trabajo o capital viene de varias personas.', watchOut: 'Define desde el principio quién suscribe cuánto y en qué plazo lo entera. Eso queda en el estatuto.' }
        ]
      }
    ],
    doInApp: { view: 'empresa', label: 'Anotar lo que decidiste en la ficha' },
    formationStep: 'design',
    documents: [
      { name: 'Minuta o acuerdo interno', whoIssues: 'Tú, o tu abogado/contador', whyItMatters: 'Deja por escrito lo acordado antes de firmar nada ante terceros.' }
    ],
    doneWhen: 'Puedes decir en una frase: qué tipo de empresa, quién es dueño de cuánto, qué actividad y dónde va a estar domiciliada.',
    terms: ['spa', 'accionista', 'capital-social'],
    pitfalls: [
      'Empezar por el trámite y decidir el capital sobre la marcha, porque el formulario lo pide. El capital tiene efectos por años.'
    ],
    sources: [
      { label: 'Portal Emprendedor del SII', url: 'https://www.sii.cl/portales/emprendedor/' },
      { label: 'Registro de Empresas y Sociedades', url: 'https://www.registrodeempresasysociedades.cl/' }
    ]
  },
  {
    id: 'capital',
    phase: 'antes',
    title: 'Definir el capital: cuánto, quién lo pone y cuándo',
    question: '¿Cuánto capital tengo que poner? ¿Y si no lo tengo todo ahora?',
    why:
      'Aquí es donde la mayoría se confunde, y es la confusión más cara del principio. “Capital” no es una cifra: son tres, y no ' +
      'tienen por qué coincidir. El CAPITAL SOCIAL es lo que declara el estatuto. El CAPITAL SUSCRITO es lo que cada dueño se ' +
      'compromete a aportar. El CAPITAL ENTERADO es lo que efectivamente entró a la cuenta de la empresa. Puedes constituir con ' +
      '$3.000.000 de capital social, suscribirlo entero y haber enterado sólo $1.000.000: es una situación perfectamente normal, ' +
      'y la aplicación la representa con tres campos distintos en vez de uno.',
    needs: [
      'Saber cuánto dinero puedes poner efectivamente al partir.',
      'Saber si vas a aportar bienes además de dinero (un notebook, un computador, mobiliario).',
      'Saber en qué plazo te comprometes a enterar el resto, si dejas algo pendiente.'
    ],
    decisions: [
      {
        question: '¿Aportas dinero, bienes, o ambos?',
        options: [
          { label: 'Sólo dinero', whenItFits: 'Lo más simple. Se deposita en la cuenta de la empresa cuando exista.', watchOut: 'Guarda la cartola: es la evidencia de que enteraste el capital.' },
          { label: 'También bienes', whenItFits: 'Cuando ya tienes el equipo con que vas a trabajar.', watchOut: 'Un bien aportado tiene tres valores que no coinciden: el de aporte, el contable y el tributario. Y no genera crédito fiscal de IVA, porque no es una compra.' }
        ]
      },
      {
        question: '¿Cuánto capital conviene declarar?',
        options: [
          { label: 'Lo que realmente vas a necesitar', whenItFits: 'Siempre. El capital debe reflejar lo que la empresa necesita para operar.', watchOut: 'Poner poco capital “para pagar menos patente” funciona mucho menos de lo que se cree: la patente tiene un mínimo de 1 UTM, así que por debajo de cierto monto pagas lo mismo.' }
        ],
        note:
          'La patente municipal del PRIMER año se calcula sobre el capital propio inicial que declares. Desde el segundo año la base ' +
          'cambia por completo: pasa a ser tu capital propio tributario. Así que un capital inicial bajo no te protege en el año 2.'
      }
    ],
    doInApp: { view: 'capital', label: 'Registrar capital social, suscrito y enterado' },
    documents: [
      { name: 'Cartola bancaria del depósito', whoIssues: 'Tu banco', whyItMatters: 'Prueba que el capital se enteró de verdad, y cuándo.' },
      { name: 'Acta de aporte de bienes', whoIssues: 'Tú y el aportante', whyItMatters: 'Identifica el bien, su valor y quién lo aportó. Sin esto, un notebook “de la empresa” no es de la empresa.' }
    ],
    doneWhen: 'Los tres campos de capital están llenos en la aplicación y sabes cuánto queda por enterar.',
    terms: ['capital-social', 'capital-suscrito', 'capital-enterado', 'capital-por-enterar', 'aporte-en-bienes'],
    pitfalls: [
      'Poner la misma cifra en los tres campos sin pensarlo. Si es verdad, perfecto; si no, estás declarando algo que no ocurrió.',
      'Aportar el notebook “de palabra”, sin documento. Después no hay forma de sostener que es un activo de la empresa.'
    ],
    sources: [{ label: 'Registro de Empresas y Sociedades', url: 'https://www.registrodeempresasysociedades.cl/' }]
  },
  {
    id: 'domicilio',
    phase: 'antes',
    title: 'Decidir dónde va a estar domiciliada',
    question: 'No tengo oficina. ¿Puedo crear una empresa igual?',
    why:
      'Sí. La empresa necesita un domicilio, que es una dirección legal, no necesariamente un lugar donde vayas todos los días. ' +
      'El domicilio determina dos cosas: ante qué oficina del SII estás y qué MUNICIPALIDAD te cobra la patente. No determina tu ' +
      'capital, ni tu capital propio tributario, ni el monto de la patente — sólo quién la cobra.',
    needs: ['Una dirección que puedas acreditar con un documento.'],
    decisions: [
      {
        question: '¿Qué tipo de domicilio?',
        options: [
          { label: 'Oficina virtual', whenItFits: 'No necesitas espacio físico. Contratas domicilio comercial a un tercero.', watchOut: 'No todas las municipalidades la aceptan igual para otorgar patente comercial. Pregunta ANTES de contratar.' },
          { label: 'Tu propia casa', whenItFits: 'Trabajas desde casa y el inmueble es tuyo o tienes autorización.', watchOut: 'Algunas comunas exigen informe de zonificación o limitan qué actividades se pueden ejercer en zona residencial.' },
          { label: 'Oficina arrendada', whenItFits: 'Necesitas espacio físico y equipo.', watchOut: 'El contrato de arriendo es la evidencia del domicilio; guárdalo.' },
          { label: 'Coworking', whenItFits: 'Espacio compartido con derecho a domicilio comercial.', watchOut: 'Confirma que el contrato incluya expresamente el uso como domicilio comercial.' }
        ],
        note:
          'Sea cual sea, el domicilio NO es capital. Tener oficina virtual no hace que tu capital sea cero ni que tu patente sea cero: ' +
          'la base de la patente sigue siendo el capital propio.'
      }
    ],
    doInApp: { view: 'empresa', label: 'Registrar domicilio, tipo y comuna' },
    formationStep: 'address',
    documents: [
      { name: 'Contrato de oficina virtual / arriendo / autorización del propietario', whoIssues: 'El proveedor o el dueño del inmueble', whyItMatters: 'Es lo que acredita el domicilio ante el SII y la municipalidad.' }
    ],
    doneWhen: 'Tienes un documento con una dirección, y sabes qué municipalidad te va a corresponder.',
    terms: ['oficina-virtual', 'domicilio-tributario'],
    pitfalls: [
      'Contratar la oficina virtual sin preguntar antes en la municipalidad si acepta ese domicilio para patente comercial.'
    ],
    sources: [{ label: 'Guía de oficina virtual del repositorio', url: 'docs/guides/OFICINA-VIRTUAL.md' }]
  },

  /* ------------------------------------------------- hacerla nacer ------ */
  {
    id: 'constituir',
    phase: 'nacer',
    title: 'Constituir la sociedad',
    question: '¿Dónde se “crea” la empresa?',
    why:
      'Hasta aquí la empresa no existe. Constituirla es el acto que la hace nacer jurídicamente. En Chile hay dos caminos: el ' +
      'Registro de Empresas y Sociedades (el llamado “Empresa en un día”, en línea y sin notario para los tipos societarios que ' +
      'cubre) o la vía tradicional ante notario con escritura pública e inscripción.',
    needs: [
      'Todo lo decidido en las etapas anteriores: tipo, socios, capital, objeto (a qué se va a dedicar) y domicilio.',
      'Clave única o firma electrónica avanzada, según el camino que uses.'
    ],
    decisions: [
      {
        question: '¿Por dónde constituyo?',
        options: [
          { label: 'Registro de Empresas y Sociedades (en línea)', whenItFits: 'Estructuras estándar. Es más rápido y barato.', watchOut: 'Usa estatutos tipo: si necesitas cláusulas particulares, puede no servirte.' },
          { label: 'Notaría (escritura pública)', whenItFits: 'Estatutos a medida o situaciones que el formulario en línea no cubre.', watchOut: 'Tiene costos notariales y de publicación.' }
        ]
      }
    ],
    doInApp: { view: 'constitucion', label: 'Marcar el trámite y guardar el certificado' },
    formationStep: 'res',
    documents: [
      { name: 'Estatuto de la sociedad', whoIssues: 'RES o notaría', whyItMatters: 'Es la fuente del capital social. Todo lo que dice la aplicación sobre capital societario sale de aquí.' },
      { name: 'Certificado de estatuto actualizado', whoIssues: 'RES', whyItMatters: 'Te lo van a pedir en el banco y en la municipalidad.' }
    ],
    doneWhen: 'Tienes el estatuto y el certificado, y la empresa aparece con su razón social.',
    terms: ['capital-social', 'spa'],
    pitfalls: ['Definir el objeto social demasiado estrecho y descubrir después que la actividad que quieres facturar no está incluida.'],
    sources: [{ label: 'Registro de Empresas y Sociedades', url: 'https://www.registrodeempresasysociedades.cl/' }]
  },
  {
    id: 'rut',
    phase: 'nacer',
    title: 'Obtener el RUT de la empresa',
    question: 'La empresa ya existe. ¿Ahora qué?',
    why:
      'La empresa necesita su propio número de identificación tributaria, distinto del tuyo. Sin RUT no puede facturar, no puede ' +
      'abrir cuenta bancaria y no puede hacer ningún trámite a su nombre.',
    needs: ['El estatuto y el certificado de la etapa anterior.'],
    doInApp: { view: 'constitucion', label: 'Registrar el RUT obtenido' },
    formationStep: 'rut',
    documents: [{ name: 'Cédula e-RUT', whoIssues: 'SII', whyItMatters: 'Identifica a la empresa en todos los trámites posteriores.' }],
    doneWhen: 'Tienes el e-RUT descargado y anotado en la ficha de la empresa.',
    terms: [],
    pitfalls: ['Confundir el RUT de la empresa con el tuyo al registrar operaciones. La aplicación valida el dígito verificador para ayudarte.'],
    sources: [{ label: 'SII — RUT e inicio de actividades', url: 'https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_8697.htm' }]
  },
  {
    id: 'inicio',
    phase: 'nacer',
    title: 'Hacer el inicio de actividades',
    question: '¿Qué es “inicio de actividades” y por qué importa tanto?',
    why:
      'Es la declaración ante el SII de que vas a empezar a realizar actividades económicas. Marca el comienzo de tu primer ' +
      'ejercicio: desde ese momento tienes obligaciones mensuales, aunque todavía no factures nada. También es lo que define que ' +
      'tu empresa sea “nueva” para efectos de la patente municipal del primer año.',
    needs: ['RUT de la empresa.', 'Domicilio acreditado.', 'Saber qué actividades económicas vas a declarar.'],
    doInApp: { view: 'capital', label: 'Anotar la fecha de inicio de actividades' },
    formationStep: 'start',
    documents: [{ name: 'Comprobante de inicio de actividades', whoIssues: 'SII', whyItMatters: 'Prueba la fecha desde la cual corren tus obligaciones.' }],
    doneWhen: 'Tienes el comprobante y la fecha registrada en la aplicación.',
    terms: ['patente-inicial', 'capital-base-patente'],
    pitfalls: [
      'Hacer el inicio de actividades y no volver a entrar al SII hasta que llega una multa. Desde este día hay F29 mensual, tengas o no ventas.'
    ],
    sources: [{ label: 'SII — Inicio de actividades', url: 'https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_8697.htm' }]
  },

  /* --------------------------------------------------- habilitarla ------ */
  {
    id: 'regimen',
    phase: 'habilitar',
    title: 'Elegir el régimen tributario',
    question: 'Me piden elegir un régimen y no sé qué significa ninguno.',
    why:
      'El régimen define cómo se calcula el impuesto de tu empresa y qué contabilidad tienes que llevar. También define cómo se ' +
      'determina tu capital propio tributario, que es la cifra que después usa la municipalidad para tu patente. No es un detalle ' +
      'administrativo: cambia números durante años.',
    needs: ['Una estimación de tus ingresos anuales.', 'Saber si vas a reinvertir utilidades o retirarlas.'],
    decisions: [
      {
        question: '¿Qué régimen?',
        options: [
          {
            label: 'Pro Pyme General (14 D N.º 3)',
            whenItFits: 'El más común para empresas pequeñas. Contabilidad simplificada y capital propio tributario simplificado.',
            watchOut: 'Es el perfil por defecto de esta aplicación, pero no significa que sea el que te corresponde.'
          },
          {
            label: 'Pro Pyme Transparente (14 D N.º 8)',
            whenItFits: 'La empresa no paga primera categoría; el resultado tributa directamente en los dueños.',
            watchOut: 'No determina el capital propio tributario simplificado. La aplicación lo dice en vez de aplicar la fórmula equivocada.'
          },
          {
            label: 'Régimen General semi integrado (14 A)',
            whenItFits: 'Empresas más grandes o estructuras complejas.',
            watchOut: 'Exige contabilidad completa y registros empresariales completos.'
          }
        ],
        note:
          'Esta es la decisión donde más se gana consultando a un contador, porque depende de tus ingresos proyectados, de si vas a ' +
          'retirar utilidades y de tu situación personal. La aplicación no la toma por ti.'
      }
    ],
    doInApp: { view: 'empresa', label: 'Declarar el régimen en la ficha' },
    formationStep: 'activities',
    documents: [{ name: 'Pantalla o certificado con actividades y régimen', whoIssues: 'SII', whyItMatters: 'Determina qué método usa la aplicación para calcular tu capital propio tributario.' }],
    doneWhen: 'El régimen está declarado en la ficha y coincide con lo que dice el SII.',
    terms: ['pro-pyme-general', 'pro-pyme-transparente', 'regimen-general', 'cpt-simplificado'],
    pitfalls: ['Dejar el régimen sin declarar en la aplicación: sin él, el capital propio tributario se calcula por el método general y puede no ser el tuyo.'],
    sources: [{ label: 'SII — Tipos de regímenes', url: 'https://www.sii.cl/destacados/modernizacion/tipos_regimenes_mt.html' }]
  },
  {
    id: 'dte',
    phase: 'habilitar',
    title: 'Habilitar la facturación electrónica',
    question: '¿Cómo cobro legalmente?',
    why:
      'En Chile los documentos tributarios son electrónicos. Para emitir una factura necesitas estar habilitado y tener un ' +
      'certificado digital. El SII ofrece un sistema de facturación gratuito, y también hay proveedores de mercado.',
    needs: ['RUT e inicio de actividades.', 'Un certificado digital a nombre del representante.'],
    decisions: [
      {
        question: '¿Con qué sistema facturas?',
        options: [
          { label: 'Sistema gratuito del SII', whenItFits: 'Volumen bajo de documentos. Sin costo.', watchOut: 'Tiene límites de volumen y menos funciones.' },
          { label: 'Proveedor de mercado', whenItFits: 'Más documentos o necesitas integración con otros sistemas.', watchOut: 'Tiene costo mensual.' }
        ]
      }
    ],
    doInApp: { view: 'operaciones', label: 'Registrar las facturas que emitas' },
    formationStep: 'dte',
    documents: [
      { name: 'Certificado digital vigente', whoIssues: 'Entidad certificadora autorizada', whyItMatters: 'Sin él no puedes firmar documentos electrónicos.' },
      { name: 'Primer documento emitido', whoIssues: 'Tú', whyItMatters: 'Confirma que la habilitación quedó operativa.' }
    ],
    doneWhen: 'Emitiste un documento de prueba o el primero real y lo registraste en la aplicación.',
    terms: ['dte', 'debito-fiscal', 'rcv'],
    pitfalls: ['Cobrar por transferencia sin emitir el documento. El ingreso existe igual y la falta del documento aparece después en el RCV.'],
    sources: [{ label: 'SII — Facturación electrónica', url: 'https://www1.sii.cl/factura_sii/factura_sii.htm' }]
  },
  {
    id: 'patente',
    phase: 'habilitar',
    title: 'Obtener la patente municipal',
    question: '¿Qué es la patente y cuánto voy a pagar?',
    why:
      'Es un tributo anual que cobra la municipalidad por ejercer una actividad. Se calcula sobre tu CAPITAL PROPIO, no sobre tus ' +
      'ventas ni sobre los metros cuadrados que ocupas. La ley fija la tasa entre 2,5‰ y 5‰, con un mínimo de 1 UTM y un máximo ' +
      'de 8.000 UTM, y cada municipalidad elige su tasa dentro de ese rango. Por eso esta aplicación no te dice una tasa: te pide ' +
      'que averigües la de tu comuna y la registres con su fuente.',
    needs: ['Domicilio acreditado.', 'Capital propio inicial declarado.', 'La tasa de tu comuna (pregúntala en la municipalidad).'],
    decisions: [
      {
        question: '¿Qué capital declaro para la patente?',
        options: [
          { label: 'Primer año: el capital propio inicial declarado', whenItFits: 'Siempre, cuando se trata de actividades nuevas.', watchOut: 'No es automáticamente “lo que puse en el estatuto”: es el capital propio inicial que declaras.' },
          { label: 'Años siguientes: el capital propio del cierre anterior', whenItFits: 'Desde el segundo ejercicio en adelante.', watchOut: 'Por eso la patente del año 2 casi nunca coincide con la del año 1.' }
        ],
        note: 'Las fechas de declaración y de pago de las cuotas varían; consúltalas con tu municipalidad.'
      }
    ],
    doInApp: { view: 'capital', label: 'Registrar comuna, tasa y ver el cálculo con su desglose' },
    formationStep: 'patent',
    documents: [
      { name: 'Rol de patente', whoIssues: 'Municipalidad', whyItMatters: 'Identifica tu patente para pagos posteriores.' },
      { name: 'Comprobante de pago', whoIssues: 'Municipalidad', whyItMatters: 'Es la única prueba de que está pagada. La aplicación no la da por pagada sola.' }
    ],
    doneWhen: 'Tienes el rol de patente y registraste la tasa de tu comuna en la aplicación con su fuente y fecha.',
    terms: ['patente-municipal', 'capital-base-patente', 'patente-inicial', 'utm', 'inversiones-deducibles'],
    pitfalls: [
      'Suponer que la patente se calcula sobre las ventas. Se calcula sobre el capital propio.',
      'Aceptar la cifra que muestra la aplicación como definitiva mientras la tasa siga marcada como no verificada.'
    ],
    sources: [{ label: 'D.L. 3.063 sobre Rentas Municipales, art. 24', url: 'https://www.bcn.cl/leychile/navegar?idNorma=6942' }]
  },
  {
    id: 'banco',
    phase: 'habilitar',
    title: 'Abrir la cuenta bancaria de la empresa',
    question: '¿Puedo usar mi cuenta personal?',
    why:
      'No conviene, y es el error que más desorden causa. La empresa es un patrimonio distinto del tuyo. Si mezclas las cuentas, ' +
      'reconstruir después qué fue gasto de la empresa, qué fue aporte tuyo y qué fue retiro se vuelve un trabajo de arqueología. ' +
      'Una cuenta a nombre de la empresa hace que la cartola sea, por sí sola, la mitad de tu contabilidad.',
    needs: ['RUT de la empresa.', 'Estatuto y certificado vigente.', 'Inicio de actividades.'],
    doInApp: { view: 'operaciones', label: 'Registrar los movimientos desde la cartola' },
    formationStep: 'bank',
    documents: [{ name: 'Contrato de cuenta y primera cartola', whoIssues: 'Tu banco', whyItMatters: 'La cartola es la evidencia de casi todo lo que ocurre después.' }],
    doneWhen: 'La empresa tiene cuenta propia y ahí depositaste el capital.',
    terms: ['conciliacion', 'evidencia'],
    pitfalls: ['Pagar gastos de la empresa con la tarjeta personal “por ahora”. Cada uno de esos pagos habrá que explicarlo después.'],
    sources: []
  },

  /* ---------------------------------------------------- operar ---------- */
  {
    id: 'registrar',
    phase: 'operar',
    title: 'Registrar lo que pasa, el día que pasa',
    question: 'Ya estoy operando. ¿Qué tengo que anotar?',
    why:
      'Todo movimiento de dinero, y algunos que no mueven dinero. La regla práctica es: si hay un documento, hay algo que registrar. ' +
      'Hacerlo el mismo día toma un minuto; hacerlo a fin de mes toma una tarde y se cometen errores, porque ya no te acuerdas de ' +
      'qué era ese pago.',
    needs: ['El documento de cada operación: factura, boleta, contrato, cartola.'],
    decisions: [
      {
        question: 'Entró dinero del dueño. ¿Qué fue?',
        options: [
          { label: 'Aporte de capital', whenItFits: 'Le pones plata a la empresa y no esperas que te la devuelva.', watchOut: 'Sube el patrimonio y el capital enterado.' },
          { label: 'Préstamo del accionista', whenItFits: 'Le prestas plata y la empresa te la va a devolver.', watchOut: 'Es una DEUDA de la empresa contigo. Baja tu capital propio tributario, al revés que un aporte.' },
          { label: 'Ingreso operacional', whenItFits: 'En realidad la empresa te prestó un servicio y le estás pagando.', watchOut: 'Es una venta: lleva documento y puede llevar IVA.' }
        ],
        note:
          'En la cartola del banco las tres se ven exactamente igual: un depósito. En el balance, en el capital propio tributario y en ' +
          'la patente, son distintas. Por eso la aplicación te obliga a elegir en vez de suponer que todo es capital.'
      },
      {
        question: 'Pagaste algo. ¿Es gasto de la empresa?',
        options: [
          { label: 'Gasto del giro', whenItFits: 'Necesario para producir la renta: servidores, dominio, software, servicios contables.', watchOut: 'Marca las dos casillas que corresponda: IVA con derecho a crédito y gasto deducible. No siempre van juntas.' },
          { label: 'Gasto personal pagado con la cuenta de la empresa', whenItFits: 'Ocurre. Regístralo como lo que es.', watchOut: 'Su IVA no es recuperable y su monto no rebaja el impuesto. Si es para ti, probablemente sea un retiro.' },
          { label: 'Retiro', whenItFits: 'Sacas dinero de la empresa para ti.', watchOut: 'Reduce el patrimonio, NO es gasto y no rebaja impuesto. Además se resta al calcular tu capital propio tributario.' }
        ]
      }
    ],
    doInApp: { view: 'operaciones', label: 'Registrar una operación' },
    documents: [
      { name: 'Facturas emitidas y recibidas', whoIssues: 'Tú y tus proveedores', whyItMatters: 'Son la base del IVA y del gasto.' },
      { name: 'Boletas de honorarios recibidas', whoIssues: 'Quien te presta el servicio', whyItMatters: 'Llevan retención que TÚ tienes que enterar.' },
      { name: 'Cartola bancaria mensual', whoIssues: 'Tu banco', whyItMatters: 'Permite comprobar que no falta nada.' }
    ],
    doneWhen: 'Cada movimiento del mes está registrado con su documento, y la aplicación no marca operaciones “sin respaldo”.',
    terms: ['gasto-deducible', 'credito-fiscal', 'aporte-de-capital', 'prestamo-del-accionista', 'retiro', 'evidencia'],
    pitfalls: [
      'Registrar todo lo que pone el dueño como capital. Es el error que más distorsiona el capital propio tributario.',
      'Olvidar la retención de una boleta de honorarios: el prestador cobra su líquido y la empresa queda debiendo la retención.'
    ],
    sources: [{ label: 'SII — Registro de Compras y Ventas', url: 'https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_6979.htm' }]
  },
  {
    id: 'mes',
    phase: 'operar',
    title: 'Cerrar el mes: IVA, PPM y F29',
    question: '¿Qué tengo que hacer todos los meses?',
    why:
      'Cada mes se declara el F29, que reúne el IVA, el PPM y las retenciones. El IVA que cobraste en tus ventas (débito) menos el ' +
      'IVA que pagaste en tus compras (crédito) da lo que tienes que enterar. Si el crédito supera al débito no se pierde: queda ' +
      'como remanente para el mes siguiente, y esta aplicación lo arrastra sola.',
    needs: ['Todas las operaciones del mes registradas.', 'El RCV del SII para comparar.', 'La cartola del mes.'],
    doInApp: { view: 'impuestos', label: 'Ver el borrador del F29' },
    documents: [
      { name: 'Comprobante de declaración del F29', whoIssues: 'SII', whyItMatters: 'Es lo único que prueba que declaraste. La aplicación no declara por ti.' },
      { name: 'Comprobante de pago', whoIssues: 'SII / banco', whyItMatters: 'Declarar y pagar son dos cosas distintas.' }
    ],
    doneWhen:
      'Comparaste el borrador con la propuesta del SII, presentaste en el portal, guardaste el folio en Obligaciones y cerraste el período en la aplicación.',
    terms: ['f29', 'debito-fiscal', 'credito-fiscal', 'remanente-credito-fiscal', 'ppm', 'conciliacion'],
    pitfalls: [
      'Creer que la aplicación declara. No lo hace: calcula y controla. La declaración ocurre en el portal del SII.',
      'No declarar los meses sin movimiento. La obligación existe igual desde el inicio de actividades.'
    ],
    sources: [{ label: 'SII — Declaración mensual F29', url: 'https://www.sii.cl/servicios_online/1042-3264.html' }]
  },

  /* ---------------------------------------------------- cerrar el año --- */
  {
    id: 'anual',
    phase: 'anual',
    title: 'Cerrar el año y determinar el capital propio tributario',
    question: '¿Qué pasa a fin de año?',
    why:
      'Al 31 de diciembre se hace un corte. Se determinan los activos, los pasivos, el patrimonio y —lo más importante para lo que ' +
      'viene— el CAPITAL PROPIO TRIBUTARIO. Esa cifra se declara en el F22 y es la que después usa la municipalidad como base de tu ' +
      'patente del año siguiente. El cierre queda congelado: es una fotografía que se puede revisar años después.',
    needs: ['Todos los meses del año cerrados.', 'Activos y pasivos reales, si los conoces mejor que la estimación de la aplicación.'],
    doInApp: { view: 'capital', label: 'Cerrar el ejercicio y ver el CPT con su desglose' },
    documents: [
      { name: 'F22 presentado', whoIssues: 'SII', whyItMatters: 'El capital propio tributario que rige es el que declaras ahí, no el que estima la aplicación.' },
      { name: 'Declaraciones juradas', whoIssues: 'SII', whyItMatters: 'Su omisión tiene multas propias.' },
      { name: 'Expediente anual', whoIssues: 'Esta aplicación', whyItMatters: 'Reúne cifras, reglas usadas, fuentes y evidencias del ejercicio en un solo archivo.' }
    ],
    doneWhen: 'El ejercicio está cerrado en la aplicación, presentaste el F22 y exportaste el expediente anual.',
    terms: ['cierre-anual', 'cpt', 'cpt-simplificado', 'f22', 'dj', 'expediente-anual'],
    pitfalls: [
      'Tratar el capital propio tributario como si fuera el capital que pusiste al constituir. Después de un año de operación ya no se parecen.',
      'Presentar el F22 sin haber cerrado los meses: los números no van a cuadrar.'
    ],
    sources: [{ label: 'SII — Operación Renta', url: 'https://www.sii.cl/servicios_online/renta/guia_trib_suplemento_2026.html' }]
  },
  {
    id: 'siguiente',
    phase: 'anual',
    title: 'El año 2 en adelante',
    question: '¿Y ahora empieza todo de nuevo?',
    why:
      'Casi. La diferencia importante es que ya no eres una empresa nueva. La base de tu patente municipal deja de ser el capital que ' +
      'declaraste al iniciar y pasa a ser tu capital propio tributario del cierre anterior. Si tuviste un buen año y no retiraste, esa ' +
      'base sube; si tuviste pérdidas o retiraste, baja. El cierre de un año es la apertura del siguiente.',
    needs: ['El cierre del año anterior hecho.'],
    doInApp: { view: 'capital', label: 'Ver el historial año por año' },
    documents: [
      { name: 'Declaración de capital propio a la municipalidad', whoIssues: 'Tú', whyItMatters: 'El SII pone el capital propio declarado a disposición de las municipalidades en mayo de cada año.' }
    ],
    doneWhen: 'Puedes explicar por qué la patente de este año es distinta de la del año pasado.',
    terms: ['capital-base-patente', 'cpt', 'cierre-anual'],
    pitfalls: ['Suponer que la patente será la misma que el año pasado y no presupuestarla.'],
    sources: [{ label: 'D.L. 3.063, art. 24', url: 'https://www.bcn.cl/leychile/navegar?idNorma=6942' }]
  }
]);

/**
 * Qué modela el sistema y qué no.
 *
 * Existe porque la pregunta “¿están todas las alternativas posibles?” tiene una
 * respuesta honesta que es NO, y esconderla haría que alguien confíe en una
 * cobertura que no existe. Un vacío declarado se puede trabajar; uno silencioso
 * se descubre tarde.
 */
export const COVERAGE = Object.freeze({
  covered: [
    'SpA, con uno o varios accionistas, incluido el accionista único al 100 %.',
    'Domicilio propio, arrendado, coworking y oficina virtual.',
    'Capital en dinero y en bienes, con capital suscrito parcialmente enterado.',
    'Aportes, aumentos y disminuciones de capital, préstamos del accionista y sus devoluciones, retiros.',
    'Ventas, compras, gastos, honorarios pagados y pagos de impuestos.',
    'IVA con remanente arrastrado entre períodos, PPM y borrador del F29.',
    'Capital propio tributario por el art. 41 y por el método simplificado Pro Pyme.',
    'Patente municipal de empresa nueva y de empresa en funcionamiento, con deducciones y prorrateo entre sucursales.',
    'Cierre mensual y cierre anual con expediente exportable.'
  ],
  notCovered: [
    {
      what: 'Trabajadores y remuneraciones',
      why: 'No hay liquidaciones de sueldo, cotizaciones previsionales ni Libro de Remuneraciones. Si contratas, vas a necesitar otra herramienta para eso.'
    },
    {
      what: 'Comercio exterior',
      why: 'Importaciones, exportaciones y sus regímenes de IVA no están modelados.'
    },
    {
      what: 'Existencias e inventario',
      why: 'La aplicación está pensada para servicios. Si vendes productos físicos, el costo de venta y el inventario no se llevan aquí.'
    },
    {
      what: 'Activo fijo y depreciación',
      why: 'Un bien aportado se registra con sus valores, pero no hay tabla de depreciación contable ni tributaria.'
    },
    {
      what: 'Corrección monetaria',
      why: 'La revalorización del art. 41 de la LIR no se aplica: el capital propio tributario que calcula es nominal.'
    },
    {
      what: 'Reorganizaciones empresariales',
      why: 'División, fusión, transformación y conversión no están modeladas.'
    },
    {
      what: 'Registros empresariales completos (RAI, DDAN, REX, SAC)',
      why: 'Necesarios en el Régimen General. Aquí sólo se cubre lo que exige el Pro Pyme.'
    },
    {
      what: 'Término de giro',
      why: 'El cierre definitivo de la empresa no tiene módulo propio todavía.'
    },
    {
      what: 'Conexión con el SII o con municipalidades',
      why: 'No existe y no se simula. Todo dato entra a mano o por importación, y la aplicación distingue el origen de cada uno.'
    },
    {
      what: 'Tasas de patente por comuna',
      why: 'No se publican porque no hay una tasa nacional: cada municipalidad fija la suya. Tienes que averiguar la tuya y registrarla.'
    }
  ],
  principle:
    'Cuando una situación depende de interpretación, de tus antecedentes o de reglas municipales que no están disponibles, la ' +
    'aplicación lo dice —“requiere verificación con fuente oficial, municipalidad o profesional tributario”— en vez de resolverlo sola.'
});

/** Preguntas frecuentes de quien recién parte, con la etapa donde se responden. */
export const FIRST_QUESTIONS = Object.freeze([
  { question: 'No sé por dónde empezar.', stage: 'decidir' },
  { question: '¿Cuánto capital tengo que poner?', stage: 'capital' },
  { question: '¿Puedo crear una empresa sin oficina?', stage: 'domicilio' },
  { question: '¿Dónde se crea la empresa?', stage: 'constituir' },
  { question: 'Me piden elegir un régimen tributario y no entiendo ninguno.', stage: 'regimen' },
  { question: '¿Cómo cobro legalmente?', stage: 'dte' },
  { question: '¿Cuánto voy a pagar de patente?', stage: 'patente' },
  { question: '¿Puedo usar mi cuenta personal?', stage: 'banco' },
  { question: 'Le puse plata a la empresa. ¿Eso es capital?', stage: 'registrar' },
  { question: '¿Qué tengo que hacer todos los meses?', stage: 'mes' },
  { question: '¿Qué pasa a fin de año?', stage: 'anual' },
  { question: '¿Por qué la patente del año 2 es distinta?', stage: 'siguiente' }
]);

const BY_ID = new Map(STAGES.map(s => [s.id, s]));

/** Una etapa por su id. */
export function stage(id) {
  return BY_ID.get(String(id)) ?? null;
}

/** Etapas agrupadas por fase, en el orden declarado en `PHASES`. */
export function stagesByPhase() {
  return PHASES.map(phase => ({ ...phase, stages: STAGES.filter(s => s.phase === phase.id) })).filter(p => p.stages.length > 0);
}

/** Referencias declaradas que no existen: fases, etapas o vistas mal escritas. */
export function danglingReferences({ views = [], glossaryIds = null, formationSteps = null } = {}) {
  const phases = new Set(PHASES.map(p => p.id));
  const missing = [];

  for (const s of STAGES) {
    if (!phases.has(s.phase)) missing.push(`${s.id}.phase → ${s.phase}`);
    if (views.length && s.doInApp && !views.includes(s.doInApp.view)) missing.push(`${s.id}.doInApp.view → ${s.doInApp.view}`);
    if (formationSteps && s.formationStep && !formationSteps.includes(s.formationStep)) {
      missing.push(`${s.id}.formationStep → ${s.formationStep}`);
    }
    if (glossaryIds) {
      for (const t of s.terms ?? []) if (!glossaryIds.includes(t)) missing.push(`${s.id}.terms → ${t}`);
    }
  }
  for (const q of FIRST_QUESTIONS) {
    if (!BY_ID.has(q.stage)) missing.push(`FIRST_QUESTIONS → ${q.stage}`);
  }
  return missing;
}
