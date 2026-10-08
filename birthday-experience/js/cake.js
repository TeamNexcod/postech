// The cake: procedural, PBR-shaded, built as two pieces from the start (the body and the
// slice that will be cut out) so the cut can open a real gap and reveal real geometry.
//
// Coordinates: the cake stands on y = 0, its axis is the y axis, radius R = 1, height H = 1.
// Angles are measured in the xz plane, x = cos(theta), z = sin(theta); +z faces the camera.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import topperFont from './topper-font.js';
import { createNoise3, mulberry32, smoothstep, clamp, angleDelta, DEG } from './util.js';
import * as TX from './textures.js';

export const R = 1, H = 1, B = 0.075, SIDE_TOP = H - B, GLAZE_T = 0.016;
// The wedge sits on the cake's right-hand side so the camera sees the blade broadside.
export const CUTS = [15 * DEG, -25 * DEG];         // first cut (front edge of the wedge), second cut
export const SLICE = { a: -25 * DEG, b: 15 * DEG, mid: -5 * DEG, pivotR: 0.55 };

const noise = createNoise3(7);
const L1 = SIDE_TOP, L2 = (Math.PI / 2) * B, L3 = R - B, S_TOTAL = L1 + L2 + L3;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------
// Shape: a nominal profile (vertical side, rounded top edge, flat top) pushed around by a
// smooth deformation field. Every surface (outer frosting, cut faces, glaze, decorations)
// samples the same field, so separately built pieces always meet without cracks.
// ---------------------------------------------------------------------------------------
function prof(s) {
  if (s <= L1) return [R, s];
  if (s <= L1 + L2) { const a = (s - L1) / B; return [R - B + B * Math.cos(a), SIDE_TOP + B * Math.sin(a)]; }
  return [Math.max(0, R - B - (s - L1 - L2)), H];
}

export function deformXYZ(r, theta, y, out = new THREE.Vector3()) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const irr = 0.011 * noise(c * 1.4 + 3.1, s * 1.4 + 0.7, y * 1.1)
    + 0.0045 * noise(c * 4 + 1, s * 4, y * 3)
    + 0.0018 * noise(c * 11 + 5, s * 11, y * 9);
  const foot = 0.012 * Math.exp(-y / 0.03);              // frosting pooled at the base
  const rr = r * (1 + irr) + foot * (r / R);
  const x0 = r * c, z0 = r * s;
  const wTop = smoothstep(0.55 * H, H, y);
  const dy = wTop * (0.011 * noise(x0 * 1.6 + 7, z0 * 1.6 + 2, 2.0) + 0.007 * (1 - (r / R) * (r / R)) - 0.003);
  out.set(rr * c, y + dy, rr * s);
  return out;
}

function F(theta, s, out) { const [r, y] = prof(s); return deformXYZ(r, theta, y, out); }

// Each nesting level gets its own scratch vectors: the glaze normal evaluates the glaze
// surface, which itself evaluates the frosting normal.
const scratch = [];
let depth = 0;
function surfaceNormal(fn, theta, s, sMin, sMax, out) {
  const e = 1e-3;
  if (!scratch[depth]) scratch[depth] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const [_a, _b, _c, _d] = scratch[depth++];
  fn(theta, Math.min(sMax, s + e), _a); fn(theta, Math.max(sMin, s - e), _b); _a.sub(_b);
  fn(theta + e, s, _c); fn(theta - e, s, _d); _c.sub(_d);
  depth--;
  out.crossVectors(_a, _c);
  if (out.lengthSq() < 1e-14) out.set(0, 1, 0); else out.normalize();
  return out;
}
const shellNormal = (theta, s, out) => surfaceNormal(F, theta, s, 0, S_TOTAL, out);

// Where the top glaze ends on the side (arc length along the profile), per angle.
function glazeEnd(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return L1 - 0.028 - 0.03 * (0.5 + 0.5 * noise(c * 2.6 + 9, s * 2.6, 0.5)) - 0.01 * noise(c * 8, s * 8, 3);
}
function glazeThickness(d) {
  return GLAZE_T * (1 + 0.5 * Math.exp(-d / 0.02)) * Math.sqrt(Math.min(1, d / 0.01)) + 0.0006;
}
const _gn = new THREE.Vector3();
function G(theta, c, out) {
  const se = glazeEnd(theta);
  const s = se + (S_TOTAL - se) * Math.pow(c, 1.7);
  F(theta, s, out);
  shellNormal(theta, s, _gn);
  return out.addScaledVector(_gn, glazeThickness(s - se));
}

