import * as C from './data.js';
import * as M from './model.js';

const { eur, fmtDate } = M;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');

/* ---------------- state ---------------- */
const KEY = 'newco-demo-v1';
const blank = () => ({ cart: [], samples: [], orders: [], draft: M.defaultConfig(), region: 'IT', ops: false, pool: null });
let S = blank();
try { S = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* private mode */ }
if (!S.draft || !S.draft.room) S.draft = M.defaultConfig();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } };
const pool = () => (S.pool ?? M.seasonalPool());
const ui = { step: 0, view: '3d', sel: null, target: 'all', fam: 'all', viewer: null, trackShift: 0 };

function toast(msg) {
  $$('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------------- shared bits ---------------- */
const ops = (sec, title, text) => `data-ops="${esc(sec)}|${esc(title)}|${esc(text)}"`;

function decorateOps(root = document) {
  $$('[data-ops]', root).forEach((el) => {
    if (el.querySelector(':scope > .ops-tag')) return;
    const [sec, title, text] = el.dataset.ops.split('|');
    const t = document.createElement('span');
    t.className = 'ops-tag';
    t.tabIndex = 0;
    t.innerHTML = `<b>${sec}</b> ${title}<span class="ops-pop"><b>${sec} · ${title}</b>${text}</span>`;
    el.appendChild(t);
  });
}

function swatch(ref, size = 18) {
  const c = C.colorOf(ref);
  return `<span class="sw" style="--c:${c.hex};width:${size}px;height:${size}px" title="${esc(c.fam.name)} · ${esc(c.name)}"></span>`;
}

function shapeIcon(shape) {
  const r = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5"/>`;
  const parts = {
    straight: r(4, 10, 32, 10),
    'chaise-left': r(4, 10, 32, 10) + r(4, 10, 10, 20),
    'chaise-right': r(4, 10, 32, 10) + r(26, 10, 10, 20),
    'corner-left': r(4, 10, 32, 10) + r(4, 10, 10, 24),
    'corner-right': r(4, 10, 32, 10) + r(26, 10, 10, 24),
    u: r(4, 10, 32, 10) + r(4, 10, 10, 22) + r(26, 10, 10, 22),
  };
  return `<svg viewBox="0 0 40 40" class="shape-ic" aria-hidden="true">${parts[shape]}</svg>`;
}

// Top-down drawing of the sofa, optionally inside the room (§1.2: the customer draws the layout on the floor plan).
function planSVG(cfg, { room = true, sel = null } = {}) {
  const L = M.buildLayout(cfg);
  const RW = room ? cfg.room.wall : L.W;
  const RD = room ? cfg.room.depth : L.Dt;
  const ox = !room ? 0 : cfg.room.pos === 'left' ? 0 : cfg.room.pos === 'right' ? RW - L.W : (RW - L.W) / 2;
  const pad = room ? 46 : 6;
  const minX = Math.min(0, ox) - pad, maxX = Math.max(RW, ox + L.W) + pad;
  const minY = -pad, maxY = Math.max(RD, L.Dt) + pad;
  const out = [];
  if (room) {
    out.push(`<rect x="0" y="0" width="${RW}" height="${RD}" class="pl-floor"/>`);
    out.push(`<path d="M0 ${RD} V0 H${RW} V${RD}" class="pl-wall"/>`);
    out.push(`<text x="${RW / 2}" y="-14" class="pl-t">Wall ${RW} cm</text>`);
    out.push(`<text x="${RW + 16}" y="${RD / 2}" class="pl-t" transform="rotate(90 ${RW + 16} ${RD / 2})">Room ${RD} cm</text>`);
  }
  for (const p of L.pieces) {
    const x = ox + p.cx - p.fw / 2, y = p.cz - p.fd / 2;
    const fab = C.colorOf(M.pieceFabric(cfg, p, 'body')).hex;
    const cush = C.colorOf(M.pieceFabric(cfg, p, 'cushion')).hex;
    const isSel = sel === p.id;
    out.push(`<g class="pl-piece${isSel ? ' sel' : ''}" data-piece="${p.id}"><title>${esc(M.pieceLabel(p))}</title>`);
    out.push(`<rect x="${x + 1}" y="${y + 1}" width="${p.fw - 2}" height="${p.fd - 2}" rx="${p.kind === 'arm' && cfg.arm === 'rounded' ? 12 : 5}" fill="${fab}" class="pl-body"/>`);
    if (p.kind !== 'arm') {
      // seat cushion area (everything except the back strips)
      const bt = 20;
      let cx = x + 3, cy = y + 3, cw = p.fw - 6, ch = p.fd - 6;
      const backs = [];
      if (p.kind === 'corner') backs.push('top', p.side === 'right' ? 'right' : 'left');
      else if (p.kind !== 'ottoman') backs.push(p.rot === 0 ? 'top' : p.rot > 0 ? 'left' : 'right');
      if (backs.includes('top')) { cy += bt; ch -= bt; }
      if (backs.includes('left')) { cx += bt; cw -= bt; }
      if (backs.includes('right')) { cw -= bt; }
      out.push(`<rect x="${cx}" y="${cy}" width="${Math.max(cw, 1)}" height="${Math.max(ch, 1)}" rx="5" fill="${cush}" class="pl-cush"/>`);
      if (room && p.fw > 50 && p.fd > 50) out.push(`<text x="${cx + cw / 2}" y="${cy + ch / 2 + 4}" class="pl-code">${M.moduleCode(p, cfg)}</text>`);
    }
    out.push('</g>');
  }
  if (room) {
    const yb = Math.max(L.Dt, 0) + 18;
    out.push(`<path d="M${ox} ${yb} H${ox + L.W}" class="pl-dim"/><text x="${ox + L.W / 2}" y="${yb + 15}" class="pl-t dim">${L.W} cm</text>`);
    const walk = RD - L.Dt;
    if (walk > 30) {
      const xm = Math.min(Math.max(ox + L.W / 2, 30), RW - 30);
      out.push(`<path d="M${xm + 40} ${L.Dt + 34} V${RD - 4}" class="pl-dim ${walk < 90 ? 'warn' : ''}"/><text x="${xm + 48}" y="${(L.Dt + 34 + RD) / 2 + 4}" class="pl-t dim start">${walk} cm to walk</text>`);
    }
  }
  return `<svg class="plan-svg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" role="img" aria-label="Floor plan of the sofa">${out.join('')}</svg>`;
}

function sofaTitle(cfg) {
  const L = M.buildLayout(cfg);
  return `${C.SHAPES[cfg.shape]} sofa, ${L.W} × ${L.sofaDepth} cm`;
}
function sofaDesc(cfg) {
  const b = C.colorOf(cfg.fabric);
  const parts = [`${b.fam.name}, ${b.name}`];
  if (cfg.cushion) { const c = C.colorOf(cfg.cushion); parts.push(`cushions in ${c.fam.name} ${c.name}`); }
  const ov = Object.keys(cfg.overrides || {}).length;
  if (ov) parts.push(`${ov} module${ov > 1 ? 's' : ''} in a contrast fabric`);
  parts.push(`${C.COMFORT[cfg.comfort].name.toLowerCase()} comfort`);
  parts.push(`${C.LEG_FINISHES[cfg.legFinish].name.toLowerCase()} ${C.LEG_SHAPES[cfg.legShape].name.toLowerCase()} legs`);
  if (cfg.trim !== 'none') parts.push(C.TRIMS[cfg.trim].name.toLowerCase());
  if (cfg.monogram) parts.push(`monogram "${esc(cfg.monogram.toUpperCase())}"`);
  return parts.join(' · ');
}

function cartCount() { return S.cart.reduce((n, i) => n + (i.qty || 1), 0); }
function renderHeader() {
  const n = cartCount();
  $('#cart-count').textContent = n;
  $('#cart-count').hidden = !n;
  const route = (location.hash.slice(2).split(/[/?]/)[0]) || '';
  $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === route));
  document.body.classList.toggle('ops', !!S.ops);
  $('#ops-toggle').setAttribute('aria-pressed', S.ops ? 'true' : 'false');
  renderOpsPanel();
}

