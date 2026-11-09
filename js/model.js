// Layout, price and delivery-date logic for the NEWCO configurator.
import { SEATS, DEPTHS, ARMS, COMFORT, LEG_SHAPES, TRIMS, MONOGRAM_PRICE, TIERS, LEG_HEIGHTS,
  REGIONS, SEASON, PRESETS, colorOf, isHoliday } from './data.js';

export function defaultConfig() {
  return {
    shape: 'straight', depth: 95, main: ['S100', 'S100', 'S100'], left: ['S80'], right: ['S80'],
    arm: 'square', armL: true, armR: true, ottomans: 0,
    fabric: 'arezzo:1', cushion: null, overrides: {},
    comfort: 'medium', legShape: 'tapered', legFinish: 'oak', legHeight: 'mid',
    trim: 'none', trimColor: 'brera:0', monogram: '',
    room: { wall: 340, depth: 420, pos: 'center' },
    person: { height: 175, use: 'tv' },
  };
}

export function presetConfig(key) {
  const p = PRESETS[key];
  const c = defaultConfig();
  if (!p) return c;
  const cfg = { ...c, ...structuredClone(p.cfg) };
  const L = buildLayout(cfg);
  cfg.room.wall = Math.max(cfg.room.wall, Math.ceil((L.W + 40) / 10) * 10);
  return cfg;
}

const hasLeftCorner = (s) => s === 'corner-left' || s === 'u';
const hasRightCorner = (s) => s === 'corner-right' || s === 'u';

// Returns placed pieces in cm. x runs along the back wall, z towards the room.
// Each piece: { id, kind, code, lw, ld (local width/depth), cx, cz (centre), rot (radians, 0 = back on -z) }
export function buildLayout(cfg) {
  const D = cfg.depth;
  const A = ARMS[cfg.arm].width;
  const P = [];
  const add = (o) => P.push(o);
  const sh = cfg.shape;
  let x = 0;

  // left end
  if (hasLeftCorner(sh)) {
    add({ id: 'corner-L', kind: 'corner', code: 'CRN', side: 'left', lw: D, ld: D, cx: D / 2, cz: D / 2, rot: 0 });
    let z = D;
    cfg.left.forEach((s, i) => {
      const w = SEATS[s].width;
      add({ id: `left-${i}`, kind: 'seat', code: s, lw: w, ld: D, cx: D / 2, cz: z + w / 2, rot: Math.PI / 2 });
      z += w;
    });
    if (cfg.armL) add({ id: 'arm-L', kind: 'arm', code: ARMS[cfg.arm].code, lw: A, ld: D, cx: D / 2, cz: z + A / 2, rot: Math.PI / 2 });
    x = D;
  } else if (sh === 'chaise-left') {
    if (cfg.armL) { add({ id: 'arm-L', kind: 'arm', code: ARMS[cfg.arm].code, lw: A, ld: 160, cx: A / 2, cz: 80, rot: 0 }); x = A; }
    add({ id: 'chaise', kind: 'chaise', code: 'CHL', lw: 90, ld: 160, cx: x + 45, cz: 80, rot: 0 });
    x += 90;
  } else if (cfg.armL) {
    add({ id: 'arm-L', kind: 'arm', code: ARMS[cfg.arm].code, lw: A, ld: D, cx: A / 2, cz: D / 2, rot: 0 });
    x = A;
  }

  // main run
  const mainStart = x;
  cfg.main.forEach((s, i) => {
    const w = SEATS[s].width;
    add({ id: `main-${i}`, kind: 'seat', code: s, lw: w, ld: D, cx: x + w / 2, cz: D / 2, rot: 0 });
    x += w;
  });
  const mainEnd = x;

  // right end
  if (hasRightCorner(sh)) {
    add({ id: 'corner-R', kind: 'corner', code: 'CRN', side: 'right', lw: D, ld: D, cx: x + D / 2, cz: D / 2, rot: 0 });
    let z = D;
    cfg.right.forEach((s, i) => {
      const w = SEATS[s].width;
      add({ id: `right-${i}`, kind: 'seat', code: s, lw: w, ld: D, cx: x + D / 2, cz: z + w / 2, rot: -Math.PI / 2 });
      z += w;
    });
    if (cfg.armR) add({ id: 'arm-R', kind: 'arm', code: ARMS[cfg.arm].code, lw: A, ld: D, cx: x + D / 2, cz: z + A / 2, rot: -Math.PI / 2 });
    x += D;
  } else if (sh === 'chaise-right') {
    add({ id: 'chaise', kind: 'chaise', code: 'CHL', lw: 90, ld: 160, cx: x + 45, cz: 80, rot: 0 });
    x += 90;
    if (cfg.armR) { add({ id: 'arm-R', kind: 'arm', code: ARMS[cfg.arm].code, lw: A, ld: 160, cx: x + A / 2, cz: 80, rot: 0 }); x += A; }
  } else if (cfg.armR) {
    add({ id: 'arm-R', kind: 'arm', code: ARMS[cfg.arm].code, lw: A, ld: D, cx: x + A / 2, cz: D / 2, rot: 0 });
    x += A;
  }

  // free-standing ottomans in front of the main run
  const od = D - 15;
  const n = cfg.ottomans || 0;
  const startX = (mainStart + mainEnd) / 2 - (n * 80) / 2;
  for (let i = 0; i < n; i++) {
    add({ id: `ott-${i}`, kind: 'ottoman', code: 'OTT', lw: 80, ld: od, cx: startX + 80 * i + 40, cz: D + 25 + od / 2, rot: 0 });
  }

  // footprint bounds
  let minX = Infinity, maxX = -Infinity, maxZ = 0;
  for (const p of P) {
    const turned = Math.abs(Math.sin(p.rot)) > 0.5;
    p.fw = turned ? p.ld : p.lw; // footprint along x
    p.fd = turned ? p.lw : p.ld; // footprint along z
    minX = Math.min(minX, p.cx - p.fw / 2);
    maxX = Math.max(maxX, p.cx + p.fw / 2);
    maxZ = Math.max(maxZ, p.cz + p.fd / 2);
  }
  if (minX !== 0) P.forEach((p) => { p.cx -= minX; });
  // depth of the sofa itself (ottomans excluded) for the walkway check
  const sofaDepth = Math.max(...P.filter((p) => p.kind !== 'ottoman').map((p) => p.cz + p.fd / 2));
  return { pieces: P, W: Math.round(maxX - minX), Dt: Math.round(maxZ), sofaDepth: Math.round(sofaDepth) };
}

