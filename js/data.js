// NEWCO catalogue and business rules.
// Every number here comes from the Assignment 2 report (section in brackets) or is a stated demo assumption.

// 13 padded module types (§1.2): 5 seat types x 2 depths + 3 armrests.
export const SEATS = {
  S80: { name: 'Single seat 80', width: 80, price: 360 },
  S100: { name: 'Single seat 100', width: 100, price: 420 },
  CRN: { name: 'Corner', width: null, price: 480 },
  CHL: { name: 'Chaise longue 160', width: 90, length: 160, price: 640 },
  OTT: { name: 'Ottoman', width: 80, price: 260 },
};
export const DEPTHS = { 95: { name: 'Standard 95 cm', surcharge: 0 }, 105: { name: 'Deep 105 cm', surcharge: 0.08 } };

export const ARMS = {
  slim: { code: 'ARM-SL', name: 'Slim', width: 15, price: 90, radius: 0.03 },
  square: { code: 'ARM-SQ', name: 'Square', width: 25, price: 120, radius: 0.025 },
  rounded: { code: 'ARM-RD', name: 'Rounded', width: 30, price: 140, radius: 0.11 },
};

export const COMFORT = {
  firm: { name: 'Firm', note: 'Upright, supportive. Good for reading and working.', price: 0 },
  medium: { name: 'Medium', note: 'The all-rounder. Good for films and evenings.', price: 0 },
  soft: { name: 'Soft topper', note: 'Feather-blend topper you sink into. Good for lying down.', price: 90 },
};

export const LEG_SHAPES = {
  tapered: { name: 'Tapered', price: 0 },
  block: { name: 'Block', price: 0 },
  cylinder: { name: 'Cylinder', price: 0 },
  sled: { name: 'Sled', price: 40 },
};
export const LEG_FINISHES = {
  oak: { name: 'Natural oak', hex: '#c9a57b' },
  smoked: { name: 'Smoked oak', hex: '#5b4232' },
  black: { name: 'Matt black', hex: '#222225' },
};
export const LEG_HEIGHTS = { low: { name: 'Low', cm: 8 }, mid: { name: 'Mid', cm: 11 }, high: { name: 'High', cm: 14 } };

export const TRIMS = {
  none: { name: 'None', price: 0 },
  piping: { name: 'Contrast piping', price: 60 },
  stitch: { name: 'Contrast stitching', price: 40 },
};
export const MONOGRAM_PRICE = 49;

export const TIERS = { A: 1.0, B: 1.12, C: 1.25 };

// 10 of the 40 fabric families (§1.2: 40 families, ≈150 colour references).
// texture drives the 3D material: weave | boucle | velvet | canvas | felt | cord
export const FABRICS = [
  { id: 'arezzo', name: 'Arezzo Linen Blend', tier: 'B', texture: 'weave', tags: [], stock: true,
    colors: [['Natural', '#d9cfbf'], ['Sand', '#cbb89b'], ['Sage', '#a3ad93'], ['Clay', '#b9826a'], ['Slate', '#6d7b8a'], ['Charcoal', '#45464a']] },
  { id: 'como', name: 'Como Bouclé', tier: 'C', texture: 'boucle', tags: [], stock: true,
    colors: [['Cream', '#ece5d8'], ['Oat', '#d8ccb6'], ['Stone', '#b7ad9e'], ['Mushroom', '#9b8b7b'], ['Charcoal', '#4c4a48']] },
  { id: 'brera', name: 'Brera Velvet', tier: 'C', texture: 'velvet', tags: [], stock: true,
    colors: [['Ink blue', '#2e3c5a'], ['Olive', '#6b6a3a'], ['Rust', '#9a4b2c'], ['Blush', '#d4a59a'], ['Bottle green', '#244a3c'], ['Mocha', '#5c4335']] },
  { id: 'prato', name: 'Prato Recycled Weave', tier: 'A', texture: 'weave', tags: ['recycled'], stock: true,
    colors: [['Light grey', '#c4c4c0'], ['Denim', '#5a6f8c'], ['Moss', '#727a4e'], ['Terracotta', '#b1664a'], ['Sand', '#cdbd9f'], ['Graphite', '#4a4c50']] },
  { id: 'sesia', name: 'Sesia Performance', tier: 'B', texture: 'canvas', tags: ['stain'], stock: true,
    colors: [['Chalk', '#e8e4dc'], ['Pebble', '#b2aca2'], ['Ocean', '#3f6479'], ['Forest', '#3c5544'], ['Mustard', '#c49a3c'], ['Ink', '#2b2f3a']] },
  { id: 'brianza', name: 'Brianza Chenille', tier: 'B', texture: 'boucle', tags: [], stock: false,
    colors: [['Ivory', '#efe9dd'], ['Latte', '#c7ad8f'], ['Sea blue', '#5d7f95'], ['Rose', '#c99b98'], ['Smoke', '#7d7b79']] },
  { id: 'lario', name: 'Lario Cotton Canvas', tier: 'A', texture: 'canvas', tags: [], stock: false,
    colors: [['White', '#f1efea'], ['Flax', '#d6c7a6'], ['Sky', '#9db4c6'], ['Ochre', '#c58f3d'], ['Black', '#2a2a2b']] },
  { id: 'dolomiti', name: 'Dolomiti Wool Felt', tier: 'C', texture: 'felt', tags: [], stock: false,
    colors: [['Heather grey', '#9a9895'], ['Camel', '#b38a5c'], ['Bordeaux', '#6e2d34'], ['Alpine green', '#4b5e48']] },
  { id: 'riviera', name: 'Riviera Easy-Care', tier: 'B', texture: 'canvas', tags: ['stain', 'recycled'], stock: false,
    colors: [['Sail white', '#ebe8e1'], ['Coral', '#d27c63'], ['Lagoon', '#3d7c80'], ['Dune', '#c9b48e']] },
  { id: 'milano', name: 'Milano Corduroy', tier: 'B', texture: 'cord', tags: [], stock: false,
    colors: [['Tobacco', '#8a5f3b'], ['Navy', '#2d3550'], ['Ecru', '#ddd2bc'], ['Olive', '#6c6a43'], ['Burgundy', '#5e2630']] },
];