function renderOpsPanel() {
  const el = $('#ops-panel');
  if (!S.ops) { el.hidden = true; return; }
  el.hidden = false;
  el.classList.toggle('min', !!S.opsMin);
  if (!el.dataset.built) {
    el.innerHTML = `
    <div class="opsp-h"><b>Ops view</b><span class="opsp-mini" id="opsp-mini"></span><span class="opsp-btns"><button class="x" data-act="ops-min" aria-label="Minimise or expand the ops panel" title="Minimise / expand">–</button><button class="x" data-act="ops-off" aria-label="Turn off ops view" title="Turn off ops view">×</button></span></div>
    <p class="opsp-s">Purple <span class="ops-tag mini"><b>§</b></span> tags link each feature to a section of our report. Hover or tap one. Below is the pre-shop order pool that drives the promised dates (Table 11).</p>
    <label class="opsp-l">Order pool: <b id="opsp-v"></b> of MTO capacity
      <input type="range" min="0.4" max="5" step="0.1" data-act="pool" aria-label="Order pool in days of capacity"></label>
    <div id="opsp-dyn"></div>`;
    el.dataset.built = '1';
  }
  const p = pool();
  const st = M.poolStatus(p);
  const now = new Date();
  const month = now.toLocaleDateString('en-GB', { month: 'long' });
  const pr = M.promise(now, S.region, p);
  const inp = el.querySelector('input');
  if (document.activeElement !== inp) inp.value = p;
  $('#opsp-v').textContent = `${p.toFixed(1)} days`;
  $('#opsp-mini').textContent = `pool ${p.toFixed(1)} d · ${st.key}`;
  el.querySelector('[data-act=ops-min]').textContent = S.opsMin ? '+' : '–';
  $('#opsp-dyn').innerHTML = `
    <div class="opsp-st ${st.key}">${st.label}</div>
    <p class="opsp-s">${st.action}</p>
    <dl class="opsp-dl">
      <dt>Seasonal index, ${month}</dt><dd>${C.SEASON[now.getMonth()].toFixed(2)}</dd>
      <dt>Promise today (${C.REGIONS[S.region].name})</dt><dd>${pr.totalDays} working days → ${fmtDate(pr.delivery)}</dd>
      <dt>WIP cap in MTO flow</dt><dd>≤ 60 orders (Little: 11.4 × 5 ≈ 57)</dd>
    </dl>
    ${S.pool != null ? '<button class="link" data-act="pool-reset">Back to the seasonal value</button>' : `<p class="fine">Starts at 2 days × the ${month} index. Drag to simulate a demand shock.</p>`}`;
}

/* ---------------- views ---------------- */
const routes = {};

routes[''] = () => {
  const pr = M.promise(new Date(), S.region, pool());
  const presets = Object.entries(C.PRESETS).map(([k, p]) => {
    const cfg = M.presetConfig(k);
    return `<a class="preset" href="#/design?preset=${k}">
      <div class="preset-plan">${planSVG(cfg, { room: false })}</div>
      <div class="preset-b"><h3>${p.title}</h3><p>${p.blurb}</p>
      <div class="preset-f"><span>from <b>${eur(M.priceOf(cfg).total)}</b></span><span class="arrow">Customise →</span></div></div></a>`;
  }).join('');
  const comp = [
    ['Generalist chains', 'Days, but only standard models', 3, 'muted'],
    ['Upholstery specialists', '4–8 weeks', 40, ''],
    ['Online DTC brands', '6–8 weeks door to door', 49, ''],
    ['Italian craft brands', '8–16 weeks', 84, ''],
    ['NEWCO, made to your design', '10 working days', 14, 'us'],
  ].map(([n, t, d, cls]) => `<div class="bar ${cls}"><span class="bar-n">${n}</span><span class="bar-track"><span style="width:${(d / 84) * 100}%"></span></span><span class="bar-t">${t}</span></div>`).join('');
  const sw = C.FABRICS.flatMap((f) => f.colors.slice(0, 3).map((_, i) => `${f.id}:${i}`)).slice(0, 24);
  return `
  <section class="hero">
    <img src="assets/hero.jpg" alt="A NEWCO modular sofa with a chaise longue in a light living room">
    <div class="hero-in">
      <p class="eyebrow">Made to order in Brianza, Italy</p>
      <h1>Your sofa, designed by you.<br>At your home in 10 working days.</h1>
      <p class="lead">Measure your room, build your sofa from our modules and choose from 150 fabrics. We make it in five days and our crew assembles it in your living room.</p>
      <div class="cta-row"><a class="btn primary lg" href="#/design">Design your sofa</a><a class="btn ghost lg" href="#/fabrics">Order free samples</a></div>
      <p class="promise" ${ops('§2.1', 'Capable-to-promise', 'The date is computed live from the capacity booked in the make-to-order stages and the transit time to the region. Orders confirmed by 14:00 are checked the same day.')}>
        <span class="dot"></span> ${M.isWorkingDay(new Date()) && new Date().getHours() < 14 ? 'Order by 14:00 today' : 'Order today'}, delivered to ${C.REGIONS[S.region].name} by <b>${fmtDate(pr.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}</b></p>
    </div>
  </section>

  <section class="strip">
    <div><b>10 working days</b><span>from order to assembled sofa</span></div>
    <div><b>100,000+</b><span>combinations from 13 modules</span></div>
    <div><b>Free samples</b><span>at your door in 48 h</span></div>
    <div><b>10-year</b><span>frame warranty</span></div>
    <div><b>Removable covers</b><span>washable and replaceable</span></div>
  </section>

  <section class="wrap">
    <div class="sec-h"><h2>Start from a layout</h2><p>Every layout changes to fit your wall. Pick one and make it yours.</p></div>
    <div class="presets">${presets}</div>
  </section>

  <section class="wrap how" ${ops('§2.1–2.2', 'Selling and production process', 'Front office: configurator, samples, consultants and delivery crew. Back office: one plant in Brianza. Day 1 validation, days 2–6 production, day 7 safety day, days 8–10 delivery.')}>
    <div class="sec-h"><h2>How it works</h2></div>
    <ol class="steps">
      <li><span>1</span><h3>Measure your room</h3><p>Enter your wall and room size. The configurator puts together seats and armrests that fit.</p></li>
      <li><span>2</span><h3>Design it in 3D</h3><p>Choose the layout, fabric, comfort, legs and details. You see the price and delivery date as you go.</p></li>
      <li><span>3</span><h3>We make it in 5 days</h3><p>Your padded modules are ready in our workshop. We cut, sew and fit your covers to order.</p></li>
      <li><span>4</span><h3>Delivered and assembled</h3><p>Pick a 2-hour slot. Our crew carries it in, assembles it and takes the packaging away.</p></li>
    </ol>
  </section>

  <section class="band">
    <div class="wrap two">
      <div><p class="eyebrow">Fast or custom? Now both.</p><h2>Most custom sofas take two to four months.</h2>
        <p>Shops are fast but sell standard models. Custom makers are slow. We keep the padded base modules ready and make only your covers to order, so a sofa designed for your room arrives in two weeks.</p>
        <a class="btn ghost" href="#/inside">See how we make it</a></div>
      <div class="bars" ${ops('Table 2', 'Competitive map', 'Lead times of the competitor groups from the report. Nobody else is strong on speed and customisation together.')}>${comp}<p class="fine">Typical door-to-door lead times in Europe.</p></div>
    </div>
  </section>

  <section class="wrap two fabrics-teaser">
    <div class="sw-grid">${sw.map((r) => swatch(r, 46)).join('')}</div>
    <div><p class="eyebrow">Fabric library</p><h2>150 colours. Touch them first.</h2>
      <p>Linen blends, bouclé, velvet, recycled weaves and stain-resistant performance fabrics, all from mills in Como and Prato. Order up to six samples for free. They arrive in 48 hours.</p>
      <a class="btn primary" href="#/fabrics">Browse fabrics</a></div>
  </section>

  <section class="wrap cards3">
    <a class="card" href="#/care" ${ops('§1.2', 'Modularity', 'Spare covers, extra modules and new layouts after a move create repeat business and limit returns.')}><h3>A sofa that moves with you</h3><p>Add a module, change the layout after a move or order a fresh cover. Every part is sold separately.</p><span class="arrow">Care and parts →</span></a>
    <a class="card" href="#/advice"><h3>Talk to a designer</h3><p>Book a free video call or visit our showrooms in Milan and Munich to try the comfort levels.</p><span class="arrow">Book a consultation →</span></a>
    <a class="card" href="#/trade"><h3>For hotels, offices and designers</h3><p>Fixed dates for your opening, matching shades across pieces and your own fabric if you need it.</p><span class="arrow">Trade desk →</span></a>
  </section>`;
};

/* ---------- configurator ---------- */
const STEPS = ['Room', 'Layout', 'Fabric', 'Details', 'Review'];

routes.design = (q) => {
  if (q.get('preset')) { S.draft = M.presetConfig(q.get('preset')); save(); history.replaceState(null, '', '#/design'); ui.step = 1; }
  if (q.get('edit')) {
    const it = S.cart.find((i) => i.id === q.get('edit'));
    if (it) { S.draft = structuredClone(it.cfg); S.editing = it.id; save(); }
    history.replaceState(null, '', '#/design');
  } else delete S.editing;
  ui.sel = null;
  return `
  <section class="design">
    <div class="stage">
      <div class="stage-top">
        <div class="seg" role="tablist">
          <button data-act="view" data-v="3d" class="${ui.view === '3d' ? 'on' : ''}">3D view</button>
          <button data-act="view" data-v="plan" class="${ui.view === 'plan' ? 'on' : ''}">Floor plan</button>
        </div>
        <span class="hint" id="hint">Drag to turn · click a module to select it</span>
      </div>
      <div class="view3d" id="view3d" ${ui.view !== '3d' ? 'hidden' : ''}><div class="loading">Loading 3D…</div></div>
      <div class="plan" id="plan" ${ui.view !== 'plan' ? 'hidden' : ''}></div>
      <div class="fitline" id="fitline"></div>
      <div class="buybar" id="buybar"></div>
    </div>
    <aside class="panel">
      <nav class="stepnav" id="stepnav"></nav>
      <div class="panel-body" id="panel"></div>
    </aside>
  </section>`;
};

