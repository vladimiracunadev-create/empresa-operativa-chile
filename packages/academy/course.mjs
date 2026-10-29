/**
 * Curso secuencial de 70 clases.
 *
 * El manifiesto conserva una frase nuclear por clase y la convierte, más abajo,
 * en una experiencia didáctica completa. La estructura compartida no rellena
 * contenido: obliga a que cada tema se observe, se razone, se practique, se
 * compruebe y produzca una evidencia revisable.
 */

const lesson = (id, title, outcome, explanation, example, practice, evidence, question, answer) =>
  Object.freeze({ id, title, outcome, explanation, example, practice, evidence, check: { question, answer } });

export const COURSE_MODULES = Object.freeze([
  {
    id: '00', slug: 'mentalidad-contable', title: 'Mentalidad contable',
    goal: 'Aprender a reconstruir hechos con documentos y no a memorizar nombres de cuentas.',
    classes: [
      lesson('C01', 'Qué resuelve la contabilidad', 'Explicar qué preguntas responde un sistema contable.', 'La contabilidad ordena qué tiene, debe, gana, gasta y mueve una empresa en un período. No sustituye contratos, declaraciones ni decisiones: los conecta para que una cifra pueda reconstruirse.', 'Una venta puede aumentar Clientes e Ingresos antes de que aumente Banco.', 'Toma cinco movimientos bancarios y escribe qué información falta para conocer su naturaleza.', ['hecho', 'fecha', 'documento', 'contraparte', 'registro'], '¿Un saldo bancario prueba utilidad?', 'No. Puede provenir de ventas, aportes o deuda y omite hechos aún no cobrados o pagados.'),
      lesson('C02', 'Documentos, hechos y evidencia', 'Separar hecho, documento, registro y evidencia.', 'El hecho es lo ocurrido; el documento lo describe; el registro traduce su efecto; la evidencia permite revisarlo. Una factura no prueba por sí sola recepción, pago o uso empresarial.', 'Factura de notebook + recepción + cartola + clasificación como activo forman un expediente más fuerte que la factura sola.', 'Construye la cadena documental de una compra y marca cada eslabón ausente.', ['documento origen', 'recepción', 'pago', 'conciliación'], '¿La cartola identifica automáticamente una venta?', 'No. Sólo prueba movimiento de dinero; la causa debe demostrarse.'),
      lesson('C03', 'Devengado vs percibido/pagado', 'Distinguir reconocimiento económico y movimiento de caja.', 'Devengar reconoce el derecho u obligación cuando nace; cobrar o pagar mueve efectivo. Mezclarlos esconde cuentas por cobrar y pagar y traslada resultados entre meses.', 'Factura emitida el 28 y cobrada el 10 siguiente: la venta y la cobranza son dos hechos enlazados.', 'Arma una línea de tiempo con emisión, recepción, vencimiento y pago de una factura.', ['factura', 'fecha de prestación', 'vencimiento', 'cartola'], '¿Pagar una factura crea nuevamente el gasto?', 'No. Cancela la deuda previamente reconocida.'),
      lesson('C04', 'Ciclo mensual y anual', 'Ubicar cada control en su frecuencia correcta.', 'El mes reúne documentos, banco, impuestos y cierre; el año conecta balances, renta y antecedentes del ejercicio siguiente. Un cierre mensual no sustituye el cierre anual ni una presentación oficial.', 'Doce cierres mensuales alimentan el análisis anual, pero una corrección de diciembre puede afectar el cierre y las declaraciones.', 'Dibuja el ciclo desde documento diario hasta cierre anual y asigna responsable a cada paso.', ['checklist mensual', 'cierres', 'comprobantes', 'balance anual'], '¿Un mes cerrado prueba que el F29 fue presentado?', 'No. Se necesita el comprobante oficial correspondiente.')
    ]
  },
  {
    id: '01', slug: 'formalizacion-y-perfil-tributario', title: 'Formalización y perfil tributario',
    goal: 'Entender qué datos definen a la empresa antes de calcular obligaciones.',
    classes: [
      lesson('C05', 'SpA unipersonal', 'Distinguir sociedad, accionista y administrador.', 'Una SpA con una persona accionista sigue siendo una persona jurídica separada. Propiedad, representación y uso del dinero requieren registros distintos; responsabilidad limitada no autoriza mezclar patrimonios.', 'La persona aporta $1.000.000: la empresa recibe capital, no ingreso por venta.', 'Enumera cuatro decisiones que deben quedar en estatuto o respaldo societario.', ['estatuto', 'acciones', 'poderes', 'aportes'], '¿La cuenta bancaria empresarial es dinero personal del accionista?', 'No. Los retiros y pagos personales requieren clasificación y evidencia.'),
      lesson('C06', 'RUT e inicio de actividades', 'Separar constitución, identificación e inicio tributario.', 'Constituir una sociedad no demuestra que inició actividades ni define todas sus obligaciones. Deben registrarse fechas, actividad, régimen y evidencia del estado ante la autoridad.', 'Sociedad constituida en enero e inicio en marzo: febrero no debe tratarse como un mes operativo por su sola existencia.', 'Construye una ficha con fecha de constitución, RUT, inicio, actividades y régimen; marca lo no verificado.', ['certificado de vigencia', 'RUT', 'acuse de inicio', 'actividades'], '¿La fecha de constitución reemplaza la de inicio?', 'No. Son hitos distintos con efectos distintos.'),
      lesson('C07', 'Oficina virtual y domicilio', 'Evaluar domicilio sin convertirlo en una garantía universal.', 'Una oficina virtual puede aportar contrato, recepción y domicilio, pero su aceptación depende del trámite y autoridad. No cambia capital, CPT ni base de patente por sí sola.', 'Contrato vigente en una comuna distinta del lugar de operación: hay que distinguir domicilio tributario, operación y competencia municipal.', 'Revisa un contrato ficticio y lista vigencia, servicios, dirección y evidencia de uso.', ['contrato', 'vigencia', 'comprobantes', 'aceptación de autoridad'], '¿Oficina virtual implica patente cero?', 'No. Domicilio y base de patente son dimensiones diferentes.'),
      lesson('C08', 'Régimen Pro Pyme', 'Reconocer que el régimen es un dato verificado, no una preferencia de cálculo.', 'El régimen condiciona métodos y obligaciones. La aplicación no debe asignarlo por tamaño aparente ni usar reglas de otro régimen cuando el perfil está incompleto.', 'Dos empresas con iguales ventas pueden tener situaciones distintas por composición, elección y requisitos.', 'Crea una lista de datos necesarios antes de habilitar un cálculo dependiente del régimen.', ['consulta de régimen', 'vigencia', 'actividad', 'antecedentes del contribuyente'], '¿Basta declarar “soy pyme” para aplicar un método?', 'No. Debe verificarse el régimen y las condiciones aplicables.')
    ]
  },
  {
    id: '02', slug: 'partida-doble', title: 'Partida doble',
    goal: 'Construir asientos desde cambios económicos y comprobar su equilibrio.',
    classes: [
      lesson('C09', 'Activo, pasivo y patrimonio', 'Clasificar recursos, obligaciones y parte residual.', 'Activo es lo controlado; pasivo, obligaciones; patrimonio, activo menos pasivo. Un préstamo aumenta activo y pasivo al mismo tiempo, por lo que no crea utilidad.', 'Préstamo bancario de $2.000.000: Banco +$2.000.000 y Deuda +$2.000.000.', 'Clasifica diez elementos y explica los dudosos en vez de forzar una categoría.', ['contratos', 'saldos', 'inventario', 'deudas'], '¿Un préstamo recibido aumenta patrimonio?', 'No por sí solo; aumenta caja y una obligación equivalente.'),
      lesson('C10', 'Debe y haber', 'Usar Debe/Haber después de identificar la cuenta y su cambio.', 'Debe y Haber son lados, no entrada y salida. Activos aumentan normalmente al Debe; pasivos, patrimonio e ingresos al Haber; las disminuciones invierten el lado.', 'Pago a proveedor: Debe Proveedores y Haber Banco.', 'Escribe cinco asientos y verifica suma Debe = suma Haber.', ['comprobante', 'cuentas afectadas', 'asiento balanceado'], '¿Todo abono bancario va al Haber de Ingresos?', 'No. Puede corresponder a capital, deuda, cobranza u otra naturaleza.'),
      lesson('C11', 'Ingresos y gastos', 'Separar resultado de caja, capital y deuda.', 'Ingreso aumenta resultado por la actividad; gasto lo reduce cuando corresponde. Aportes, préstamos y retiros no son ingresos o gastos por el solo movimiento de dinero.', 'Un retiro de $100.000 reduce Banco y la cuenta patrimonial del accionista, no crea gasto operativo.', 'Clasifica venta, aporte, préstamo, arriendo, retiro y devolución de préstamo.', ['documento', 'propósito', 'beneficiario', 'clasificación'], '¿Un pago personal con tarjeta empresa es gasto?', 'No automáticamente; debe separarse y regularizarse.'),
      lesson('C12', 'Balance de comprobación', 'Usar el balance para detectar, no para ocultar, errores.', 'Que Debe y Haber cuadren sólo prueba equilibrio matemático. Un asiento puede estar balanceado y usar cuentas equivocadas, período incorrecto o documento inexistente.', 'Registrar un préstamo como venta cuadra, pero falsea ingreso e impuestos.', 'Revisa un balance y busca saldos anómalos, cuentas sin movimiento y diferencias con auxiliares.', ['balance', 'mayores', 'auxiliares', 'conciliaciones'], '¿Balance cuadrado significa contabilidad correcta?', 'No. Falta validar naturaleza, integridad, corte y evidencia.')
    ]
  },
  {
    id: '03', slug: 'plan-de-cuentas-y-evidencia', title: 'Plan de cuentas y evidencia',
    goal: 'Diseñar registros que expliquen la operación sin perder trazabilidad.',
    classes: [
      lesson('C13', 'Diseñar cuentas', 'Crear un plan útil sin fragmentarlo ni esconder diferencias.', 'Una cuenta debe agrupar hechos comparables y permitir conciliación. Demasiadas cuentas vuelven imposible revisar; muy pocas mezclan impuestos, accionistas, clientes y gastos distintos.', 'Separar Banco, Clientes, Proveedores, IVA débito/crédito y Cuenta accionista permite conciliaciones específicas.', 'Diseña un plan mínimo para una empresa de servicios y justifica cada cuenta.', ['naturaleza', 'uso', 'responsable', 'auxiliar asociado'], '¿Conviene una cuenta “Varios” para todo?', 'No. Oculta naturaleza y dificulta evidencia y revisión.'),
      lesson('C14', 'Banco y caja', 'Controlar efectivo con responsables y conciliación.', 'Banco debe reconciliarse con cartolas; caja requiere arqueo y comprobantes. Un saldo contable sin conteo o extracto no demuestra disponibilidad.', 'Comisión bancaria no registrada explica una diferencia; no se corrige cambiando el saldo a mano.', 'Haz una conciliación con saldo inicial, movimientos en tránsito y comisión.', ['cartola', 'mayor', 'arqueo', 'partidas conciliatorias'], '¿La conciliación consiste en forzar saldos iguales?', 'No. Consiste en explicar cada diferencia.'),
      lesson('C15', 'Clientes y proveedores', 'Mantener auxiliares por contraparte y vencimiento.', 'El total de Clientes debe reconciliar con facturas pendientes; Proveedores, con obligaciones recibidas. Sin auxiliares no se sabe quién debe, cuánto ni desde cuándo.', 'Una factura cobrada parcialmente mantiene el saldo restante y su trazabilidad.', 'Construye antigüedad de saldos 0–30, 31–60 y más de 60 días.', ['DTE', 'vencimiento', 'pagos', 'confirmaciones'], '¿El saldo total basta para cobrar?', 'No. Se necesita detalle por documento, contraparte y vencimiento.'),
      lesson('C16', 'Trazabilidad documental', 'Seguir una cifra desde reporte hasta documento y vuelta.', 'La trazabilidad bidireccional permite partir del F29 y llegar a documentos, o partir de una factura y encontrar su asiento, pago y declaración. Identificadores y referencias evitan búsquedas manuales ambiguas.', 'Código interno OP-2026-001 vincula factura, asiento, banco y carpeta mensual.', 'Elige una cifra del resumen y documenta la ruta completa de ida y regreso.', ['identificador', 'documento', 'asiento', 'pago', 'declaración'], '¿Una carpeta con archivos sin índice es trazable?', 'No suficientemente; debe poder relacionarse cada evidencia con el registro.')
    ]
  },
  {
    id: '04', slug: 'ventas-y-dte', title: 'Ventas y DTE',
    goal: 'Registrar ventas, documentos y cobranza sin duplicar ingresos.',
    classes: [
      lesson('C17', 'Factura electrónica', 'Leer campos esenciales de un DTE y conectarlos con el hecho.', 'Fecha, folio, receptor, neto, impuestos y total deben coincidir con la prestación. Emitir un documento no prueba cobro y cobrar no reemplaza el documento.', 'Factura $500.000 neto + IVA, pagada diez días después: emisión y cobro son asientos distintos.', 'Revisa un DTE ficticio y detecta tres datos que impedirían conciliarlo.', ['XML/PDF DTE', 'respaldo del servicio', 'aceptación', 'cobro'], '¿Factura emitida significa dinero recibido?', 'No. Puede existir una cuenta por cobrar.'),
      lesson('C18', 'Base neta e IVA', 'Calcular y explicar neto, IVA y total.', 'El neto es base de la operación; IVA es impuesto recargado; total es la obligación del cliente. Registrar el total como ingreso sobrestima resultado.', '$1.000.000 neto genera $190.000 IVA y $1.190.000 total con tasa 19%.', 'Calcula tres ventas y verifica que neto + IVA = total.', ['DTE', 'regla vigente', 'cálculo', 'registro'], '¿Los $190.000 de IVA son ingreso?', 'No. Son impuesto recargado que debe controlarse.'),
      lesson('C19', 'Notas de crédito y débito', 'Relacionar ajustes con el documento original.', 'Una nota corrige o modifica una operación previa y debe conservar la referencia. No se registra como una venta nueva independiente ni se borra el documento original.', 'Devolución parcial reduce neto, IVA y cuenta por cobrar mediante nota vinculada.', 'Construye el antes/después de una factura con devolución del 20%.', ['documento original', 'nota', 'motivo', 'conciliación RCV'], '¿Debe eliminarse la factura original?', 'No. Se conserva y se vincula el documento de ajuste.'),
      lesson('C20', 'Cobranza y cuentas por cobrar', 'Separar venta, vencimiento, cobro y mora.', 'Clientes muestra derechos de cobro; Banco muestra efectivo. La antigüedad revela riesgo y permite proyectar caja sin asumir que toda factura se cobrará a tiempo.', 'Factura de $952.000, abono $500.000: quedan $452.000 identificados.', 'Arma una agenda de cobro y registra promesas sin tratarlas como efectivo.', ['factura', 'vencimiento', 'abonos', 'comunicaciones'], '¿Promesa de pago equivale a caja?', 'No. Es un supuesto que debe mantenerse separado.')
    ]
  },
  {
    id: '05', slug: 'compras-y-gastos', title: 'Compras y gastos',
    goal: 'Decidir tratamiento contable y tributario con evidencia suficiente.',
    classes: [
      lesson('C21', 'Factura recibida', 'Validar compra, recepción y obligación por pagar.', 'La factura debe corresponder a un bien o servicio recibido y a la empresa correcta. También hay que distinguir fecha de documento, recepción, vencimiento y pago.', 'Servicio recibido en marzo y pagado en abril: se reconoce obligación antes del pago.', 'Revisa contraparte, folio, montos, recepción y condición de pago.', ['DTE recibido', 'orden/contrato', 'recepción', 'pago'], '¿Pagar valida automáticamente la factura?', 'No. Aún debe comprobarse naturaleza y recepción.'),
      lesson('C22', 'Crédito fiscal', 'Evaluar elegibilidad del IVA sin asumirla.', 'Documento con IVA y pago empresarial no bastan por sí solos. Deben revisarse relación con el giro, requisitos y exclusiones; la duda queda pendiente de verificación.', 'Notebook de uso empresarial puede tener tratamiento distinto a consumo personal pagado con la misma tarjeta.', 'Clasifica cuatro compras como elegible, no elegible o por verificar y justifica.', ['DTE', 'uso', 'giro', 'regla aplicable'], '¿Toda factura da crédito fiscal?', 'No. La elegibilidad depende de condiciones concretas.'),
      lesson('C23', 'Gasto del giro', 'Relacionar costo con actividad y período.', 'Un gasto debe tener causa empresarial, respaldo y clasificación temporal. Necesario no significa ilimitado, y pagado no significa automáticamente deducible.', 'Software usado por el equipo tiene vínculo demostrable; una compra personal no.', 'Escribe para cinco gastos cómo contribuyen a la actividad y qué evidencia lo prueba.', ['contrato/factura', 'uso empresarial', 'aprobación', 'pago'], '¿La cuenta bancaria define si es gasto del giro?', 'No. La naturaleza y evidencia lo definen.'),
      lesson('C24', 'Gasto rechazado o no deducible', 'Registrar sin esconder un desembolso no aceptado.', 'Que un monto no sea deducible no permite borrarlo: la salida existe y debe clasificarse. Puede afectar cuenta del accionista, resultado contable u otra cuenta y requerir revisión tributaria.', 'Multa pagada aparece en banco, pero su tratamiento no se fuerza como gasto deducible.', 'Toma tres desembolsos dudosos y documenta decisión, responsable y consulta requerida.', ['comprobante', 'beneficiario', 'motivo', 'revisión profesional'], '¿Debe omitirse un gasto no deducible?', 'No. Se registra el hecho y se separa su tratamiento tributario.')
    ]
  },
  {
    id: '06', slug: 'registro-de-compras-y-ventas', title: 'Registro de Compras y Ventas',
    goal: 'Conciliar documentos propios con el registro oficial sin copiar a ciegas.',
    classes: [
      lesson('C25', 'RCV ventas', 'Comparar DTE emitidos, anulados y ajustados con el registro.', 'El RCV es una fuente oficial importante, pero debe contrastarse con prestación, folios y notas. Una diferencia requiere investigar período, aceptación o documento faltante.', 'Factura interna aparece en libros pero no en corte descargado: se revisa estado y fecha antes de ajustar.', 'Construye tabla folio por folio con estado y diferencia.', ['DTE', 'RCV', 'notas', 'respaldo de servicio'], '¿Copiar el total del RCV reemplaza la conciliación?', 'No. Deben explicarse documentos y diferencias.'),
      lesson('C26', 'RCV compras', 'Revisar documentos recibidos y su clasificación.', 'El registro puede contener documentos que necesitan aceptación, reclamo o caracterización. La empresa debe validar recepción y tratamiento, no asumir que toda fila es gasto o crédito.', 'Factura de proveedor desconocido exige investigación antes de usarla.', 'Marca cada documento como confirmado, reclamado o pendiente y asigna acción.', ['RCV', 'factura', 'recepción', 'decisión'], '¿Documento en RCV prueba que el servicio fue recibido?', 'No necesariamente; debe contrastarse con la operación real.'),
      lesson('C27', 'Caracterización', 'Asignar tratamiento sin perder el documento original.', 'Caracterizar conecta el documento con uso, cuenta y elegibilidad. Debe quedar quién decidió, con qué evidencia y qué elemento sigue pendiente.', 'Compra mixta exige separar porción empresarial y no adivinar porcentajes.', 'Caracteriza cuatro documentos y registra el motivo de cada decisión.', ['documento', 'uso', 'cuenta', 'revisor'], '¿Caracterizar es cambiar el monto del DTE?', 'No. Es documentar su tratamiento y relación con la actividad.'),
      lesson('C28', 'Conciliación RCV ↔ documentos', 'Cerrar diferencias entre fuente oficial y expediente interno.', 'Compara cantidades, netos, IVA, notas y estados. Las diferencias se agrupan y resuelven con evidencia; no se compensan entre sí sólo porque el total coincide.', 'Falta una factura de $100.000 y sobra otra por igual monto: el total cuadra, el detalle no.', 'Haz conciliación por documento y crea lista de excepciones.', ['descarga RCV', 'DTE', 'matriz de diferencias', 'resolución'], '¿Totales iguales prueban conciliación?', 'No. Pueden ocultar diferencias compensadas.')
    ]
  },
  {
    id: '07', slug: 'f29-y-ppm', title: 'F29 y PPM',
    goal: 'Preparar un control mensual explicable sin confundirlo con presentación.',
    classes: [
      lesson('C29', 'Anatomía F29', 'Reconocer componentes y procedencia de datos.', 'El formulario reúne impuestos y retenciones con bases distintas. Cada casilla debe enlazar a documentos, registros y reglas; un total sin procedencia no es revisable.', 'IVA, PPM y honorarios pueden coexistir en el mismo período pero nacen de auxiliares distintos.', 'Crea un mapa casilla → fuente → responsable → comprobante.', ['borrador', 'auxiliares', 'reglas', 'propuesta oficial'], '¿La app presenta el F29?', 'No. Sólo prepara y controla; la presentación ocurre en el sistema oficial.'),
      lesson('C30', 'IVA débito y crédito', 'Conciliar impuesto de ventas, compras y remanente.', 'Débito proviene de operaciones gravadas; crédito requiere elegibilidad; remanente conecta períodos. Cada saldo debe conservar su origen y no degradarse a una resta sin documentos.', 'Débito $152.000, crédito $19.000 y remanente $10.000: el control explica los tres componentes.', 'Construye un puente desde RCV hasta saldo del mes.', ['RCV ventas', 'RCV compras', 'remanente anterior', 'cálculo'], '¿Cero a pagar significa sin movimiento?', 'No. Puede haber débitos y créditos compensados.'),
      lesson('C31', 'PPM Pro Pyme', 'Calcular anticipo sólo con régimen, base y tasa vigentes.', 'El PPM no es IVA ni utilidad. La tasa y base dependen del contexto verificado; usar la tasa inicial eternamente es un error de vigencia.', 'Venta neta de $1.000.000 con tasa 0,25% produce $2.500 sólo bajo el supuesto declarado.', 'Calcula tres escenarios y escribe la regla usada en cada uno.', ['régimen', 'tasa', 'vigencia', 'base'], '¿PPM prueba que hubo utilidad?', 'No. Es un pago provisional calculado sobre la base aplicable.'),
      lesson('C32', 'Plazos, pago y rectificación', 'Separar vencimiento, presentación, pago y corrección.', 'La fecha depende de período, modalidad, calendario y reglas vigentes. Rectificar no debe prometerse como universal: se documenta el error y se confirma el procedimiento oficial.', 'Declaración presentada pero no pagada tiene dos estados distintos.', 'Diseña una línea de tiempo con preparación, revisión, presentación, pago y evidencia.', ['calendario oficial', 'acuse', 'pago', 'expediente de corrección'], '¿Presentado significa pagado?', 'No. Son estados distintos y requieren evidencia distinta.')
    ]
  },
  {
    id: '08', slug: 'honorarios', title: 'Honorarios',
    goal: 'Controlar bruto, líquido, retención y evidencia sin duplicar costos.',
    classes: [
      lesson('C33', 'Boleta recibida', 'Validar emisor, servicio, fecha y monto bruto.', 'La boleta respalda el honorario, pero debe conectarse con servicio y aprobación. El bruto es el costo total; el pago puede dividirse entre prestador y retención.', 'Boleta $250.000: se analiza antes de registrar el pago líquido.', 'Revisa una boleta ficticia y construye su ficha de control.', ['boleta', 'contrato/servicio', 'aprobación', 'fecha'], '¿El líquido es el costo total?', 'No. El costo se analiza desde el bruto.'),
      lesson('C34', 'Retención 15,25% 2026', 'Aplicar la tasa 2026 sin convertirla en regla eterna.', 'Para el ejemplo 2026, bruto × 15,25% determina retención bajo el supuesto aplicable. Cada año debe verificarse la tasa y quién retiene.', '$250.000 × 15,25% = $38.125; líquido $211.875.', 'Calcula sobre $400.000 y documenta año y fuente.', ['año', 'tasa oficial', 'boleta', 'cálculo'], '¿Puede usarse 15,25% en cualquier año?', 'No. Es una tasa fechada para 2026 y debe verificarse para otro período.'),
      lesson('C35', 'Pago y F29', 'Conectar pago líquido con retención por enterar.', 'El pago al prestador reduce Banco por el líquido; la retención queda como obligación. El F29 y su comprobante cierran otra parte del circuito.', 'Pagar $211.875 no elimina los $38.125 retenidos.', 'Concilia boleta, transferencia y retención en una tabla.', ['boleta', 'pago líquido', 'retención', 'comprobante F29'], '¿Pagar al prestador extingue la retención?', 'No. Sigue pendiente hasta su tratamiento y evidencia correspondiente.'),
      lesson('C36', 'Casos con o sin retención', 'Evitar inferir obligación desde una etiqueta incompleta.', 'Quién emite, quién paga, tipo de documento, fecha y reglas definen el tratamiento. Si falta un dato, la app debe exigir verificación y no elegir el caso más común.', 'Dos boletas iguales en monto pueden tener tratamiento distinto por el contexto.', 'Construye un árbol de decisión que termine en sí, no o requiere verificación.', ['tipo de documento', 'emisor', 'pagador', 'regla vigente'], '¿El monto define si hay retención?', 'No. Se necesita el contexto normativo y documental.')
    ]
  },
  {
    id: '09', slug: 'tesoreria', title: 'Tesorería',
    goal: 'Administrar caja, vencimientos y conciliaciones sin ocultar riesgo.',
    classes: [
      lesson('C37', 'Cuenta bancaria empresa', 'Separar fondos empresariales y personales.', 'La cuenta empresarial mejora trazabilidad, pero no corrige una mala clasificación. Cada transferencia con propietarios debe identificar aporte, préstamo, devolución o retiro.', 'Depósito del accionista sin glosa queda pendiente, no se registra como venta.', 'Clasifica diez movimientos de una cartola ficticia.', ['cartola', 'origen', 'beneficiario', 'respaldo'], '¿Usar cuenta empresa vuelve empresarial cualquier pago?', 'No. La naturaleza del hecho sigue mandando.'),
      lesson('C38', 'Conciliación bancaria', 'Explicar diferencias entre libro y banco.', 'Se comparan saldos en la misma fecha y se listan partidas en tránsito, comisiones, errores y registros faltantes. Ajustar el saldo sin explicación destruye trazabilidad.', 'Cheque pendiente y comisión no registrada explican diferencias opuestas.', 'Prepara una conciliación y asigna acción a cada partida.', ['cartola', 'mayor banco', 'partidas', 'ajustes aprobados'], '¿Una partida en tránsito se registra dos veces?', 'No. Se explica hasta que aparezca, sin duplicar el hecho.'),
      lesson('C39', 'Cuentas por pagar', 'Ordenar obligaciones por acreedor, fecha y criticidad.', 'El total no muestra vencimientos ni consecuencias. Se necesita detalle, disputa, garantías, impuestos y responsables antes de priorizar pagos.', 'Tres facturas suman $1.000.000, pero una está vencida y otra en disputa.', 'Construye agenda de pagos con estado y evidencia.', ['factura', 'vencimiento', 'contrato', 'aprobación'], '¿Debe pagarse sólo por orden de monto?', 'No. Se evalúan vencimiento, naturaleza, riesgo y asesoría cuando corresponda.'),
      lesson('C40', 'Flujo de caja', 'Proyectar cobros y pagos con escenarios.', 'La proyección usa fechas probables y separa confirmado de supuesto. Debe mostrar escenarios 6/12/24/36 meses y no presentar reservas sugeridas como mínimo legal.', 'Factura por cobrar sin fecha no se trata como caja disponible.', 'Construye escenario base, cobro atrasado y sin cobro.', ['saldo inicial', 'calendario', 'supuestos', 'escenarios'], '¿Una venta pendiente paga una deuda hoy?', 'No hasta que se cobre o exista financiamiento confirmado.')
    ]
  },
  {
    id: '10', slug: 'accionista-y-patrimonio', title: 'Accionista y patrimonio',
    goal: 'Registrar relaciones con propietarios sin mezclar capital, deuda y gasto.',
    classes: [
      lesson('C41', 'Aporte de capital', 'Relacionar estatuto, compromiso y aporte efectivo.', 'El aporte aumenta recursos y patrimonio según su respaldo. Capital social, suscrito y enterado se mantienen separados; un bien aportado requiere descripción y valoración.', 'Notebook aportado no es depósito bancario, pero puede enterar capital documentado.', 'Construye expediente de aporte en dinero y en especie.', ['estatuto', 'suscripción', 'comprobante', 'valoración'], '¿Capital social equivale siempre a capital enterado?', 'No. Puede existir saldo pendiente de enterar.'),
      lesson('C42', 'Cuenta corriente accionista', 'Registrar deudas recíprocas con claridad.', 'Movimientos temporales entre empresa y accionista deben identificar quién debe a quién y por qué. Usar una cuenta genérica sin auxiliares puede esconder retiros o préstamos.', 'Accionista paga proveedor por cuenta empresa: puede surgir deuda de la empresa con él.', 'Reconstruye tres movimientos y determina saldo por persona.', ['comprobante', 'acuerdo', 'auxiliar', 'saldo'], '¿Toda transferencia del accionista es aporte?', 'No. Puede ser préstamo, pago por cuenta o regularización.'),
      lesson('C43', 'Retiros y distribuciones', 'Separar salida patrimonial de gasto operativo.', 'El retiro no se convierte en gasto por salir de Banco. Distribuciones y retiros requieren contexto societario y tributario; no se automatizan desde una descripción bancaria.', 'Pago de gasto personal reduce Banco y se registra contra el accionista, sujeto a revisión.', 'Clasifica cuatro salidas personales y explica su regularización.', ['beneficiario', 'acuerdo', 'comprobante', 'tratamiento revisado'], '¿Un retiro reduce automáticamente la utilidad contable?', 'No como gasto operativo.'),
      lesson('C44', 'Separación empresa/persona', 'Aplicar controles para evitar mezcla patrimonial.', 'Cuentas, contratos, gastos y garantías deben identificar a la parte correcta. La responsabilidad limitada tiene excepciones y no protege conductas sin documentación o abuso.', 'Garantía personal del accionista no transforma la deuda empresarial en gasto personal.', 'Diseña cinco controles de separación patrimonial.', ['cuentas separadas', 'aprobaciones', 'contratos', 'conciliación'], '¿Responsabilidad limitada permite mezclar fondos?', 'No. La separación debe mantenerse y documentarse.')
    ]
  },
  {
    id: '11', slug: 'activos-y-cierre-contable', title: 'Activos y cierre contable',
    goal: 'Reconocer recursos de largo plazo y ajustes sin inventar valores.',
    classes: [
      lesson('C45', 'Activo vs gasto', 'Decidir si un desembolso beneficia uno o varios períodos.', 'Un activo presta servicios futuros y se controla; un gasto se consume en el período. Precio alto o pago en cuotas no deciden por sí solos.', 'Computador usado tres años se analiza distinto a mantención mensual.', 'Clasifica seis desembolsos y documenta vida útil esperada.', ['factura', 'recepción', 'uso', 'política contable'], '¿Todo pago grande es activo?', 'No. Importa la naturaleza y beneficio esperado.'),
      lesson('C46', 'Depreciación conceptual', 'Entender distribución del costo sin usar tasas inventadas.', 'Depreciar asigna el costo del activo durante su uso; no es una salida mensual de caja. Vida útil, valor residual y método requieren política y reglas aplicables.', 'Equipo pagado al contado mantiene costo y acumula depreciación con el tiempo.', 'Construye tabla conceptual con costo, meses y saldo, rotulada simulación.', ['registro del activo', 'política', 'cálculo', 'revisión tributaria'], '¿Depreciación mensual implica pago mensual?', 'No. Es reconocimiento contable del consumo del activo.'),
      lesson('C47', 'Provisiones y ajustes', 'Registrar estimaciones como estimaciones revisables.', 'Un ajuste debe tener base, responsable y fecha. No se usa para cuadrar resultados deseados; la incertidumbre se declara y se reevalúa.', 'Servicio recibido sin factura puede requerir estimación documentada, no monto arbitrario.', 'Diseña ficha de provisión con supuesto y evidencia pendiente.', ['base de cálculo', 'aprobación', 'fecha', 'reverso/revisión'], '¿Una provisión es una cifra definitiva?', 'No. Es una estimación que debe revisarse.'),
      lesson('C48', 'Cierre de resultados', 'Cerrar ingresos y gastos preservando el detalle del período.', 'El cierre determina resultado y lo conecta con patrimonio, pero no borra auxiliares ni documentos. Antes se revisan corte, ajustes y saldos anómalos.', 'Ingreso omitido cambia resultado y patrimonio; corregir exige trazabilidad.', 'Prepara hoja de revisión previa al cierre anual.', ['balance', 'ajustes', 'mayores', 'aprobación'], '¿Cerrar elimina los documentos del año?', 'No. Deben conservarse para reconstrucción y revisión.')
    ]
  },
  {
    id: '12', slug: 'municipal-y-compliance', title: 'Municipal y cumplimiento',
    goal: 'Controlar patente y obligaciones con vigencia, fuente y ámbito.',
    classes: [
      lesson('C49', 'Patente municipal', 'Calcular sólo con base, tasa, comuna y período verificados.', 'La patente no se obtiene cambiando etiquetas a un impuesto nacional. Debe distinguir empresa nueva, en funcionamiento, prorrateos y fuente municipal.', 'Misma empresa puede cambiar de base entre primer y segundo año.', 'Completa ficha de cálculo y deja no determinado lo que falte.', ['base', 'tasa', 'UTM', 'comuna', 'vigencia'], '¿Puede inventarse una tasa municipal promedio?', 'No. Se requiere fuente específica o simulación explícita.'),
      lesson('C50', 'UTM y actualizaciones', 'Usar el valor del período correcto.', 'La UTM cambia por mes; trasladar un valor sin advertencia produce montos plausibles pero erróneos. El motor debe registrar período y fuente.', 'UTM de agosto no se usa silenciosamente para diciembre.', 'Compara dos períodos y documenta cuál valor falta.', ['mes', 'valor', 'fuente', 'fecha de consulta'], '¿Una UTM sirve para todo el año?', 'No. Debe usarse el período aplicable.'),
      lesson('C51', 'Contratos y oficina virtual', 'Controlar vigencia, servicio y dependencia laboral.', 'Un contrato debe reflejar realidad, entregables, propiedad intelectual y pagos. Llamar independiente a alguien no elimina subordinación si los hechos muestran otra relación.', 'Colaborador por proyecto con horario impuesto requiere revisar la realidad, no sólo el título.', 'Revisa un contrato con checklist de alcance, IP, pagos y forma de trabajo.', ['contrato', 'entregables', 'comunicaciones', 'pagos'], '¿El nombre “honorarios” descarta relación laboral?', 'No. Los hechos pueden exigir revisión profesional.'),
      lesson('C52', 'Matriz de obligaciones', 'Mantener frecuencia, próxima fecha, fuente y evidencia.', 'Pago único, mensual, anual, decenal o condicional deben modelarse distintos. No determinado no es cero y sin movimiento no es no aplica.', 'Patente anual y banco mensual requieren calendarios separados.', 'Construye matriz con estado, responsable y recuperación ante falla.', ['obligación', 'frecuencia', 'fuente', 'comprobante'], '¿NO APLICA equivale a SIN MOVIMIENTO?', 'No. Son estados con significados diferentes.')
    ]
  },
  {
    id: '13', slug: 'cierre-mensual', title: 'Cierre mensual',
    goal: 'Cerrar períodos con controles, evidencia y recuperación explícita.',
    classes: [
      lesson('C53', 'Checklist', 'Definir pasos mínimos antes de congelar un mes.', 'El checklist cubre documentos, banco, auxiliares, impuestos y pendientes. Marcar por rutina sin evidencia no reduce el riesgo.', 'Banco sin conciliar bloquea el cierre aunque el balance cuadre.', 'Diseña checklist con responsable, evidencia y condición de bloqueo.', ['lista', 'responsables', 'comprobantes', 'pendientes'], '¿Completar casillas basta para cerrar?', 'No. Cada control necesita resultado y evidencia.'),
      lesson('C54', 'Conciliaciones cruzadas', 'Comparar fuentes independientes y explicar diferencias.', 'Ventas, RCV, contabilidad y banco observan el mismo negocio desde ángulos distintos. La coincidencia por total no reemplaza el detalle.', 'Ventas $1M en contabilidad y RCV, pero folios distintos: hay diferencia real.', 'Cruza cuatro fuentes y crea matriz de excepciones.', ['RCV', 'mayores', 'cartola', 'documentos'], '¿Totales iguales prueban integridad?', 'No. Pueden existir omisiones compensadas.'),
      lesson('C55', 'Control de errores', 'Clasificar error, impacto y corrección sin borrar historia.', 'Distingue dato incompleto, clasificación, período, duplicado y regla. La corrección documenta antes/después, responsable y si afecta declaraciones.', 'Factura duplicada se revierte con rastro, no se elimina silenciosamente.', 'Analiza tres errores y define plan de recuperación.', ['hallazgo', 'impacto', 'aprobación', 'evidencia de corrección'], '¿Debe editarse un cierre sin registro?', 'No. Se reabre con motivo y auditoría.'),
      lesson('C56', 'Carpeta de evidencia', 'Organizar un expediente que otra persona pueda revisar.', 'La carpeta debe tener índice, período, fuentes y vínculo a cifras. Guardar archivos sueltos sin nombres ni relación no asegura trazabilidad.', 'Índice mensual enlaza RCV, banco, F29, conciliaciones y pendientes.', 'Diseña estructura de carpetas y nomenclatura sin datos personales reales.', ['índice', 'documentos', 'conciliaciones', 'comprobantes'], '¿Acumular PDFs sin índice es evidencia suficiente?', 'No. Debe poder relacionarse cada archivo con el control y cifra.')
    ]
  },
  {
    id: '14', slug: 'renta-anual', title: 'Renta anual',
    goal: 'Preparar la revisión anual sin convertir la app en declarante automático.',
    classes: [
      lesson('C57', 'Base Pro Pyme', 'Identificar régimen, período y ajustes antes de calcular.', 'La base anual no se obtiene sumando caja. Se necesita método, ingresos, gastos y ajustes respaldados; si el régimen no califica, no se fuerza el cálculo simplificado.', 'Dos resultados contables iguales pueden producir bases distintas por ajustes.', 'Construye puente conceptual resultado → ajustes → base.', ['régimen', 'balance', 'ajustes', 'fuentes'], '¿La utilidad bancaria es base tributaria?', 'No existe tal equivalencia; se requiere cálculo y reglas aplicables.'),
      lesson('C58', 'Registros empresariales', 'Reconocer registros aplicables sin inferirlos.', 'Los registros dependen del régimen y hechos del contribuyente. La aplicación debe pedir perfil y no mostrar obligaciones universales por defecto.', 'Empresa sin retiros y otra con distribuciones requieren antecedentes distintos.', 'Lista datos que determinan qué registros revisar.', ['régimen', 'movimientos patrimoniales', 'cierres', 'declaraciones'], '¿Toda empresa usa los mismos registros?', 'No. Depende del contexto verificado.'),
      lesson('C59', 'Declaraciones Juradas', 'Gestionar catálogo, fuente y vencimiento por obligación concreta.', 'No existe una lista universal válida para toda empresa. Cada DJ necesita criterio de aplicabilidad, período, datos, revisión y comprobante.', 'No tener trabajadores no decide todas las DJ posibles.', 'Crea matriz sí/no/por verificar con fundamento.', ['perfil', 'resolución/instrucción', 'datos', 'acuse'], '¿Puede la app asignar DJ sólo por ser SpA?', 'No. Debe revisar la obligación específica.'),
      lesson('C60', 'F22 y revisión final', 'Conciliar declaración anual con cierres y fuentes oficiales.', 'El F22 integra resultados y antecedentes anuales. La app puede preparar controles, pero la propuesta y presentación se verifican en el portal y con profesional cuando corresponde.', 'CPT del cierre debe enlazar con el dato revisado, no copiarse sin contexto.', 'Prepara checklist final con diferencias y responsables.', ['balance', 'CPT', 'declaraciones', 'acuse F22'], '¿Un borrador interno es declaración?', 'No. Falta revisión y presentación oficial.')
    ]
  },
  {
    id: '15', slug: 'auditoria-y-automatizacion', title: 'Auditoría y automatización',
    goal: 'Automatizar controles sin automatizar afirmaciones no verificadas.',
    classes: [
      lesson('C61', 'Muestreo y pruebas', 'Seleccionar evidencia según riesgo y objetivo.', 'Muestrear no es mirar al azar sin criterio. Se define población, riesgo, cobertura y excepción; partidas críticas pueden revisarse al 100%.', 'Todos los movimientos con accionistas se revisan; gastos menores se muestrean.', 'Diseña muestra y explica qué no cubre.', ['población', 'criterio', 'muestra', 'excepciones'], '¿Una muestra sin población definida es reproducible?', 'No. Falta alcance y método.'),
      lesson('C62', 'Alertas de inconsistencias', 'Diseñar alertas accionables y no alarmistas.', 'Una alerta indica condición observable, severidad, evidencia y acción. No debe acusar fraude ni incumplimiento legal sin investigación.', 'Caja negativa proyectada exige revisar cobros y pagos, no declarar insolvencia.', 'Redacta tres alertas con condición y recuperación.', ['regla', 'dato', 'severidad', 'acción'], '¿Alerta equivale a conclusión?', 'No. Inicia revisión y puede requerir verificación humana.'),
      lesson('C63', 'Reglas versionadas', 'Conservar vigencia, fuente y cambios históricos.', 'Una regla legal necesita país, período, fuente, revisión y estado. Actualizar una tasa no reescribe años cerrados; se crea una versión nueva y pruebas.', 'Tasa 2027 no reemplaza cálculo 2026.', 'Diseña una propuesta DRAFT y su prueba antes de activarla.', ['fuente', 'vigencia', 'revisor', 'diff', 'prueba'], '¿Un scraping puede autoactivar una norma?', 'No. Requiere revisión y publicación controlada.'),
      lesson('C64', 'Diseño de un contador virtual seguro', 'Definir qué automatizar y dónde fallar cerrado.', 'El sistema calcula y organiza evidencia; no firma, presenta, paga ni decide elegibilidad. Datos incompletos devuelven un estado observable y una ruta de verificación.', 'País sin reglas aprobadas muestra NOT_IMPLEMENTED, no una tasa aproximada.', 'Escribe cinco guardrails y casos de prueba.', ['contrato', 'estados', 'fuentes', 'tests', 'auditoría'], '¿Un modelo debe rellenar una tasa faltante?', 'No. Debe detenerse y pedir verificación.')
    ]
  },
  {
    id: '16', slug: 'gobernanza-control-interno', title: 'Gobernanza, control interno y auditoría continua',
    goal: 'Diseñar decisiones, controles e investigaciones con responsabilidad y evidencia.',
    classes: [
      lesson('C65', 'Gobierno corporativo, integridad y RACI', 'Asignar responsable, aprobador, consultado e informado.', 'RACI aclara roles, pero no reemplaza competencias ni independencia. Una decisión crítica debe mostrar quién propone, valida, aprueba y ejecuta.', 'Pago relevante no debe quedar sin aprobador identificado.', 'Construye RACI de compra, pago y conciliación.', ['matriz RACI', 'acta', 'aprobación', 'ejecución'], '¿Dos letras RACI para la misma persona siempre son adecuadas?', 'No. Puede crear conflicto y debe evaluarse.'),
      lesson('C66', 'Segregación de funciones', 'Separar etapas incompatibles o crear compensaciones.', 'Quien solicita, aprueba, paga, registra y concilia no debería controlar todo el ciclo. En equipos pequeños se usan revisiones posteriores independientes y evidencia reforzada.', 'La misma persona paga y registra; otra revisa cartola y documentos.', 'Diseña segregación para un equipo de dos personas.', ['flujo', 'roles', 'aprobaciones', 'revisión compensatoria'], '¿Equipo pequeño elimina la segregación?', 'No. Exige controles compensatorios explícitos.'),
      lesson('C67', 'Diseño y clasificación de controles', 'Definir objetivo, tipo, frecuencia y evidencia.', 'Un control preventivo evita; uno detectivo identifica; uno correctivo recupera. Debe decir qué riesgo reduce y cómo se demuestra su ejecución.', 'Doble aprobación previene; conciliación detecta; reverso documentado corrige.', 'Diseña un control de cada tipo para pagos.', ['riesgo', 'objetivo', 'frecuencia', 'evidencia'], '¿Una política escrita demuestra ejecución?', 'No. Se necesita evidencia del control operando.'),
      lesson('C68', 'Libros auxiliares, conciliación, documentos y custodia', 'Conectar detalle, mayor y evidencia preservada.', 'Los auxiliares explican saldos por tercero o documento; la custodia protege integridad y acceso. Hash o bitácora ayudan, pero no corrigen contenido falso.', 'Auxiliar de proveedores suma al mayor y cada fila enlaza factura.', 'Reconcilia auxiliar y mayor y define retención/custodia.', ['auxiliar', 'mayor', 'documentos', 'control de acceso'], '¿Hash prueba que un documento es verdadero?', 'Prueba integridad desde el hash, no veracidad de origen.'),
      lesson('C69', 'Risk register, KRI, excepciones y auditoría continua', 'Medir riesgo residual y excepciones vencidas.', 'Registro de riesgo conecta causa, evento, impacto, controles y dueño. KRI observa tendencia; no declara culpabilidad. Excepciones requieren fecha, aprobación y remediación.', 'Cuentas vencidas sobre umbral generan alerta y seguimiento.', 'Define un KRI con fórmula, fuente, umbral y acción.', ['riesgo', 'control', 'KRI', 'excepción', 'remediación'], '¿KRI alto prueba fraude?', 'No. Indica exposición o anomalía que requiere análisis.'),
      lesson('C70', 'Whistleblowing, investigación independiente y remediación', 'Preservar denuncias y separar hechos de hipótesis.', 'Una investigación protege evidencia, confidencialidad, independencia y debido proceso. No presume culpabilidad; documenta alcance, conflictos, hechos, decisiones y remediación verificada.', 'Denuncia contra aprobador requiere investigador sin dependencia del involucrado.', 'Diseña cadena de custodia y plan de investigación ficticio sin datos reales.', ['recepción', 'cadena de custodia', 'conflictos', 'hallazgos', 'remediación'], '¿Una denuncia equivale a hecho probado?', 'No. Es información que debe investigarse con garantías.')
    ]
  }
]);

