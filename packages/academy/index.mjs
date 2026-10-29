/**
 * Academia práctica embarcada en Web, Windows y Android.
 *
 * Cada lección debe poder enseñar sin depender de `curriculum/`, de GitHub ni
 * de una conexión. Los datos son texto plano: la vista decide cómo renderizar
 * y escapa todo por defecto.
 */

export const ACADEMY_VERSION = 1;

export const ACADEMY_MODULES = Object.freeze([
  { id: 'fundamentos', title: '1 · Fundamentos', description: 'Leer hechos, documentos y asientos sin memorizar fórmulas.' },
  { id: 'operacion-mensual', title: '2 · Operación mensual', description: 'Ventas, compras, honorarios, F29, banco y caja.' },
  { id: 'capital-cierre', title: '3 · Capital y cierres', description: 'Separar patrimonio, cerrar períodos y conectar un año con el siguiente.' },
  { id: 'continuidad', title: '4 · Continuidad y crisis', description: 'Inactividad, liquidez y escalamiento sin conclusiones legales automáticas.' }
]);

const SII = 'https://www.sii.cl/';
const RES = 'https://www.registrodeempresasysociedades.cl/';
const SUPERIR = 'https://www.superir.gob.cl/';

export const ACADEMY_LESSONS = Object.freeze([
  {
    id: 'A01',
    module: 'fundamentos',
    title: 'Del hecho a la evidencia: qué estás registrando realmente',
    durationMinutes: 12,
    level: 'Inicial',
    goal: 'Distinguir el hecho económico, su documento, el registro contable y la evidencia de cumplimiento.',
    concepts: ['hecho económico', 'documento', 'registro', 'evidencia'],
    sections: [
      {
        title: 'Cuatro capas que no deben confundirse',
        paragraphs: [
          'El hecho económico es lo que ocurrió: prestaste un servicio, compraste un equipo o pagaste una deuda. El documento describe o respalda ese hecho, pero no lo reemplaza.',
          'El registro contable traduce el hecho a cuentas y montos. La evidencia permite que otra persona reconstruya la decisión: documento, fecha, contraparte, pago, conciliación y comprobante oficial cuando corresponda.'
        ]
      },
      {
        title: 'Por qué una cartola no basta',
        paragraphs: [
          'Una transferencia de $300.000 sólo demuestra que se movió dinero. No dice si fue una venta, un aporte, un préstamo del accionista, la devolución de una deuda o un error.',
          'Clasificar por el movimiento bancario sin revisar su causa produce cifras plausibles pero falsas. Primero identifica la naturaleza; después registra; al final concilia el registro con banco y documento.'
        ]
      },
      {
        title: 'Regla práctica',
        paragraphs: [
          'Pregúntate: ¿qué ocurrió?, ¿qué lo prueba?, ¿qué cuentas cambian?, ¿qué obligación afecta? Si una respuesta falta, el registro está pendiente de verificación, no listo.'
        ]
      }
    ],
    workedExample: {
      title: 'Cliente deposita $595.000',
      scenario: 'La empresa emitió una factura por $500.000 netos más IVA y el cliente pagó el total.',
      steps: [
        'Hecho: se prestó y cobró un servicio; no fue un aporte de capital.',
        'Documento: factura electrónica por neto $500.000, IVA $95.000 y total $595.000.',
        'Registro: aumenta Banco por $595.000, Ingresos por $500.000 e IVA débito por $95.000.',
        'Evidencia: factura, aceptación o respaldo del servicio, cartola y conciliación con el RCV.'
      ],
      conclusion: 'El depósito y el ingreso no son sinónimos: $95.000 corresponden a IVA recargado, no a ingreso propio.'
    },
    practice: {
      prompt: 'Recibiste $1.000.000 del accionista sin descripción.',
      tasks: [
        'Enumera al menos tres naturalezas posibles del depósito.',
        'Indica qué documento pedirías antes de registrarlo.',
        'Explica por qué no debe clasificarse automáticamente como venta o capital.'
      ]
    },
    check: {
      question: '¿Qué prueba por sí sola una transferencia bancaria?',
      options: ['La naturaleza tributaria del movimiento', 'Sólo que el dinero se movió entre cuentas', 'Que existe una venta afecta a IVA'],
      correctIndex: 1,
      explanation: 'La cartola prueba el movimiento de caja; la naturaleza se determina con el hecho y sus documentos.'
    },
    evidence: ['Documento que origina el hecho', 'Comprobante de pago o cobro', 'Conciliación entre documento, registro y banco'],
    appAction: { view: 'operaciones', label: 'Practicar en Operaciones', instruction: 'Abre SANDBOX y registra una venta describiendo el documento que la respalda.' },
    sources: [{ title: 'Servicio de Impuestos Internos', url: SII }]
  },
  {
    id: 'A02',
    module: 'fundamentos',
    title: 'Partida doble sin recetas: qué cambia y por qué',
    durationMinutes: 15,
    level: 'Inicial',
    goal: 'Construir un asiento desde los cambios en activos, pasivos y patrimonio.',
    concepts: ['activo', 'pasivo', 'patrimonio', 'debe', 'haber'],
    sections: [
      {
        title: 'La ecuación antes que las palabras Debe y Haber',
        paragraphs: [
          'Activo es lo que la empresa controla; pasivo, lo que debe; patrimonio, la parte residual de los propietarios. La relación básica es Activo = Pasivo + Patrimonio.',
          'Debe y Haber son lados del registro, no significan bueno/malo ni entrada/salida. Un activo normalmente aumenta al Debe; un pasivo, un ingreso o el patrimonio normalmente aumentan al Haber.'
        ]
      },
      {
        title: 'Un asiento cuenta una historia',
        paragraphs: [
          'Si compras un computador al contado, aumenta Equipos y disminuye Banco. Si lo compras a crédito, aumenta Equipos y también Proveedores. El objeto es el mismo; la forma de financiarlo cambia la segunda cuenta.',
          'Un asiento está completo cuando la suma del Debe coincide con la suma del Haber y su explicación coincide con el hecho real.'
        ]
      },
      {
        title: 'Cómo revisar',
        paragraphs: [
          'Nombra primero las cuentas afectadas, decide si cada una aumenta o disminuye y recién después ubícala en Debe o Haber. Si partes memorizando posiciones, es fácil registrar bien una operación distinta.'
        ]
      }
    ],
    workedExample: {
      title: 'Compra de equipo a crédito por $1.190.000',
      scenario: 'Equipo del giro por $1.000.000 netos y $190.000 de IVA, pagadero al proveedor el próximo mes.',
      steps: [
        'Equipos aumenta $1.000.000: Debe.',
        'IVA crédito elegible aumenta $190.000: Debe, sujeto a documento y requisitos.',
        'Proveedores aumenta $1.190.000: Haber.',
        'Control: Debe $1.190.000 = Haber $1.190.000; Banco todavía no cambia.'
      ],
      conclusion: 'Comprar no siempre significa pagar en el mismo momento; devengo y caja deben poder separarse.'
    },
    practice: {
      prompt: 'La empresa paga al proveedor del ejemplo el mes siguiente.',
      tasks: ['Identifica las dos cuentas que cambian.', 'Indica cuál disminuye y en qué lado se registra.', 'Comprueba que el pago no vuelve a crear el gasto o el activo.']
    },
    check: {
      question: '¿Qué ocurre al pagar una deuda ya registrada con un proveedor?',
      options: ['Se reconoce otra vez la compra', 'Disminuyen Banco y Proveedores', 'Aumentan Banco e Ingresos'],
      correctIndex: 1,
      explanation: 'El hecho de compra ya se reconoció. El pago cancela caja y deuda, sin duplicar el activo o gasto.'
    },
    evidence: ['Factura o documento de compra', 'Condición de pago', 'Asiento de devengo', 'Comprobante del pago posterior'],
    appAction: { view: 'academia', label: 'Revisar ejemplo de venta', instruction: 'Compara el asiento de venta visible arriba con el ejemplo de compra de esta lección.' },
    sources: [{ title: 'SII · información para contribuyentes', url: SII }]
  },
  {
    id: 'A03',
    module: 'operacion-mensual',
    title: 'Venta afecta: neto, IVA, total y cobranza',
    durationMinutes: 14,
    level: 'Inicial',
    goal: 'Separar ingreso, IVA débito y cuenta por cobrar desde una venta afecta.',
    concepts: ['venta neta', 'IVA débito', 'DTE', 'cuentas por cobrar'],
    sections: [
      {
        title: 'Tres montos, tres significados',
        paragraphs: [
          'El neto remunera la venta; el IVA se recarga al cliente; el total es lo que el cliente debe pagar. Sumar todo como ingreso infla el resultado y esconde la obligación de IVA.',
          'La factura y el cobro pueden ocurrir en fechas distintas. Al emitir nace la cuenta por cobrar; al pagar el cliente, esa cuenta se transforma en Banco.'
        ]
      },
      {
        title: 'Documento y período',
        paragraphs: [
          'El DTE identifica folio, fecha, receptor y montos. La fecha del documento y las reglas aplicables determinan el período tributario; la fecha del depósito no debe mover arbitrariamente la venta a otro mes.',
          'La aplicación ayuda a controlar, pero la conciliación final se hace contra los registros y propuestas oficiales.'
        ]
      },
      {
        title: 'Error frecuente',
        paragraphs: ['Registrar sólo el depósito deja fuera las ventas pendientes de cobro y puede mezclar anticipos, préstamos o aportes con ingresos.']
      }
    ],
    workedExample: {
      title: 'Factura por $800.000 netos',
      scenario: 'Servicio afecto; el cliente paga diez días después.',
      steps: [
        'Calcula IVA: $800.000 × 19% = $152.000.',
        'Total por cobrar: $952.000.',
        'Al emitir: Debe Clientes $952.000; Haber Ingresos $800.000 e IVA débito $152.000.',
        'Al cobrar: Debe Banco $952.000; Haber Clientes $952.000.'
      ],
      conclusion: 'El cobro cancela la cuenta por cobrar; no crea una segunda venta.'
    },
    practice: {
      prompt: 'Emite dos facturas: una cobrada y otra pendiente.',
      tasks: ['Calcula neto, IVA y total por separado.', 'Determina el saldo de Clientes.', 'Concilia el único depósito con la factura correspondiente.']
    },
    check: {
      question: '¿Cuál es el ingreso de una factura por $1.190.000 total con IVA 19%?',
      options: ['$1.190.000', '$1.000.000', '$190.000'],
      correctIndex: 1,
      explanation: 'El total incluye $190.000 de IVA débito. El ingreso neto es $1.000.000.'
    },
    evidence: ['DTE emitido', 'Respaldo de la prestación', 'Estado de aceptación o reclamo cuando corresponda', 'Cartola y conciliación'],
    appAction: { view: 'operaciones', label: 'Registrar una venta', instruction: 'Hazlo en SANDBOX y luego revisa el resumen del período.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A04',
    module: 'operacion-mensual',
    title: 'Compra, gasto e IVA crédito: cuatro preguntas distintas',
    durationMinutes: 16,
    level: 'Intermedio',
    goal: 'Evitar que una salida de dinero se convierta automáticamente en gasto deducible o IVA crédito.',
    concepts: ['compra', 'gasto deducible', 'IVA crédito', 'gasto personal'],
    sections: [
      {
        title: 'Pagar no decide el tratamiento',
        paragraphs: [
          'Una salida bancaria puede comprar un activo, pagar un gasto, cancelar una deuda, devolver un préstamo o financiar un consumo personal. El banco muestra caja; no decide contabilidad ni tributación.',
          'Para cada compra separa: relación con el giro, documento válido, derecho a IVA crédito y tratamiento del neto. Las respuestas pueden ser distintas.'
        ]
      },
      {
        title: 'IVA crédito y gasto deducible no son la misma casilla',
        paragraphs: [
          'Que el neto sea necesario para la actividad no prueba por sí solo el crédito fiscal; y tener una factura con IVA no vuelve deducible un consumo personal.',
          'Cuando falte evidencia o exista una exclusión posible, la clasificación correcta es pendiente de revisión, no “sí” por defecto.'
        ]
      },
      {
        title: 'Activo versus gasto',
        paragraphs: ['Un bien que prestará servicios durante varios períodos puede ser un activo y no un gasto inmediato. La forma de pago tampoco cambia esa naturaleza.']
      }
    ],
    workedExample: {
      title: 'Notebook de $1.190.000 y almuerzo personal de $59.500',
      scenario: 'Ambos se pagaron con la cuenta empresarial y ambos tienen comprobante.',
      steps: [
        'Notebook: verificar giro, factura, uso empresarial y si corresponde reconocer activo e IVA crédito.',
        'Almuerzo personal: separar del gasto empresarial; el pago desde Banco puede generar cuenta del accionista.',
        'No compensar ambos sólo porque salieron de la misma cuenta.',
        'Guardar la decisión y su respaldo; si hay duda tributaria, escalar al contador.'
      ],
      conclusion: 'El medio de pago no transforma un gasto personal en empresarial.'
    },
    practice: {
      prompt: 'Clasifica software anual, computador, multa y compra de supermercado personal.',
      tasks: ['Indica el hecho económico de cada uno.', 'Marca IVA crédito como sí/no/por verificar.', 'Distingue gasto, activo, cuenta del accionista o no deducible.']
    },
    check: {
      question: '¿Qué condición basta por sí sola para usar IVA crédito?',
      options: ['Haber pagado desde la cuenta empresa', 'Tener cualquier comprobante', 'Ninguna: hay que verificar documento, giro y exclusiones'],
      correctIndex: 2,
      explanation: 'El derecho no nace sólo del pago o de cualquier papel; requiere revisar las condiciones aplicables.'
    },
    evidence: ['Documento tributario', 'Justificación de relación con el giro', 'Recepción del bien o servicio', 'Decisión de clasificación'],
    appAction: { view: 'operaciones', label: 'Comparar dos compras', instruction: 'Registra una compra elegible y otra pendiente de verificación en SANDBOX.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A05',
    module: 'operacion-mensual',
    title: 'Honorarios: bruto, retención, líquido y obligación',
    durationMinutes: 12,
    level: 'Inicial',
    goal: 'Entender por qué el costo bruto, el pago líquido y la retención son cifras diferentes.',
    concepts: ['honorario bruto', 'retención', 'líquido', 'F29'],
    sections: [
      {
        title: 'Una obligación dividida en dos pagos',
        paragraphs: [
          'El bruto expresa el costo u honorario total. Una parte se paga al prestador y otra se retiene para enterarla según las reglas aplicables. Líquido más retención debe reconciliar con el bruto.',
          'Pagar sólo el líquido no extingue la parte retenida. Si no se registra, aparece después como diferencia o deuda.'
        ]
      },
      {
        title: 'La tasa tiene vigencia',
        paragraphs: [
          'No memorices una tasa para todos los años. La app carga la regla del período disponible y debe fallar si el año no está verificado.',
          'Antes de presentar, confirma emisor, fecha, obligación de retener, tasa y propuesta oficial.'
        ]
      },
      {
        title: 'Qué conciliar',
        paragraphs: ['Concilia la boleta, el pago líquido, la retención registrada y el formulario del período. Las cuatro piezas deben contar la misma historia.']
      }
    ],
    workedExample: {
      title: 'Boleta por $250.000 brutos en 2026',
      scenario: 'La app aplica la tasa verificada del año 2026 mostrada en la tarjeta superior.',
      steps: [
        'Parte del bruto: $250.000.',
        'Calcula la retención con la regla del año; en la demo 2026 resulta $38.125.',
        'Líquido: $211.875.',
        'Registra por separado el pago al prestador y la retención por enterar.'
      ],
      conclusion: 'El costo sigue siendo $250.000 aunque Banco disminuya inicialmente sólo por el líquido.'
    },
    practice: {
      prompt: 'Repite el cálculo con un bruto de $400.000 usando la tasa que muestra la app.',
      tasks: ['Calcula retención y líquido.', 'Explica qué saldo queda por pagar al fisco.', 'Enumera los comprobantes que cerrarían el circuito.']
    },
    check: {
      question: 'Si sólo pagaste el líquido al prestador, ¿qué queda pendiente?',
      options: ['Nada; el bruto desaparece', 'La retención por enterar y su evidencia', 'Una segunda boleta por la retención'],
      correctIndex: 1,
      explanation: 'La retención es una obligación separada del pago líquido.'
    },
    evidence: ['Boleta de honorarios', 'Comprobante del pago líquido', 'Registro de la retención', 'Comprobante oficial de declaración/pago'],
    appAction: { view: 'impuestos', label: 'Revisar efecto en Impuestos', instruction: 'Registra primero el honorario en SANDBOX y observa su efecto en el período.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A06',
    module: 'operacion-mensual',
    title: 'F29 y PPM: preparar no es presentar',
    durationMinutes: 18,
    level: 'Intermedio',
    goal: 'Construir un control mensual y reconocer qué parte sólo puede confirmar el portal oficial.',
    concepts: ['F29', 'IVA débito', 'IVA crédito', 'PPM', 'sin movimiento'],
    sections: [
      {
        title: 'El F29 reúne obligaciones distintas',
        paragraphs: [
          'El control mensual puede combinar IVA débito, crédito, remanente, PPM y retenciones. Cada componente nace de documentos y reglas distintas; por eso no se valida con un único total.',
          'El PPM es un anticipo anual calculado según la base y tasa aplicables; no es lo mismo que IVA ni prueba por sí solo que hubo utilidad.'
        ]
      },
      {
        title: 'Sin ventas no siempre significa sin movimiento',
        paragraphs: [
          'Compras, honorarios, remanentes u otros hechos pueden afectar el período aunque las ventas sean cero. La etiqueta “sin movimiento” exige revisar el perfil y las operaciones, no mirar sólo la facturación.',
          'Si falta el perfil tributario o una obligación concreta, la respuesta debe quedar como requiere verificación.'
        ]
      },
      {
        title: 'Límite de la aplicación',
        paragraphs: ['La app prepara y concilia un borrador. No entra al SII, no presenta, no paga y no transforma su cálculo en comprobante oficial.']
      }
    ],
    workedExample: {
      title: 'Mes con venta, compra y honorario',
      scenario: 'Venta neta $800.000, compra elegible neta $100.000 y honorario bruto $250.000.',
      steps: [
        'Reúne IVA débito de ventas e IVA crédito elegible de compras.',
        'Incorpora remanente anterior sólo si está respaldado y conciliado.',
        'Calcula PPM sobre la base definida por la regla vigente.',
        'Agrega la retención de honorarios y compara cada componente con el RCV y propuesta oficial.'
      ],
      conclusion: 'Un total correcto sin conciliación de componentes todavía no es una declaración verificada.'
    },
    practice: {
      prompt: 'Construye una carpeta mensual para un mes con cero ventas y una compra.',
      tasks: ['Decide por qué no puedes llamarlo sin movimiento automáticamente.', 'Lista los datos necesarios para clasificar F29.', 'Separa cálculo, presentación, pago y evidencia.']
    },
    check: {
      question: '¿Cuándo puede la app marcar el F29 como presentado?',
      options: ['Cuando el cálculo da cero', 'Cuando existe evidencia del acto realizado fuera de la app', 'Al registrar la primera venta'],
      correctIndex: 1,
      explanation: 'Calcular no equivale a presentar. El comprobante oficial respalda el cambio de estado.'
    },
    evidence: ['RCV y DTE del período', 'Cálculo y conciliación', 'Propuesta o datos oficiales revisados', 'Comprobante de presentación y pago cuando corresponda'],
    appAction: { view: 'impuestos', label: 'Abrir borrador F29', instruction: 'Usa SANDBOX y revisa qué componentes provienen de cada operación.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A07',
    module: 'operacion-mensual',
    title: 'Conciliación bancaria y flujo de caja: saldo no es explicación',
    durationMinutes: 15,
    level: 'Intermedio',
    goal: 'Conciliar movimientos y proyectar caja sin confundir liquidez con utilidad.',
    concepts: ['conciliación bancaria', 'flujo de caja', 'cuentas por cobrar', 'cuentas por pagar'],
    sections: [
      {
        title: 'Conciliar es explicar diferencias',
        paragraphs: [
          'El saldo del libro y el del banco pueden diferir por transferencias en tránsito, comisiones no registradas, cobros pendientes, errores o fechas de corte. Conciliar no consiste en forzar ambos números: consiste en identificar cada diferencia.',
          'Cada movimiento bancario debe vincularse a un hecho ya registrado o generar una tarea de investigación.'
        ]
      },
      {
        title: 'Caja versus resultado',
        paragraphs: [
          'Una empresa puede tener utilidad y no tener efectivo porque aún no cobra; también puede tener caja por un préstamo y estar perdiendo dinero. El origen del saldo importa tanto como el monto.',
          'Proyectar caja usa fechas esperadas de cobro y pago, no sólo ingresos y gastos contables.'
        ]
      },
      {
        title: 'Horizontes',
        paragraphs: ['Usa 6 meses para tensión inmediata y 12/24/36 para compromisos recurrentes, renovación y decisiones estructurales. Una reserva sugerida no debe presentarse como mínimo legal.']
      }
    ],
    workedExample: {
      title: 'Banco muestra $900.000; libro, $1.020.000',
      scenario: 'Hay un cheque o transferencia por $150.000 aún no reflejado y una comisión bancaria de $30.000 no registrada.',
      steps: [
        'Parte de ambos saldos en la misma fecha de corte.',
        'Identifica $150.000 en tránsito sin duplicar el pago.',
        'Registra o investiga la comisión de $30.000 con su comprobante.',
        'Después de ajustes explicados, ambos caminos llegan al mismo saldo conciliado.'
      ],
      conclusion: 'La diferencia deja de ser un número misterioso y se convierte en dos partidas con responsable y evidencia.'
    },
    practice: {
      prompt: 'Proyecta tres meses con una factura por cobrar, arriendo mensual y patente anual.',
      tasks: ['Ubica cada flujo en su fecha probable.', 'Crea un escenario de cobro atrasado.', 'Señala el primer mes con caja negativa y la acción previa requerida.']
    },
    check: {
      question: '¿Qué demuestra una caja alta?',
      options: ['Que existe utilidad', 'Que no hay deudas', 'Sólo que hay efectivo; falta explicar su origen y compromisos'],
      correctIndex: 2,
      explanation: 'La caja puede venir de ventas, capital o deuda y puede estar comprometida.'
    },
    evidence: ['Cartola completa', 'Mayor de Banco', 'Lista de partidas conciliatorias', 'Fechas y supuestos de proyección'],
    appAction: { view: 'continuidad', label: 'Proyectar continuidad', instruction: 'Usa los horizontes 6/12/24/36 y revisa los supuestos.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A08',
    module: 'capital-cierre',
    title: 'Capital, préstamo y retiro: el banco los hace parecer iguales',
    durationMinutes: 16,
    level: 'Intermedio',
    goal: 'Clasificar dinero entre accionista y empresa sin alterar falsamente patrimonio o resultado.',
    concepts: ['capital social', 'capital enterado', 'préstamo del accionista', 'retiro'],
    sections: [
      {
        title: 'Capital social, suscrito y enterado',
        paragraphs: [
          'El capital social proviene del estatuto; el suscrito es el compromiso asumido; el enterado es lo efectivamente aportado. Pueden coincidir, pero no son sinónimos.',
          'Un aporte en bienes necesita describir el bien, su valoración y quién aporta. No se vuelve dinero sólo por registrarlo como capital.'
        ]
      },
      {
        title: 'Préstamo del accionista',
        paragraphs: [
          'Si la empresa debe devolver el dinero, existe un pasivo. El depósito aumenta Banco y la deuda con el accionista; no aumenta capital enterado.',
          'La devolución cancela Banco y pasivo. Tratarla como gasto distorsiona el resultado.'
        ]
      },
      {
        title: 'Retiro',
        paragraphs: ['Un retiro personal reduce la relación patrimonial con el accionista; no se transforma en gasto necesario por salir desde la cuenta empresarial.']
      }
    ],
    workedExample: {
      title: 'Tres depósitos de $500.000',
      scenario: 'Uno paga capital suscrito, otro es un préstamo documentado y el tercero corresponde a una venta cobrada.',
      steps: [
        'Capital: aumenta Banco y capital enterado/patrimonio según la evidencia societaria.',
        'Préstamo: aumenta Banco y pasivo con accionista.',
        'Venta: aumenta Banco o cancela Clientes; reconoce ingreso e IVA según el documento.',
        'La cartola muestra tres abonos idénticos; la contabilidad muestra tres causas distintas.'
      ],
      conclusion: 'La clasificación nace del acuerdo y del hecho, no del signo positivo en el banco.'
    },
    practice: {
      prompt: 'El accionista paga una cuenta personal con la tarjeta de la empresa.',
      tasks: ['Explica por qué no es gasto automático.', 'Propón la cuenta que documenta la relación con el accionista.', 'Indica cómo se regularizaría sin ocultar el movimiento.']
    },
    check: {
      question: '¿Qué efecto tiene un préstamo del accionista recibido por la empresa?',
      options: ['Aumenta Banco y pasivo', 'Aumenta ingreso y utilidad', 'Aumenta capital social automáticamente'],
      correctIndex: 0,
      explanation: 'Existe obligación de devolver: es financiamiento mediante deuda, no ingreso ni reforma automática de capital.'
    },
    evidence: ['Estatuto y suscripción', 'Comprobante del aporte', 'Contrato o respaldo del préstamo', 'Acuerdo y trazabilidad de retiros'],
    appAction: { view: 'capital', label: 'Abrir Capital', instruction: 'Compara capital social, suscrito, enterado, patrimonio y movimientos del accionista.' },
    sources: [{ title: 'Registro de Empresas y Sociedades', url: RES }]
  },
  {
    id: 'A09',
    module: 'capital-cierre',
    title: 'Cierre mensual: congelar evidencia, no esconder pendientes',
    durationMinutes: 14,
    level: 'Intermedio',
    goal: 'Preparar un cierre reproducible y saber cuándo reabrirlo.',
    concepts: ['cierre mensual', 'conciliación', 'inmutabilidad', 'reapertura'],
    sections: [
      {
        title: 'Qué debe estar resuelto',
        paragraphs: [
          'Antes de cerrar, revisa documentos emitidos y recibidos, banco, cuentas por cobrar y pagar, impuestos, evidencia y partidas pendientes. Cerrar no convierte una diferencia en cero.',
          'Un pendiente conocido debe quedar descrito con responsable y acción; uno crítico puede impedir el cierre.'
        ]
      },
      {
        title: 'Por qué el cierre es inmutable',
        paragraphs: [
          'Si un período cerrado cambia silenciosamente, ya no puedes reproducir lo que se revisó o declaró. La instantánea protege la trazabilidad entre documentos, cálculo y decisión.',
          'Corregir exige reapertura con motivo, cambio explícito, nueva conciliación y rastro de auditoría.'
        ]
      },
      {
        title: 'Cierre no es presentación',
        paragraphs: ['Cerrar internamente ordena el expediente. No demuestra que un formulario se presentó o pagó; esa evidencia viene del organismo correspondiente.']
      }
    ],
    workedExample: {
      title: 'Aparece una factura después del cierre',
      scenario: 'Octubre fue cerrado; luego llega una factura recibida fechada en octubre.',
      steps: [
        'No la insertes a escondidas en el período cerrado.',
        'Determina con el contador el tratamiento correcto y la necesidad de reapertura o ajuste posterior.',
        'Si se reabre, registra el motivo y preserva la instantánea anterior.',
        'Recalcula, concilia y vuelve a cerrar con evidencia nueva.'
      ],
      conclusion: 'La corrección es auditable; la historia anterior no desaparece.'
    },
    practice: {
      prompt: 'Diseña tu checklist de cierre con cinco controles.',
      tasks: ['Incluye banco, documentos e impuestos.', 'Define qué hallazgo bloquea el cierre.', 'Indica qué comprobante queda por cada control.']
    },
    check: {
      question: '¿Qué debes hacer para cambiar un período cerrado?',
      options: ['Editarlo directamente', 'Reabrir con motivo y dejar rastro', 'Crear una empresa nueva'],
      correctIndex: 1,
      explanation: 'La reapertura explícita conserva la trazabilidad y obliga a revisar el cambio.'
    },
    evidence: ['Checklist firmado o responsable identificado', 'Conciliaciones', 'Instantánea del cierre', 'Motivo y bitácora de reapertura si existe'],
    appAction: { view: 'cierre', label: 'Abrir Cierre', instruction: 'Revisa qué controles están completos y cuáles requieren evidencia.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A10',
    module: 'capital-cierre',
    title: 'Cierre anual, CPT y patente: el año siguiente empieza aquí',
    durationMinutes: 18,
    level: 'Avanzado',
    goal: 'Distinguir patrimonio contable, Capital Propio Tributario y base municipal.',
    concepts: ['patrimonio contable', 'CPT', 'patente municipal', 'año comercial'],
    sections: [
      {
        title: 'Tres cálculos con propósitos distintos',
        paragraphs: [
          'El patrimonio contable resume activos menos pasivos bajo criterios contables. El CPT aplica reglas tributarias y puede requerir agregados, deducciones o un método específico según régimen.',
          'La patente municipal usa la base y reglas aplicables al período y comuna. Una empresa nueva no necesariamente usa la misma referencia que una empresa en funcionamiento.'
        ]
      },
      {
        title: 'La cadena entre ejercicios',
        paragraphs: [
          'El cierre de un año genera saldos y evidencia para el siguiente. Recalcular retrospectivamente con reglas nuevas rompería la historia; los períodos cerrados y las reglas vigentes deben conservarse.',
          'Si falta año, régimen, tasa municipal o fuente verificada, el cálculo debe detenerse o mostrarse como simulación.'
        ]
      },
      {
        title: 'Lo que no debe concluirse',
        paragraphs: ['Capital social, patrimonio, CPT y base de patente pueden ser diferentes. Ninguno debe copiarse a otro campo sólo para completar el formulario.']
      }
    ],
    workedExample: {
      title: 'Capital social $3.000.000; patrimonio $6.806.600; CPT $6.200.000',
      scenario: 'La empresa demo operó, mantuvo utilidades, recibió un préstamo y adquirió obligaciones.',
      steps: [
        'Conserva $3.000.000 como dato societario del estatuto.',
        'Obtén patrimonio desde activos y pasivos contables.',
        'Determina CPT con el método y ajustes tributarios aplicables.',
        'Calcula patente sólo con período, base, comuna, tasa y fuente identificados.'
      ],
      conclusion: 'Que los números sean distintos es esperable; lo importante es explicar el origen de cada uno.'
    },
    practice: {
      prompt: 'Explica la diferencia entre una empresa nueva y su segundo año.',
      tasks: ['Identifica qué cifra proviene del estatuto.', 'Indica qué cierre alimenta el año siguiente.', 'Enumera los datos que no pueden adivinarse para la patente.']
    },
    check: {
      question: '¿Puede usarse siempre el capital social como base de patente?',
      options: ['Sí, porque está en el estatuto', 'No; depende de etapa, período y reglas verificadas', 'Sí, si la empresa no tiene trabajadores'],
      correctIndex: 1,
      explanation: 'La base aplicable cambia según la situación y no se deriva universalmente del capital social.'
    },
    evidence: ['Balance y cierre anual', 'Método y conciliación del CPT', 'Declaración o dato oficial aplicable', 'Certificado/tasa municipal con vigencia'],
    appAction: { view: 'capital', label: 'Comparar las cinco cifras', instruction: 'Abre la explicación de cada cálculo y revisa fuente, período y advertencias.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A11',
    module: 'continuidad',
    title: 'Sin clientes o sin ventas no significa sin obligaciones',
    durationMinutes: 15,
    level: 'Intermedio',
    goal: 'Clasificar meses inactivos sin inventar declaraciones ni cierres automáticos.',
    concepts: ['sin ingresos', 'sin movimiento', 'inactividad', 'requiere verificación'],
    sections: [
      {
        title: 'Primero define el estado real',
        paragraphs: [
          'Una sociedad constituida sin inicio de actividades no tiene el mismo perfil que una empresa con inicio, compras y cero ventas. Tampoco es igual no tener clientes que no tener movimientos.',
          'Compras, honorarios, arriendo, oficina virtual, cuenta bancaria, remanentes o deudas pueden mantener tareas activas.'
        ]
      },
      {
        title: 'Obligación por perfil, no por intuición',
        paragraphs: [
          'F29, F22 y declaraciones juradas deben clasificarse según inicio, régimen, operaciones y obligación concreta. Si el perfil está incompleto, el resultado correcto es requiere verificación.',
          'Un período vacío no autoriza a copiar obligaciones de otra empresa ni a declarar automáticamente sin movimiento.'
        ]
      },
      {
        title: 'Inactividad no disuelve la sociedad',
        paragraphs: ['Alertas por períodos sin operación o declaración requieren revisar condiciones y evidencia. No equivalen por sí solas a disolución societaria, liquidación o término tributario.']
      }
    ],
    workedExample: {
      title: 'Doce meses sin ventas, pero con oficina y banco',
      scenario: 'La empresa tiene inicio de actividades, paga oficina virtual y mantención bancaria, y no emitió ventas.',
      steps: [
        'No rotules los meses como vacíos: existen pagos y documentos.',
        'Revisa el perfil tributario y las obligaciones del período.',
        'Proyecta caja incluyendo costos recurrentes a 6/12/24/36 meses.',
        'Conserva evidencia y consulta el portal/profesional antes de omitir una declaración.'
      ],
      conclusion: 'Cero ventas describe una sola columna; no describe toda la actividad ni todas las obligaciones.'
    },
    practice: {
      prompt: 'Compara empresa constituida sin inicio versus empresa con inicio y cero ventas.',
      tasks: ['Lista la evidencia necesaria para distinguirlas.', 'Identifica qué obligaciones quedan no determinadas.', 'Explica qué costo sigue consumiendo caja.']
    },
    check: {
      question: '¿Cuándo puede afirmarse “sin movimiento”?',
      options: ['Cuando las ventas son cero', 'Cuando no hay clientes', 'Después de verificar operaciones y perfil; cero ventas no basta'],
      correctIndex: 2,
      explanation: 'Compras, honorarios, costos y remanentes pueden existir sin ventas.'
    },
    evidence: ['Estado de inicio de actividades', 'Perfil y régimen', 'Movimientos bancarios y documentos', 'Calendario de obligaciones revisado'],
    appAction: { view: 'continuidad', label: 'Evaluar inactividad', instruction: 'Completa el contexto y revisa alertas sin aceptar conclusiones automáticas.' },
    sources: [{ title: 'SII', url: SII }]
  },
  {
    id: 'A12',
    module: 'continuidad',
    title: 'Falta de caja, deuda e insolvencia: cuándo escalar',
    durationMinutes: 18,
    level: 'Avanzado',
    goal: 'Detectar tensión de liquidez, preparar evidencia y evitar diagnosticar quiebra automáticamente.',
    concepts: ['liquidez', 'deuda vencida', 'insolvencia', 'reorganización', 'liquidación'],
    sections: [
      {
        title: 'Una alerta financiera no es una sentencia legal',
        paragraphs: [
          'Caja insuficiente para pagar vencimientos es una alerta operativa. Insolvencia, reorganización, liquidación concursal, disolución societaria y término de giro son conceptos distintos con requisitos y autoridades diferentes.',
          'La cantidad de trabajadores o el tipo societario no prueban por sí solos elegibilidad para un procedimiento.'
        ]
      },
      {
        title: 'Qué medir antes de decidir',
        paragraphs: [
          'Ordena caja disponible, cobros probables, cuentas por pagar vencidas, impuestos, previsión, garantías, juicios y obligaciones de corto plazo. Proyecta escenarios, no una sola fecha ideal.',
          'Priorizar sin asesoría puede tener consecuencias legales. El sistema debe mostrar la tensión y preparar el expediente, no ejecutar pagos o solicitudes por el usuario.'
        ]
      },
      {
        title: 'Expediente mínimo',
        paragraphs: ['Reúne acreedores, montos, vencimientos, bienes, gravámenes, cartolas, carpeta tributaria, trabajadores, contratos y juicios. Marca lo no comprobado; no rellenes vacíos con supuestos.']
      }
    ],
    workedExample: {
      title: 'Caja $300.000 y pagos de $1.200.000 en siete días',
      scenario: 'Hay una factura por cobrar de $1.000.000 sin fecha confirmada y obligaciones tributarias vencidas.',
      steps: [
        'Registra brecha inmediata de $900.000 sin contar el cobro incierto como efectivo.',
        'Separa deuda vencida, deuda próxima y cobros no confirmados.',
        'Conserva contratos, vencimientos, comunicaciones y cartolas.',
        'Escala a contador/abogado o autoridad competente; no concluyas quiebra ni elegibilidad automática.'
      ],
      conclusion: 'La alerta es objetiva; el procedimiento adecuado requiere hechos completos y revisión profesional.'
    },
    practice: {
      prompt: 'Construye un escenario base, uno de cobro atrasado y uno sin cobro.',
      tasks: ['Calcula la caja mínima por semana.', 'Identifica el primer incumplimiento en cada escenario.', 'Lista las pruebas que entregarías al profesional.']
    },
    check: {
      question: '¿Qué puede concluir la app al detectar caja insuficiente y deuda vencida?',
      options: ['Que la empresa está legalmente en quiebra', 'Que existe riesgo y se requiere verificación/escalamiento', 'Que corresponde liquidación simplificada'],
      correctIndex: 1,
      explanation: 'Los datos sostienen una alerta de liquidez; no bastan para decidir un procedimiento legal.'
    },
    evidence: ['Caja y cartolas', 'Listado de acreedores y vencimientos', 'Impuestos y obligaciones laborales/previsionales', 'Bienes, gravámenes, contratos y juicios'],
    appAction: { view: 'continuidad', label: 'Preparar contingencia', instruction: 'Revisa caja, obligaciones vencidas y el expediente sin enviar nada automáticamente.' },
    sources: [
      { title: 'Superintendencia de Insolvencia y Reemprendimiento', url: SUPERIR },
      { title: 'SII', url: SII }
    ]
  }
]);

export function academyLesson(id) {
  return ACADEMY_LESSONS.find(lesson => lesson.id === id) ?? null;
}

export function academyLessonsByModule(moduleId) {
  return ACADEMY_LESSONS.filter(lesson => lesson.module === moduleId);
}

export function academyProgress(completedIds = []) {
  const known = new Set(ACADEMY_LESSONS.map(lesson => lesson.id));
  const completed = new Set(completedIds.filter(id => known.has(id)));
  const total = ACADEMY_LESSONS.length;
  return Object.freeze({
    completed: completed.size,
    total,
    percent: total ? Math.round((completed.size / total) * 100) : 0,
    remaining: total - completed.size
  });
}
