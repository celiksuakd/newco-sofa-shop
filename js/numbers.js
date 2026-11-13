/* Numbers page: every key figure of the Assignment 2 report on one page.
   Values marked calc are worked out from the report's own tables (Tables 5 and 7), not printed in it. */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const calc = '<span class="nb-calc" title="Calculated from the report’s tables, not printed in the report">calc.</span>';
const AVG = 2500 / 220; // sofas per working day ≈ 11.4

const KEY = [
  ['2,500', 'sofas a year'],
  ['11.4', 'sofas per working day'],
  ['10', 'working days, door to door'],
  ['≥ 95%', 'delivered on the promised date'],
  ['≤ 75%', 'saturation, make-to-order stages'],
  ['≤ 85%', 'saturation, make-to-stock stages'],
  ['≈ 15', 'sofas a day: sewing’s limit on one shift'],
  ['57 → 60', 'orders in process (11.4 × 5 days), cap'],
  ['1–3 days', 'of capacity in the order pool'],
  ['34', 'people: 27 direct + 7 indirect'],
];

const HOURS = [
  ['Working days', '<b>220</b> a year (closed in August and at Christmas)'],
  ['Shift', '8 h minus 20 min of breaks = <b>460 min ≈ 7.67 h</b>'],
  ['Available per station and shift', '220 × 460 min ≈ <b>1,687 h</b> a year'],
  ['CNC router (2 shifts)', '<b>3,374 h</b> a year'],
  ['Days a person is present', '<b>≈ 200</b> a year → 220 ÷ 200 = <b>1.10</b> people per post'],
  ['Hours per person', `≈ <b>1,533 h</b> a year ${calc}`],
  ['Work per sofa', '≈ <b>12 h</b> in total, ≈ <b>7 h</b> in the make-to-order stages'],
  ['Total required load', '≈ <b>30,700 h</b> a year (incl. scrap, setups, order engineering)'],
  ['Availability', '90% CNC machines · 95% manual stations'],
];

/* Table 7. sat in %, target in %, res = resources. */
const STAGES = [
  { side: 'Make-to-order', target: 75, rows: [
    ['Order engineering', '1 person', 57],
    ['Fabric cutting', '1 machine', 72, 83],
    ['Sewing', '7 stations', 75, null, true],
    ['Upholstery', '5 stations', 67],
    ['QC, packing, shipping', '2 stations', 55],
  ] },
  { side: 'Make-to-stock', target: 85, rows: [
    ['Frame CNC router', '1 machine × 2 shifts', 75],
    ['Frame assembly', '4 stations', 82],
    ['Foam CNC cutting', '1 machine', 75],
    ['Foam gluing / wrapping', '2 stations', 81],
  ] },
];

const KINGMAN = [[75, '3'], [85, '5.7'], [90, '9'], [95, '19']];

const MONTHS = [['Jan', 1.20], ['Feb', 0.95], ['Mar', 1.05], ['Apr', 1.00], ['May', 0.90], ['Jun', 0.85], ['Jul', 0.70], ['Aug', 0.60], ['Sep', 1.15], ['Oct', 1.20], ['Nov', 1.35], ['Dec', 1.05]];

const POOL = [
  ['low', '< 1 day', 'Lowest', 'Dates brought forward, promotions, build module stock, training and maintenance.'],
  ['normal', '1–3 days', 'Normal', 'Standard release and the 10-working-day promise.'],
  ['high', '> 3 days', 'Peak', 'Overtime, temporary operators, floaters to sewing and upholstery, dates +2–3 days.'],
];

const TARGETS = [
  ['Saturation', '≤ 75% MTO · ≤ 85% MTS', 'Weekly'],
  ['OEE of CNC machines', '≥ 75%', 'Weekly'],
  ['Order-to-delivery lead time', '≤ 10 working days', 'Daily'],
  ['On-time delivery', '≥ 95%', 'Weekly'],
  ['First-pass yield', '≥ 96%', 'Daily'],
  ['Fabric cutter setup', '8 → 4 min (frees 184 h a year)', 'Weekly'],
  ['WIP in the make-to-order flow', '≤ 60 orders', 'Daily'],
  ['Order pool', '1–3 days of capacity', 'Daily'],
  ['Module stock coverage', '3–5 days, 0 stockouts', 'Daily'],
  ['Pre-sale response', '< 24 h', 'Monthly'],
  ['Net Promoter Score', '≥ 50', 'Monthly'],
  ['Returns and claims', '< 2%', 'Monthly'],
];

