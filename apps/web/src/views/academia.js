import { html, raw, fmtCLP, fmtPercent } from '../lib/dom.js';
import { state, ws, setMode } from '../lib/state.js';
import { saleFromNet, honorariumFromGross, journal } from '../core/accounting-engine/index.mjs';
import { loadRules } from '../core/chile-tax-rules/index.mjs';
import { openExternal } from '../lib/platform.js';

/**
 * Explicaciones ancladas a la operación real.
 *
 * La academia usa los MISMOS cálculos que el resto de la app —no textos
 * escritos aparte que con el tiempo dejen de coincidir con el motor—. Si la
 * tasa de retención cambia en `rules/`, esta página lo dice sola.
 */
const QA = rules => [
  [
    '¿Por qué una compra genera IVA crédito y otra no?',
    `El IVA soportado sólo es crédito fiscal si la compra es del giro, está respaldada por un documento válido y la ley no lo excluye.
     Un almuerzo personal pagado con la cuenta de la empresa sale plata igual, pero su IVA no es recuperable y su neto no es gasto deducible.
     Por eso cada operación tiene dos casillas separadas: <em>IVA con derecho a crédito</em> y <em>gasto deducible</em>.`
  ],
  [
    '¿Por qué un retiro no es un gasto?',
    `Un gasto es un sacrificio necesario para producir la renta de la empresa. Un retiro es el accionista sacando plata para sí mismo:
     reduce el patrimonio, no el resultado. En el asiento se ve claro — se debita <code>Cuenta accionista / retiros</code> y se acredita <code>Banco</code>,
     sin tocar ninguna cuenta de resultado.`
  ],
  [
    '¿Qué es el PPM y por qué lo pago si aún no gano nada?',
    `El Pago Provisional Mensual es un anticipo a cuenta del impuesto anual, calculado sobre los ingresos brutos, no sobre la utilidad.
     Se paga aunque el mes cierre con pérdida. En la Operación Renta se descuenta del impuesto final y, si sobró, se devuelve.
     Con la tasa Pro Pyme inicial (${fmtPercent(rules.ppmProPyme.initialYearRate)}), una venta de ${fmtCLP(1000000)} genera ${fmtCLP(2500)} de PPM.`
  ],
  [
    '¿Qué es el remanente de crédito fiscal?',
    `Cuando el IVA crédito de un mes supera al débito, no se pierde ni te lo devuelven: queda como remanente y se usa el mes siguiente.
     Es lo típico al partir, cuando compras equipamiento antes de facturar. Esta app arrastra el remanente automáticamente de un período
     al siguiente; lo que <strong>no</strong> hace es reajustarlo, y eso está declarado como limitación.`
  ],
  [
    '¿Por qué la app no marca sola un trámite como cumplido?',
    `Porque calcular no es presentar. La app distingue seis estados: calculado, preparado, conciliado, presentado, pagado y evidenciado.
     Puede llegar sola hasta "calculado". El salto a "presentado" ocurre en el portal del organismo, y sólo lo prueba el comprobante que tú registres.
     Una app que se marque sola las tareas como hechas te da tranquilidad, no cumplimiento.`
  ],
  [
    '¿Qué evidencia debo guardar y por cuánto tiempo?',
    `Como mínimo: documentos tributarios emitidos y recibidos, comprobantes de declaración y pago, cartolas bancarias y los certificados de constitución.
     El criterio práctico es poder reconstruir cualquier cifra declarada sin depender de la memoria ni de un sistema externo que quizá ya no exista.`
  ]
];

