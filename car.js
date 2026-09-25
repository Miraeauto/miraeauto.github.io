import * as THREE from 'three';

// Unbranded compact sedan loosely modelled on a current Korean C-segment car.
// Built as a loft of cross-sections along z (front at -z, right side at +x).
const U0 = -2.34, U1 = 2.34;
const FA = -1.41, RA = 1.31, WR = 0.33, AR = 0.395, WX = 0.79;
const END_F = 0.2, END_R = 0.17;
const INNER = 0.6;

function spline(pts) {
  return u => {
    if (u <= pts[0][0]) return pts[0][1];
    const n = pts.length - 1;
    if (u >= pts[n][0]) return pts[n][1];
    let i = 0;
    while (u > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const h = p2[0] - p1[0], t = (u - p1[0]) / h;
    const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * h;
    const m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
}

const BOT = spline([[-2.34, 0.36], [-2.2, 0.25], [-1.95, 0.2], [1.95, 0.2], [2.2, 0.27], [2.34, 0.38]]);
const BELT = spline([[-2.34, 0.62], [-2.15, 0.71], [-1.7, 0.8], [-1.1, 0.86], [-0.8, 0.885], [0, 0.925], [0.8, 0.96], [1.5, 0.99], [2.0, 1.0], [2.25, 0.985], [2.34, 0.95]]);
const ROOF = spline([[-0.86, 0.885], [-0.62, 1.02], [-0.36, 1.19], [-0.1, 1.335], [0.2, 1.4], [0.55, 1.41], [0.86, 1.375], [1.2, 1.27], [1.55, 1.14], [1.85, 1.03], [2.02, 1.0]]);
const HW = spline([[-2.34, 0.7], [-2.2, 0.82], [-1.9, 0.89], [-1.4, 0.912], [1.3, 0.912], [1.8, 0.895], [2.15, 0.855], [2.34, 0.79]]);

// points per segment: bottom, bottom arc, side, shoulder arc, shoulder, glass side, roof arc, roof top
const SEGS = [5, 5, 10, 5, 3, 7, 4, 7];
const K = SEGS.reduce((a, b) => a + b, 0);
const SEG_OF = SEGS.flatMap((n, s) => Array(n).fill(s));
const S_SIDE = SEGS[0] + SEGS[1];
const S_SHOULDER = S_SIDE + SEGS[2];
const S_GLASS = S_SHOULDER + SEGS[3] + SEGS[4];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const greenhouse = u => (u > -0.86 && u < 2.02 ? Math.max(0, ROOF(u) - BELT(u)) : 0);

// Right half cross-section from bottom centre (i=0) to top centre (i=K-1), before end rounding and arches.
function halfSection(u) {
  const b = BOT(u), t = BELT(u), w = HW(u), gh = greenhouse(u);
  const wg = w - 0.15, wr = lerp(wg, 0.57, clamp(gh / 0.25, 0, 1)), rr = Math.min(0.08, gh * 0.4);
  const rb = 0.1, rs = 0.075;
  const pts = [];
  const seg = (n, fn, last) => { for (let k = 0; k < n + (last ? 1 : 0); k++) pts.push(fn(k / n)); };
  seg(5, k => [lerp(0, w - rb, k), b]);
  seg(5, k => { const a = -Math.PI / 2 + k * Math.PI / 2; return [w - rb + Math.cos(a) * rb, b + rb + Math.sin(a) * rb]; });
  seg(10, k => [w - 0.02 * Math.abs(k - 0.35) + 0.008 * Math.exp(-(((k - 0.72) / 0.07) ** 2)), lerp(b + rb, t - rs, k)]);
  seg(5, k => { const a = k * Math.PI / 2; return [w - rs + Math.cos(a) * rs - 0.013, t - rs + Math.sin(a) * rs]; });
  seg(3, k => [lerp(w - rs - 0.013, wg, k), t]);
  seg(7, k => [lerp(wg, wr + rr, k), lerp(t, t + gh - rr, k)]);
  seg(4, k => { const a = k * Math.PI / 2; return [wr + Math.cos(a) * rr, t + gh - rr + Math.sin(a) * rr]; });
  seg(6, k => { const x = lerp(wr, 0, k); const top = wr > 0 ? 1 - (x / wr) ** 2 : 0; return [x, t + gh + (gh > 0.02 ? 0.02 : 0.03) * top]; }, true);
  return { pts, b, t, gh };
}

// Final surface point for right-half index i at station u, plus a shade value for the vertex colour.
function surf(u, i) {
  const { pts, b, t, gh } = halfSection(u);
  let [x, y] = pts[i];
  const s = SEG_OF[i];
  let shade = 1;
  const d = Math.min(u - U0, U1 - u), R = u < 0 ? END_F : END_R;
  const cap = d < R;
  if (cap) {
    const f = Math.sqrt(1 - (1 - d / R) ** 2);
    const yc = (b + t) / 2;
    x *= f; y = yc + (y - yc) * f;
  }
  let arch = false;
  for (const A of [FA, RA]) {
    const du = u - A;
    if (Math.abs(du) < AR) {
      const ay = WR + Math.sqrt(AR * AR - du * du);
      if (x > INNER && y < ay) { y = ay; arch = true; }
    }
  }
  if (s <= 1 || (s === 2 && y < b + 0.09)) shade = 0.06;
  if (gh > 0.02) {
    const k = i - S_GLASS;
    if (s === 5 && k < 6 && u > -0.6 && u < 1.2) shade = 0.025;
    if (s === 5 && u > 0.12 && u < 0.26) shade = 0.02;
    if (s === 7 && (u < -0.16 || u > 0.72)) shade = 0.025;
  }
  if (cap && u < 0 && x < 0.76 && y > 0.27 && y < 0.6) shade = 0.035;
  if (cap && u > 0 && y < 0.37) shade = 0.06;
  if (arch) shade = 0.05;
  return { x, y, z: u, shade };
}

function stations(n) {
  const out = [];
  for (let j = 0; j <= n; j++) out.push(U0 + (U1 - U0) * (1 - Math.cos(Math.PI * j / n)) / 2);
  return out;
}

// Grid mesh over stations x right-half index range, optionally mirrored into a closed ring.
function gridGeometry(us, i0, i1, { ring = false, offset = 0, uv = false } = {}) {
  const rows = us.map(u => {
    const half = [];
    for (let i = i0; i <= i1; i++) half.push(surf(u, i));
    if (!ring) return half;
    const left = [];
    for (let i = K - 2; i >= 1; i--) { const p = surf(u, i); left.push({ ...p, x: -p.x }); }
    return half.concat(left);
  });
  const cols = rows[0].length;
  const pos = [], col = [], uvs = [], idx = [];
  rows.forEach((row, j) => row.forEach((p, i) => {
    pos.push(p.x + Math.sign(p.x) * offset, p.y, p.z);
    col.push(p.shade, p.shade, p.shade);
    uvs.push(i / (cols - 1), j / (rows.length - 1));
  }));
  const span = ring ? cols : cols - 1;
  for (let j = 0; j < rows.length - 1; j++) {
    for (let i = 0; i < span; i++) {
      const a = j * cols + i, b = j * cols + (i + 1) % cols, c = (j + 1) * cols + i, d = (j + 1) * cols + (i + 1) % cols;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mirrored(geo) {
  const g = geo.clone();
  g.scale(-1, 1, 1);
  const a = g.index.array, flipped = [];
  for (let k = 0; k < a.length; k += 3) flipped.push(a[k], a[k + 2], a[k + 1]);
  g.setIndex(flipped);
  g.computeVertexNormals();
  return g;
}

function tubeAlong(points, r, mat) {
  const clean = points.filter((p, k) => k === 0 || p.distanceTo(points[k - 1]) > 0.004);
  if (clean.length < 2) return new THREE.Group();
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(clean), clean.length * 3, r, 6), mat);
}

function wheel(side, mats) {
  const g = new THREE.Group();
  const rIn = 0.225, hw = 0.112;
  const prof = [new THREE.Vector2(rIn, -hw * 0.95)];
  for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + (k / 12) * Math.PI; prof.push(new THREE.Vector2(WR - 0.035 + Math.cos(a) * 0.035, Math.sin(a) * hw)); }
  prof.push(new THREE.Vector2(rIn, hw * 0.95));
  const tire = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), mats.rubber);
  tire.rotation.z = Math.PI / 2;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rIn, rIn, 0.2, 40, 1, true), mats.dark);
  barrel.rotation.z = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(rIn, 40), mats.dark);
  face.rotation.y = side * Math.PI / 2;
  face.position.x = 0.06 * side;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(rIn - 0.006, 0.012, 8, 48), mats.alloy);
  lip.rotation.y = Math.PI / 2;
  lip.position.x = 0.1 * side;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.05, 24), mats.alloy);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = 0.085 * side;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 32), mats.brake);
  disc.rotation.z = Math.PI / 2;
  disc.position.x = 0.02 * side;
  g.add(tire, barrel, face, lip, hub, disc);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + (i % 2 ? 0.1 : -0.1);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.17, 0.028), mats.alloy);
    spoke.position.set(0.09 * side, Math.cos(a) * 0.135, Math.sin(a) * 0.135);
    spoke.rotation.x = a;
    g.add(spoke);
  }
  return g;
}

