/* OpsCrew section: KPIs and decision levers from the report (§2.4–2.6, Tables 9–13). */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const OBJECTIVES = ['Delivery speed', 'Delivery reliability', 'Price (cost)', 'Design quality', 'Conformance quality', 'Customisation', 'Variety (mix)', 'Plan (volume)', 'Service'];
const OBJ_SHORT = ['Speed', 'Reliab.', 'Cost', 'Design', 'Conform.', 'Custom.', 'Variety', 'Volume', 'Service'];

/* Table 13. kind: 'lead' = early warning, 'lag' = outcome, 'imp' = improvement target. bonus = used for cell bonuses (§2.5). */
export const KPIS = [
  { name: 'Saturation per stage', target: '≤ 75% MTO', target2: '≤ 85% MTS', def: 'Required load hours (incl. setups and scrap) ÷ available hours', freq: 'Weekly', kind: 'lead',
    why: 'Kingman: queues grow sharply above ~75%. The make-to-stock side can run higher because the module stock absorbs variability.' },
  { name: 'OEE of CNC machines', target: '≥ 75%', def: 'Availability × performance × quality rate (Nakajima)', freq: 'Weekly', kind: 'lead',
    why: 'One router and one fabric cutter: if either stops, the whole flow stops.' },
  { name: 'Order-to-delivery lead time', target: '≤ 10', unit: 'working days', def: 'Days from order confirmation to delivery', freq: 'Daily', kind: 'lag',
    why: 'Day 1 release, days 2–6 production, day 7 safety day, days 8–10 transport and home assembly.' },
  { name: 'On-time delivery', target: '≥ 95%', def: '% of orders delivered by the promised date', freq: 'Weekly', kind: 'lag', bonus: true,
    why: 'Reliability is an order loser. The safety day on day 7 is there to protect this number.' },
  { name: 'First pass yield', target: '≥ 96%', def: '% of pieces passing each stage without rework or scrap', freq: 'Daily', kind: 'lead', bonus: true,
    why: 'Every re-cut or re-sew eats the safety day and adds a setup at the cutter.' },
  { name: 'Setup time per order', target: '8 → 4', unit: 'min', def: 'Average setup at the fabric cutter', freq: 'Weekly', kind: 'imp',
    why: 'Setups are 26% of the cutter’s load. Halving them takes it from 83% to ≈ 72% and frees ≈ 184 h a year.' },
  { name: 'WIP in the MTO flow', target: '≤ 60', unit: 'orders', def: 'Orders in process (Little: 11.4 sofas/day × 5 days ≈ 57)', freq: 'Daily', kind: 'lead', bonus: true,
    why: 'WIP above 57 means lead time is growing, days before deliveries start to be late. Above 60, new releases wait in the pool.' },
  { name: 'Order pool level', target: '1–3', unit: 'days of capacity', def: 'Confirmed orders not yet released', freq: 'Daily', kind: 'lead', live: true,
    why: 'Above 3 days: overtime and later dates. Below 1 day: earlier dates and promotions (Table 11).' },
  { name: 'Decoupling stock coverage', target: '3–5', unit: 'days', target2: '0 stockouts', def: 'Days of consumption per module type; module stockouts', freq: 'Daily', kind: 'lead',
    why: 'One missing module type stops the whole order, however fast the downstream flow is.' },
  { name: 'Service KPIs', target: '< 24 h', target2: 'NPS ≥ 50 · claims < 2%', def: 'Response time to pre-sale requests; Net Promoter Score; return and claim rate', freq: 'Monthly', kind: 'lag',
    why: 'Service is a growing order winner: from 15 to about 25 of the 100 points by year 5.' },
];

const KIND = { lead: ['Early warning', 'lead'], lag: ['Outcome', 'lag'], imp: ['Improvement', 'imp'] };

