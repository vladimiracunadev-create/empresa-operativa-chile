import test from 'node:test';
import assert from 'node:assert/strict';
import { f29Basic, f29DueDates, honorariumFromGross, journal } from '../packages/accounting-engine/index.mjs';

test('con IVA declarado usa los documentos y no la tasa derivada', () => {
  // Una venta exenta y una nota de crédito hacen que el IVA real no sea el 19%
  // del neto. Si el motor recalculara, le cobraría al usuario un IVA que no debe.
  const derived = f29Basic({ salesNet: 1000000, purchasesNet: 300000 });
  const declared = f29Basic({ salesNet: 1000000, purchasesNet: 300000, debitVat: 95000, creditVat: 57000 });
  assert.equal(derived.debitVat, 190000);
  assert.equal(derived.origin, 'derivado');
  assert.equal(declared.debitVat, 95000);
  assert.equal(declared.origin, 'documentos');
  assert.equal(declared.vatPayable, 38000);
});

test('el remanente de crédito fiscal se arrastra al período siguiente', () => {
  const mesConRemanente = f29Basic({ salesNet: 100000, purchasesNet: 1000000 });
  assert.equal(mesConRemanente.vatPayable, 0);
  assert.equal(mesConRemanente.nextVatCredit, 171000);

  const mesSiguiente = f29Basic({ salesNet: 1000000, purchasesNet: 0, previousVatCredit: mesConRemanente.nextVatCredit });
  assert.equal(mesSiguiente.availableCreditVat, 171000);
  assert.equal(mesSiguiente.vatPayable, 19000);
});

test('el borrador siempre declara sus limitaciones', () => {
  const x = f29Basic({ salesNet: 500000, purchasesNet: 100000 });
  assert.ok(x.limitations.length >= 2);
  assert.ok(x.limitations.some(l => /derivado de los netos/i.test(l)));
});

test('los montos negativos se rechazan en vez de propagarse', () => {
  assert.throws(() => f29Basic({ salesNet: -1 }), /salesNet/);
  assert.throws(() => f29Basic({ salesNet: 0, creditVat: -5 }), /creditVat/);
  assert.throws(() => honorariumFromGross(-1), /gross/);
});

test('los vencimientos del F29 se calculan sobre el mes siguiente al período', () => {
  const d = f29DueDates('2026-08');
  assert.equal(d.general.date.slice(0, 7), '2026-09');
  assert.ok(d.internetWithoutPayment.date > d.internetWithPayment.date);
  assert.ok(d.internetWithPayment.date > d.general.date);
});

test('un vencimiento en fin de semana se traslada y lo informa', () => {
  // 2026-11-12 cae jueves; buscamos un período cuyo día 12 caiga sábado o domingo.
  const finDeSemana = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12']
    .map(p => f29DueDates(p))
    .find(d => d.general.shiftedFromWeekend);
  assert.ok(finDeSemana, 'ningún vencimiento del año cae en fin de semana');
  const day = new Date(`${finDeSemana.general.date}T00:00:00Z`).getUTCDay();
  assert.ok(day >= 1 && day <= 5, 'el traslado no llegó a día hábil');
  assert.equal(finDeSemana.checkHolidays, true);
});

test('el período debe venir en formato YYYY-MM', () => {
  assert.throws(() => f29DueDates('agosto'), /YYYY-MM/);
});

test('el honorario separa líquido y retención en el asiento', () => {
  const entries = journal({ type: 'honorarium', amount: 250000 });
  const retencion = entries.find(e => /Retenciones/.test(e.credit));
  assert.equal(retencion.amount, 38125);
  assert.equal(entries.reduce((a, e) => a + e.amount, 0), 250000);
});
