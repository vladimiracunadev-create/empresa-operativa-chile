/** Casos integradores: decisiones encadenadas, no ejercicios de una sola cifra. */

const caseStudy = (id, title, hours, situation, facts, stages, decisions, expectedFindings, appViews) => Object.freeze({
  id, title, hours, situation,
  learningGoal: 'Integrar operación, contabilidad, impuestos, evidencia, caja y control sin convertir datos incompletos en certezas.',
  facts: Object.freeze(facts),
  stages: Object.freeze(stages),
  decisions: Object.freeze(decisions),
  expectedFindings: Object.freeze(expectedFindings),
  appViews: Object.freeze(appViews),
  studentPack: Object.freeze([
    'Cronología y mapa de actores.',
    'Libro de decisiones: dato, hipótesis, evidencia, responsable y estado.',
    'Registros/cálculos reproducibles y conciliaciones.',
    'Matriz de obligaciones: aplica, no aplica o requiere verificación, con fuente.',
    'Informe ejecutivo de una página con riesgos, límites y próximas acciones.'
  ]),
  evaluation: Object.freeze([
    { criterion: 'Integración', weight: 25, descriptor: 'Conecta hechos, registros, caja, obligaciones y evidencia sin duplicarlos.' },
    { criterion: 'Juicio', weight: 25, descriptor: 'Toma decisiones proporcionales y deja lo incierto como verificación.' },
    { criterion: 'Trazabilidad', weight: 20, descriptor: 'Toda conclusión puede reconstruirse desde la fuente.' },
    { criterion: 'Recuperación', weight: 15, descriptor: 'Cada fallo o diferencia tiene responsable, fecha y forma de comprobar su solución.' },
    { criterion: 'Comunicación', weight: 15, descriptor: 'El informe permite actuar sin ocultar límites ni usar alarmismo.' }
  ]),
  boundary: 'Caso educativo con datos ficticios. No determina elegibilidad legal, no presenta declaraciones y no sustituye asesoría habilitada.'
});