export function pieceLabel(p) {
  if (p.kind === 'arm') return `${p.id === 'arm-L' ? 'Left' : 'Right'} armrest`;
  if (p.kind === 'corner') return `${p.side === 'left' ? 'Left' : 'Right'} corner`;
  if (p.kind === 'chaise') return 'Chaise longue';
  if (p.kind === 'ottoman') return `Ottoman ${+p.id.split('-')[1] + 1}`;
  const [run, i] = p.id.split('-');
  const runName = run === 'main' ? 'Seat' : run === 'left' ? 'Left return seat' : 'Right return seat';
  return `${runName} ${+i + 1}`;
}

export function moduleCode(p, cfg) {
  if (p.kind === 'arm') return p.code;
  return `${p.code}-${cfg.depth}`;
}

// Bill of padded modules: what is picked from the decoupling stock (§2.2).
export function billOfModules(cfg) {
  const { pieces } = buildLayout(cfg);
  const bom = {};
  for (const p of pieces) {
    const code = moduleCode(p, cfg);
    bom[code] = (bom[code] || 0) + 1;
  }
  return bom;
}

export function pieceFabric(cfg, p, part) {
  if (cfg.overrides && cfg.overrides[p.id]) return cfg.overrides[p.id];
  if (part === 'cushion' && cfg.cushion) return cfg.cushion;
  return cfg.fabric;
}

const tierOf = (ref) => TIERS[colorOf(ref).fam.tier];