export function buildCar(paint) {
  paint.vertexColors = true;
  paint.needsUpdate = true;
  const mats = {
    trim: new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.5, metalness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9, side: THREE.DoubleSide }),
    alloy: new THREE.MeshStandardMaterial({ color: 0xd4d8dd, metalness: 1, roughness: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1b1e22, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide }),
    brake: new THREE.MeshStandardMaterial({ color: 0x5a5e63, metalness: 0.8, roughness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe8ebee, metalness: 1, roughness: 0.12 }),
    liner: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1, side: THREE.DoubleSide }),
    head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf2ff, emissiveIntensity: 1.4, side: THREE.DoubleSide }),
    tail: new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1c1c, emissiveIntensity: 1.1, side: THREE.DoubleSide }),
    plate: new THREE.MeshStandardMaterial({ color: 0xeceff2, roughness: 0.45 }),
  };
  const car = new THREE.Group();
  const body = new THREE.Mesh(gridGeometry(stations(150), 0, K - 1, { ring: true }), paint);
  body.name = 'body';
  car.add(body);

  for (const A of [FA, RA]) for (const side of [-1, 1]) {
    const g = new THREE.CylinderGeometry(AR - 0.012, AR - 0.012, 0.36, 32, 1, true, 0, Math.PI);
    g.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, mats.liner);
    m.position.set(side * 0.74, WR, A);
    car.add(m);
  }

  // lamps are patches of the rounded nose and tail
  const between = (a, b, n) => Array.from({ length: n + 1 }, (_, k) => lerp(a, b, k / n));
  const headGeo = gridGeometry(between(U0 + END_F * 0.45, U0 + END_F * 0.88, 8), S_SHOULDER - 2, S_SHOULDER, { offset: 0.004 });
  car.add(new THREE.Mesh(headGeo, mats.head), new THREE.Mesh(mirrored(headGeo), mats.head));
  const tailGeo = gridGeometry(between(U1 - END_R * 0.82, U1 - END_R * 0.68, 4), S_SHOULDER - 2, K - 1, { offset: 0.004 });
  car.add(new THREE.Mesh(tailGeo, mats.tail), new THREE.Mesh(mirrored(tailGeo), mats.tail));

  const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.11), mats.plate);
  fp.position.set(0, 0.42, U0 + 0.002);
  fp.rotation.y = Math.PI;
  const rp = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.11), mats.plate);
  rp.position.set(0, 0.54, U1 - 0.014);
  car.add(fp, rp);

  const V = (p, dx = 0, dy = 0) => new THREE.Vector3(p.x + dx, p.y + dy, p.z);
  for (const side of [-1, 1]) {
    const S = v => { v.x *= side; return v; };
    car.add(tubeAlong(between(-0.72, 1.86, 60).map(u => S(V(surf(u, S_GLASS), 0.004, 0.003))), 0.006, mats.chrome));
    for (const u of [-0.98, 0.17, 1.02]) {
      const pts = [];
      for (let i = S_SIDE + 1; i < S_SHOULDER + 2; i++) pts.push(S(V(surf(u, i), 0.002)));
      car.add(tubeAlong(pts, 0.0022, mats.trim));
    }
    for (const u of [-0.32, 0.72]) {
      const p = surf(u, S_SHOULDER - 2);
      const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.11, 4, 8), mats.chrome);
      h.rotation.x = Math.PI / 2;
      h.position.set(side * (p.x + 0.008), p.y, u);
      car.add(h);
    }
    const mp = surf(-0.7, S_GLASS);
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), paint);
    mirror.scale.set(1.25, 0.72, 1.45);
    mirror.position.set(side * (mp.x + 0.14), mp.y + 0.08, -0.68);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.05), mats.trim);
    arm.position.set(side * (mp.x + 0.06), mp.y + 0.05, -0.66);
    car.add(mirror, arm);
  }

  for (const [x, z] of [[-WX, FA], [WX, FA], [-WX, RA], [WX, RA]]) {
    const w = wheel(Math.sign(x), mats);
    w.position.set(x, WR, z);
    car.add(w);
  }

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 5.3), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  shadow.renderOrder = 2;
  car.add(shadow);
  return car;
}

function shadowTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 256;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(64, 128, 10, 64, 128, 124);
  grad.addColorStop(0, 'rgba(0,0,0,.85)');
  grad.addColorStop(0.55, 'rgba(0,0,0,.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(64, 128, 60, 124, 0, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Scratches and a dent on the right front door, conforming to the body surface.
const DMG_U = [-0.72, -0.1];
export const DAMAGE_POS = (() => { const p = surf(-0.41, 13); return new THREE.Vector3(p.x, p.y, p.z); })();

export function buildDamage() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const g = cv.getContext('2d');
  const dent = g.createRadialGradient(240, 200, 8, 256, 192, 170);
  dent.addColorStop(0, 'rgba(0,0,0,.5)');
  dent.addColorStop(0.45, 'rgba(0,0,0,.24)');
  dent.addColorStop(0.75, 'rgba(255,255,255,.09)');
  dent.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = dent;
  g.fillRect(0, 0, 512, 384);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 16; i++) {
    const x0 = 80 + rnd() * 150, y0 = 140 + rnd() * 110;
    const len = 90 + rnd() * 220, ang = -0.16 + rnd() * 0.2;
    g.strokeStyle = i % 5 === 0 ? 'rgba(245,247,250,.9)' : `rgba(${170 + rnd() * 50 | 0},${175 + rnd() * 50 | 0},${182 + rnd() * 50 | 0},${0.35 + rnd() * 0.4})`;
    g.lineWidth = i % 5 === 0 ? 2.5 + rnd() * 2 : 0.8 + rnd() * 1.6;
    g.beginPath();
    g.moveTo(x0, y0);
    let x = x0, y = y0;
    for (let k = 0; k < 8; k++) { x += (len / 8) * Math.cos(ang); y += (len / 8) * Math.sin(ang) + (rnd() - 0.5) * 6; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 9; i++) {
    g.fillStyle = i % 3 ? 'rgba(150,155,160,.85)' : 'rgba(235,238,241,.9)';
    g.beginPath();
    g.ellipse(170 + rnd() * 190, 160 + rnd() * 90, 2 + rnd() * 6, 1.5 + rnd() * 3.5, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const us = Array.from({ length: 13 }, (_, k) => lerp(DMG_U[0], DMG_U[1], k / 12));
  const geo = gridGeometry(us, 10, 17, { offset: 0.003, uv: true });
  geo.deleteAttribute('color');
  // grid uv.x runs up the section and uv.y front to rear; swap so the scratches run along the car
  const uv = geo.attributes.uv;
  for (let k = 0; k < uv.count; k++) { const a = uv.getX(k), b = uv.getY(k); uv.setXY(k, b, a); }
  const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}
