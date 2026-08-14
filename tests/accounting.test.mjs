import test from 'node:test'; import assert from 'node:assert/strict';
import { saleFromNet, honorariumFromGross, f29Basic, municipalPatent, idpcProPyme, journal } from '../packages/accounting-engine/index.mjs';

test('venta 100.000 -> IVA 19.000',()=>{const x=saleFromNet(100000);assert.equal(x.iva,19000);assert.equal(x.total,119000)});
test('honorario 250.000 -> retención 15,25%',()=>{const x=honorariumFromGross(250000);assert.equal(x.retention,38125);assert.equal(x.liquid,211875)});
test('F29 básico combina IVA + PPM + retención',()=>{const x=f29Basic({salesNet:1000000,purchasesNet:300000,honorariaGross:250000});assert.equal(x.debitVat,190000);assert.equal(x.currentCreditVat,57000);assert.equal(x.vatPayable,133000);assert.equal(x.ppm,2500);assert.equal(x.honorariaWithholding,38125);assert.equal(x.estimatedF29Payment,173625)});
test('patente pequeña respeta mínimo 1 UTM agosto 2026',()=>{const x=municipalPatent({capital:1000000});assert.equal(x.annualPatent,71649)});
test('IDPC educativo 12,5%',()=>{const x=idpcProPyme({incomeReceived:2000000,expensesPaid:1000000});assert.equal(x.base,1000000);assert.equal(x.estimatedIdpc,125000)});
test('retiro no se registra como gasto',()=>{const [x]=journal({type:'owner_withdrawal',amount:100000});assert.match(x.debit,/accionista/i)});