const LADDER = [['rel', 'Day 1', 'Validation and release'], ['prod', 'Days 2–6', 'Production'], ['safe', 'Day 7', 'Safety day'], ['ship', 'Days 8–10', 'Transport and home assembly']];
const PHASE = ['rel', 'prod', 'prod', 'prod', 'prod', 'prod', 'safe', 'ship', 'ship', 'ship'];

/* Table 2, in weeks. Chains sell from stock (days). */
const RIVALS = [
  ['NEWCO', 2, 2, '10 working days', true],
  ['Generalist chains', 0.2, 1, 'days, from stock'],
  ['Upholstery specialists', 4, 8, '4–8 weeks'],
  ['Online DTC brands', 6, 8, '6–8 weeks door to door'],
  ['Italian craft brands', 8, 16, '8–16 weeks'],
];

const STOCK = [
  ['Module types', '<b>13</b> (10 seats, 3 armrests)'],
  ['Use per module type', '≈ <b>4.4</b> a day'],
  ['Batch size', 'Q = <b>25</b>'],
  ['Replenishment time', '<b>2 days</b> (θ ≈ 8.7 modules)'],
  ['Safety stock', '<b>1 day</b> of use'],
  ['Reorder point', 'r ≈ <b>13</b>'],
  ['Average stock', '≈ <b>17</b> per type ≈ <b>220</b> modules ≈ <b>4 days</b>; ≈ <b>350</b> after the build-up'],
  ['Built ahead of the autumn peak', '≈ <b>130</b> modules'],
  ['Router minimum batch', '≈ <b>3–4</b>; batches of 4 would push the router to 96%'],
  ['Fabrics', 'top <b>30</b> kept in stock (≈ 70% of orders); mills deliver in <b>48 h</b>'],
  ['Scrap rates', 'cutting 3% · sewing 4% · upholstery 3% · router 3% · frame assembly 2% · foam CNC 4% · gluing 2%'],
];

const PEOPLE = [['CNC router', 2], ['Frame assembly', 4], ['Foam', 3], ['Fabric cutting', 1], ['Sewing', 7], ['Upholstery', 5], ['QC, packing', 2], ['Floaters', 3]];

const FUNNEL = [
  ['Global sofa market', '€95.6 bn', 'USD 109.9 bn'],
  ['Europe', '€19.1 bn', '≈ 20%'],
  ['Italy, France, DACH, Benelux', '€9.6 bn', '50%'],
  ['Sectional sofas', '€2.75 bn', '28.76%'],
  ['Mid-range price band', '€1.26 bn', '45.66%'],
  ['Configurable / made to order', '€0.25 bn', '20% · ≈ 139,000 sofas'],
  ['NEWCO, end of year 2', '2,500 sofas', '1.8% of the niche'],
];

const MARKET = [
  ['Revenue', '<b>€4.5 m</b> (2,500 × €1,800), ≈ 7% of SOFACOMPANY’s €67 m'],
  ['Price', '<b>€1,800</b>, inside the €1,200–2,500 mid-range band'],
  ['Share of all European sofa sales', '≈ <b>0.02%</b>'],
  ['Channels', 'web <b>75%</b> · showrooms (Milan, Munich) <b>10%</b> · trade desk <b>15%</b> (≈ 375 orders)'],
  ['Customers', '<b>85%</b> private, aged 28–45'],
  ['Product', '<b>40</b> fabric families, ≈ <b>150</b> colours · 10-year frame warranty · 30-day colour guarantee'],
  ['Order losers', 'delivery reliability, conformance quality'],
  ['Qualifier', 'price (strong)'],
  ['By year 5', 'speed ≈ 20, service ≈ 25, price becomes an order winner (≈ 10)'],
];

const WINNERS = [['Delivery speed', 35], ['Customisation', 30], ['Design quality', 20], ['Service', 15]];