function afterDesign() {
  refreshDesign(true);
  const host = $('#view3d');
  import('./sofa3d.js').then(({ createViewer }) => {
    if (!host.isConnected) return;
    host.innerHTML = '';
    try {
      ui.viewer = createViewer(host, { onPick: (id) => { ui.sel = id; if (id) { ui.target = 'module'; } refreshDesign(ui.step === 2); } });
      ui.viewer.update(S.draft, ui.sel);
    } catch (e) {
      host.innerHTML = '<div class="loading">3D is not available in this browser. The floor plan shows your sofa.</div>';
    }
  }).catch(() => { host.innerHTML = '<div class="loading">Could not load the 3D viewer (offline?). Use the floor plan.</div>'; });
}

function refreshDesign(panel = true) {
  const cfg = S.draft;
  save();
  if (ui.viewer) ui.viewer.update(cfg, ui.sel);
  $('#plan').innerHTML = planSVG(cfg, { sel: ui.sel });
  const fc = M.fitCheck(cfg);
  $('#fitline').innerHTML = fc.issues.map((i) => `<span class="fit ${i.level}">${esc(i.text)}</span>`).join('') +
    `<span class="dims">${fc.W} × ${fc.sofaDepth} cm · seat height ${M.seatHeight(cfg)} cm</span>`;
  const price = M.priceOf(cfg);
  const pr = M.promise(new Date(), S.region, pool());
  $('#buybar').innerHTML = `
    <div class="bb-price" ${ops('§1.5', 'Price is a qualifier', 'NEWCO stays inside the mid-range band (€1,200–2,500). Inside the band price does not win orders, above it customers do not buy.')}><span>Your price</span><b>${eur(price.total)}</b><small>incl. VAT, delivery and assembly</small></div>
    <div class="bb-date" ${ops('§2.5', 'Capable-to-promise', 'The date uses the real load of each stage plus transit to the region. When the order pool is above 3 days of capacity the promise is extended (Table 11).')}><span>Delivered and assembled by</span><b>${fmtDate(pr.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
      <small>to <select data-act="region" aria-label="Delivery country">${Object.entries(C.REGIONS).map(([k, r]) => `<option value="${k}" ${k === S.region ? 'selected' : ''}>${r.name}</option>`).join('')}</select> · ${pr.totalDays} working days</small></div>
    <button class="btn primary lg" data-act="add-sofa">${S.editing ? 'Update cart' : 'Add to cart'}</button>`;
  $('#stepnav').innerHTML = STEPS.map((s, i) => `<button data-act="step" data-i="${i}" class="${i === ui.step ? 'on' : ''}"><span>${i + 1}</span>${s}</button>`).join('');
  if (panel) { $('#panel').innerHTML = stepHTML(ui.step); decorateOps($('#panel')); }
  decorateOps($('.design'));
}

const chip = (act, val, on, label, extra = '') => `<button class="chip ${on ? 'on' : ''}" data-act="${act}" data-v="${esc(val)}" ${extra}>${label}</button>`;

