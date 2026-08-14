import { loadRules } from '../packages/chile-tax-rules/index.mjs';
const r=loadRules(2026); const errors=[];
if(r.iva.generalRate!==0.19) errors.push('IVA 2026 esperado 19%');
if(r.honorarios.retentionRate!==0.1525) errors.push('Retención honorarios 2026 esperada 15,25%');
if(r.ppmProPyme.initialYearRate!==0.0025) errors.push('PPM inicial Pro Pyme esperado 0,25%');
if(!r.lastVerified) errors.push('Falta lastVerified');
if(errors.length){console.error(errors.join('\n'));process.exit(1)} console.log(`Reglas ${r.commercialYear} validadas; última verificación ${r.lastVerified}`);