export const ACADEMY_CASES = Object.freeze([
  caseStudy('K01', 'Primer mes de una SpA unipersonal', 4,
    'Ruta Andina SpA fue constituida para prestar servicios tecnológicos. Tiene una accionista, oficina virtual y ningún trabajador dependiente. El caso comienza antes de asumir que existe inicio de actividades o que corresponde declarar un formulario.',
    [
      'Capital estatutario y abono bancario: $1.000.000.',
      'Venta ficticia: $800.000 netos, cobrada en el mes.',
      'Compra del giro: $100.000 netos, pagada en el mes.',
      'Honorario: $250.000 bruto, tasa según regla vigente.',
      'Pago personal con tarjeta empresa: $150.000.',
      'Inicio de actividades y régimen: evidencia deliberadamente incompleta.'
    ],
    [
      { name: '1. Diagnóstico', work: 'Separa constitución, RUT, inicio, régimen, domicilio y habilitación de documentos. Marca cada estado con su evidencia.' },
      { name: '2. Operación', work: 'Registra capital, venta, compra, honorario, pago personal y sus movimientos de banco sin duplicar hechos.' },
      { name: '3. Control mensual', work: 'Concilia banco y auxiliares; prepara IVA, PPM y retención sólo si el perfil habilita cada cálculo.' },
      { name: '4. Decisión', work: 'Explica qué puede cerrar la empresa y qué debe verificar antes de cualquier presentación real.' }
    ],
    ['¿Qué cambia si la sociedad fue constituida pero no inició actividades?', '¿El pago personal puede clasificarse como gasto?', '¿Qué evidencia prueba que el capital está efectivamente pagado?', '¿Qué partes del control mensual son cálculo y cuáles son obligaciones por confirmar?'],
    ['Constituir no prueba inicio ni régimen.', 'Capital no es ingreso.', 'El retiro/pago personal se separa del gasto del giro.', 'El control F29 interno no es una declaración presentada.', 'Faltantes decisivos devuelven REQUIERE_VERIFICACION.'],
    ['Empresa', 'Capital', 'Operaciones', 'F29', 'Cierres']),
  caseStudy('K02', 'Doce meses: de la apertura al cierre anual', 6,
    'Ruta Andina completa su primer año con meses de venta, meses sin clientes, compras, honorarios, patente y una cuenta por cobrar vencida. El desafío es mantener continuidad entre doce cierres sin tratar “sin ventas” como “sin movimiento”.',
    [
      'Meses 1–3: inversión y una sola venta.',
      'Meses 4–6: sin ventas, pero con software, oficina virtual y honorarios.',
      'Meses 7–10: ventas recurrentes y una nota de crédito.',
      'Meses 11–12: una factura vencida y patente proyectada.',
      'Dos meses tienen diferencias entre expediente y RCV.',
      'Un saldo inicial no coincide con el cierre anterior.'
    ],
    [
      { name: '1. Línea de tiempo', work: 'Construye los doce meses y distingue sin ventas, sin compras, sin movimiento y dato no determinado.' },
      { name: '2. Cierres', work: 'Valida arrastre de saldos, remanentes, documentos y excepciones entre períodos.' },
      { name: '3. Caja', work: 'Proyecta 6/12/24/36 meses con escenarios, sin presentar una reserva como mínimo legal.' },
      { name: '4. Año', work: 'Prepara balance, puente anual, CPT preliminar y matriz de F22/DJ según perfil, no por tipo societario.' }
    ],
    ['¿Qué mes realmente no tuvo movimiento?', '¿Cómo se corrige un saldo inicial roto sin reescribir el cierre anterior?', '¿Qué obligaciones siguen siendo condicionales?', '¿Qué evidencia permite sostener el CPT preliminar?'],
    ['Mes con compras u honorarios no es “sin movimiento”.', 'Los históricos permanecen inmutables y la corrección queda versionada.', 'F22 y DJ no se asignan universalmente.', 'La proyección de caja declara supuestos y escenarios.', 'Patente, CPT, capital y banco son magnitudes distintas.'],
    ['Operaciones', 'Cierres', 'Flujo de caja', 'Cierre anual', 'Patente']),
  caseStudy('K03', 'Descalce de caja y custodia de evidencia', 5,
    'La empresa vende con pago a 60 días y debe pagar proveedores y retenciones antes. En paralelo, faltan documentos de tres transferencias. El caso exige distinguir riesgo de liquidez, deuda vencida e insolvencia, y reconstruir evidencia sin fabricar respaldos.',
    [
      'Ventas por cobrar: $4.500.000, vencimiento promedio 52 días.',
      'Banco disponible: $620.000.',
      'Pagos próximos 30 días: $1.850.000.',
      'Tres cargos bancarios suman $410.000 y carecen de vínculo documental.',
      'Una obligación previsional está marcada por verificar.',
      'No existe conclusión profesional sobre insolvencia.'
    ],
    [
      { name: '1. Diagnóstico de caja', work: 'Construye flujo de 13 semanas con escenario base, cobro tardío y pérdida de cliente.' },
      { name: '2. Prioridades', work: 'Ordena obligaciones por vencimiento, consecuencia y capacidad; separa negociación de omisión.' },
      { name: '3. Evidencia', work: 'Abre excepciones por transferencias, preserva cartolas y solicita documentos sin inventar su causa.' },
      { name: '4. Escalamiento', work: 'Define umbrales para contador, abogado o asesor de insolvencia sin diagnosticar elegibilidad.' }
    ],
    ['¿Cuándo la alerta pasa de educativa a operación detenida?', '¿Qué pagos no pueden clasificarse con la cartola sola?', '¿Qué información falta para hablar de insolvencia?', '¿Cómo se conserva la cadena de custodia de los respaldos recuperados?'],
    ['La falta de caja próxima es una alerta demostrable; “quiebra” no lo es.', 'Los escenarios no se mezclan con saldos reales.', 'Las transferencias quedan pendientes con dueño y plazo.', 'La consulta concursal devuelve REQUIERE_VERIFICACION.', 'La remediación preserva archivos originales y bitácora.'],
    ['Flujo de caja', 'Continuidad', 'Alertas', 'Auditoría', 'Insolvencia']),
  caseStudy('K04', 'La operación que cuadraba y estaba mal', 5,
    'Una revisión encuentra un mes perfectamente balanceado: un préstamo fue registrado como venta, una compra personal como gasto y dos diferencias de RCV se compensaron. El caso demuestra que cuadrar es condición necesaria, no evidencia de corrección.',
    [
      'Abono bancario/préstamo: $2.000.000 registrado como ingreso.',
      'Compra personal: $220.000 registrada como gasto con IVA crédito.',
      'Factura faltante y duplicada: mismo neto, folios distintos.',
      'Debe = Haber y totales internos = totales del RCV.',
      'Cierre del mes ya emitido como snapshot inmutable.',
      'No hay indicio suficiente para afirmar conducta dolosa.'
    ],
    [
      { name: '1. Prueba de naturaleza', work: 'Reconstruye la causa de cada movimiento desde contrato, documento, beneficiario y contraparte.' },
      { name: '2. Prueba de detalle', work: 'Concilia por folio y detecta las diferencias compensadas.' },
      { name: '3. Corrección', work: 'Diseña asientos correctivos y versión nueva sin borrar el cierre original.' },
      { name: '4. Control preventivo', work: 'Rediseña aprobaciones, referencias y alertas para evitar repetición.' }
    ],
    ['¿Por qué el préstamo no es ingreso?', '¿Por qué la igualdad de totales no prueba integridad?', '¿Cómo se corrige un cierre inmutable?', '¿Qué puede afirmar el informe y qué no puede afirmar sobre intención?'],
    ['El préstamo aumenta activo y pasivo.', 'El gasto personal se separa y su IVA no se activa por el pago.', 'La conciliación por documento descubre compensaciones.', 'La corrección referencia el cierre previo en vez de eliminarlo.', 'El informe describe fallos y evidencia; no presume fraude.'],
    ['Diario', 'RCV', 'Cierres', 'Auditoría', 'Gobierno'])
]);

export function academyCase(id) {
  return ACADEMY_CASES.find(item => item.id === id) ?? null;
}