function stepHTML(i) {
  const c = S.draft;
  const nav = `<div class="step-nav">${i > 0 ? `<button class="btn ghost" data-act="step" data-i="${i - 1}">← ${STEPS[i - 1]}</button>` : '<span></span>'}${i < STEPS.length - 1 ? `<button class="btn primary" data-act="step" data-i="${i + 1}">Next: ${STEPS[i + 1]} →</button>` : '<button class="btn primary" data-act="add-sofa">Add to cart</button>'}</div>`;
  if (i === 0) {
    const rec = M.recommend(c.person);
    const applied = rec.depth === c.depth && rec.comfort === c.comfort && rec.legHeight === c.legHeight;
    return `
    <h2>Your room</h2>
    <p class="muted">Measure the wall the sofa goes against and how deep the room is. Our order engineer checks every layout against these numbers before we start.</p>
    <div class="grid2" ${ops('§1.2', 'Built on the room plan', 'The customer enters the room and draws the layout; the configurator combines seat widths and armrests to fit. The order engineer checks it (≈22 min per order, Table 7).')}>
      <label class="field">Wall length (cm)<input type="number" min="150" max="900" step="5" value="${c.room.wall}" data-in="room.wall"></label>
      <label class="field">Room depth (cm)<input type="number" min="200" max="1000" step="5" value="${c.room.depth}" data-in="room.depth"></label>
    </div>
    <div class="field">Sofa position on the wall<div class="chips">${['left', 'center', 'right'].map((p) => chip('pos', p, c.room.pos === p, p[0].toUpperCase() + p.slice(1))).join('')}</div></div>
    <button class="btn wide" data-act="fit">Fit the sofa to my wall</button>
    <hr>
    <h2>You</h2>
    <p class="muted">We set seat height, depth and firmness to your body and how you sit.</p>
    <div class="grid2">
      <label class="field">Your height (cm)<input type="number" min="140" max="215" step="1" value="${c.person.height}" data-in="person.height"></label>
      <div class="field">Mostly for<div class="chips">${[['tv', 'Watching TV'], ['reading', 'Reading'], ['lying', 'Lying down']].map(([k, l]) => chip('use', k, c.person.use === k, l)).join('')}</div></div>
    </div>
    <div class="rec" ${ops('§1.2', 'Personal fit', 'Height and preferred use set seat height, depth and firmness through toppers, cushions and legs.')}>
      <b>Recommended for you</b>
      <ul>${rec.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      ${applied ? '<span class="ok-badge">Applied</span>' : '<button class="btn small" data-act="apply-rec">Apply</button>'}
    </div>
    ${nav}`;
  }
  if (i === 1) {
    const run = (key, label, max) => `
      <div class="run"><div class="run-h">${label}<span class="muted">${c[key].length} seat${c[key].length > 1 ? 's' : ''}</span></div>
      <div class="run-items">${c[key].map((s, j) => `<button class="mod" data-act="swap" data-run="${key}" data-j="${j}" title="Switch 80/100">${C.SEATS[s].width}<small>cm</small><span data-act="del" data-run="${key}" data-j="${j}" aria-label="Remove" class="del">×</span></button>`).join('')}
      ${c[key].length < max ? `<button class="mod add" data-act="addseat" data-run="${key}" data-s="S80">+ 80</button><button class="mod add" data-act="addseat" data-run="${key}" data-s="S100">+ 100</button>` : ''}</div></div>`;
    const hasL = c.shape === 'corner-left' || c.shape === 'u';
    const hasR = c.shape === 'corner-right' || c.shape === 'u';
    const bom = M.billOfModules(c);
    return `
    <h2>Layout</h2>
    <div class="shapes">${Object.entries(C.SHAPES).map(([k, n]) => `<button class="shape ${c.shape === k ? 'on' : ''}" data-act="shape" data-v="${k}">${shapeIcon(k)}<span>${n}</span></button>`).join('')}</div>
    <div class="field">Seat depth<div class="chips">${Object.entries(C.DEPTHS).map(([k, d]) => chip('depth', k, +k === c.depth, d.name + (d.surcharge ? ' <small>+8%</small>' : ''))).join('')}</div></div>
    ${hasL ? run('left', 'Left return', 3) : ''}
    ${run('main', 'Main wall', 5)}
    ${hasR ? run('right', 'Right return', 3) : ''}
    <p class="fine">Click a seat to switch between 80 and 100 cm.</p>
    <div class="field">Armrests<div class="chips">${Object.entries(C.ARMS).map(([k, a]) => chip('arm', k, c.arm === k, `${a.name} <small>${a.width} cm</small>`)).join('')}</div>
      <div class="chips tight">${chip('armL', 1, c.armL, (c.armL ? '✓ ' : '') + 'Left arm')}${chip('armR', 1, c.armR, (c.armR ? '✓ ' : '') + 'Right arm')}</div></div>
    <div class="field">Free-standing ottomans<div class="stepper"><button data-act="ott" data-d="-1" ${c.ottomans <= 0 ? 'disabled' : ''}>−</button><b>${c.ottomans}</b><button data-act="ott" data-d="1" ${c.ottomans >= 2 ? 'disabled' : ''}>+</button></div></div>
    <div class="bom" ${ops('§2.2', 'Decoupling point', 'The 13 padded module types (frame, webbing, foam, no cover) are made to stock with Kanban. Only the covers and upholstery are made after the order: postponement.')}>
      <b>Your sofa is built from these modules</b>
      <ul>${Object.entries(bom).map(([k, n]) => `<li><code>${k}</code> × ${n}<span class="instock">In stock</span></li>`).join('')}</ul>
      <p class="fine">All padded modules are ready in our workshop. We only make your covers to order, which is why it takes days, not months.</p>
    </div>
    ${nav}`;
  }
  if (i === 2) {
    const selP = ui.sel ? M.buildLayout(c).pieces.find((p) => p.id === ui.sel) : null;
    if (!selP && ui.target === 'module') ui.target = 'all';
    const cur = ui.target === 'cushion' ? (c.cushion || c.fabric) : ui.target === 'module' ? M.pieceFabric(c, selP, 'body') : c.fabric;
    const fams = C.FABRICS.filter((f) => ui.fam === 'all' || (ui.fam === 'stock' ? f.stock : f.tags.includes(ui.fam)));
    const ovs = Object.entries(c.overrides || {});
    return `
    <h2>Fabric</h2>
    <div class="field">Apply to
      <div class="seg full">
        <button data-act="target" data-v="all" class="${ui.target === 'all' ? 'on' : ''}">Whole sofa</button>
        <button data-act="target" data-v="cushion" class="${ui.target === 'cushion' ? 'on' : ''}">Cushions only</button>
        <button data-act="target" data-v="module" class="${ui.target === 'module' ? 'on' : ''}" ${selP ? '' : 'disabled'}>${selP ? esc(M.pieceLabel(selP)) : 'One module'}</button>
      </div>
      ${selP ? '' : '<p class="fine">To mix fabrics by module, click a module in the 3D view or floor plan.</p>'}
    </div>
    <div class="current">${swatch(c.fabric, 22)} <span>Sofa: <b>${esc(C.colorOf(c.fabric).fam.name)}, ${esc(C.colorOf(c.fabric).name)}</b></span>
      ${c.cushion ? `<br>${swatch(c.cushion, 22)} <span>Cushions: <b>${esc(C.colorOf(c.cushion).fam.name)}, ${esc(C.colorOf(c.cushion).name)}</b></span> <button class="link" data-act="clear-cushion">same as sofa</button>` : ''}
      ${ovs.map(([id, ref]) => { const p = M.buildLayout(c).pieces.find((x) => x.id === id); return p ? `<br>${swatch(ref, 22)} <span>${esc(M.pieceLabel(p))}: <b>${esc(C.colorOf(ref).name)}</b></span> <button class="link" data-act="clear-ov" data-id="${id}">reset</button>` : ''; }).join('')}
    </div>
    <div class="chips filt">${[['all', 'All'], ['stain', 'Stain-resistant'], ['recycled', 'Recycled'], ['stock', 'Bestsellers']].map(([k, l]) => chip('fam', k, ui.fam === k, l)).join('')}</div>
    <div class="fams" ${ops('§2.6', 'Fabric supply', 'NEWCO keeps a safety stock of the top 30 bestselling fabrics (≈70% of orders); the rest of the library comes from mills in Como and Prato in 48 h.')}>
      ${fams.map((f) => `<div class="fam"><div class="fam-h"><b>${f.name}</b><span class="tier">${f.tier === 'A' ? 'Base price' : f.tier === 'B' ? '+12%' : '+25%'}</span>${f.tags.map((t) => `<span class="tag">${C.TAG_LABEL[t]}</span>`).join('')}</div>
        <div class="fam-sw">${f.colors.map((col, j) => { const ref = `${f.id}:${j}`; return `<button class="swb ${ref === cur ? 'on' : ''}" data-act="fabric" data-v="${ref}" title="${esc(col[0])}" style="--c:${col[1]}"><span class="sr">${esc(col[0])}</span></button>`; }).join('')}</div></div>`).join('')}
    </div>
    <p class="fine">Showing 10 of our 40 fabric families. <button class="link" data-act="sample-cur">Order a free sample of ${esc(C.colorOf(cur).name)}</button></p>
    ${nav}`;
  }
  if (i === 3) {
    const trimColors = ['brera:0', 'prato:3', 'sesia:4', 'arezzo:5', 'sesia:0', 'brera:4'];
    return `
    <h2>Comfort</h2>
    <div class="opts">${Object.entries(C.COMFORT).map(([k, o]) => `<button class="opt ${c.comfort === k ? 'on' : ''}" data-act="comfort" data-v="${k}"><b>${o.name}</b><span>${o.note}</span><small>${o.price ? '+€30 per seat' : 'Included'}</small></button>`).join('')}</div>
    <h2>Legs</h2>
    <div class="field">Shape<div class="chips">${Object.entries(C.LEG_SHAPES).map(([k, o]) => chip('legShape', k, c.legShape === k, o.name + (o.price ? ` <small>+€${o.price}</small>` : ''))).join('')}</div></div>
    <div class="field">Finish<div class="chips">${Object.entries(C.LEG_FINISHES).map(([k, o]) => chip('legFinish', k, c.legFinish === k, `<span class="dotc" style="--c:${o.hex}"></span>${o.name}`)).join('')}</div></div>
    <div class="field">Height<div class="chips">${Object.entries(C.LEG_HEIGHTS).map(([k, o]) => chip('legHeight', k, c.legHeight === k, `${o.name} <small>${o.cm} cm</small>`)).join('')}</div>
      <p class="fine">Seat height with these legs: <b>${M.seatHeight(c)} cm</b></p></div>
    <h2>Details</h2>
    <div class="field">Contrast trim<div class="chips">${Object.entries(C.TRIMS).map(([k, o]) => chip('trim', k, c.trim === k, o.name + (o.price ? ` <small>+€${o.price}</small>` : ''))).join('')}</div>
      ${c.trim !== 'none' ? `<div class="chips tight">${trimColors.map((r) => `<button class="swb sm ${c.trimColor === r ? 'on' : ''}" data-act="trimColor" data-v="${r}" style="--c:${C.colorOf(r).hex}" title="${esc(C.colorOf(r).name)}"></button>`).join('')}</div>` : ''}</div>
    <label class="field">Embroidered monogram on the right arm <small>+€${C.MONOGRAM_PRICE}, up to 3 letters</small>
      <input type="text" maxlength="3" value="${esc(c.monogram)}" data-in="monogram" placeholder="e.g. ACR" autocomplete="off"></label>
    ${nav}`;
  }
  // review
  const price = M.priceOf(c);
  const pr = M.promise(new Date(), S.region, pool());
  const L = M.buildLayout(c);
  const fc = M.fitCheck(c);
  return `
  <h2>Review</h2>
  <div class="review-plan">${planSVG(c, { room: false })}</div>
  <dl class="spec">
    <dt>Layout</dt><dd>${C.SHAPES[c.shape]}, ${L.pieces.filter((p) => p.kind !== 'arm').length} seat modules + ${L.pieces.filter((p) => p.kind === 'arm').length} armrests</dd>
    <dt>Size</dt><dd>${L.W} × ${L.sofaDepth} cm, seat depth ${c.depth} cm, seat height ${M.seatHeight(c)} cm</dd>
    <dt>Fabric</dt><dd>${sofaDesc(c)}</dd>
    <dt>Fits your room</dt><dd class="${fc.fits ? 'okc' : 'badc'}">${esc(fc.issues[0].text)}</dd>
  </dl>
  <table class="lines">${price.lines.map((l) => `<tr><td>${esc(l.label)}</td><td>${l.amount ? eur(l.amount) : 'Included'}</td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td>${eur(price.total)}</td></tr></table>
  <div class="dateblock" ${ops('§2.1', 'Order release', 'Orders confirmed by 14:00 are validated the same day and released next morning into the pre-shop pool, at the rate of available capacity.')}>
    <b>Delivered and assembled by ${fmtDate(pr.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
    <ol class="mini-tl"><li>Day 1 · ${fmtDate(pr.d1)}<span>Order engineer checks your layout</span></li><li>Days 2–6<span>Cut, sewn, upholstered, checked</span></li><li>Day 7<span>Safety day, handed to delivery</span></li><li>Day ${pr.totalDays} · ${fmtDate(pr.delivery)}<span>Delivered and assembled</span></li></ol>
  </div>
  ${nav}`;
}

function setPath(obj, path, val) {
  const k = path.split('.');
  let o = obj;
  while (k.length > 1) o = o[k.shift()];
  o[k[0]] = val;
}

function designAction(act, el) {
  const c = S.draft;
  let panel = true;
  switch (act) {
    case 'view':
      ui.view = el.dataset.v;
      $('#view3d').hidden = ui.view !== '3d';
      $('#plan').hidden = ui.view !== 'plan';
      $$('.stage-top .seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.view));
      $('#hint').textContent = ui.view === '3d' ? 'Drag to turn · click a module to select it' : 'Click a module to select it';
      return;
    case 'step': ui.step = +el.dataset.i; $('#panel').scrollTop = 0; break;
    case 'pos': c.room.pos = el.dataset.v; break;
    case 'fit': { const r = M.fitToWall(c); S.draft = r.cfg; toast(esc(r.msg)); break; }
    case 'use': c.person.use = el.dataset.v; break;
    case 'apply-rec': { const r = M.recommend(c.person); Object.assign(c, { depth: r.depth, comfort: r.comfort, legHeight: r.legHeight }); toast('Applied: seat depth, comfort and legs set for you.'); break; }
    case 'shape': c.shape = el.dataset.v; if (!c.left.length) c.left = ['S80']; if (!c.right.length) c.right = ['S80']; ui.sel = null; break;
    case 'depth': c.depth = +el.dataset.v; break;
    case 'swap': { const arr = c[el.dataset.run]; const j = +el.dataset.j; arr[j] = arr[j] === 'S80' ? 'S100' : 'S80'; break; }
    case 'del': { const arr = c[el.dataset.run]; if (arr.length > 1) arr.splice(+el.dataset.j, 1); else toast('Each run needs at least one seat.'); ui.sel = null; break; }
    case 'addseat': c[el.dataset.run].push(el.dataset.s); break;
    case 'arm': c.arm = el.dataset.v; break;
    case 'armL': c.armL = !c.armL; break;
    case 'armR': c.armR = !c.armR; break;
    case 'ott': c.ottomans = Math.max(0, Math.min(2, c.ottomans + +el.dataset.d)); break;
    case 'target': ui.target = el.dataset.v; break;
    case 'fam': ui.fam = el.dataset.v; break;
    case 'fabric': {
      const ref = el.dataset.v;
      if (ui.target === 'all') { c.fabric = ref; c.overrides = {}; if (c.cushion === ref) c.cushion = null; }
      else if (ui.target === 'cushion') c.cushion = ref === c.fabric ? null : ref;
      else if (ui.sel) { if (ref === c.fabric) delete c.overrides[ui.sel]; else c.overrides[ui.sel] = ref; }
      break;
    }
    case 'clear-cushion': c.cushion = null; break;
    case 'clear-ov': delete c.overrides[el.dataset.id]; break;
    case 'sample-cur': {
      const p = ui.sel && M.buildLayout(c).pieces.find((x) => x.id === ui.sel);
      addSample(ui.target === 'cushion' ? (c.cushion || c.fabric) : ui.target === 'module' && p ? M.pieceFabric(c, p, 'body') : c.fabric);
      panel = false; break;
    }
    case 'comfort': case 'legShape': case 'legFinish': case 'legHeight': case 'trim': case 'trimColor':
      c[act] = el.dataset.v; break;
    case 'region': return;
    case 'add-sofa': addSofa(); return;
    default: return;
  }
  // keep run arrays valid after layout changes
  Object.keys(c.overrides || {}).forEach((id) => { if (!M.buildLayout(c).pieces.some((p) => p.id === id)) delete c.overrides[id]; });
  refreshDesign(panel);
}

function addSofa() {
  const cfg = structuredClone(S.draft);
  const fc = M.fitCheck(cfg);
  const item = { id: S.editing || 'sofa-' + Date.now().toString(36), kind: 'sofa', cfg, price: M.priceOf(cfg).total, title: sofaTitle(cfg), qty: 1 };
  const idx = S.cart.findIndex((i) => i.id === item.id);
  if (idx >= 0) S.cart[idx] = item; else S.cart.push(item);
  delete S.editing;
  save();
  renderHeader();
  toast(`Added to your cart: <b>${esc(item.title)}</b>${fc.fits ? '' : '<br><small>Note: it does not fit the room you entered. Our order engineer will call you before production.</small>'} <a href="#/cart">View cart →</a>`);
}

function addSample(ref) {
  if (S.samples.includes(ref)) { toast('That sample is already in your sample box.'); return; }
  if (S.samples.length >= 6) { toast('Your sample box is full (6 samples). <a href="#/fabrics">Review it →</a>'); return; }
  S.samples.push(ref);
  save();
  const c = C.colorOf(ref);
  toast(`${swatch(ref, 14)} <b>${esc(c.name)}</b> added to your free sample box (${S.samples.length}/6). <a href="#/fabrics">Order →</a>`);
}

/* ---------- fabrics & samples ---------- */
routes.fabrics = () => {
  const box = S.samples.map((r) => { const c = C.colorOf(r); return `<li>${swatch(r, 34)}<span><b>${esc(c.name)}</b><small>${esc(c.fam.name)}</small></span><button class="x" data-act="rm-sample" data-v="${r}" aria-label="Remove">×</button></li>`; }).join('');
  return `
  <section class="page-h wrap"><p class="eyebrow">Fabric library</p><h1>Choose your fabric</h1><p class="lead">10 of our 40 families, from mills in the Como and Prato textile districts. Every fabric is removable, zipped and washable on the sofa. Order up to six samples for free.</p></section>
  <section class="wrap fab-layout">
    <div class="fab-list">
      <div class="chips filt">${[['all', 'All'], ['stain', 'Stain-resistant'], ['recycled', 'Recycled'], ['stock', 'Bestsellers']].map(([k, l]) => chip('fam2', k, ui.fam === k, l)).join('')}</div>
      ${C.FABRICS.filter((f) => ui.fam === 'all' || (ui.fam === 'stock' ? f.stock : f.tags.includes(ui.fam))).map((f) => `
        <article class="fab-card">
          <div class="fab-top"><h3>${f.name}</h3><span class="tier">${f.tier === 'A' ? 'Base price' : f.tier === 'B' ? '+12% on modules' : '+25% on modules'}</span></div>
          <p class="tags">${f.tags.map((t) => `<span class="tag">${C.TAG_LABEL[t]}</span>`).join('')}${f.stock ? '<span class="tag soft">Bestseller</span>' : ''}<span class="tag soft">${{ weave: 'Woven', boucle: 'Looped texture', velvet: 'Velvet pile', canvas: 'Tight weave', felt: 'Felted wool', cord: 'Corduroy' }[f.texture]}</span></p>
          <div class="fab-sw">${f.colors.map((col, j) => { const ref = `${f.id}:${j}`; const inBox = S.samples.includes(ref); return `<button class="swatch-card ${inBox ? 'on' : ''}" data-act="sample" data-v="${ref}"><span class="sw-big tex-${f.texture}" style="--c:${col[1]}"></span><span>${esc(col[0])}</span><small>${inBox ? '✓ In box' : '+ Sample'}</small></button>`; }).join('')}</div>
        </article>`).join('')}
    </div>
    <aside class="sample-box" ${ops('§1.3', 'Lower acquisition cost', 'Free samples in 48 h reduce the customer’s effort and the risk of returns: customers are sure of the result before spending ≈ €1,800.')}>
      <h2>Your sample box</h2>
      <p class="muted">${S.samples.length}/6 samples · free · delivered in 48 h</p>
      ${S.samples.length ? `<ul class="samples">${box}</ul>` : '<p class="empty">Click a colour to add it.</p>'}
      ${S.samples.length ? `<div class="grid2"><label class="field">Country<select data-in2="region">${Object.entries(C.REGIONS).map(([k, r]) => `<option value="${k}" ${k === S.region ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label><label class="field">Postcode<input type="text" placeholder="20121"></label></div>
      <button class="btn primary wide" data-act="order-samples">Send my samples</button><p class="fine">Demo: nothing is shipped.</p>` : ''}
    </aside>
  </section>`;
};

/* ---------- advice & showrooms ---------- */
routes.advice = () => {
  const days = []; let d = new Date();
  while (days.length < 6) { d = M.nextWorkingDay(d); days.push(new Date(d)); }
  return `
  <section class="page-h wrap"><p class="eyebrow">Free design advice</p><h1>Talk to a designer before you buy</h1><p class="lead">Our design consultants help you plan the layout, check your measurements and choose fabrics. It is free and there is no obligation to buy.</p></section>
  <section class="wrap two advice" ${ops('§1.3', 'Front office', 'Consultants, showrooms and the configurator are the front office where the experience is created. Showrooms (Milan, Munich) bring 10% of sales, but customers still order through the configurator.')}>
    <form class="card form" data-form="book">
      <h2>Book a session</h2>
      <div class="seg full"><label><input type="radio" name="mode" value="video" checked> Video call, 30 min</label><label><input type="radio" name="mode" value="milan"> Showroom Milan</label><label><input type="radio" name="mode" value="munich"> Showroom Munich</label></div>
      <div class="field">Day<div class="chips">${days.map((x, i) => `<label class="chip-r"><input type="radio" name="day" value="${x.toISOString()}" ${i === 0 ? 'checked' : ''}><span>${fmtDate(x)}</span></label>`).join('')}</div></div>
      <div class="field">Time<div class="chips">${['09:30', '11:00', '14:30', '16:00', '17:30'].map((t, i) => `<label class="chip-r"><input type="radio" name="time" value="${t}" ${i === 1 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>
      <label class="field">What would you like help with?<textarea rows="3" placeholder="e.g. A corner sofa for a 3.4 m wall, two kids and a dog"></textarea></label>
      <button class="btn primary wide">Book my session</button>
      <p class="fine">Demo: no booking is made and nothing is sent.</p>
    </form>
    <div class="showrooms">
      <article class="card"><h3>Milan showroom</h3><p>Sit on all three comfort levels, touch the full fabric library and plan your sofa with a designer.</p><p class="fine">Mon–Sat 10:00–19:00</p></article>
      <article class="card"><h3>Munich showroom</h3><p>The same library and comfort samples for customers in Germany and Austria.</p><p class="fine">Mon–Sat 10:00–19:00</p></article>
      <article class="card"><h3>Not sure about a fabric?</h3><p>Order up to six samples for free. They arrive in 48 hours.</p><a class="btn ghost" href="#/fabrics">Order samples</a></article>
    </div>
  </section>`;
};

/* ---------- trade desk ---------- */
routes.trade = () => `
  <section class="page-h wrap"><p class="eyebrow">NEWCO Trade Desk</p><h1>Sofas for hotels, offices and interior designers</h1><p class="lead">You have an opening date. We give you a delivery date you can plan around, the same shade on every piece and the documents your project needs.</p></section>
  <section class="wrap cards3 trade" ${ops('§1.3', 'Professional segment (15%)', 'Professionals value delivery reliability (opening dates), consistent fabric shade on several pieces and technical documentation. Served by a dedicated trade desk.')}>
    <article class="card"><h3>Dates you can rely on</h3><p>We book your order into our workshop plan when you confirm it, so the date we quote is the date we deliver.</p></article>
    <article class="card"><h3>One shade on every piece</h3><p>All the fabric for your project is cut from the same dye batch and checked on arrival.</p></article>
    <article class="card" ${ops('§2.1', 'Customer’s own material', 'For trade orders with the customer’s own fabric, release waits for the incoming inspection, and the promised date starts from that moment.')}><h3>Your own fabric</h3><p>Send us your fabric (COM). We inspect it when it arrives and confirm your date from that day.</p></article>
    <article class="card"><h3>Logos and embroidery</h3><p>Your brand or hotel name embroidered on the arm or on cushions.</p></article>
    <article class="card"><h3>Technical documents</h3><p>Specification sheets, dimensions, cleaning guides and fabric test data for every piece.</p></article>
    <article class="card"><h3>One contact</h3><p>A dedicated trade manager follows your project from the first drawing to installation.</p></article>
  </section>
  <section class="wrap">
    <form class="card form trade-form" data-form="trade">
      <h2>Request a project quote</h2>
      <div class="grid3">
        <label class="field">Project type<select name="type"><option>Hotel or B&amp;B</option><option>Office lounge</option><option>Residential design</option><option>Restaurant or bar</option></select></label>
        <label class="field">Number of sofas<input name="qty" type="number" min="1" max="60" value="6"></label>
        <label class="field">Opening date<input name="open" type="date"></label>
      </div>
      <label class="check"><input type="checkbox" name="com"> We will send our own fabric (COM)</label>
      <div id="trade-out"></div>
      <button class="btn primary">Check our earliest date</button>
      <p class="fine">Demo: nothing is sent. The date check runs in your browser.</p>
    </form>
  </section>`;

/* ---------- care & parts ---------- */
routes.care = () => {
  const modOpts = Object.entries(C.SEATS).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('') + Object.entries(C.ARMS).map(([k, a]) => `<option value="arm:${k}">${a.name} armrest</option>`).join('');
  const fabOpts = C.FABRICS.map((f) => `<optgroup label="${f.name}">${f.colors.map((c, j) => `<option value="${f.id}:${j}">${c[0]}</option>`).join('')}</optgroup>`).join('');
  return `
  <section class="page-h wrap"><p class="eyebrow">Care and parts</p><h1>Made to last, made to change</h1><p class="lead">Every NEWCO sofa is a set of modules joined by metal connectors. Change a cover, add a seat or rebuild the layout after a move.</p></section>
  <section class="wrap cards3 care" ${ops('§1.2', 'Modularity and after-sales', 'Spare covers and extra modules extend the product life, create repeat business and limit returns, since modules travel flat and covers can be exchanged.')}>
    <form class="card form" data-form="part" data-kind="cover">
      <h3>New cover</h3><p>Fresh cover for one module, in any fabric. Zip it on in minutes.</p>
      <label class="field">Module<select name="mod">${modOpts}</select></label>
      <label class="field">Fabric<select name="fab">${fabOpts}</select></label>
      <div class="part-price" data-price></div>
      <button class="btn primary wide">Add to cart</button>
    </form>
    <form class="card form" data-form="part" data-kind="module">
      <h3>Add a module</h3><p>A complete padded module with its cover. It connects to your sofa with the same metal connectors.</p>
      <label class="field">Module<select name="mod">${modOpts}</select></label>
      <label class="field">Depth<select name="depth"><option value="95">Standard 95 cm</option><option value="105">Deep 105 cm</option></select></label>
      <label class="field">Fabric<select name="fab">${fabOpts}</select></label>
      <div class="part-price" data-price></div>
      <button class="btn primary wide">Add to cart</button>
    </form>
    <div class="card"><h3>Our guarantees</h3>
      <ul class="ticks"><li><b>10-year frame warranty</b> on every module frame</li><li><b>30-day colour guarantee</b>: if the colour is not what you expected, we send a new cover</li><li><b>Washable covers</b>: zipped and removable on every module</li><li><b>Spare parts</b> for every module we have ever sold</li></ul>
      <a class="btn ghost" href="#/track">Track an order</a></div>
  </section>`;
};

function partPrice(form) {
  const f = new FormData(form);
  const mod = f.get('mod');
  const isArm = mod.startsWith('arm:');
  const base = isArm ? C.ARMS[mod.slice(4)].price : C.SEATS[mod].price * (1 + (C.DEPTHS[f.get('depth') || 95].surcharge));
  const t = C.TIERS[C.colorOf(f.get('fab')).fam.tier];
  const k = form.dataset.kind === 'cover' ? 0.45 : 1;
  return Math.round((base * t * k) / 5) * 5;
}

/* ---------- cart & checkout ---------- */
routes.cart = () => {
  if (!S.cart.length) return `<section class="wrap page-h"><h1>Your cart is empty</h1><p class="lead">Design your sofa or start from one of our layouts.</p><a class="btn primary lg" href="#/design">Design your sofa</a></section>`;
  const total = S.cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const pr = M.promise(new Date(), S.region, pool());
  return `
  <section class="wrap page-h"><h1>Your cart</h1></section>
  <section class="wrap cart-layout">
    <div class="cart-items">${S.cart.map((i) => `
      <article class="cart-item">
        <div class="ci-img">${i.kind === 'sofa' ? planSVG(i.cfg, { room: false }) : swatch(i.fab, 64)}</div>
        <div class="ci-b"><h3>${esc(i.title)}</h3><p class="muted">${i.kind === 'sofa' ? sofaDesc(i.cfg) : esc(i.desc)}</p>
          <div class="ci-act">${i.kind === 'sofa' ? `<a href="#/design?edit=${i.id}" class="link">Edit design</a>` : `<span class="stepper sm"><button data-act="qty" data-id="${i.id}" data-d="-1">−</button><b>${i.qty}</b><button data-act="qty" data-id="${i.id}" data-d="1">+</button></span>`}<button class="link" data-act="rm" data-id="${i.id}">Remove</button></div></div>
        <div class="ci-p">${eur(i.price * (i.qty || 1))}</div>
      </article>`).join('')}
    </div>
    <aside class="card summary">
      <h2>Summary</h2>
      <table class="lines"><tr><td>Items</td><td>${eur(total)}</td></tr><tr><td>Delivery and assembly</td><td>Included</td></tr><tr class="tot"><td>Total incl. VAT</td><td>${eur(total)}</td></tr></table>
      <p class="dateline" ${ops('§2.5', 'Capable-to-promise', 'Same promise logic as the configurator: validation day + 5 production days + safety day + transit.')}>Delivered by <b>${fmtDate(pr.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}</b> to ${C.REGIONS[S.region].name}</p>
      <a class="btn primary wide lg" href="#/checkout">Checkout</a>
      <p class="fine">Demo shop: no payment is taken.</p>
    </aside>
  </section>`;
};

routes.checkout = () => {
  if (!S.cart.length) { location.hash = '#/cart'; return ''; }
  const total = S.cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const pr = M.promise(new Date(), S.region, pool());
  return `
  <section class="wrap page-h"><h1>Checkout</h1></section>
  <section class="wrap cart-layout">
    <form class="card form checkout" data-form="checkout">
      <h2>Delivery</h2>
      <div class="grid2">
        <label class="field">Country<select name="region" data-in2="region">${Object.entries(C.REGIONS).map(([k, r]) => `<option value="${k}" ${k === S.region ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>
        <label class="field">Postcode<input name="zip" type="text" placeholder="20121"></label>
        <label class="field">Name<input name="name" type="text" placeholder="Your name"></label>
        <label class="field">Email<input name="email" type="email" placeholder="you@example.com"></label>
      </div>
      <div class="field" ${ops('§2.1', 'White-glove delivery', 'The delivery partner books a 2-hour slot once the production date is confirmed, and assembles at home.')}>Preferred 2-hour delivery slot
        <div class="chips">${['08–10', '10–12', '12–14', '14–16', '16–18'].map((t, i) => `<label class="chip-r"><input type="radio" name="slot" value="${t}" ${i === 1 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
        <p class="fine">We confirm the exact slot by text when your sofa leaves the workshop.</p></div>
      <label class="field">Notes for our crew<textarea name="notes" rows="2" placeholder="Floor, lift, narrow stairs…"></textarea></label>
      <h2>Payment</h2>
      <div class="demo-pay">This is a demo shop for a university project. No payment details are collected and nothing is charged.</div>
      <button class="btn primary wide lg">Place demo order · ${eur(total)}</button>
    </form>
    <aside class="card summary">
      <h2>Your order</h2>
      ${S.cart.map((i) => `<div class="sum-i"><span>${esc(i.title)}${i.qty > 1 ? ` × ${i.qty}` : ''}</span><b>${eur(i.price * (i.qty || 1))}</b></div>`).join('')}
      <table class="lines"><tr class="tot"><td>Total incl. VAT</td><td>${eur(total)}</td></tr></table>
      <p class="dateline">Delivered and assembled by <b id="co-date">${fmtDate(pr.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}</b></p>
    </aside>
  </section>`;
};

function placeOrder(form) {
  const f = new FormData(form);
  const now = new Date();
  const region = f.get('region');
  const pr = M.promise(now, region, pool());
  const id = 'NC-' + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
  const order = { id, placedAt: now.toISOString(), d1: pr.d1.toISOString(), delivery: pr.delivery.toISOString(), extra: pr.status.extra, region, slot: f.get('slot'), items: S.cart, total: S.cart.reduce((s, i) => s + i.price * (i.qty || 1), 0) };
  S.orders.unshift(order);
  S.cart = [];
  save();
  location.hash = `#/order/${id}`;
}

function demoOrder() {
  // a sample order placed 4 working days ago, so the tracking page has something to show
  let d = new Date();
  for (let k = 0; k < 4;) { d.setDate(d.getDate() - 1); if (M.isWorkingDay(d)) k++; }
  d.setHours(11, 20, 0, 0);
  const pr = M.promise(d, 'DE', 2);
  const cfg = M.presetConfig('lounger');
  return { id: 'NC-DEMO', placedAt: d.toISOString(), d1: pr.d1.toISOString(), delivery: pr.delivery.toISOString(), extra: 0, region: 'DE', slot: '10–12', items: [{ id: 'x', kind: 'sofa', cfg, title: sofaTitle(cfg), price: M.priceOf(cfg).total, qty: 1 }], total: M.priceOf(cfg).total };
}
const findOrder = (id) => (id === 'NC-DEMO' ? demoOrder() : S.orders.find((o) => o.id === id));

function timeline(order, shift = 0) {
  const st = M.stagesFor(order);
  const now = new Date();
  // simulated "today": real now plus N working days (demo slider)
  const today = shift ? M.addWorkingDays(now, shift) : now;
  let cur = 0;
  st.forEach((s, i) => { if (s.date <= today) cur = i; });
  return `<ol class="tl" ${ops('§2.5', 'Live order status', 'Live order status flows from the shop-floor system to the customer’s tracking page, the shop-floor board and the managers’ KPI dashboard.')}>${st.map((s, i) => `
    <li class="${i < cur ? 'done' : i === cur ? 'now' : ''}"><span class="tl-dot"></span><div><b>${s.title}</b><small>${fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}${i === 0 ? ' · ' + new Date(s.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</small><p>${s.text}</p></div></li>`).join('')}</ol>`;
}

routes.order = (q, id) => {
  const o = findOrder(id);
  if (!o) return `<section class="wrap page-h"><h1>Order not found</h1><a class="btn" href="#/track">Track an order</a></section>`;
  return `
  <section class="wrap page-h confirm"><p class="eyebrow">Order ${esc(o.id)} confirmed</p><h1>Thank you. Your sofa arrives on ${fmtDate(o.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}.</h1>
    <p class="lead">Our order engineer checks your layout ${fmtDate(o.d1, { weekday: 'long' }) === fmtDate(o.placedAt, { weekday: 'long' }) ? 'today' : 'on ' + fmtDate(o.d1, { weekday: 'long' })}. We will text you the exact 2-hour slot (you asked for ${esc(o.slot)}) when it leaves the workshop.</p></section>
  <section class="wrap cart-layout">
    <div class="card">${timeline(o)}</div>
    <aside class="card summary"><h2>Items</h2>${o.items.map((i) => `<div class="sum-i"><span>${esc(i.title)}</span><b>${eur(i.price * (i.qty || 1))}</b></div>`).join('')}
      <table class="lines"><tr class="tot"><td>Total</td><td>${eur(o.total)}</td></tr></table>
      <a class="btn ghost wide" href="#/track?id=${o.id}">Track this order</a><a class="btn ghost wide" href="#/fabrics">Order fabric samples</a></aside>
  </section>`;
};

routes.track = (q) => {
  const id = q.get('id');
  const o = id ? findOrder(id.trim().toUpperCase()) : null;
  const mine = S.orders.slice(0, 5);
  return `
  <section class="wrap page-h"><p class="eyebrow">Order tracking</p><h1>Where is my sofa?</h1></section>
  <section class="wrap cart-layout">
    <div>
      <form class="card form track-form" data-form="track"><label class="field">Order number<input name="id" type="text" value="${esc(id || '')}" placeholder="NC-2611-1234"></label><button class="btn primary">Track</button></form>
      ${id && !o ? '<p class="card">We could not find that order in this browser. Try <a href="#/track?id=NC-DEMO">NC-DEMO</a>.</p>' : ''}
      ${o ? `<div class="card"><div class="track-h"><div><b>${esc(o.id)}</b><span class="muted"> · ${esc(o.items.map((i) => i.title).join(', '))}</span></div><div>Delivery to ${C.REGIONS[o.region].name} on <b>${fmtDate(o.delivery, { weekday: 'long', day: 'numeric', month: 'long' })}</b></div></div>
        <label class="sim">Demo: move time forward <input type="range" min="0" max="10" value="${ui.trackShift}" data-act="shift"> <b>+${ui.trackShift} working days</b></label>
        <div id="tl">${timeline(o, ui.trackShift)}</div></div>` : ''}
    </div>
    <aside class="card summary"><h2>Your orders</h2>
      ${mine.length ? mine.map((m) => `<a class="ord" href="#/track?id=${m.id}"><b>${m.id}</b><span>${fmtDate(m.delivery)}</span></a>`).join('') : '<p class="muted">Orders you place in this browser appear here.</p>'}
      <a class="ord demo" href="#/track?id=NC-DEMO"><b>NC-DEMO</b><span>sample order, placed 4 working days ago</span></a>
    </aside>
  </section>`;
};

/* ---------- inside NEWCO ---------- */
routes.inside = () => `
  <section class="page-h wrap"><p class="eyebrow">How we make it</p><h1>Why your sofa takes 10 days, not 10 weeks</h1>
    <p class="lead">A custom sofa usually waits weeks before work starts, then takes a month to build and one or two more weeks for fabric and transport. We designed our workshop to remove each of those waits.</p></section>
  <section class="wrap inside-grid">
    <article class="card" ${ops('§2.2', 'Assemble to order', 'Decoupling point after the padded modules. 13 types made to stock in batches of 25 and restocked by Kanban; covers made to order.')}><span class="big">13</span><h3>Base modules, always ready</h3><p>Every sofa is built from 13 padded modules: frame, webbing and foam. We keep them in stock, so after you order we only make your covers.</p></article>
    <article class="card" ${ops('§2.3', 'Capacity cushion', 'Make-to-order stages planned at ≤ 75% saturation (Kingman), so orders do not queue. Seven sewing stations, five upholstery stations, one automatic fabric cutter.')}><span class="big">5 days</span><h3>From fabric roll to finished sofa</h3><p>Your fabric is cut on an automatic cutter, sewn and fitted by upholsterers in Brianza. We keep spare capacity so your order never waits in a queue.</p></article>
    <article class="card" ${ops('§2.4', 'Supply chain configuration', 'Mills deliver the 150 references in 48 h; foam and plywood are vendor-managed; markets are 1–3 days away by truck.')}><span class="big">48 h</span><h3>Fabric from mills nearby</h3><p>Our fabrics come from the Como and Prato textile districts, two days away. Your sofa is 1 to 3 days from your home by truck.</p></article>
  </section>
  <section class="wrap">
    <div class="sec-h"><h2>Your 10 days</h2></div>
    <ol class="days">
      <li><b>Day 1</b><span>Our order engineer checks your layout against your room plan</span></li>
      <li><b>Day 2</b><span>Modules picked from stock, fabric cut</span></li>
      <li><b>Days 3–4</b><span>Covers sewn</span></li>
      <li><b>Day 5</b><span>Upholstered on the modules</span></li>
      <li><b>Day 6</b><span>Final check and packing</span></li>
      <li><b>Day 7</b><span>Safety day, handed to delivery</span></li>
      <li><b>Days 8–10</b><span>Delivered and assembled at home</span></li>
    </ol>
  </section>
  <section class="wrap ops-only">
    <div class="sec-h"><h2>Process map (from our report, Table 6)</h2></div>
    <img class="pmap" src="assets/process-map.png" alt="Process map: customer, front office and order engineering, MTO production, MTS production, logistics and suppliers">
  </section>`;

/* ---------- about this project ---------- */
routes.project = () => {
  const rows = [
    ['3D configurator, room and body inputs', '§1.2, §1.3', 'Product built on the customer’s specifications; the configurator captures complete specs (75% of sales)'],
    ['“Fit the sofa to my wall” and fit warnings', '§1.2', 'Configurator combines seat widths and armrests to fit; order engineer checks it'],
    ['Module list with “In stock”', '§2.2, §2.6', 'Decoupling point after the 13 padded modules (MTS, Kanban); postponement of covers'],
    ['Live price', '§1.4, §1.5', 'Mid-range band €1,200–2,500; price is a strong qualifier'],
    ['Live delivery date (order by 14:00)', '§2.1, §2.5', 'Capable-to-promise from booked MTO capacity + transit; 10 working days'],
    ['Ops view: order pool slider', '§2.6, Table 11', 'Pool above 3 days → dates extended; below 1 day → dates brought forward'],
    ['Fabric library, mixing by module and cushion', '§1.2, §2.6', '40 families / 150 colours; top 30 fabrics in safety stock, rest from mills in 48 h'],
    ['Free samples, video calls, showrooms', '§1.3', 'Lower the customer’s acquisition cost; front office'],
    ['Checkout with a 2-hour delivery slot', '§2.1', 'White-glove partner, delivery and assembly at home'],
    ['Order tracking timeline', '§2.2, §2.5', 'Day 1 validation, days 2–6 production, day 7 safety, days 8–10 delivery; live status'],
    ['Trade desk and project date check', '§1.3, §2.1', 'Professionals (15%): reliable dates, shade batch control, COM incoming inspection'],
    ['Care and parts', '§1.2, §1.5', 'Spare covers and modules: life-cycle cost, repeat business, fewer returns'],
  ];
  return `
  <section class="page-h wrap"><p class="eyebrow">About this demo</p><h1>NEWCO is a student project</h1>
    <p class="lead">This site is a working mock-up of NEWCO’s direct-to-consumer shop, built for Assignment 2 (Operations Strategy), Operations Management 2026/27, Politecnico di Milano, Prof. Alberto Portioli Staudacher. Group 6. NEWCO is fictional. Nothing on this site is sold, charged or sent.</p>
    <p><button class="btn primary" data-act="ops-on">Turn on Ops view</button> <span class="muted">to see in place which report section each feature comes from.</span></p></section>
  <section class="wrap">
    <table class="map"><thead><tr><th>Feature on the site</th><th>Report</th><th>Operations choice it shows</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
    <h2>Assumptions used only by the demo</h2>
    <ul class="ticks">
      <li>Module prices are set so that the average sofa (3 seats + 2 armrests) costs about €1,800, the average selling price in §1.3. Fabric tiers add 0%, 12% or 25%.</li>
      <li>Delivery date = day 1 (same day if confirmed by 14:00 on a working day) + 5 production days + 1 safety day + transit (Italy 2 days, other markets 3 days). Weekends, Italian public holidays and the August and Christmas closures are skipped.</li>
      <li>The order pool starts at 2 days of capacity × the seasonal index of the month (Table 5). Above 3 days the promise grows by 2 days (3 above 4 days); below 1 day it is brought forward by 1 day.</li>
      <li>The site stores your cart, samples and demo orders only in this browser (localStorage).</li>
    </ul>
    <img class="pmap" src="assets/process-map.png" alt="Process map from the report">
  </section>`;
};

/* ---------------- router ---------------- */
function render() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const [name, arg] = path.split('/');
  const view = routes[name] || routes[''];
  const q = new URLSearchParams(qs || '');
  if (name !== 'design') ui.viewer = null;
  app.innerHTML = view(q, arg);
  app.dataset.route = name || 'home';
  if (name === 'design') afterDesign();
  if (name === 'care') $$('form[data-form="part"]').forEach((f) => { f.querySelector('[data-price]').textContent = eur(partPrice(f)); });
  decorateOps(app);
  renderHeader();
  if (!render.keepScroll) window.scrollTo(0, 0);
  render.keepScroll = false;
}
window.addEventListener('hashchange', render);

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  const piece = e.target.closest('[data-piece]');
  if (piece && app.dataset.route === 'design' && !el) {
    ui.sel = ui.sel === piece.dataset.piece ? null : piece.dataset.piece;
    if (ui.sel) ui.target = 'module';
    refreshDesign(ui.step === 2);
    return;
  }
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'ops-off') { S.ops = false; save(); renderHeader(); return; }
  if (act === 'ops-min') { S.opsMin = !S.opsMin; save(); renderOpsPanel(); return; }
  if (act === 'ops-on') { S.ops = true; save(); decorateOps(app); renderHeader(); toast('Ops view is on: look for the § tags.'); return; }
  if (act === 'pool-reset') { S.pool = null; save(); if (app.dataset.route === 'design') { refreshDesign(ui.step === 4); renderOpsPanel(); } else rerenderKeep(); return; }
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  if (app.dataset.route === 'design') { e.preventDefault(); designAction(act, el); return; }
  switch (act) {
    case 'sample': { const r = el.dataset.v; if (S.samples.includes(r)) { S.samples = S.samples.filter((x) => x !== r); save(); } else addSample(r); rerenderKeep(); break; }
    case 'rm-sample': S.samples = S.samples.filter((x) => x !== el.dataset.v); save(); rerenderKeep(); break;
    case 'fam2': ui.fam = el.dataset.v; rerenderKeep(); break;
    case 'order-samples': toast(`Done. Your ${S.samples.length} samples would arrive by <b>${fmtDate(M.addWorkingDays(new Date(), 2), { weekday: 'long', day: 'numeric', month: 'short' })}</b>. (Demo: nothing shipped.)`); S.samples = []; save(); rerenderKeep(); break;
    case 'rm': S.cart = S.cart.filter((i) => i.id !== el.dataset.id); save(); rerenderKeep(); break;
    case 'qty': { const it = S.cart.find((i) => i.id === el.dataset.id); it.qty = Math.max(1, Math.min(9, it.qty + +el.dataset.d)); save(); rerenderKeep(); break; }
    default:
  }
});

$('#ops-toggle').addEventListener('click', () => { S.ops = !S.ops; save(); decorateOps(app); renderHeader(); if (S.ops) toast('Ops view is on: hover the § tags to see the link to our report.'); });

function rerenderKeep() { render.keepScroll = true; render(); }

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.act === 'pool') {
    S.pool = +t.value; save(); renderOpsPanel();
    if (app.dataset.route === 'design') refreshDesign(ui.step === 4);
    else if (['home', 'cart', 'checkout'].includes(app.dataset.route)) rerenderKeep();
    return;
  }
  if (t.dataset.act === 'shift') { ui.trackShift = +t.value; t.nextElementSibling.textContent = `+${ui.trackShift} working days`; const id = new URLSearchParams(location.hash.split('?')[1]).get('id'); const o = findOrder(id.toUpperCase()); $('#tl').innerHTML = timeline(o, ui.trackShift); decorateOps($('#tl')); return; }
  if (t.dataset.in && app.dataset.route === 'design') {
    const path = t.dataset.in;
    let v = t.value;
    if (t.type === 'number') { v = +v; if (!v) return; }
    if (path === 'monogram') v = v.replace(/[^a-zA-Z]/g, '').slice(0, 3);
    setPath(S.draft, path, v);
    refreshDesign(false);
  }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.act === 'region' || t.dataset.in2 === 'region') {
    S.region = t.value; save();
    if (app.dataset.route === 'design') refreshDesign(ui.step === 4);
    else if (app.dataset.route === 'checkout') { const pr = M.promise(new Date(), S.region, pool()); $('#co-date').textContent = fmtDate(pr.delivery, { weekday: 'long', day: 'numeric', month: 'long' }); renderOpsPanel(); }
    else renderOpsPanel();
    return;
  }
  if (t.dataset.in && app.dataset.route === 'design') refreshDesign(true); // re-render panel after a committed number (updates recommendation)
  const pf = t.closest('form[data-form="part"]');
  if (pf) pf.querySelector('[data-price]').textContent = eur(partPrice(pf));
});

document.addEventListener('submit', (e) => {
  const f = e.target;
  if (!f.dataset.form) return;
  e.preventDefault();
  const kind = f.dataset.form;
  if (kind === 'checkout') placeOrder(f);
  else if (kind === 'track') location.hash = `#/track?id=${encodeURIComponent(new FormData(f).get('id').trim().toUpperCase())}`;
  else if (kind === 'book') {
    const d = new FormData(f);
    const where = { video: 'Video call', milan: 'Milan showroom', munich: 'Munich showroom' }[d.get('mode')];
    toast(`${where} on <b>${fmtDate(d.get('day'), { weekday: 'long', day: 'numeric', month: 'long' })} at ${d.get('time')}</b>. (Demo: no booking made.)`);
  } else if (kind === 'part') {
    const d = new FormData(f);
    const mod = d.get('mod');
    const name = mod.startsWith('arm:') ? C.ARMS[mod.slice(4)].name + ' armrest' : C.SEATS[mod].name;
    const c = C.colorOf(d.get('fab'));
    const item = { id: 'part-' + Date.now().toString(36), kind: f.dataset.kind, title: `${f.dataset.kind === 'cover' ? 'Cover' : 'Module'}: ${name}`, desc: `${c.fam.name}, ${c.name}${d.get('depth') ? `, ${d.get('depth')} cm deep` : ''}`, fab: d.get('fab'), price: partPrice(f), qty: 1 };
    S.cart.push(item); save(); renderHeader();
    toast(`Added: <b>${esc(item.title)}</b>. <a href="#/cart">View cart →</a>`);
  } else if (kind === 'trade') {
    const d = new FormData(f);
    const qty = Math.max(1, +d.get('qty') || 1);
    // project orders go through the same pool; large projects are split over several days of capacity (11.4 sofas/day)
    const now = new Date();
    const start = d.get('com') ? M.addWorkingDays(now, 2) : now; // COM: wait for the fabric and the incoming inspection
    const pr = M.promise(start, S.region, pool());
    const spread = Math.max(0, Math.ceil(qty / 4) - 1); // max ≈ 4 trade sofas a day so private orders keep their dates
    const date = M.addWorkingDays(pr.delivery, spread);
    const open = d.get('open') ? new Date(d.get('open')) : null;
    const ok = !open || open >= M.addWorkingDays(date, 2);
    $('#trade-out').innerHTML = `<div class="trade-res ${ok ? 'ok' : 'bad'}">Earliest reliable delivery for ${qty} sofa${qty > 1 ? 's' : ''}: <b>${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</b>${d.get('com') ? ' (your fabric must reach us within 2 working days; the date starts after our incoming inspection)' : ''}. ${open ? (ok ? 'That leaves at least 2 working days before your opening.' : 'This is too close to your opening date: call our trade desk to plan it.') : ''}</div>`;
  }
});

render();
