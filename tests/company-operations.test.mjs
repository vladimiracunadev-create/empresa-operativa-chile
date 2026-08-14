import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CompanyWorkspace, seedSandbox } from '../packages/company-operations/index.mjs';

test('real y sandbox nunca comparten operaciones',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'company-ws-'));
  const real=new CompanyWorkspace({rootDir:root,mode:'real'}); const sb=seedSandbox(root);
  real.addTransaction({date:'2026-08-01',kind:'sale',description:'Real',net:100,vat:19,total:119});
  assert.equal(real.listTransactions().length,1); assert.ok(sb.listTransactions().length>1);
  assert.equal(sb.listTransactions().some(x=>x.description==='Real'),false);
});

test('resumen mensual discrimina ventas y crédito IVA elegible',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'company-ws-')); const ws=new CompanyWorkspace({rootDir:root,mode:'real'});
  ws.addTransaction({date:'2026-08-02',kind:'sale',description:'Venta',net:100000,vat:19000,total:119000});
  ws.addTransaction({date:'2026-08-03',kind:'expense',description:'Gasto',net:50000,vat:9500,total:59500,vatCreditEligible:true});
  const s=ws.periodSummary('2026-08'); assert.equal(s.salesNet,100000);assert.equal(s.debitVat,19000);assert.equal(s.creditVat,9500);
});

test('cierre de período deja snapshot y estado cerrado',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'company-ws-')); const ws=new CompanyWorkspace({rootDir:root,mode:'real'});
  ws.addTransaction({date:'2026-08-02',kind:'sale',description:'Venta',net:100000,vat:19000,total:119000});
  const c=ws.closePeriod('2026-08',{bank:true,rcv:true}); assert.equal(c.period,'2026-08'); assert.equal(ws.isPeriodClosed('2026-08'),true);
});

test('constitución exige evidencia separada por paso',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'company-ws-')); const ws=new CompanyWorkspace({rootDir:root,mode:'real'});
  const before=ws.listFormationSteps(); assert.equal(before.some(x=>x.id==='res'),true);
  ws.updateFormationStep({id:'res',status:'done',evidenceRef:'CERT-TEST-001'});
  const after=ws.listFormationSteps().find(x=>x.id==='res'); assert.equal(after.status,'done');assert.equal(after.evidenceRef,'CERT-TEST-001');
});