export default {
  id: 'academia',
  label: 'Academia',
  title: 'Academia y sandbox',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4 2 9l10 5 10-5-10-5z"/><path d="M6 11.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/></svg>',

  render() {
    const rules = loadRules(2026);
    const venta = saleFromNet(1000000);
    const honorario = honorariumFromGross(250000);
    const asientoVenta = journal({ type: 'sale', amount: 1000000 });
    const sandboxOps = ws('sandbox').listTransactions().length;

    return html`
      <div class="page__head">
        <h1>Academia</h1>
        <p>Las mismas reglas y el mismo motor que operan tu empresa, explicados. Para practicar sin riesgo, cambia a <strong>SANDBOX</strong>.</p>
      </div>

      ${state.mode === 'real'
        ? raw(html`<div class="note note--warn"><span class="note__icon">!</span>
            <p>Estás en <strong>EMPRESA REAL</strong>. Para experimentar con una empresa ficticia ya cargada (${sandboxOps} operaciones de ejemplo), cambia de entorno.
            <button class="btn btn--sm" data-to-sandbox style="margin-left:8px">Ir al sandbox</button></p></div>`)
        : raw(html`<div class="note note--ok"><span class="note__icon">✓</span>
            <p>Estás en <strong>SANDBOX</strong>. Rompe lo que quieras: nada de aquí toca la empresa real.</p></div>`)}

      <div class="grid grid--2" style="margin-top:14px">
        <div class="card">
          <div class="card__head"><h2>Una venta, paso a paso</h2></div>
          <p class="card__hint">Servicio facturado por ${fmtCLP(venta.net)} netos, IVA al ${fmtPercent(venta.rate)}.</p>
          <div class="tablewrap" style="margin-top:8px">
            <table>
              <thead><tr><th>Debe</th><th>Haber</th><th class="num">Monto</th></tr></thead>
              <tbody>
                ${raw(asientoVenta.map(a => html`
                  <tr><td>${a.debit}</td><td>${a.credit}</td><td class="num">${fmtCLP(a.amount)}</td></tr>
                  <tr><td colspan="3"><span class="card__hint">${a.explanation}</span></td></tr>`).join(''))}
              </tbody>
            </table>
          </div>
          <div class="note note--info" style="margin-top:10px"><span class="note__icon">i</span>
            <p>El total cobrado al cliente es ${fmtCLP(venta.total)}, pero el ingreso de la empresa es ${fmtCLP(venta.net)}.
            Los ${fmtCLP(venta.iva)} restantes son IVA que estás recaudando <em>para el fisco</em>: nunca fueron tuyos.</p></div>
        </div>

        <div class="card">
          <div class="card__head"><h2>Un honorario, paso a paso</h2></div>
          <p class="card__hint">Boleta de honorarios por ${fmtCLP(honorario.gross)} brutos.</p>
          <div class="tablewrap" style="margin-top:8px">
            <table>
              <tbody>
                <tr><td>Bruto de la boleta</td><td class="num">${fmtCLP(honorario.gross)}</td></tr>
                <tr><td>Retención (${fmtPercent(honorario.rate)})</td><td class="num">${fmtCLP(honorario.retention)}</td></tr>
                <tr><td><strong>Líquido al prestador</strong></td><td class="num"><strong>${fmtCLP(honorario.liquid)}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div class="note note--info" style="margin-top:10px"><span class="note__icon">i</span>
            <p>La empresa paga ${fmtCLP(honorario.liquid)} al prestador y entera ${fmtCLP(honorario.retention)} al fisco en su F29.
            El costo total sigue siendo ${fmtCLP(honorario.gross)}: olvidar la retención es el error clásico que aparece como deuda meses después.</p></div>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Preguntas que aparecen operando</h2></div>
        ${raw(QA(rules).map(([q, a]) => html`
          <details class="qa"><summary>${q}</summary><div class="qa__body"><p>${raw(a)}</p></div></details>`).join(''))}
      </div>

      <div class="card">
        <div class="card__head"><h2>Fuentes oficiales</h2></div>
        <p class="card__hint">Reglas del año comercial ${rules.commercialYear}, verificadas el ${rules.lastVerified}. Cuando algo de esta app y el SII no coincidan, manda el SII.</p>
        <div class="btn__row" style="margin-top:10px">
          <button class="btn btn--sm" data-ext="https://www.sii.cl/">Servicio de Impuestos Internos</button>
          <button class="btn btn--sm" data-ext="https://www.registrodeempresasysociedades.cl/">Registro de Empresas y Sociedades</button>
          <button class="btn btn--sm" data-ext="https://www.sii.cl/portales/emprendedor/">Portal Emprendedor</button>
          <button class="btn btn--sm" data-ext="https://www.sii.cl/destacados/modernizacion/regimenes_mt.html">Regímenes tributarios</button>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Material extendido</h2></div>
        <p class="card__hint">
          El repositorio incluye un currículo con laboratorios y casos completos en <code>curriculum/</code>, <code>labs/</code> y <code>cases/</code>,
          pensados para practicar en el sandbox antes de tocar la contabilidad real.
        </p>
      </div>`;
  },

  mount(root, rerender) {
    root.querySelector('[data-to-sandbox]')?.addEventListener('click', () => {
      setMode('sandbox');
      rerender(true);
    });
    root.querySelectorAll('[data-ext]').forEach(b =>
      b.addEventListener('click', () => openExternal(b.dataset.ext))
    );
  }
};