// Point on top of the glaze, for decorations.
export function topPoint(r, theta, out = new THREE.Vector3()) {
  deformXYZ(r, theta, H, out);
  out.y += GLAZE_T;
  return out;
}

// ---------------------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------------------
function thetaSamples(a, b) {
  const n = Math.max(8, Math.ceil((b - a) / (TAU / 150)));
  const out = [];
  for (let i = 0; i <= n; i++) out.push(a + ((b - a) * i) / n);
  // denser columns right next to the cut planes so the opening slit stays smooth
  for (const off of [0.0025, 0.007, 0.014, 0.024]) out.push(a + off, b - off);
  out.sort((x, y) => x - y);
  return out.filter((v, i) => i === 0 || v - out[i - 1] > 1e-5);
}

function profileSamples() {
  const s = [];
  const side = 36, arc = 10, top = 30;
  for (let i = 0; i <= side; i++) s.push((L1 * i) / side);
  for (let i = 1; i <= arc; i++) s.push(L1 + (L2 * i) / arc);
  for (let i = 1; i <= top; i++) s.push(L1 + L2 + L3 * Math.pow(i / top, 1.15));
  return s;
}
const S_SAMPLES = profileSamples();

function gridIndices(rows, cols, flip) {
  const idx = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = (i + 1) * cols + j, c = (i + 1) * cols + j + 1, d = i * cols + j + 1;
      if (flip) idx.push(a, b, d, b, c, d); else idx.push(a, d, b, b, d, c);
    }
  }
  return idx;
}

// Flip the winding if most triangles disagree with the expected outward normal.
function orient(pos, idx, expected) {
  const p = (k, v) => v.set(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3(), n = new THREE.Vector3();
  let vote = 0;
  for (let t = 0; t < idx.length; t += 3) {
    p(idx[t], A); p(idx[t + 1], Bv); p(idx[t + 2], C);
    n.crossVectors(Bv.sub(A), C.sub(A));
    if (n.lengthSq() < 1e-14) continue;
    vote += n.dot(expected(idx[t])) >= 0 ? 1 : -1;
  }
  if (vote < 0) for (let k = 0; k < idx.length; k += 3) { const tmp = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = tmp; }
  return idx;
}

function makeGeometry(pos, nrm, uv, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nrm) g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  if (!nrm) g.computeVertexNormals();
  return g;
}

// Outer frosting shell of the sector [a, b].
function buildShell(a, b) {
  const th = thetaSamples(a, b);
  const pos = [], nrm = [], uv = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  for (const t of th) {
    for (const s of S_SAMPLES) {
      F(t, s, P); shellNormal(t, s, N);
      pos.push(P.x, P.y, P.z); nrm.push(N.x, N.y, N.z);
      uv.push((t / TAU) * 3, s * 1.4);
    }
  }
  const idx = orient(pos, gridIndices(th.length, S_SAMPLES.length, false), (k) => new THREE.Vector3(nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]));
  return makeGeometry(pos, nrm, uv, idx);
}

// Planar cut face at angle theta. `outward` is the face normal pointing out of the piece.
function buildFace(theta, outward) {
  const rows = [];
  for (const s of S_SAMPLES) if (s <= L1 + L2 + 1e-9) { const [r, y] = prof(s); rows.push([r, y]); }
  const cols = [0];
  for (let i = S_SAMPLES.length - 1; i >= 0; i--) if (S_SAMPLES[i] > L1 + L2 + 1e-9) cols.push(prof(S_SAMPLES[i])[0] / (R - B));
  cols.sort((x, y) => x - y);
  if (cols[cols.length - 1] < 1) cols.push(1);
  const pos = [], nrm = [], uv = [];
  const P = new THREE.Vector3();
  for (const [rmax, y] of rows) {
    for (const u of cols) {
      deformXYZ(u * rmax * 0.996, theta, Math.min(y, H - 0.003), P);
      pos.push(P.x, P.y, P.z); nrm.push(outward.x, outward.y, outward.z);
      uv.push((u * rmax) / R, y / H);
    }
  }
  const idx = orient(pos, gridIndices(rows.length, cols.length, false), () => outward);
  return makeGeometry(pos, nrm, uv, idx);
}