/* Tables 9, 10 and 12. fx = effect on the 9 objectives in OBJECTIVES order: '+', '-', '±' or ''. */
export const LEVER_GROUPS = [
  { id: 'oc-structural', title: 'Structural levers', ref: 'Table 9 · §2.4', sub: 'What the plant can do', levers: [
    { name: 'Overall capacity', fx: ['+', '+', '-', '', '', '', '', '+', ''],
      choice: 'Capacity above average demand (leading strategy): ≤ 75% saturation in the make-to-order stages, ≤ 85% in the make-to-stock stages. One plant in Brianza, one shift (two on the CNC router), a partial second shift for the peak months.',
      rejected: 'Planning at 85–90% saturation: cheaper hours, but queues that break the 10-day promise.' },
    { name: 'Make or buy', fx: ['+', '', '±', '+', '+', '+', '+', '', ''],
      choice: 'Make the whole made-to-order loop (fabric cutting, sewing, upholstery) plus frames and foam. Buy the commodities: plywood, foam blocks, legs and pre-dyed fabrics from specialist mills (150 references).',
      rejected: 'Buying frames (supplier lead times and minimum order quantities); dyeing in-house (needs scale, permits and time).' },
    { name: 'Process technology', fx: ['+', '', '±', '', '+', '+', '+', '', ''],
      choice: 'All cutting on programmable machines. The fabric cutter receives a cutting file from the configurator for every order; the CNC router and foam cutter run standard programs for the 13 module types.',
      rejected: 'Manual cutting with templates (≈ 45 min per marker against 15); moulded foam, which needs a mould for every shape.' },
    { name: 'Automation level', fx: ['±', '', '-', '+', '', '+', '+', '', ''],
      choice: 'High in cutting, where the task is programmable. Low in frame assembly, sewing and upholstery, which stay skilled manual work because every order is different.',
      rejected: 'Automated sewing or robotic upholstery cells: with every order different, they would not pay back.' },
    { name: 'Plant layout', fx: ['+', '+', '', '', '+', '', '', '±', ''], link: ['#/inside', 'See the plant layout'],
      choice: 'Hybrid. Functional departments upstream for the 13 module types, made in batches. Product flow downstream: each order moves as one kit through cutting → sewing → upholstery → packing, with buffers of at most ½ day.',
      rejected: 'A functional layout downstream: orders would queue between departments and the pieces of one sofa would be split.' },
    { name: 'Supply chain configuration', fx: ['+', '+', '±', '', '', '', '+', '', '+'],
      choice: 'Brianza, next to the Como and Prato textile districts and 1–3 days by truck from the markets. Mills deliver in 48 h, two foam suppliers. Direct sales (web, showrooms, trade desk); a white-glove partner delivers and assembles.',
      rejected: 'Producing in Eastern Europe or Asia: cheaper labour, but one to several weeks of extra transport.' },
  ] },
  { id: 'oc-organisational', title: 'Organisational levers', ref: 'Table 10 · §2.5', sub: 'How much of that reaches the customer', levers: [
    { name: 'Competences', fx: ['+', '', '-', '+', '+', '+', '', '+', ''],
      choice: 'Dedicated specialists in the core roles (frames, foam, upholstery) plus 3 floaters cross-trained on sewing, upholstery, frame assembly and fabric cutting, tracked in a skill matrix. The floaters follow the bottleneck instead of overstaffing every cell.' },
    { name: 'Responsibility allocation', fx: ['+', '+', '', '', '+', '', '', '', ''],
      choice: 'Autonomous cells: each leader handles first-level quality control, minor maintenance and stop-and-escalate decisions. Release rules and WIP limits are set by the operations manager and cells cannot override them.' },
    { name: 'Teams vs individuals', fx: ['+', '', '', '', '', '+', '', '+', ''],
      choice: 'Individual stations for cutting, sewing and upholstery, with a colleague or floater to flip heavy modules. Design and configurator engineering work as a small team, so every new option can actually be built.' },
    { name: 'Objectives vs procedures', fx: ['', '+', '', '', '+', '+', '', '', ''],
      choice: 'Standard work and checklists in the make-to-stock stages and final QC, where work repeats. Management by objectives (on-time delivery, first pass yield) in the made-to-order cells, where every configuration is different.' },
    { name: 'Integration of functions', fx: ['', '+', '', '+', '', '', '', '+', '+'],
      choice: 'The 3D configurator feeds the ERP and the shop floor: each order creates its bill of materials and cutting file automatically, the order engineer checks it, and sales quotes dates with capable-to-promise logic.' },
    { name: 'Incentives', fx: ['', '+', '-', '', '+', '', '', '', '+'],
      choice: 'Bonuses paid per cell on on-time delivery, first pass yield and staying under the WIP cap.',
      rejected: 'Rewarding individual output or machine utilisation: cells would overload and start jobs early, making lead times longer (Kerr).' },
    { name: 'Information flows', fx: ['+', '+', '', '', '+', '', '', '', '+'], link: ['#/track?id=NC-DEMO', 'See the tracking page'],
      choice: 'Live order status on the shop-floor board, the managers’ KPI dashboard and the customer’s tracking page. Every department works from the same data, so the promised date is one the plant can meet.' },
  ] },
  { id: 'oc-planning', title: 'Planning & control levers', ref: 'Table 12 · §2.6', sub: 'How it runs every day', levers: [
    { name: 'Planning and control', fx: ['+', '+', '', '', '', '', '', '+', ''],
      choice: 'Two policies, one on each side of the decoupling point. Upstream: Kanban for the 13 module types (reorder point = use during replenishment + safety stock), stock raised May–July for the autumn peak. Downstream: a pre-shop order pool released at finite capacity.' },
    { name: 'How to meet demand', fx: ['+', '', '±', '', '', '+', '+', '', ''],
      choice: 'Assemble to order: modules made to stock, covers and upholstery made to order (postponement). 13 module types in stock instead of thousands of finished sofas, so nothing goes obsolete.' },
    { name: 'How to make the product', fx: ['+', '', '-', '', '', '+', '+', '', ''],
      choice: 'Batches of 25 upstream; one-order flow downstream. Orders due in the same period that use the same fabric are cut together, saving setups without delaying anyone.' },
    { name: 'Supply chain coordination', fx: ['+', '+', '±', '', '', '', '+', '', ''],
      choice: 'Long-term framework agreements. Foam blocks and plywood are vendor-managed (VMI). Mills keep the whole fabric library available in 48 h; NEWCO keeps a safety stock of the top 30 fabrics (≈ 70% of orders).' },
    { name: 'Maintenance', fx: ['', '+', '±', '', '+', '', '', '', ''],
      choice: 'Preventive maintenance on the CNC machines on Saturdays; operators clean and check blades and tools themselves (TPM). With one router and one cutter, a breakdown would stop the whole flow.' },
    { name: 'Quality and cost control', fx: ['', '+', '+', '', '+', '', '', '', '+'],
      choice: 'Fabric inspected on arrival for shade batch and defects, self-checks at every station, a final checklist, analysis of returns and complaints, and a monthly review of cost per sofa.' },
    { name: 'Continuous improvement', fx: ['+', '', '+', '', '+', '', '', '', ''],
      choice: 'Lean, driven by the KPIs: daily meetings at the KPI board and improvement workshops with the operators. First result: the next roll and cutting file are prepared while the cutter works, so setup drops from 8 to 4 min.' },
  ] },
];