const MODULE_PEDAGOGY = Object.freeze({
  '00': { prerequisite: 'Ninguno: se parte desde hechos cotidianos y documentos.', caseContext: 'Ruta Andina SpA acaba de abrir y debe reconstruir qué ocurrió sin confiar sólo en el banco.', appViews: ['Operaciones', 'Documentos', 'Cierres'], sources: ['Marco Conceptual para la Información Financiera', 'SII: educación tributaria y documentación'] },
  '01': { prerequisite: 'Distinguir hecho, documento, registro y evidencia.', caseContext: 'La sociedad ya existe, pero todavía debe probar su identidad, inicio, domicilio y régimen.', appViews: ['Empresa', 'Configuración', 'Obligaciones'], sources: ['Registro de Empresas y Sociedades', 'SII: inicio de actividades y regímenes'] },
  '02': { prerequisite: 'Reconocer activo, deuda, patrimonio, ingreso y gasto en lenguaje cotidiano.', caseContext: 'Ruta Andina debe transformar movimientos reales en asientos equilibrados que otra persona pueda revisar.', appViews: ['Operaciones', 'Diario', 'Reportes'], sources: ['Marco Conceptual para la Información Financiera', 'Material de formación contable básica'] },
  '03': { prerequisite: 'Comprender la ecuación contable y la partida doble.', caseContext: 'El volumen crece y la empresa necesita cuentas, auxiliares y referencias que no oculten diferencias.', appViews: ['Plan de cuentas', 'Documentos', 'Auditoría'], sources: ['Marco Conceptual para la Información Financiera', 'Buenas prácticas de control documental'] },
  '04': { prerequisite: 'Separar ingreso, impuesto, cuenta por cobrar y caja.', caseContext: 'Ruta Andina vende servicios afectos, corrige una operación y cobra en más de una fecha.', appViews: ['Operaciones', 'Ventas', 'Diario'], sources: ['SII: facturación electrónica', 'SII: Registro de Compras y Ventas'] },
  '05': { prerequisite: 'Leer un documento tributario y reconocer devengo frente a pago.', caseContext: 'La empresa compra software, servicios y activos; no todos reciben el mismo tratamiento.', appViews: ['Operaciones', 'Compras', 'Documentos'], sources: ['SII: crédito fiscal IVA', 'SII: gastos necesarios para producir la renta'] },
  '06': { prerequisite: 'Registrar ventas y compras con sus documentos de ajuste.', caseContext: 'El expediente interno y el Registro de Compras y Ventas no coinciden y hay que explicar cada diferencia.', appViews: ['Impuestos', 'Conciliación', 'Documentos'], sources: ['SII: Registro de Compras y Ventas', 'SII: documentos tributarios electrónicos'] },
  '07': { prerequisite: 'Distinguir IVA débito, crédito, retenciones y pagos provisionales.', caseContext: 'Llegó el cierre tributario mensual; la aplicación prepara un control, pero no presenta la declaración.', appViews: ['F29', 'Impuestos', 'Cierres'], sources: ['SII: Formulario 29', 'SII: calendario tributario'] },
  '08': { prerequisite: 'Separar una prestación independiente de una relación laboral.', caseContext: 'Ruta Andina recibe una boleta de honorarios y debe controlar gasto, retención, pago y respaldo.', appViews: ['Operaciones', 'Honorarios', 'F29'], sources: ['SII: boleta de honorarios electrónica', 'SII: retenciones vigentes'] },
  '09': { prerequisite: 'Comprender patrimonio, obligaciones y movimientos de caja.', caseContext: 'La persona accionista aporta, presta, retira y paga gastos: cuatro hechos que el banco hace parecer iguales.', appViews: ['Capital', 'Gobierno', 'Diario'], sources: ['Registro de Empresas y Sociedades', 'SII: gastos y retiros'] },
  '10': { prerequisite: 'Registrar el ciclo mensual y mantener referencias documentales.', caseContext: 'Fin de mes: hay saldos que cuadran, documentos pendientes y una decisión sobre qué puede cerrarse.', appViews: ['Cierres', 'Auditoría', 'Respaldo'], sources: ['Buenas prácticas de cierre contable', 'SII: conservación de documentación'] },
  '11': { prerequisite: 'Distinguir capital societario, patrimonio contable y caja.', caseContext: 'La empresa proyecta su base municipal y debe separar una simulación interna del trámite real.', appViews: ['Patente', 'Capital', 'Obligaciones'], sources: ['Decreto Ley 3.063 sobre Rentas Municipales', 'Municipalidad competente'] },
  '12': { prerequisite: 'Cerrar meses y conciliar cuentas de balance.', caseContext: 'Ruta Andina prepara el puente entre su cierre anual, capital propio tributario y obligaciones siguientes.', appViews: ['Cierre anual', 'CPT', 'Patente'], sources: ['SII: Operación Renta', 'SII: regímenes tributarios'] },
  '13': { prerequisite: 'Leer cuentas por cobrar, por pagar y conciliaciones bancarias.', caseContext: 'La empresa puede mostrar utilidad y aun así quedarse sin efectivo en las próximas trece semanas.', appViews: ['Flujo de caja', 'Continuidad', 'Alertas'], sources: ['Superir: educación financiera e insolvencia', 'Buenas prácticas de tesorería'] },
  '14': { prerequisite: 'Tener doce cierres mensuales explicables y perfil tributario verificado.', caseContext: 'Se prepara la revisión anual sin copiar propuestas ni inferir obligaciones desde datos incompletos.', appViews: ['Cierre anual', 'Obligaciones', 'Evidencias'], sources: ['SII: Operación Renta', 'SII: declaraciones juradas'] },
  '15': { prerequisite: 'Poder reconstruir una cifra desde su documento y su regla.', caseContext: 'El sistema automatiza comprobaciones, pero debe fallar cerrado frente a normas incompletas o vencidas.', appViews: ['Auditoría', 'Reglas', 'Bitácora'], sources: ['Política de reglas del repositorio', 'Fuentes oficiales versionadas'] },
  '16': { prerequisite: 'Comprender procesos, evidencia, riesgos y responsables.', caseContext: 'Ruta Andina creció y necesita controles independientes, alertas útiles e investigaciones con debido proceso.', appViews: ['Gobierno', 'Riesgos', 'Auditoría'], sources: ['Ley 20.393 y Ley 21.595', 'Buenas prácticas de control interno'] }
});