function buildGlaze(a, b) {
  const th = thetaSamples(a, b);
  const C = 34;
  const pos = [], nrm = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  const gn = (t, c, out) => surfaceNormal(G, t, c, 0, 1, out);
  for (const t of th) {
    for (let j = 0; j <= C; j++) {
      const c = j / C;
      G(t, c, P); gn(t, Math.max(0.002, c), N);
      pos.push(P.x, P.y, P.z); nrm.push(N.x, N.y, N.z);
    }
  }
  // the analytic normal flips sign depending on parameter direction; point it up/out
  for (let k = 0; k < nrm.length; k += 3) {
    const px = pos[k], pz = pos[k + 2];
    if (nrm[k] * px + nrm[k + 1] * 0.6 + nrm[k + 2] * pz < 0) { nrm[k] *= -1; nrm[k + 1] *= -1; nrm[k + 2] *= -1; }
  }
  const idx = orient(pos, gridIndices(th.length, C + 1, false), (k) => new THREE.Vector3(nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]));
  return makeGeometry(pos, nrm, null, idx);
}

// The thin purple band of glaze seen in section at a cut plane.
function buildGlazeFace(theta, outward) {
  const C = 34;
  const pos = [];
  const P = new THREE.Vector3(), Q = new THREE.Vector3();
  const se = glazeEnd(theta);
  for (let j = 0; j <= C; j++) {
    const c = j / C;
    const s = se + (S_TOTAL - se) * Math.pow(c, 1.7);
    F(theta, s, P); G(theta, c, Q);
    Q.lerp(P, 0.12); P.multiplyScalar(0.997); // tucked just inside the glaze surface
    pos.push(P.x, P.y, P.z, Q.x, Q.y, Q.z);
  }
  const idx = orient(pos, gridIndices(C + 1, 2, false), () => outward);
  const nrm = [];
  for (let k = 0; k < pos.length / 3; k++) nrm.push(outward.x, outward.y, outward.z);
  return makeGeometry(pos, nrm, null, idx);
}

function buildDrip(theta0, len, halfW, seed) {
  const rows = 30, cols = 12;
  const yTop = glazeEnd(theta0) + 0.02;
  const rb = halfW * 1.3;
  const pos = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const l = len * (1 - Math.pow(1 - t, 1.25));
    let w;
    if (l < len - rb) w = halfW + (rb - halfW) * smoothstep(len - 3.2 * rb, len - rb, l);
    else { const q = (l - (len - rb)) / rb; w = rb * Math.sqrt(Math.max(0, 1 - q * q)); }
    w *= 1 + 0.1 * noise(seed * 3.1, l * 18, 1.7);
    const thick = w * 0.55;
    const tc = theta0 + 0.006 * noise(seed, l * 5, 4.2);
    const y = yTop - l;
    for (let j = 0; j <= cols; j++) {
      const a = -1 + (2 * j) / cols;
      const th = tc + (a * w) / R;
      deformXYZ(R, th, y, P); shellNormal(th, Math.max(0, y), N);
      const h = thick * Math.pow(Math.max(0, 1 - a * a), 0.6) + 0.0008;
      pos.push(P.x + N.x * h, P.y + N.y * h, P.z + N.z * h);
    }
  }
  const out = new THREE.Vector3(Math.cos(theta0), 0, Math.sin(theta0));
  const idx = orient(pos, gridIndices(rows + 1, cols + 1, false), () => out);
  return makeGeometry(pos, null, null, idx);
}

function rosetteGeometry() {
  const segH = 26, segA = 56;
  const pos = [];
  for (let i = 0; i <= segH; i++) {
    const h = i / segH;
    const rr = 0.082 * Math.pow(Math.max(0, 1 - Math.pow(h, 1.5)), 0.62) * (1 + 0.12 * Math.sin(h * Math.PI));
    const y = h * 0.118;
    const curl = 0.014 * Math.pow(h, 2.4);
    for (let j = 0; j <= segA; j++) {
      const phi = (j / segA) * TAU;
      const ridge = 1 + 0.17 * Math.cos(8 * phi + h * 6.0) * (1 - 0.6 * h);
      pos.push(rr * ridge * Math.cos(phi) + curl, y, rr * ridge * Math.sin(phi));
    }
  }
  const idx = orient(pos, gridIndices(segH + 1, segA + 1, false), (k) => new THREE.Vector3(pos[k * 3], 0.2, pos[k * 3 + 2]));
  return makeGeometry(pos, null, null, idx);
}