export function priceOf(cfg) {
  const { pieces } = buildLayout(cfg);
  const depthK = 1 + DEPTHS[cfg.depth].surcharge;
  let modules = 0;
  let seatsCount = 0;
  for (const p of pieces) {
    const base = p.kind === 'arm' ? ARMS[cfg.arm].price : SEATS[p.code].price * depthK;
    const t = Math.max(tierOf(pieceFabric(cfg, p, 'body')), p.kind === 'arm' ? 0 : tierOf(pieceFabric(cfg, p, 'cushion')));
    modules += base * t;
    if (p.kind !== 'arm' && p.kind !== 'ottoman') seatsCount++;
  }
  const lines = [{ label: `${pieces.length} modules, covered in your fabric`, amount: Math.round(modules) }];
  if (cfg.comfort === 'soft') lines.push({ label: `Soft topper (${seatsCount} seats)`, amount: 30 * seatsCount });
  if (cfg.trim !== 'none') lines.push({ label: TRIMS[cfg.trim].name, amount: TRIMS[cfg.trim].price });
  if (LEG_SHAPES[cfg.legShape].price) lines.push({ label: `${LEG_SHAPES[cfg.legShape].name} legs`, amount: LEG_SHAPES[cfg.legShape].price });
  if (cfg.monogram && cfg.monogram.trim()) lines.push({ label: `Embroidered monogram "${cfg.monogram.trim().toUpperCase()}"`, amount: MONOGRAM_PRICE });
  lines.push({ label: 'White-glove delivery and assembly', amount: 0 });
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) / 5) * 5;
  return { lines, total, seatsCount, modules: pieces.length };
}

export function seatHeight(cfg) {
  return LEG_HEIGHTS[cfg.legHeight].cm + 20 + (cfg.comfort === 'soft' ? 16 : 14);
}

// §1.2: height and preferred use set seat height, depth and firmness.
export function recommend(person) {
  const h = +person.height || 175;
  const use = person.use;
  const depth = h >= 180 || use === 'lying' ? 105 : 95;
  const comfort = use === 'lying' ? 'soft' : use === 'reading' ? 'firm' : 'medium';
  const legHeight = h >= 185 ? 'high' : h < 163 ? 'low' : 'mid';
  const why = [];
  why.push(depth === 105 ? `Deep 105 cm seats, so ${use === 'lying' ? 'you can stretch out' : 'your thighs are supported at your height'}` : 'Standard 95 cm seats keep your feet on the floor');
  why.push(`${COMFORT[comfort].name} comfort for ${use === 'tv' ? 'watching TV' : use === 'reading' ? 'reading' : 'lying down'}`);
  why.push(`${LEG_HEIGHTS[legHeight].name} legs for a ${LEG_HEIGHTS[legHeight].cm + 20 + (comfort === 'soft' ? 16 : 14)} cm seat height`);
  return { depth, comfort, legHeight, why };
}

// The configurator combines seat widths and armrests to fit the wall (§1.2).
function bestCombo(target, maxN, minN = 1) {
  let best = null;
  for (let n = minN; n <= maxN; n++) {
    for (let k = 0; k <= n; k++) { // k seats of 100, n-k of 80
      const len = 100 * k + 80 * (n - k);
      if (len > target) continue;
      const score = len * 10 - n; // longest first, then fewer modules
      if (!best || score > best.score) best = { score, list: [...Array(k).fill('S100'), ...Array(n - k).fill('S80')] };
    }
  }
  return best ? best.list : null;
}

export function fitToWall(cfg) {
  const c = structuredClone(cfg);
  const A = ARMS[c.arm].width;
  const D = c.depth;
  const margin = 10;
  let fixed = 0;
  if (hasLeftCorner(c.shape)) fixed += D; else if (c.armL) fixed += A;
  if (hasRightCorner(c.shape)) fixed += D; else if (c.armR) fixed += A;
  if (c.shape.startsWith('chaise')) fixed += 90;
  const main = bestCombo(c.room.wall - margin - fixed, 5);
  if (!main) return { cfg: c, ok: false, msg: `The smallest ${c.shape.replace('-', ' ')} sofa does not fit a ${c.room.wall} cm wall. Try a straight layout or slim arms.` };
  c.main = main;
  const returnTarget = c.room.depth - 90 - D - A; // keep a 90 cm passage at the end of the return
  if (hasLeftCorner(c.shape)) c.left = bestCombo(returnTarget, 2) || ['S80'];
  if (hasRightCorner(c.shape)) c.right = bestCombo(returnTarget, 2) || ['S80'];
  const W = buildLayout(c).W;
  return { cfg: c, ok: true, msg: `Fitted ${main.length} seat${main.length > 1 ? 's' : ''} on the main wall: the sofa is ${W} cm on a ${c.room.wall} cm wall.` };
}