export const TAG_LABEL = { stain: 'Stain-resistant', recycled: 'Recycled polyester' };

export function fabricById(id) { return FABRICS.find((f) => f.id === id) || FABRICS[0]; }
export function colorOf(ref) {
  // ref = "familyId:colorIndex"
  const [fid, ci] = (ref || 'arezzo:0').split(':');
  const fam = fabricById(fid);
  const c = fam.colors[+ci] || fam.colors[0];
  return { fam, name: c[0], hex: c[1], ref: `${fam.id}:${fam.colors.indexOf(c)}` };
}

// Delivery regions: transit days from the Brianza plant (§1.1: main markets 1–3 days by truck).
export const REGIONS = {
  IT: { name: 'Italy', transit: 2 },
  FR: { name: 'France', transit: 3 },
  DE: { name: 'Germany', transit: 3 },
  AT: { name: 'Austria', transit: 3 },
  CH: { name: 'Switzerland', transit: 3 },
  NL: { name: 'Netherlands', transit: 3 },
  BE: { name: 'Belgium', transit: 3 },
  LU: { name: 'Luxembourg', transit: 3 },
};

// Seasonal index of total demand (Table 5).
export const SEASON = [1.2, 0.95, 1.05, 1.0, 0.9, 0.85, 0.7, 0.6, 1.15, 1.2, 1.35, 1.05];

// Plant closures: Italian public holidays + collective closures in August and at Christmas (§2.3).
export function isHoliday(d) {
  const m = d.getMonth() + 1, day = d.getDate();
  const fixed = ['1-1', '1-6', '4-25', '5-1', '6-2', '8-15', '11-1', '12-8', '12-25', '12-26'];
  if (fixed.includes(`${m}-${day}`)) return true;
  if (m === 8 && day >= 8 && day <= 23) return true; // August closure
  if ((m === 12 && day >= 24) || (m === 1 && day <= 2)) return true; // Christmas closure
  return false;
}

// Starter layouts for the home page and configurator.
export const PRESETS = {
  nook: { title: 'The Nook', blurb: 'Two seats for a small flat.', cfg: { shape: 'straight', main: ['S100', 'S100'], arm: 'slim', fabric: 'prato:1' } },
  classic: { title: 'The Classic', blurb: 'Three seats, the most-ordered layout.', cfg: { shape: 'straight', main: ['S100', 'S100', 'S100'], arm: 'square', fabric: 'arezzo:1' } },
  lounger: { title: 'The Lounger', blurb: 'Two seats and a chaise for lying down.', cfg: { shape: 'chaise-right', main: ['S100', 'S100'], arm: 'square', fabric: 'como:1' } },
  corner: { title: 'The Corner', blurb: 'An L-shape that fills a corner.', cfg: { shape: 'corner-right', main: ['S100', 'S100'], right: ['S80'], arm: 'rounded', fabric: 'brera:0' } },
  gathering: { title: 'The Gathering', blurb: 'A U-shape for big families.', cfg: { shape: 'u', main: ['S100'], left: ['S80'], right: ['S80'], arm: 'square', fabric: 'prato:1' } },
};

export const SHAPES = {
  straight: 'Straight',
  'chaise-left': 'Chaise left',
  'chaise-right': 'Chaise right',
  'corner-left': 'Corner left',
  'corner-right': 'Corner right',
  u: 'U-shape',
};