/* Table 11 */
const POOL_BANDS = [
  { key: 'low', range: '< 1 day', sit: 'Low season or negative demand shock', act: 'Bring dates forward, promotions and price incentives, build module stock, training and maintenance.' },
  { key: 'normal', range: '1–3 days', sit: 'Normal', act: 'Standard release; promised date of 10 working days.' },
  { key: 'high', range: '> 3 days', sit: 'Peak or positive demand shock', act: 'Saturday overtime, temporary operators, cross-trained people moved to sewing and upholstery, promised dates extended by 2–3 days.' },
];

const WHY = [
  ['Why plan at 75% saturation and not 90%?', 'Delivery speed is the first order winner (35 of 100 points). At 90% each hour is cheaper, but Kingman’s rule says queues explode, and queues are exactly what breaks a 10-day promise. The idle capacity is the price of speed, and it also covers the November peak (+35%) with overtime alone.'],
  ['Why is every “−” on cost?', 'Price is a qualifier: NEWCO only has to stay inside the mid-range band (€1,200–2,500). Speed, customisation, design quality and service win the orders, so NEWCO accepts a higher cost per sofa to get them.'],
  ['Why a hybrid layout?', 'Upstream there are only 13 standard module types made in batches, so grouping machines by function works. Downstream every order is different: a product flow keeps the pieces of one sofa together as a kit and avoids queues between departments.'],
  ['Why make frames in-house when most of the industry buys them?', 'Kanban replenishes the 13 module types in small, frequent batches. A frame supplier’s lead times and minimum order quantities would clash with that.'],
  ['Why batches of 25 modules and not 4?', 'With batches of 4 the CNC router would sit at ≈ 96% and have no room to build summer stock; with 25 it stays at 75%. The extra cycle stock (≈ 12 units per type) is upstream of the decoupling point, so customers never wait for it.'],
  ['Why is the decoupling point after the padded modules?', 'The customer then waits only for covers and upholstery, about 5 production days. Stocking 13 module types instead of finished sofas means nothing goes obsolete and every fabric and layout stays possible.'],
  ['Why pay bonuses on delivery and not on output?', 'Rewarding output or utilisation makes cells overload themselves and start jobs early, which raises WIP and, by Little’s law, lead time. NEWCO sells speed, so it pays for on-time delivery, first pass yield and respect of the WIP cap.'],
];