const buildLearningDesign = (item, module) => {
  const context = MODULE_PEDAGOGY[module.id];
  const evidenceList = item.evidence.join(', ');
  return Object.freeze({
    ...item,
    module: module.id,
    moduleTitle: module.title,
    durationMinutes: 35,
    level: Number(module.id) < 4 ? 'Fundamento' : Number(module.id) < 11 ? 'Operación' : 'Control y decisión',
    prerequisite: context.prerequisite,
    caseContext: context.caseContext,
    results: Object.freeze([
      item.outcome,
      `Explicar con palabras propias por qué «${item.title}» cambia una decisión operativa.`,
      `Resolver un caso sin confundir el movimiento de dinero con su naturaleza económica.`,
      `Construir una evidencia revisable usando ${evidenceList}.`,
      'Detectar cuándo faltan antecedentes y marcar REQUIERE_VERIFICACION en vez de inventar una respuesta.'
    ]),
    concepts: Object.freeze(item.evidence.map((name, index) => ({
      name,
      meaning: index === 0
        ? `Punto de partida observable para estudiar ${item.title.toLowerCase()}; no se reemplaza por una suposición.`
        : `Eslabón ${index + 1} del expediente: debe poder relacionarse con el hecho, el registro y la decisión.`
    }))),
    mentalModel: `No memorices una cuenta o un formulario. Sigue esta cadena: hecho → evidencia → clasificación → registro → conciliación → decisión. En esta clase la cadena se usa para ${item.outcome.toLowerCase()}`,
    development: Object.freeze([
      {
        title: '1. Observar antes de calcular',
        body: `Parte por el hecho y el período. ${item.explanation} Antes de tocar una fórmula, identifica quién intervino, qué cambió, cuándo nació el derecho u obligación y qué documento lo demuestra. Si falta uno de esos datos, el resultado todavía es una hipótesis.`
      },
      {
        title: '2. Razonar la clasificación',
        body: `Pregunta qué recurso, obligación, resultado, impuesto o patrimonio cambió y en qué dirección. No uses el banco como plan de cuentas: un abono puede ser venta, cobranza, capital o préstamo. La clasificación correcta debe explicar el ejemplo de la clase y seguir siendo válida aunque el pago ocurra en otra fecha.`
      },
      {
        title: '3. Controlar y decidir',
        body: `Contrasta el resultado con ${evidenceList}. Una cifra útil permite volver desde el reporte al documento y desde el documento al asiento, pago o declaración. Si las piezas no coinciden, registra una diferencia con responsable y fecha; cuadrar no autoriza borrar la excepción.`
      }
    ]),
    workedExample: Object.freeze({
      situation: item.example,
      steps: Object.freeze([
        `Describe el hecho sin nombres de cuentas: qué ocurrió y en qué fecha.`,
        `Reúne el expediente mínimo: ${evidenceList}.`,
        `Clasifica cada cambio y separa devengo, documento y movimiento de caja.`,
        `Registra el efecto y comprueba que no duplicaste ingreso, gasto, impuesto o pago.`,
        `Explica qué conclusión permite el registro y cuál todavía necesita verificación externa.`
      ]),
      interpretation: `La respuesta no termina cuando el cálculo cuadra. Termina cuando otra persona puede reconstruir por qué el caso pertenece a «${item.title}», qué evidencia lo sostiene y qué cambiaría si faltara una pieza.`
    }),
    workshop: Object.freeze({
      prompt: item.practice,
      beforeYouStart: 'Escribe primero tu hipótesis y los datos faltantes. Después abre la aplicación o una hoja de trabajo; así podrás comparar tu razonamiento, no sólo el número final.',
      sequence: Object.freeze([
        'Dibuja la línea de tiempo del hecho, documento, vencimiento y pago.',
        'Propón la clasificación y justifica cada cuenta o estado utilizado.',
        'Realiza el cálculo o conciliación con unidades y período visibles.',
        'Busca una explicación alternativa y decide qué evidencia la descartaría.',
        'Guarda el entregable sin datos personales reales.'
      ]),
      deliverable: `Una ficha titulada «${item.id} — ${item.title}» con decisión, cálculo o registro, evidencia, supuesto, pendiente y acción siguiente.`,
      acceptance: Object.freeze([
        'El período, la jurisdicción y el contexto de empresa están explícitos.',
        'Cada cifra puede rastrearse a un dato y cada dato a una evidencia.',
        'La respuesta distingue hecho, documento, registro y pago.',
        'Lo desconocido aparece como pendiente; nunca como cero ni como hecho confirmado.',
        `La conclusión responde realmente a: ${item.outcome}`
      ])
    }),
    commonErrors: Object.freeze([
      { symptom: 'La respuesta parte del saldo bancario.', cause: 'Se confundió caja con naturaleza económica.', correction: 'Vuelve al hecho y separa devengo, documento y pago.' },
      { symptom: 'El total cuadra, pero no se puede reconstruir.', cause: 'Faltan referencias o se compensaron diferencias.', correction: `Repite la trazabilidad usando ${evidenceList}.` },
      { symptom: 'Un dato ausente aparece como cero o “no aplica”.', cause: 'Se cerró la incertidumbre sin evidencia.', correction: 'Usa NO DETERMINADO o REQUIERE_VERIFICACION y asigna la comprobación.' },
      { symptom: `Se responde «${item.check.answer}» sin explicar por qué.`, cause: 'Se memorizó la conclusión.', correction: 'Demuestra la cadena hecho → evidencia → registro → efecto.' }
    ]),
    checks: Object.freeze([
      Object.freeze(item.check),
      Object.freeze({ question: `¿Qué evidencia mínima pedirías antes de aplicar ${item.title.toLowerCase()} a una empresa real?`, answer: `Como mínimo: ${evidenceList}; además debe verificarse período, perfil y fuente vigente cuando exista efecto legal o tributario.` }),
      Object.freeze({ question: '¿Qué debe hacer la aplicación si falta un antecedente decisivo?', answer: 'Detener la conclusión, mostrar qué falta y devolver REQUIERE_VERIFICACION; nunca completar la respuesta por semejanza.' })
    ]),
    appViews: Object.freeze(context.appViews),
    sources: Object.freeze(context.sources),
    boundary: 'Material educativo. La aplicación prepara, explica y conserva evidencia; no presenta declaraciones, firma, paga ni reemplaza la revisión profesional.'
  });
};

export const COURSE_CLASSES = Object.freeze(COURSE_MODULES.flatMap(module =>
  module.classes.map(item => buildLearningDesign(item, module))
));

export function courseClass(id) {
  return COURSE_CLASSES.find(item => item.id === id) ?? null;
}