const dl = (rows) => `<dl class="nb-dl">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const head = (id, ref, title, sub = '') => `<div class="sec-h"><div><p class="oc-ref">${ref}</p><h2>${title}</h2></div>${sub ? `<p>${sub}</p>` : ''}</div>`;

function stageTable() {
  const rows = STAGES.map((g) => `
    <tr class="nb-grp"><th colspan="4" scope="colgroup">${g.side} stages · target ≤ ${g.target}%</th></tr>
    ${g.rows.map(([name, res, sat, before, bott]) => {
      const max = g.side === 'Make-to-order' ? `≈ ${Math.round(AVG / (sat / 100))}` : '<span class="muted">stock</span>';
      const tip = `${name}: ${before ? `${before}% today, ` : ''}${sat}% saturation, target ${g.target}%`;
      return `<tr${bott ? ' class="nb-bott"' : ''}>
        <th scope="row">${esc(name)}${bott ? ' <span class="nb-tag">bottleneck</span>' : ''}</th>
        <td>${esc(res)}</td>
        <td><div class="nb-meter" title="${esc(tip)}" style="--v:${sat}%;--t:${g.target}%${before ? `;--b:${before}%` : ''}">
          ${before ? '<i class="nb-before"></i>' : ''}<i class="nb-fill"></i><i class="nb-target"></i></div>
          <span class="nb-pct">${before ? `${before}% → ` : ''}<b>${sat}%</b></span></td>
        <td class="nb-num">${max}</td>
      </tr>`;
    }).join('')}`).join('');
  return `<div class="nb-scroll"><table class="nb-cap">
    <caption class="sr">Saturation per stage against its target, and the most sofas a day each make-to-order stage could handle at 100%</caption>
    <thead><tr><th scope="col">Stage</th><th scope="col">Resources</th><th scope="col">Saturation <span class="nb-key-t">▏target</span></th><th scope="col">Max sofas/day at 100% ${calc}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="fine">Fabric cutting is 83% today and ≈ 72% once its setup is halved (pale bar → solid bar). The make-to-stock stages are covered by the module stock, not by daily capacity.</p>`;
}

function seasonChart() {
  const top = 18;
  const lim = AVG / 0.75; // sewing at 100%
  const bars = MONTHS.map(([m, i]) => {
    const v = i * AVG;
    const cls = i === 1.35 ? ' hi' : i === 0.6 ? ' lo' : '';
    const tip = `${m}: index ${i.toFixed(2)} · ≈ ${v.toFixed(1)} sofas/day · sewing ≈ ${Math.round(75 * i)}%`;
    return `<div class="nb-col${cls}" title="${esc(tip)}" tabindex="0" aria-label="${esc(tip)}">
      <span class="nb-cv">${cls ? v.toFixed(1) : ''}</span>
      <i style="height:${(v / top) * 100}%"></i><span class="nb-cm">${m}</span></div>`;
  }).join('');
  return `<figure class="nb-season">
    <div class="nb-lkey"><span><i class="lim"></i>≈ 15 a day: sewing at 100% on one shift</span><span><i class="avg"></i>11.4 a day: average</span><span>Hover a month, or open the table below</span></div>
    <figcaption class="sr">Sofas per working day by month (seasonal index × 11.4), with the average and sewing’s one-shift limit</figcaption>
    <div class="nb-plot">
      <div class="nb-line lim" style="bottom:${(lim / top) * 100}%"></div>
      <div class="nb-line avg" style="bottom:${(AVG / top) * 100}%"></div>
      ${bars}
    </div>
  </figure>
  <details class="nb-tbl"><summary>Show as a table</summary>
    <div class="nb-scroll"><table class="nb-small"><thead><tr><th scope="col">Month</th>${MONTHS.map(([m]) => `<th scope="col">${m}</th>`).join('')}</tr></thead><tbody>
      <tr><th scope="row">Index</th>${MONTHS.map(([, i]) => `<td>${i.toFixed(2)}</td>`).join('')}</tr>
      <tr><th scope="row">Sofas/day ${calc}</th>${MONTHS.map(([, i]) => `<td>${(i * AVG).toFixed(1)}</td>`).join('')}</tr>
      <tr><th scope="row">Sewing ${calc}</th>${MONTHS.map(([, i]) => `<td>${Math.round(75 * i)}%</td>`).join('')}</tr>
    </tbody></table></div></details>`;
}

function rivals() {
  const max = 16;
  return `<div class="nb-rivals" role="list">${RIVALS.map(([n, a, b, label, me]) => `
    <div class="nb-rv${me ? ' me' : ''}" role="listitem" title="${esc(`${n}: ${label}`)}">
      <span class="nb-rn">${esc(n)}</span>
      <span class="nb-rt"><i style="left:${(a / max) * 100}%;width:${Math.max(((b - a) / max) * 100, 1.2)}%"></i></span>
      <span class="nb-rl">${esc(label)}</span>
    </div>`).join('')}
    <div class="nb-rv nb-axis" aria-hidden="true"><span></span><span class="nb-rt">${[0, 4, 8, 12, 16].map((w) => `<em style="left:${(w / max) * 100}%">${w}${w === 16 ? ' wk' : ''}</em>`).join('')}</span><span></span></div>
  </div>`;
}

export function numbersPage() {
  const nav = [['nb-key', 'Key figures'], ['nb-hours', 'Hours'], ['nb-cap', 'Capacity'], ['nb-season', 'Highest & lowest'], ['nb-targets', 'Targets'], ['nb-lead', 'Lead time'], ['nb-stock', 'Stock'], ['nb-people', 'People'], ['nb-market', 'Market']];
  return `
  <section class="page-h wrap oc-head">
    <p class="eyebrow oc-eyebrow">OpsCrew · Group 6 · Numbers</p>
    <h1>NEWCO in numbers</h1>
    <p class="lead">The figures behind the operations plan in our Assignment 2 report: how many hours we can work, where the capacity limits are, the highest and lowest months, and the targets we want to hit. Figures marked ${calc} are calculated from the report’s tables.</p>
    <div class="oc-jump" role="navigation" aria-label="On this page">${nav.map(([id, t]) => `<button class="chip" data-act="jump" data-v="${id}">${esc(t)}</button>`).join('')}</div>
  </section>

  <section class="wrap oc-sec" id="nb-key">
    ${head('nb-key', 'The ten to remember', 'Key figures')}
    <div class="nb-tiles">${KEY.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
  </section>

  <section class="wrap oc-sec" id="nb-hours">
    ${head('nb-hours', '§2.3 · Table 7 · Table 8', 'How many hours we can work')}
    ${dl(HOURS)}
  </section>

  <section class="wrap oc-sec" id="nb-cap">
    ${head('nb-cap', '§2.3 · Table 7', 'Capacity per stage', 'Saturation = required hours (incl. setups and scrap) ÷ available hours.')}
    ${stageTable()}
    <div class="nb-limits">
      <div><b>≈ 15</b><span>sofas a day on one shift: the normal limit, set by sewing</span></div>
      <div><b>≈ 2×</b><span>average load in sewing with every peak lever: overtime, Saturdays, floaters, temporary workers</span></div>
      <div><b>≈ 122%</b><span>of average demand: make-to-stock capacity, plus ≈ 130 modules built ahead of the peak</span></div>
    </div>
    <div class="nb-king">
      <h3>Why 75%: Kingman’s queue factor u ÷ (1 − u)</h3>
      <div class="nb-kq">${KINGMAN.map(([u, q]) => `<div${u === 75 ? ' class="on"' : ''}><span>at ${u}%</span><b>${q}</b></div>`).join('')}</div>
      <p class="fine">Waiting time grows with this factor. Going from 75% to 90% triples the queue.</p>
    </div>
  </section>

  <section class="wrap oc-sec" id="nb-season">
    ${head('nb-season', 'Table 5 · §2.3', 'Highest and lowest demand', 'Seasonal index × 11.4 sofas a day.')}
    ${seasonChart()}
    <div class="nb-hl">
      <div class="hi"><span>Highest · November</span><b>1.35 → ≈ 15.3 a day</b><p>Sewing ≈ 101%, upholstery ≈ 90%, cutter ≈ 97%. A partial second shift on the cutter from October to January brings it to ≈ 77%.</p></div>
      <div class="lo"><span>Lowest · August</span><b>0.60 → ≈ 6.8 a day</b><p>Sewing ≈ 45% ${calc}. Time for promotions, training and maintenance.</p></div>
      <div><span>On top of the season</span><b>±15% a week</b><p>Uncertainty around the forecast. If cycle times were 20% longer: make-to-order stages 80–89%, frame assembly and gluing ≈ 97%.</p></div>
    </div>
    <h3 class="nb-sub">Order pool rules (Table 11)</h3>
    <div class="oc-bands">${POOL.map(([k, r, s, a]) => `<div class="oc-band ${k}"><b>${r}</b><span class="oc-sit">${s}</span><p>${a}</p></div>`).join('')}</div>
  </section>

  <section class="wrap oc-sec" id="nb-targets">
    ${head('nb-targets', 'Table 13 · §2.6', 'Numbers that make us happy', 'The KPI targets of the daily management system.')}
    <div class="nb-targets">${TARGETS.map(([k, t, f]) => `<div><span>${esc(k)}</span><b>${esc(t)}</b><small>${f}</small></div>`).join('')}</div>
  </section>

  <section class="wrap oc-sec" id="nb-lead">
    ${head('nb-lead', '§1.4 · §2.2', 'Lead time', '10 working days from order confirmation to the customer’s home.')}
    <div class="nb-ladder" aria-label="The 10 working days">${PHASE.map((p, i) => `<div class="${p}"><b>${i + 1}</b></div>`).join('')}</div>
    <div class="nb-legend">${LADDER.map(([c, d, t]) => `<span><i class="${c}"></i><b>${d}</b> ${t}</span>`).join('')}</div>
    <p class="fine">Orders confirmed by 14:00 are released the next morning.</p>
    <div class="nb-split">
      <div class="nb-pt">
        <h3>Production: 38.3 h, of which ≈ 7 h processing</h3>
        <div class="nb-ptbar" title="≈ 7 h processing of 38.3 h production lead time (≈ 18%)"><i style="width:18%"></i></div>
        <p class="fine">5 days × 7.67 h = 38.3 h. Processing is ≈ <b>18%</b> of it, against 1–5% for custom competitors. Little’s law: 11.4 sofas a day × 5 days = <b>57</b> orders in process.</p>
      </div>
      <div>
        <h3>Against the competitors (Table 2)</h3>
        ${rivals()}
      </div>
    </div>
  </section>

  <section class="wrap oc-sec" id="nb-stock">
    ${head('nb-stock', '§2.3 · §2.6', 'Stock at the decoupling point')}
    ${dl(STOCK)}
  </section>

  <section class="wrap oc-sec" id="nb-people">
    ${head('nb-people', 'Table 8', 'People', '24 posts × 1.10 = 26.4 → 27 direct people.')}
    <div class="nb-people">${PEOPLE.map(([n, c]) => `<div><b>${c}</b><span>${esc(n)}</span></div>`).join('')}<div class="tot"><b>27</b><span>Direct</span></div></div>
    <p class="nb-ind"><b>+ 7 indirect:</b> operations manager, order engineer, planner, quality and maintenance technician, warehouse, 2 design consultants. <b>Total 34.</b></p>
  </section>

  <section class="wrap oc-sec" id="nb-market">
    ${head('nb-market', '§1.1–1.6 · Tables 3 and 4', 'Market and customer')}
    <ol class="nb-funnel">${FUNNEL.map(([n, v, s], i) => `<li style="--w:${100 - i * 9}%"><span class="nb-fn">${esc(n)}</span><b>${esc(v)}</b><small>${esc(s)}</small></li>`).join('')}</ol>
    <div class="nb-split nb-mk">
      ${dl(MARKET)}
      <div>
        <h3>Order winners (100 points)</h3>
        <div class="nb-ow">${WINNERS.map(([n, p]) => `<div title="${esc(`${n}: ${p} points`)}"><span>${esc(n)}</span><span class="nb-owt"><i style="width:${(p / 35) * 100}%"></i></span><b>${p}</b></div>`).join('')}</div>
      </div>
    </div>
    <p class="fine">Source: Assignment 2, Operations Strategy, Operations Management 2026/27, Politecnico di Milano, Group 6 (OpsCrew). Numbers are the report’s estimates and assumptions. <a href="#/opscrew">See the KPIs and levers →</a></p>
  </section>`;
}