const sign = (v) => (v === '+' ? ['+', 'pos', 'supports'] : v === '-' ? ['−', 'neg', 'penalises'] : v === '±' ? ['±', 'mix', 'mixed effect on'] : ['', '', '']);

function matrix(g) {
  return `<div class="oc-mx-scroll"><table class="oc-mx">
    <caption class="sr">${esc(g.title)}: effect of each lever on the nine performance objectives</caption>
    <thead><tr><th scope="col">Lever</th>${OBJ_SHORT.map((o, i) => `<th scope="col" title="${esc(OBJECTIVES[i])}">${esc(o)}</th>`).join('')}</tr></thead>
    <tbody>${g.levers.map((l) => `<tr><th scope="row">${esc(l.name)}</th>${l.fx.map((v, i) => { const [t, c, w] = sign(v); return `<td>${t ? `<span class="oc-fx ${c}" title="${esc(`${l.name} ${w} ${OBJECTIVES[i].toLowerCase()}`)}">${t}</span>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function leverCard(l) {
  const fx = l.fx.map((v, i) => [v, OBJECTIVES[i]]).filter(([v]) => v);
  return `<article class="oc-lever">
    <h3>${esc(l.name)}</h3>
    <p>${esc(l.choice)}</p>
    <div class="oc-chips">${fx.map(([v, o]) => { const [t, c] = sign(v); return `<span class="oc-chip ${c}"><b>${t}</b>${esc(o)}</span>`; }).join('')}</div>
    ${l.rejected ? `<p class="oc-rej"><b>Rejected:</b> ${esc(l.rejected)}</p>` : ''}
    ${l.link ? `<a class="arrow" href="${l.link[0]}">${esc(l.link[1])} →</a>` : ''}
  </article>`;
}

const liveTag = (l) => `<span class="opsp-st ${l.key}">Demo now: ${l.pool.toFixed(1)} days · ${esc(l.label)}</span>`;
const nowTag = (pool) => `<span class="oc-now">Demo now: ${pool.toFixed(1)} days</span>`;

function kpiCard(k, live) {
  const [kl, kc] = KIND[k.kind];
  return `<article class="oc-kpi">
    <div class="oc-kpi-top"><span class="oc-kind ${kc}">${kl}</span><span class="oc-freq">${esc(k.freq)}</span></div>
    <h3>${esc(k.name)}</h3>
    <div class="oc-target"><b>${esc(k.target)}</b>${k.unit ? `<span>${esc(k.unit)}</span>` : ''}</div>
    ${k.target2 ? `<div class="oc-target2">${esc(k.target2)}</div>` : ''}
    <p class="oc-def">${esc(k.def)}</p>
    <p class="oc-why">${esc(k.why)}</p>
    ${k.live && live ? `<p class="oc-live">${liveTag(live)}</p>` : ''}
    ${k.bonus ? '<span class="oc-bonus" title="Cell bonuses are paid on this KPI (§2.5)">Cell bonus</span>' : ''}
  </article>`;
}

export function opscrewPage({ pool, status }) {
  const live = { pool, key: status.key, label: status.label };
  const nav = [['oc-kpis', 'KPIs'], ...LEVER_GROUPS.map((g) => [g.id, g.title.replace(' levers', '')]), ['oc-pool', 'Order pool'], ['oc-fit', 'How it fits'], ['oc-why', 'Why these choices']];
  return `
  <section class="page-h wrap oc-head">
    <p class="eyebrow oc-eyebrow">OpsCrew · Group 6 · Behind the shop</p>
    <h1>The operations behind NEWCO</h1>
    <p class="lead">The KPIs we track and the 20 decision levers we chose, from our Assignment 2 report (§2.4–2.6, Tables 9–13). This part of the site is for the course, not for customers.</p>
    <div class="oc-jump" role="navigation" aria-label="On this page">${nav.map(([id, t]) => `<button class="chip" data-act="jump" data-v="${id}">${esc(t)}</button>`).join('')}</div>
  </section>

  <section class="wrap">
    <div class="oc-stats">
      <div><b>10</b><span>working days, door to door</span></div>
      <div><b>≥ 95%</b><span>delivered on the promised date</span></div>
      <div><b>≤ 75%</b><span>planned saturation, make-to-order stages</span></div>
      <div><b>≈ 18%</b><span>of production lead time is processing (≈ 7 h of 38.3 h), against 1–5% for custom competitors</span></div>
    </div>
  </section>

  <section class="wrap oc-sec" id="oc-kpis">
    <div class="sec-h"><div><p class="oc-ref">Table 13 · §2.6</p><h2>KPIs of the daily management system</h2></div><p>Ten KPIs, all checking one promise: delivery in 10 working days.</p></div>
    <div class="oc-chain" aria-label="How the KPIs drive each other">
      <div class="oc-node lead"><small>Setup time · First pass yield</small><b>Less lost capacity</b></div>
      <span class="oc-arr" aria-hidden="true">→</span>
      <div class="oc-node lead"><small>Saturation</small><b>≤ 75%</b></div>
      <span class="oc-arr" aria-hidden="true">→</span>
      <div class="oc-node lead"><small>WIP in MTO flow</small><b>≤ 60 orders</b></div>
      <span class="oc-arr" aria-hidden="true">→</span>
      <div class="oc-node lag"><small>Lead time</small><b>≤ 10 days</b></div>
      <span class="oc-arr" aria-hidden="true">→</span>
      <div class="oc-node lag"><small>On-time delivery</small><b>≥ 95%</b></div>
    </div>
    <p class="fine oc-chain-note">Early warnings (left) move days before the outcomes (right), so they are checked daily or weekly. The order pool and the module stock are the buffers on either side of the decoupling point.</p>
    <div class="oc-kpis">${KPIS.map((k) => kpiCard(k, live)).join('')}</div>
  </section>

  ${LEVER_GROUPS.map((g) => `
  <section class="wrap oc-sec" id="${g.id}">
    <div class="sec-h"><div><p class="oc-ref">${esc(g.ref)}</p><h2>${esc(g.title)}</h2></div><p>${esc(g.sub)}</p></div>
    <p class="oc-legend"><span><span class="oc-fx pos">+</span> supports the objective</span><span><span class="oc-fx neg">−</span> penalises it (trade-off)</span><span><span class="oc-fx mix">±</span> mixed effect</span><span>blank = no significant impact</span></p>
    ${matrix(g)}
    <div class="oc-levers">${g.levers.map(leverCard).join('')}</div>
  </section>`).join('')}

  <section class="wrap oc-sec" id="oc-pool">
    <div class="sec-h"><div><p class="oc-ref">Table 11 · §2.6</p><h2>Regulating the order pool</h2></div><p>The daily rule that turns the KPIs into actions.</p></div>
    <div class="oc-bands">${POOL_BANDS.map((b) => `<div class="oc-band ${b.key}${b.key === status.key ? ' on' : ''}" data-k="${b.key}"><b>${esc(b.range)}</b><span class="oc-sit">${esc(b.sit)}</span><p>${esc(b.act)}</p>${b.key === status.key ? nowTag(pool) : ''}</div>`).join('')}</div>
    <div class="oc-var">
      <h3>Managing variability</h3>
      <ul class="ticks">
        <li><b>Decoupling:</b> module stock upstream and the order pool downstream, so a sudden change in demand does not hit every stage at once.</li>
        <li><b>Capacity:</b> cross-training, Saturday overtime and temporary operators from October to January.</li>
        <li><b>Demand:</b> promotions and price incentives in the low season; delivery slots booked at checkout.</li>
      </ul>
      <p class="fine">About ±15% uncertainty is covered by planning at 75% saturation. Beyond that, customers are told as soon as the pool passes its limit. Try it with the slider in <button class="link" data-act="ops-on">Ops view</button>.</p>
    </div>
  </section>

  <section class="wrap oc-sec" id="oc-fit">
    <div class="sec-h"><div><p class="oc-ref">§2.7</p><h2>How it fits together</h2></div></div>
    <div class="oc-layers">
      <div><span>1</span><h3>Structural</h3><p>Create the capability: spare capacity, a flow layout downstream, suppliers 48 h away.</p></div>
      <div><span>2</span><h3>Organisational</h3><p>Make people use it the right way: floaters on the bottleneck, central WIP caps, bonuses on delivery instead of output.</p></div>
      <div><span>3</span><h3>Planning &amp; control</h3><p>Run it every day: Kanban upstream, the order pool downstream, maintenance and continuous improvement, steered by the KPIs.</p></div>
    </div>
    <p class="oc-note">Every <b>−</b> in Tables 9, 10 and 12 falls on <b>price (cost)</b>: capacity, automation, competences, incentives and one-order flow. Price is a qualifier and delivery speed the first order winner, so NEWCO pays for speed on purpose.</p>
  </section>

  <section class="wrap oc-sec" id="oc-why">
    <div class="sec-h"><div><p class="oc-ref">Trade-offs</p><h2>Why these choices</h2></div></div>
    <div class="oc-why">${WHY.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    <p class="fine">Source: Assignment 2, Operations Strategy, Operations Management 2026/27, Politecnico di Milano, Group 6 (OpsCrew). Numbers are the report’s estimates and assumptions.</p>
  </section>`;
}

/* Called when the Ops view pool slider moves while this page is open: update only the live bits. */
export function opscrewLive(root, { pool, status }) {
  root.querySelectorAll('.oc-band').forEach((b) => {
    const on = b.dataset.k === status.key;
    b.classList.toggle('on', on);
    b.querySelector('.oc-now')?.remove();
    if (on) b.insertAdjacentHTML('beforeend', nowTag(pool));
  });
  const l = root.querySelector('.oc-live');
  if (l) l.innerHTML = liveTag({ pool, key: status.key, label: status.label });
}