function berryGeometry() {
  const g = new THREE.SphereGeometry(1, 22, 16);
  const n = createNoise3(91);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.035 * n(x * 2.2, y * 2.2, z * 2.2) - 0.08 * smoothstep(0.82, 1, y); // dimple at the crown
    p.setXYZ(i, x * k, y * k * 0.86, z * k);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------
// Materials. Every piece of the cake that touches a cut plane gets the "cut" shader chunk:
// vertices next to the blade are pushed apart (the slit), and the lips of cream are raised.
// ---------------------------------------------------------------------------------------
const CUT_HEADER = /* glsl */`
uniform vec2 uCutDir[2];
uniform float uCutY[2];
uniform float uCutSlope[2];
uniform float uCutOpen[2];
uniform float uCutBulge[2];
uniform float uSide[2];
varying float vCutAO;
vec3 cutDeform(vec3 p) {
  vec3 o = p;
  vCutAO = 1.0;
  for (int k = 0; k < 2; k++) {
    vec2 dir = uCutDir[k];
    vec2 perp = vec2(-dir.y, dir.x);
    float along = dot(p.xz, dir);
    float d = dot(p.xz, perp);
    float ad = abs(d);
    float s = ad < 1e-4 ? uSide[k] : sign(d);
    float edgeY = uCutY[k] + (along - 0.5) * uCutSlope[k];
    float m = smoothstep(edgeY - 0.04, edgeY + 0.004, p.y) * smoothstep(-0.03, 0.03, along);
    float w = exp(-(ad * ad) / 0.0016);
    o.xz += perp * s * uCutOpen[k] * w * m;
    float lip = max(exp(-(ad * ad) / 0.0005) - exp(-(ad * ad) / 0.00003), 0.0);
    o.y += uCutBulge[k] * lip * smoothstep(0.86, 1.0, p.y) * m;
    float open = smoothstep(0.0, 0.004, uCutOpen[k]);
    vCutAO = min(vCutAO, 1.0 - 0.6 * open * m * exp(-(ad * ad) / 0.00012));
  }
  return o;
}
`;

function applyCut(material, shared, side, extra = {}) {
  const local = { uSide: { value: side }, ...extra };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, local);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + CUT_HEADER)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = cutDeform(transformed);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vCutAO;\n' + (extra.uExpose ? 'uniform float uExpose;\n' : ''))
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= vCutAO;' + (extra.uExpose ? '\ndiffuseColor.rgb *= mix(0.32, 1.0, uExpose);' : ''));
  };
  material.customProgramCacheKey = () => 'cut' + (extra.uExpose ? 'face' : '');
  material.userData.cut = local;
  return material;
}

// ---------------------------------------------------------------------------------------
// Candles and flames
// ---------------------------------------------------------------------------------------
const FLAME_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FLAME_FRAG = /* glsl */`
uniform float uTime;
uniform float uLife;
uniform float uSeed;
uniform float uWind;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
void main() {
  float t = uTime;
  float life = uLife;
  float n1 = vnoise(vec2(t * 2.3 + uSeed * 17.0, uSeed));
  float n2 = vnoise(vec2(t * 7.1 + uSeed * 5.0, 3.0 + uSeed));
  float height = (0.74 + 0.16 * n1 + 0.05 * n2) * mix(0.25, 1.0, life);
  float yy = vUv.y / height;
  // the tip wanders more than the base; licks travel upward
  float sway = (vnoise(vec2(t * 3.1 + uSeed * 9.0, yy * 2.2 - t * 4.5)) - 0.5) * 0.30 * yy * yy + uWind * yy * yy;
  float x = (vUv.x - 0.5) - sway;
  float w = 0.62 * pow(clamp(yy, 0.0, 1.0), 0.45) * pow(clamp(1.0 - yy, 0.0, 1.0), 0.85) * (0.9 + 0.2 * n2) + 1e-4;
  float d = abs(x) / w;
  float body = smoothstep(1.0, 0.45, d) * step(0.0, yy) * smoothstep(1.0, 0.82, yy);
  float core = smoothstep(0.7, 0.0, d) * smoothstep(0.06, 0.24, yy) * smoothstep(0.78, 0.3, yy);
  float base = smoothstep(0.3, 0.02, yy) * smoothstep(1.0, 0.25, d);
  vec3 col = mix(vec3(1.0, 0.30, 0.05), vec3(1.0, 0.60, 0.20), smoothstep(0.95, 0.35, d));
  col = mix(col, vec3(1.0, 0.92, 0.72), core);
  col = mix(col, vec3(0.22, 0.38, 1.0), base * (1.0 - core) * 0.75);
  float a = body * (0.9 - 0.45 * base);
  float glow = (2.4 + 3.2 * core) * life;
  gl_FragColor = vec4(col * a * glow, 1.0);
}`;

