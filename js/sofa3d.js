// Three.js viewer for the configured sofa. Units: metres. x along the wall, z towards the room.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ARMS, LEG_FINISHES, LEG_HEIGHTS, colorOf } from './data.js';
import { buildLayout, pieceFabric } from './model.js';

const texCache = {};
function fabricTexture(kind) {
  if (texCache[kind]) return texCache[kind];
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#ececec';
  g.fillRect(0, 0, s, s);
  const rnd = mulberry(kind.length * 977);
  const dot = (x, y, r, v) => { g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  if (kind === 'boucle') {
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * s, y = rnd() * s, r = 1.2 + rnd() * 2.2;
      g.strokeStyle = `rgba(255,255,255,${0.5 + rnd() * 0.5})`;
      g.lineWidth = 1;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
      dot(x + 0.6, y + 0.6, r * 0.45, 170 + rnd() * 40);
    }
  } else if (kind === 'cord') {
    for (let x = 0; x < s; x += 8) {
      const grd = g.createLinearGradient(x, 0, x + 8, 0);
      grd.addColorStop(0, '#bdbdbd'); grd.addColorStop(0.5, '#ffffff'); grd.addColorStop(1, '#bdbdbd');
      g.fillStyle = grd; g.fillRect(x, 0, 8, s);
    }
  } else if (kind === 'weave' || kind === 'canvas') {
    const step = kind === 'weave' ? 4 : 3;
    for (let y = 0; y < s; y += step) for (let x = 0; x < s; x += step) {
      const v = ((x / step + y / step) % 2 ? 215 : 245) + (rnd() - 0.5) * (kind === 'weave' ? 40 : 18);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, step, step);
    }
    if (kind === 'weave') for (let i = 0; i < 90; i++) { // slub yarns of a linen blend
      const y = rnd() * s; g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.3})`; g.fillRect(rnd() * s, y, 10 + rnd() * 40, 1.5);
    }
  } else { // velvet, felt: soft noise
    for (let i = 0; i < 9000; i++) dot(rnd() * s, rnd() * s, 0.8 + rnd() * 1.6, kind === 'felt' ? 190 + rnd() * 60 : 222 + rnd() * 30);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache[kind] = t;
  return t;
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function createViewer(container, { onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.47;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ae9e, 1.15));
  const sun = new THREE.DirectionalLight(0xfff3e4, 2.9);
  sun.position.set(2.5, 5.5, 4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
  fill.position.set(-4, 3, 2);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  let sofa = new THREE.Group();
  scene.add(sofa);
  let outline = null;
  let lastFitKey = '';
  let selected = null;
  const mats = {};

  function fabricMat(ref) {
    if (mats[ref]) return mats[ref];
    const { fam, hex } = colorOf(ref);
    const params = { color: new THREE.Color(hex), map: fabricTexture(fam.texture), bumpMap: fabricTexture(fam.texture), bumpScale: fam.texture === 'boucle' ? 2.2 : 0.8, roughness: 0.92 };
    let m;
    if (fam.texture === 'velvet') {
      m = new THREE.MeshPhysicalMaterial({ ...params, roughness: 0.72, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.45) });
    } else {
      m = new THREE.MeshStandardMaterial(params);
    }
    mats[ref] = m;
    return m;
  }
  const legMat = (finish, shape) => {
    const k = `leg-${finish}-${shape}`;
    if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial({ color: LEG_FINISHES[finish].hex, roughness: finish === 'black' ? 0.45 : 0.55, metalness: shape === 'sled' && finish === 'black' ? 0.4 : 0 });
    return mats[k];
  };

  const box = (w, h, d, r, mat) => {
    const rr = Math.max(0.002, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002));
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, rr), mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };

  function backCushion(len, mat, H) {
    const g = new THREE.Group();
    const m = box(len, H, 0.16, 0.06, mat);
    m.position.set(0, H / 2, 0.08);
    g.add(m);
    g.rotation.order = 'YXZ';
    g.rotation.x = -0.13;
    return g;
  }

  function trimRod(len, color, kind) {
    const r = kind === 'piping' ? 0.0065 : 0.0028;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
    m.rotation.z = Math.PI / 2;
    return m;
  }

  function legs(g, lw, ld, cfg, L) {
    const finish = cfg.legFinish, shape = cfg.legShape;
    const mat = legMat(finish, shape);
    const ix = lw / 2 - 0.07, iz = ld / 2 - 0.07;
    if (shape === 'sled') {
      for (const sx of [-ix, ix]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, ld - 0.14), mat);
        rail.position.set(sx, 0.008, 0); rail.castShadow = true; g.add(rail);
        for (const sz of [-iz, iz]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.016, L, 0.016), mat); v.position.set(sx, L / 2, sz); v.castShadow = true; g.add(v); }
      }
      return;
    }
    let geo;
    if (shape === 'tapered') geo = new THREE.CylinderGeometry(0.019, 0.011, L, 18);
    else if (shape === 'block') geo = new THREE.BoxGeometry(0.05, L, 0.05);
    else geo = new THREE.CylinderGeometry(0.024, 0.024, L, 20);
    for (const sx of [-ix, ix]) for (const sz of [-iz, iz]) {
      const m = new THREE.Mesh(geo, mat); m.position.set(sx, L / 2, sz); m.castShadow = true; g.add(m);
    }
  }

  function buildPiece(p, cfg) {
    const g = new THREE.Group();
    const lw = p.lw / 100, ld = p.ld / 100;
    const L = LEG_HEIGHTS[cfg.legHeight].cm / 100;
    const BASE = 0.2, BACK_T = 0.2;
    const SEAT_T = cfg.comfort === 'soft' ? 0.16 : 0.14;
    const BACK_TOP = L + 0.6;
    const body = fabricMat(pieceFabric(cfg, p, 'body'));
    const cush = fabricMat(pieceFabric(cfg, p, 'cushion'));
    const trim = cfg.trim !== 'none' ? colorOf(cfg.trimColor).hex : null;
    const seatTop = L + BASE + SEAT_T;
    const backH = BACK_TOP - (L + BASE);

    const addSeatCushion = (w, d, x, z) => {
      const m = box(w, SEAT_T, d, cfg.comfort === 'firm' ? 0.035 : 0.055, cush);
      m.position.set(x, L + BASE + SEAT_T / 2, z);
      g.add(m);
      if (trim) { const r = trimRod(w - 0.06, trim, cfg.trim); r.position.set(x, seatTop - 0.012, z + d / 2 - (cfg.trim === 'piping' ? 0.004 : 0.012)); g.add(r); }
    };

    if (p.kind === 'arm') {
      const A = ARMS[cfg.arm];
      const h = 0.48;
      const m = box(lw, h, ld, A.radius, body);
      m.position.set(0, L + h / 2, 0);
      g.add(m);
      if (trim) { const r = trimRod(ld - 0.08, trim, cfg.trim); r.rotation.z = 0; r.rotation.x = Math.PI / 2; r.position.set(0, L + h + (cfg.trim === 'piping' ? 0.002 : -0.001), 0); g.add(r); }
      legs(g, lw, ld, cfg, L);
    } else {
      const base = box(lw, BASE, ld, 0.03, body);
      base.position.set(0, L + BASE / 2, 0);
      g.add(base);
      if (p.kind === 'ottoman') {
        addSeatCushion(lw - 0.01, ld - 0.01, 0, 0);
      } else {
        const back = box(lw, backH, BACK_T, 0.045, body);
        back.position.set(0, L + BASE + backH / 2, -ld / 2 + BACK_T / 2);
        g.add(back);
        const cushionH = backH - 0.06;
        if (p.kind === 'corner') {
          const s = p.side === 'right' ? 1 : -1;
          const side = box(BACK_T, backH, ld - BACK_T, 0.045, body);
          side.position.set(s * (lw / 2 - BACK_T / 2), L + BASE + backH / 2, BACK_T / 2);
          g.add(side);
          addSeatCushion(lw - BACK_T - 0.01, ld - BACK_T - 0.01, -s * BACK_T / 2, BACK_T / 2);
          const c1 = backCushion(lw - BACK_T - 0.04, cush, cushionH);
          c1.position.set(-s * BACK_T / 2, seatTop - 0.01, -ld / 2 + BACK_T);
          g.add(c1);
          const c2 = backCushion(ld - BACK_T - 0.2, cush, cushionH);
          c2.rotation.y = -s * Math.PI / 2;
          c2.position.set(s * (lw / 2 - BACK_T), seatTop - 0.01, BACK_T / 2 + 0.08);
          g.add(c2);
        } else {
          addSeatCushion(lw - 0.01, ld - BACK_T - 0.01, 0, BACK_T / 2);
          const c = backCushion(lw - 0.04, cush, cushionH);
          c.position.set(0, seatTop - 0.01, -ld / 2 + BACK_T);
          g.add(c);
        }
      }
      legs(g, lw, ld, cfg, L);
    }
    g.traverse((o) => { o.userData.pieceId = p.id; });
    return g;
  }

  function dispose(group) {
    group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  function update(cfg, sel = selected) {
    selected = sel;
    const L = buildLayout(cfg);
    const next = new THREE.Group();
    const cx = L.W / 200, cz = L.Dt / 200;
    for (const p of L.pieces) {
      const g = buildPiece(p, cfg);
      g.position.set(p.cx / 100 - cx, 0, p.cz / 100 - cz);
      g.rotation.y = p.rot;
      g.name = p.id;
      next.add(g);
    }
    scene.remove(sofa);
    dispose(sofa);
    sofa = next;
    scene.add(sofa);
    setOutline();
    const key = `${cfg.shape}|${L.W}|${L.Dt}`;
    if (key !== lastFitKey) { fit(L); lastFitKey = key; }
  }

  function setOutline() {
    if (outline) { scene.remove(outline); outline.geometry.dispose(); outline = null; }
    if (!selected) return;
    const obj = sofa.getObjectByName(selected);
    if (!obj) return;
    const b = new THREE.Box3().setFromObject(obj).expandByScalar(0.015);
    outline = new THREE.Box3Helper(b, new THREE.Color('#d0643b'));
    scene.add(outline);
  }

  function fit(L) {
    const size = Math.max(L.W, L.Dt * 1.2) / 100;
    const aspect = Math.max(camera.aspect || 1.4, 0.6);
    const dist = (size * 1.18 + 0.9) * Math.max(1, 1.35 / aspect);
    const target = new THREE.Vector3(0, 0.32, 0);
    const dir = new THREE.Vector3(0.42, 0.55, 1).normalize();
    camera.position.copy(target).addScaledVector(dir, dist);
    controls.target.copy(target);
    controls.update();
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // click (not drag) selects a module
  const ray = new THREE.Raycaster();
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(sofa.children, true)[0];
    if (onPick) onPick(hit ? hit.object.userData.pieceId : null);
  });

  let alive = true;
  (function loop() {
    if (!alive) return;
    if (!container.isConnected) { destroy(); return; }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  function destroy() {
    alive = false;
    ro.disconnect();
    dispose(sofa);
    controls.dispose();
    renderer.dispose();
  }

  return {
    update,
    select(id) { selected = id; setOutline(); },
    resetView() { lastFitKey = ''; },
    snapshot() { return renderer.domElement.toDataURL('image/jpeg', 0.8); },
    destroy,
  };
}
