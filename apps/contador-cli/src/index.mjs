#!/usr/bin/env node
/**
 * CLI de Empresa Operativa Chile.
 *
 * Dos familias de comandos:
 *
 *  - CÁLCULO puro (`venta`, `honorario`, `f29`, `patente`, `idpc`, `asiento`,
 *    `escenario`): no tocan disco, sirven para verificar un número a mano o
 *    dentro de un script.
 *  - ESPACIO DE TRABAJO (`registrar`, `resumen`, `cerrar`, `exportar`,
 *    `importar`, `bitacora`): operan sobre un directorio de datos en archivos.
 *    Es el mismo formato de respaldo que exportan la web, Android y Windows,
 *    así que la CLI puede leer lo que produjo el teléfono y viceversa.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  saleFromNet,
  purchaseFromNet,
  honorariumFromGross,
  f29Basic,
  f29DueDates,
  municipalPatent,
  calculateMunicipalPatent,
  calculateTaxEquity,
  idpcProPyme,
  simulateScenario,
  journal
} from '../../../packages/accounting-engine/index.mjs';
import { termsByCategory, searchTerms } from '../../../packages/glossary/index.mjs';
import { CompanyWorkspace, seedSandbox } from '../../../packages/company-operations/index.mjs';
import { loadRules, availableYears } from '../../../packages/chile-tax-rules/index.mjs';
import { validateRut } from '../../../packages/company-operations/rut.mjs';

const args = process.argv.slice(2);
const cmd = args[0] || 'ayuda';

const flag = name => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const num = (name, fallback = 0) => {
  const v = flag(name);
  return v === undefined ? fallback : Number(v);
};
const has = name => args.includes(`--${name}`);

const out = value => console.log(JSON.stringify(value, null, 2));
const fail = message => {
  console.error(`error: ${message}`);
  process.exit(1);
};

const dataRoot = () => flag('datos') || process.env.EMPRESA_OPERATIVA_DATA || path.resolve('.local-data');
const workspace = () => {
  const mode = has('sandbox') ? 'sandbox' : 'real';
  const root = dataRoot();
  if (mode === 'sandbox') seedSandbox(root);
  return new CompanyWorkspace({ rootDir: root, mode });
};

const AYUDA = `Empresa Operativa Chile — CLI

CÁLCULO (no toca disco)
  venta        --neto N [--anio 2026]
  compra       --neto N
  honorario    --bruto N
  f29          --ventas-netas N --compras-netas N [--remanente N] [--honorarios N]
  vencimientos --periodo YYYY-MM
  patente      --capital N [--tasa 0.0025] [--utm N]        (estimación rápida sobre una cifra dada)
  patente-municipal --etapa nueva|funcionamiento --anio 2026
               [--capital-inicial N] [--cpt N] [--tasa 0.0025] [--deducciones N] [--asignado N] [--utm N]
  cpt          --anio 2026 --regimen "Pro Pyme General (14 D N.º 3)"
               [--activos N] [--pasivos N] [--capital-aportado N] [--base-imponible N] [--perdidas N] [--retiros N]
  idpc         --ingresos N --gastos N [--ajustes N]
  asiento      --tipo sale|purchase|expense|honorarium|capital_contribution|shareholder_loan|shareholder_loan_repayment|owner_withdrawal|tax_payment --monto N
  escenario    archivo.json
  rut          76.123.456-7
  reglas       [--anio 2026]
  glosario     [término a buscar]

ESPACIO DE TRABAJO (archivos en --datos, por defecto ./.local-data)
  registrar    --fecha YYYY-MM-DD --tipo sale --descripcion "..." --neto N [--iva N] [--documento N]
  operaciones  [--periodo YYYY-MM]
  resumen      --periodo YYYY-MM
  obligaciones
  cerrar       --periodo YYYY-MM
  bitacora     [--limite 50]
  exportar     [--salida respaldo.json]
  importar     archivo.json [--fusionar]

OPCIONES GLOBALES
  --sandbox    trabaja sobre el entorno de práctica en vez de la empresa real
  --datos DIR  directorio de datos

Las reglas tributarias vienen de packages/chile-tax-rules/rules/<anio>.json.
Años disponibles: ${availableYears().join(', ')}.`;

const anio = () => num('anio', 2026);

try {
  switch (cmd) {
    /* ------------------------------------------------------- cálculo --- */
    case 'ayuda':
    case '--help':
    case '-h':
      console.log(AYUDA);
      break;

    case 'venta':
      out(saleFromNet(num('neto'), anio()));
      break;

    case 'compra':
      out(purchaseFromNet(num('neto'), anio()));
      break;

    case 'honorario':
      out(honorariumFromGross(num('bruto'), anio()));
      break;

    case 'f29':
      out(
        f29Basic(
          {
            salesNet: num('ventas-netas'),
            purchasesNet: num('compras-netas'),
            previousVatCredit: num('remanente'),
            honorariaGross: num('honorarios')
          },
          anio()
        )
      );
      break;

    case 'vencimientos':
      out(f29DueDates(flag('periodo') ?? new Date().toISOString().slice(0, 7), anio()));
      break;

    case 'patente':
      out(
        municipalPatent(
          { capital: num('capital'), rate: has('tasa') ? num('tasa') : undefined, utm: has('utm') ? num('utm') : undefined },
          anio()
        )
      );
      break;

    // A diferencia de `patente`, este comando decide qué capital corresponde
    // usar según la etapa de la empresa, que es la bifurcación del art. 24.
    case 'patente-municipal': {
      const etapa = flag('etapa');
      if (!['nueva', 'funcionamiento'].includes(etapa)) fail('indica --etapa nueva|funcionamiento');
      out(
        calculateMunicipalPatent({
          businessStage: etapa === 'nueva' ? 'NEW_BUSINESS' : 'ESTABLISHED_BUSINESS',
          year: anio(),
          initialOwnCapital: has('capital-inicial') ? num('capital-inicial') : undefined,
          taxEquity: has('cpt') ? num('cpt') : undefined,
          deductibleInvestments: num('deducciones'),
          allocatedCapital: has('asignado') ? num('asignado') : undefined,
          municipalRate: has('tasa') ? num('tasa') : undefined,
          utm: has('utm') ? num('utm') : undefined,
          utmPeriod: flag('utm-periodo')
        })
      );
      break;
    }

    case 'cpt':
      out(
        calculateTaxEquity({
          fiscalYear: anio(),
          taxRegime: flag('regimen') ?? '',
          assets: has('activos') ? num('activos') : undefined,
          liabilities: has('pasivos') ? num('pasivos') : undefined,
          nonEffectiveValues: num('valores-sin-inversion'),
          equityMovements: {
            capitalEnteradoPorMovimientos: num('capital-aportado'),
            disminucionesDeCapital: num('disminuciones'),
            retiros: num('retiros')
          },
          operations: {
            taxableBase: has('base-imponible') ? num('base-imponible') : undefined,
            losses: num('perdidas'),
            participationIncome: num('participaciones'),
            article21Paid: num('art21')
          },
          method: flag('metodo')
        })
      );
      break;

    case 'glosario': {
      const query = args.slice(1).filter(a => !a.startsWith('--')).join(' ');
      out(
        query
          ? searchTerms(query).map(t => ({ id: t.id, termino: t.term, resumen: t.short, definicion: t.long, noConfundirCon: t.notToConfuseWith ?? [], baseLegal: t.legalReference ?? null }))
          : termsByCategory().map(g => ({ categoria: g.category, terminos: g.terms.map(t => ({ id: t.id, termino: t.term, resumen: t.short })) }))
      );
      break;
    }

    case 'idpc':
      out(idpcProPyme({ incomeReceived: num('ingresos'), expensesPaid: num('gastos'), adjustments: num('ajustes') }, anio()));
      break;

    case 'asiento':
      out(journal({ type: flag('tipo'), amount: num('monto') }, anio()));
      break;

    case 'escenario': {
      const file = args[1];
      if (!file) fail('indica el archivo del escenario');
      out(simulateScenario(JSON.parse(fs.readFileSync(file, 'utf8')), anio()));
      break;
    }

    case 'rut': {
      const value = args[1];
      if (!value) fail('indica el RUT a validar');
      const r = validateRut(value);
      out(r);
      if (!r.valid) process.exitCode = 1;
      break;
    }

    case 'reglas':
      out(loadRules(anio()));
      break;

    /* --------------------------------------------- espacio de trabajo --- */

    case 'registrar': {
      const ws = workspace();
      const neto = num('neto');
      const tx = ws.addTransaction({
        date: flag('fecha'),
        kind: flag('tipo'),
        description: flag('descripcion') ?? '',
        net: neto,
        vat: has('iva') ? num('iva') : Math.round(neto * loadRules(anio()).iva.generalRate),
        documentNumber: flag('documento'),
        counterpartyRut: flag('rut'),
        paid: has('pagado')
      });
      out(tx);
      break;
    }

    case 'operaciones': {
      const ws = workspace();
      const periodo = flag('periodo');
      out(ws.listTransactions().filter(t => !periodo || t.date.startsWith(periodo)));
      break;
    }

    case 'resumen': {
      const ws = workspace();
      const periodo = flag('periodo') ?? new Date().toISOString().slice(0, 7);
      const s = ws.periodSummary(periodo);
      out({
        ...s,
        remanenteEntrante: ws.vatCarryForwardInto(periodo),
        f29: f29Basic(
          {
            salesNet: s.salesNet,
            purchasesNet: s.purchasesNet,
            debitVat: s.debitVat,
            creditVat: s.creditVat,
            previousVatCredit: ws.vatCarryForwardInto(periodo),
            honorariaGross: s.honorariaGross
          },
          anio()
        )
      });
      break;
    }

    case 'obligaciones':
      out(workspace().listObligations());
      break;

    case 'cerrar': {
      const periodo = flag('periodo');
      if (!periodo) fail('indica --periodo YYYY-MM');
      out(workspace().closePeriod(periodo, { cli: true }));
      break;
    }

    case 'bitacora': {
      const limite = num('limite', 50);
      out(workspace().listAudit().slice(-limite));
      break;
    }

    case 'exportar': {
      const payload = JSON.stringify(workspace().exportAll(), null, 2);
      const destino = flag('salida');
      if (destino) {
        fs.writeFileSync(destino, payload);
        console.log(`Respaldo escrito en ${destino}`);
      } else {
        console.log(payload);
      }
      break;
    }

    case 'importar': {
      const file = args[1];
      if (!file) fail('indica el archivo de respaldo');
      out(workspace().importAll(JSON.parse(fs.readFileSync(file, 'utf8')), { replace: !has('fusionar') }));
      break;
    }

    default:
      console.error(`Comando desconocido: ${cmd}\n`);
      console.error(AYUDA);
      process.exit(1);
  }
} catch (error) {
  fail(error.message);
}