function buildCandle(i, waxMap, glowTex, rnd) {
  const g = new THREE.Group();
  const hgt = 0.36 + rnd() * 0.02;
  const waxMat = new THREE.MeshStandardMaterial({ map: waxMap, roughness: 0.5, envMapIntensity: 0.6 });
  const glowU = { value: 0 };
  waxMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaxGlow = glowU;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWaxH;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaxH = position.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vWaxH;\nuniform float uWaxGlow;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(1.0, 0.48, 0.16) * uWaxGlow * smoothstep(${(hgt / 2 - 0.09).toFixed(3)}, ${(hgt / 2).toFixed(3)}, vWaxH);`);
  };
  waxMat.customProgramCacheKey = () => 'wax' + hgt.toFixed(3);
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.025, hgt, 28, 1), waxMat);
  wax.position.y = hgt / 2 - 0.05; // 5 cm pushed into the cake
  wax.castShadow = true;
  g.add(wax);
  const topY = hgt - 0.05;
  // slightly melted, recessed top
  const cup = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.005, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.35 }));
  cup.rotation.x = Math.PI / 2; cup.position.y = topY - 0.001;
  g.add(cup);
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x141110, roughness: 0.9 });
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0032, 0.04, 6), wickMat);
  wick.position.y = topY + 0.017; wick.rotation.z = (rnd() - 0.5) * 0.35; wick.rotation.x = (rnd() - 0.5) * 0.2;
  g.add(wick);
  const emberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 8, 6), emberMat);
  ember.position.set(0, 0.019, 0); wick.add(ember);

  const flameU = { uTime: { value: 0 }, uLife: { value: 0 }, uSeed: { value: rnd() * 10 }, uWind: { value: 0 } };
  const flame = new THREE.Mesh(
    new THREE.PlaneGeometry(0.09, 0.19).translate(0, 0.095, 0),
    new THREE.ShaderMaterial({ uniforms: flameU, vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  flame.position.y = topY + 0.012;
  flame.visible = false;
  g.add(flame);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa860, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  halo.scale.setScalar(0.5);
  halo.position.y = topY + 0.07;
  g.add(halo);
  const light = new THREE.PointLight(0xffa24f, 0, 4, 2);
  light.position.y = topY + 0.08;
  g.add(light);
  return { group: g, flame, flameU, halo, light, ember, emberMat, glowU, life: 0, seed: rnd() * 100, topY };
}

// ---------------------------------------------------------------------------------------
// Topper
// ---------------------------------------------------------------------------------------
function buildTopper(goldMat, creamMat) {
  const font = new Font(topperFont);
  const text = new TextGeometry('AMIT', { font, size: 0.24, height: 0.022, depth: 0.022, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.0032, bevelSegments: 3 });
  text.computeBoundingBox();
  const bb = text.boundingBox;
  text.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y + 0.012, -(bb.min.z + bb.max.z) / 2);
  const width = bb.max.x - bb.min.x;
  const g = new THREE.Group();
  const letters = new THREE.Mesh(text, goldMat);
  letters.castShadow = true;
  g.add(letters);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(width + 0.03, 0.02, 0.022), goldMat);
  bar.position.y = 0.006; bar.castShadow = true;
  g.add(bar);
  const stakeLen = 0.34;
  for (const sx of [-1, 1]) {
    const stake = new THREE.Mesh(new THREE.BoxGeometry(0.014, stakeLen, 0.012), goldMat);
    stake.position.set(sx * (width / 2 - 0.05), -stakeLen / 2 + 0.006, 0);
    stake.castShadow = true;
    g.add(stake);
  }
  return { group: g, width, stakeX: width / 2 - 0.05 };
}

// ---------------------------------------------------------------------------------------
// Build everything
// ---------------------------------------------------------------------------------------
export function createCake({ quality }) {
  const rnd = mulberry32(2024);
  const root = new THREE.Group();
  const body = new THREE.Group();
  const slice = new THREE.Group();
  const sliceInner = new THREE.Group();
  const pivot = new THREE.Vector3(Math.cos(SLICE.mid) * SLICE.pivotR, 0, Math.sin(SLICE.mid) * SLICE.pivotR);
  slice.position.copy(pivot);
  sliceInner.position.copy(pivot).negate();
  slice.add(sliceInner);
  root.add(body, slice);

  const cutShared = {
    uCutDir: { value: CUTS.map((t) => new THREE.Vector2(Math.cos(t), Math.sin(t))) },
    uCutY: { value: [5, 5] },
    uCutSlope: { value: [0, 0] },
    uCutOpen: { value: [0, 0] },
    uCutBulge: { value: [0, 0] },
  };

  const section = TX.cakeCrossSection(quality.mobile ? 512 : 768);
  const relief = TX.frostingRelief(quality.mobile ? 256 : 512, quality.mobile ? 256 : 512);
  const frostingParams = {
    color: 0xf4efe7, roughness: 0.62, roughnessMap: relief.roughnessMap, bumpMap: relief.bumpMap, bumpScale: 0.45,
    sheen: 0.4, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.75, envMapIntensity: 0.55,
  };
  const glazeParams = { color: 0x2b1442, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.1 };
  const creamMat = new THREE.MeshPhysicalMaterial(frostingParams);

  const pieces = { body: { group: body, side: [1, -1], a: CUTS[0], b: CUTS[1] + TAU }, slice: { group: sliceInner, side: [-1, 1], a: SLICE.a, b: SLICE.b } };
  const faceMaterials = [];
  const hiddenUntilCut = [];
  for (const key of Object.keys(pieces)) {
    const pc = pieces[key];
    const frost = applyCut(new THREE.MeshPhysicalMaterial(frostingParams), cutShared, pc.side);
    const glaze = applyCut(new THREE.MeshPhysicalMaterial(glazeParams), cutShared, pc.side);
    const glazeFaceMat = applyCut(new THREE.MeshPhysicalMaterial({ ...glazeParams, side: THREE.DoubleSide }), cutShared, pc.side);
    const shell = new THREE.Mesh(buildShell(pc.a, pc.b), frost);
    shell.castShadow = shell.receiveShadow = true;
    const glazeMesh = new THREE.Mesh(buildGlaze(pc.a, pc.b), glaze);
    glazeMesh.castShadow = glazeMesh.receiveShadow = true;
    pc.group.add(shell, glazeMesh);
    // cut faces: start of sector faces backwards (-tangent), end of sector forwards (+tangent)
    for (const [ang, sign] of [[pc.a, -1], [pc.b, 1]]) {
      const out = new THREE.Vector3(-Math.sin(ang) * sign, 0, Math.cos(ang) * sign);
      const expose = { value: 0 };
      const faceMat = applyCut(new THREE.MeshStandardMaterial({ map: section.map, roughnessMap: section.roughnessMap, bumpMap: section.bumpMap, bumpScale: 1.4, roughness: 1, envMapIntensity: 0.35 }), cutShared, pc.side, { uExpose: expose });
      const face = new THREE.Mesh(buildFace(ang, out), faceMat);
      face.receiveShadow = true;
      const gf = new THREE.Mesh(buildGlazeFace(ang, out), glazeFaceMat);
      pc.group.add(face, gf);
      hiddenUntilCut.push(face, gf);
      faceMaterials.push(expose);
    }
    pc.frost = frost; pc.glaze = glaze;
  }

  // drips, spaced irregularly, never straddling a cut line
  const drips = { body: [], slice: [] };
  let ang = rnd() * 0.2;
  while (ang < TAU) {
    const halfW = 0.02 + rnd() * 0.013;
    const len = 0.08 + Math.pow(rnd(), 1.5) * 0.36;
    const margin = (halfW * 1.5 + 0.02) / R;
    const nearCut = CUTS.some((c) => Math.abs(angleDelta(ang, c)) < margin);
    if (!nearCut) {
      const inSlice = angleDelta(ang, SLICE.a) > 0 && angleDelta(ang, SLICE.b) < 0;
      (inSlice ? drips.slice : drips.body).push(buildDrip(ang, len, halfW, ang * 7.7));
    }
    ang += (TAU / 27) * (0.65 + rnd() * 0.7);
  }
  for (const key of ['body', 'slice']) {
    if (!drips[key].length) continue;
    const m = new THREE.Mesh(mergeGeometries(drips[key]), pieces[key].glaze);
    m.castShadow = true;
    pieces[key].group.add(m);
  }

  // ----- decorations ----------------------------------------------------------------
  const distToCut = (r, t) => Math.min(...CUTS.map((c) => {
    const dl = angleDelta(t, c);
    return Math.cos(dl) > 0 ? Math.abs(r * Math.sin(dl)) : r;
  }));
  const inSlice = (t) => angleDelta(t, SLICE.a) > 0 && angleDelta(t, SLICE.b) < 0;

  const candleSpots = [[-0.58, 0.12], [-0.22, 0.56], [0.3, 0.55], [0.55, -0.48]];
  const topper = { z: -0.42, x: 0 };
  const blocked = (x, z, rad) =>
    candleSpots.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < rad + 0.05) ||
    (Math.abs(z - topper.z) < rad + 0.03 && Math.abs(x - topper.x) < 0.3);

  const place = { body: { ros: [], berry: [], pearl: [] }, slice: { ros: [], berry: [], pearl: [] } };
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), E = new THREE.Euler();
  const pushInstance = (list, pos, scale, rotY, tilt = 0) => {
    E.set((rnd() - 0.5) * tilt, rotY, (rnd() - 0.5) * tilt);
    Q.setFromEuler(E);
    list.push(new THREE.Matrix4().compose(pos.clone(), Q.clone(), scale.clone()));
  };

  for (let k = 0; k < 15; k++) {
    const t = (5 + k * 24 + (rnd() - 0.5) * 2.5) * DEG;
    const r = 0.84 + (rnd() - 0.5) * 0.015;
    if (distToCut(r, t) < 0.085) continue;
    topPoint(r, t, P); P.y -= 0.004;
    const sc = 0.92 + rnd() * 0.16;
    pushInstance(place[inSlice(t) ? 'slice' : 'body'].ros, P, S.set(sc, sc * (0.9 + rnd() * 0.2), sc), rnd() * TAU, 0.08);
  }
  // berries tucked between the rosettes, plus small clusters
  const berrySpots = [];
  for (let k = 0; k < 15; k++) berrySpots.push([0.72 + (rnd() - 0.5) * 0.04, (k * 24 + 17 + (rnd() - 0.5) * 5) * DEG]);
  for (const [cx, cz] of [[-0.28, 0.06], [0.12, 0.32], [-0.1, -0.16], [0.45, 0.02]]) {
    for (let k = 0; k < 3; k++) berrySpots.push([Math.hypot(cx, cz) + (rnd() - 0.5) * 0.09, Math.atan2(cz, cx) + (rnd() - 0.5) * 0.35]);
  }
  for (const [r, t] of berrySpots) {
    const br = 0.031 + rnd() * 0.006;
    const x = r * Math.cos(t), z = r * Math.sin(t);
    if (distToCut(r, t) < br + 0.02 || blocked(x, z, br)) continue;
    topPoint(r, t, P); P.y += br * 0.78;
    pushInstance(place[inSlice(t) ? 'slice' : 'body'].berry, P, S.set(br, br, br), rnd() * TAU, 0.9);
  }
  // sugar pearls, loosely scattered
  for (let k = 0; k < (quality.mobile ? 46 : 70); k++) {
    const r = 0.25 + Math.sqrt(rnd()) * 0.66;
    const t = rnd() * TAU;
    const pr = 0.0085 + rnd() * 0.004;
    const x = r * Math.cos(t), z = r * Math.sin(t);
    if (distToCut(r, t) < pr + 0.012 || blocked(x, z, pr) || Math.abs(r - 0.84) < 0.07) continue;
    topPoint(r, t, P); P.y += pr * 0.85;
    pushInstance(place[inSlice(t) ? 'slice' : 'body'].pearl, P, S.set(pr, pr, pr), 0);
  }

  const rosetteGeo = rosetteGeometry();
  const berryGeo = berryGeometry();
  const crownGeo = new THREE.CylinderGeometry(0.3, 0.18, 0.1, 10).translate(0, 0.84, 0);
  const pearlGeo = new THREE.SphereGeometry(1, 16, 12);
  const berryMat = new THREE.MeshPhysicalMaterial({ color: 0x252b58, roughness: 0.45, sheen: 1, sheenColor: new THREE.Color(0x8d9ed0), sheenRoughness: 0.42, envMapIntensity: 0.7 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x1b1224, roughness: 0.85 });
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xe8e5df, metalness: 1, roughness: 0.16, envMapIntensity: 1.2 });
  const instanced = (geo, mat, list, parent) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = true; im.receiveShadow = true;
    parent.add(im);
  };
  for (const key of ['body', 'slice']) {
    const parent = pieces[key].group;
    instanced(rosetteGeo, creamMat, place[key].ros, parent);
    instanced(berryGeo, berryMat, place[key].berry, parent);
    instanced(crownGeo, crownMat, place[key].berry, parent);
    instanced(pearlGeo, pearlMat, place[key].pearl, parent);
  }

  // ----- topper -----------------------------------------------------------------------
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xe6bf86, metalness: 1, roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 1.6 });
  const top = buildTopper(goldMat, creamMat);
  const topperY = topPoint(0, 0).y + 0.17;
  top.group.position.set(topper.x, topperY, topper.z);
  top.group.rotation.set(-0.07, 0.035, 0.012);
  body.add(top.group);
  for (const sx of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.0055, 8, 18), creamMat);
    const x = topper.x + sx * top.stakeX;
    topPoint(Math.hypot(x, topper.z), Math.atan2(topper.z, x), P);
    collar.position.copy(P); collar.rotation.x = Math.PI / 2;
    body.add(collar);
  }

  // ----- candles ----------------------------------------------------------------------
  const waxMap = TX.candleWax();
  const glowTex = TX.radialSprite(128, [[0, 0.9], [0.18, 0.35], [0.5, 0.08], [1, 0]]);
  const candles = candleSpots.map(([x, z], i) => {
    const c = buildCandle(i, waxMap, glowTex, rnd);
    topPoint(Math.hypot(x, z), Math.atan2(z, x), P);
    c.group.position.set(x, P.y, z);
    c.group.rotation.set((rnd() - 0.5) * 0.05, rnd() * TAU, (rnd() - 0.5) * 0.05);
    body.add(c.group);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.007, 8, 22), creamMat);
    collar.position.set(x, P.y - 0.002, z); collar.rotation.x = Math.PI / 2;
    body.add(collar);
    return c;
  });
  if (quality.mobile) candles.forEach((c, i) => { if (i % 2) { c.group.remove(c.light); c.light = null; } else if (c.light) c.light.userData.boost = 1.8; });

  // ----- contact shadows ----------------------------------------------------------------
  const shadowTex = TX.radialSprite(256, [[0, 0.85], [0.55, 0.55], [0.8, 0.18], [1, 0]], '0,0,0');
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 2.42), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.75 }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = 0.0015; contact.renderOrder = -1;
  root.add(contact);
  const sliceShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }));
  sliceShadow.rotation.set(-Math.PI / 2, 0, -SLICE.mid); sliceShadow.position.set(0, 0.002, 0);
  slice.add(sliceShadow);

  // ----- runtime ------------------------------------------------------------------------
  const camPos = new THREE.Vector3(), wp = new THREE.Vector3();
  function update(dt, time, camera) {
    camera.getWorldPosition(camPos);
    const opened = cutShared.uCutOpen.value[0] > 0 || cutShared.uCutOpen.value[1] > 0;
    for (const m of hiddenUntilCut) m.visible = opened;
    for (const c of candles) {
      const lit = c.life > 0.001;
      c.flame.visible = lit;
      c.flameU.uTime.value = time;
      c.flameU.uLife.value = c.life;
      c.flameU.uWind.value = 0.05 * Math.sin(time * 0.7 + c.seed) + 0.04 * Math.sin(time * 2.3 + c.seed * 2);
      const f = 0.82 + 0.1 * noise(time * 6 + c.seed, 0.5) + 0.08 * noise(time * 17 + c.seed, 1.5);
      c.halo.material.opacity = 0.55 * c.life * f;
      c.halo.scale.setScalar(0.42 + 0.06 * f);
      if (c.light) c.light.intensity = 0.42 * c.life * f * (c.light.userData.boost || 1);
      c.glowU.value = 0.6 * c.life * f;
      c.emberMat.color.setRGB(2.4 * Math.min(1, c.life * 3), 0.7 * Math.min(1, c.life * 3), 0.15 * Math.min(1, c.life * 3));
      // cylindrical billboard: the flame turns to face the camera around its own vertical axis
      c.flame.getWorldPosition(wp);
      const parentRotY = c.group.rotation.y;
      c.flame.rotation.y = Math.atan2(camPos.x - wp.x, camPos.z - wp.z) - parentRotY;
    }
  }

  function reset() {
    cutShared.uCutY.value[0] = cutShared.uCutY.value[1] = 5;
    cutShared.uCutSlope.value[0] = cutShared.uCutSlope.value[1] = 0;
    cutShared.uCutOpen.value[0] = cutShared.uCutOpen.value[1] = 0;
    cutShared.uCutBulge.value[0] = cutShared.uCutBulge.value[1] = 0;
    faceMaterials.forEach((e) => (e.value = 0));
    slice.position.copy(pivot); slice.rotation.set(0, 0, 0);
    body.rotation.set(0, 0, 0);
    sliceShadow.material.opacity = 0;
    candles.forEach((c) => (c.life = 0));
  }

  return { root, body, slice, pivot, candles, cut: cutShared, faceExpose: faceMaterials, sliceShadow, update, reset };
}