export function fitCheck(cfg) {
  const L = buildLayout(cfg);
  const free = cfg.room.wall - L.W;
  const walk = cfg.room.depth - L.Dt;
  const issues = [];
  if (free < 0) issues.push({ level: 'bad', text: `Too wide by ${-free} cm for a ${cfg.room.wall} cm wall.` });
  if (walk < 60) issues.push({ level: 'bad', text: `Only ${Math.max(walk, 0)} cm left in front of the sofa. We suggest at least 90 cm to walk past.` });
  else if (walk < 90) issues.push({ level: 'warn', text: `${walk} cm left in front of the sofa: tight but usable. 90 cm is comfortable.` });
  if (!issues.length) issues.push({ level: 'ok', text: `Fits: ${free} cm of free wall and ${walk} cm to walk in front.` });
  return { ...L, free, walk, issues, fits: !issues.some((i) => i.level === 'bad') };
}

/* ---------- Capable-to-promise delivery dates (§2.1, §2.5, Table 11) ---------- */

export function isWorkingDay(d) {
  const wd = d.getDay();
  return wd !== 0 && wd !== 6 && !isHoliday(d);
}
export function addWorkingDays(date, n) {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d)) left--;
  }
  return d;
}
export function nextWorkingDay(date) { return addWorkingDays(date, 1); }

export function seasonalPool(date = new Date()) {
  // Demo assumption: in a normal month the pool holds 2 days of MTO capacity, scaled by the seasonal index.
  return Math.round(2 * SEASON[date.getMonth()] * 10) / 10;
}

export function poolStatus(pool) {
  if (pool > 3) return { key: 'high', label: 'Above the upper limit', action: 'Saturday overtime, temporary operators, floaters moved to sewing and upholstery. Promised dates extended.', extra: pool > 4 ? 3 : 2 };
  if (pool < 1) return { key: 'low', label: 'Below the lower limit', action: 'Dates brought forward, promotions, module stock build-up, training and maintenance.', extra: -1 };
  return { key: 'normal', label: 'Normal (1–3 days)', action: 'Standard release, promised date of 10 working days.', extra: 0 };
}

// Day 1 = order validation. Orders confirmed by 14:00 on a working day are validated the same day
// and released next morning; later orders start the next working day.
export function dayOne(now) {
  const n = new Date(now);
  if (isWorkingDay(n) && n.getHours() < 14) { const d = new Date(n); d.setHours(9, 0, 0, 0); return d; }
  return nextWorkingDay(n);
}

export function promise(now, region, pool) {
  const d1 = dayOne(now);
  const transit = REGIONS[region]?.transit ?? 3;
  const st = poolStatus(pool);
  const totalDays = 7 + transit + st.extra; // validation, 5 production days, safety day, transit
  const delivery = addWorkingDays(d1, totalDays - 1);
  return { d1, delivery, totalDays, transit, status: st };
}

export function stagesFor(order) {
  const d1 = new Date(order.d1);
  const day = (k) => addWorkingDays(d1, k - 1);
  const extra = order.extra || 0;
  const delivery = new Date(order.delivery);
  return [
    { key: 'confirmed', title: 'Order confirmed', text: 'Price and date fixed at checkout from the capacity booked in our workshop.', date: new Date(order.placedAt) },
    { key: 'validated', title: 'Checked by our order engineer', text: 'Layout checked against your room plan. Bill of modules and cutting file generated.', date: day(1) },
    { key: 'cut', title: 'Modules picked, fabric cut', text: 'Your padded modules are picked from stock. Your fabric is cut on our automatic cutter.', date: day(2) },
    { key: 'sewn', title: 'Covers sewn', text: 'Removable, zipped covers sewn by our upholsterers in Brianza.', date: day(4) },
    { key: 'upholstered', title: 'Upholstered', text: 'Covers fitted on the modules, cushions filled to your comfort level.', date: day(5) },
    { key: 'qc', title: 'Final check and packing', text: 'Seams, cover tension, legs and labels checked against your order. Packed flat.', date: day(6) },
    { key: 'shipped', title: 'With our delivery partner', text: 'Your 2-hour delivery slot is confirmed by text.', date: day(7 + Math.max(extra, 0)) },
    { key: 'delivered', title: 'Delivered and assembled', text: 'Our white-glove crew carries it in, assembles it and takes the packaging away.', date: delivery },
  ];
}

export const fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('en-GB', opts);
export const eur = (n) => '€' + Math.round(n).toLocaleString('en-GB');
