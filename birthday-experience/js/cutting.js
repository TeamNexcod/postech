// The knife, the crumbs, and the choreography of the cut.
//
// The blade is built from its real cross-section (thick spine ground down to a thin edge),
// and during the cut its edge height drives the cake's cut shader: everything above the
// edge, next to the blade, is pushed apart by the blade's thickness. So the slit in the
// frosting is always exactly where the steel is.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CUTS, SLICE, R } from './cake.js';
import { BOARD_R, PLINTH_R, PLINTH_H } from './scene.js';
import { mulberry32, smoothstep, clamp, lerp } from './util.js';
import * as TX from './textures.js';

const BLADE_L = 1.58;
const R_HEEL = BLADE_L - 0.1; // heel distance from the cake axis when the tip is just past the centre

const spineY = (x) => (x < 0.6 * BLADE_L ? 0.21 : 0.21 - 0.15 * Math.pow((x - 0.6 * BLADE_L) / (0.4 * BLADE_L), 1.8));
const edgeY = (x) => (x < 0.7 * BLADE_L ? 0 : 0.06 * Math.pow((x - 0.7 * BLADE_L) / (0.3 * BLADE_L), 2));
const halfThick = (v) => 0.0007 + 0.0085 * Math.pow(v, 0.55);

function bladeSurface({ u0 = 0, u1 = 1, v0 = 0, v1 = 1, offset = 0, Nu = 72, Nv = 10 }, side) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= Nu; i++) {
    const u = lerp(u0, u1, i / Nu);
    const x = u * BLADE_L;
    const ye = edgeY(x), ys = spineY(x);
    for (let j = 0; j <= Nv; j++) {
      const v = lerp(v0, v1, j / Nv);
      pos.push(x, ye + v * (ys - ye), side * (halfThick(v) + offset));
      uv.push((u - u0) / (u1 - u0), (v - v0) / (v1 - v0));
    }
  }
  const cols = Nv + 1;
  for (let i = 0; i < Nu; i++) {
    for (let j = 0; j < Nv; j++) {
      const a = i * cols + j, b = (i + 1) * cols + j, c = (i + 1) * cols + j + 1, d = i * cols + j + 1;
      if (side > 0) idx.push(a, b, d, b, c, d); else idx.push(a, d, b, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function spineStrip() {
  const pos = [], uv = [], idx = [];
  const Nu = 72;
  for (let i = 0; i <= Nu; i++) {
    const x = (i / Nu) * BLADE_L;
    const t = halfThick(1);
    pos.push(x, spineY(x), t, x, spineY(x), -t);
    uv.push(i / Nu, 1, i / Nu, 0.98); // the anisotropic steel needs UVs for its tangent frame
  }
  for (let i = 0; i < Nu; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function brushedLinear() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const ctx = c.getContext('2d');
  const rnd = mulberry32(9);
  ctx.fillStyle = 'rgb(46,46,46)';
  ctx.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 500; i++) {
    const y = rnd() * 64, x = rnd() * 512, len = 40 + rnd() * 300, s = 30 + rnd() * 50;
    ctx.strokeStyle = `rgba(${s},${s},${s},0.5)`;
    ctx.lineWidth = 0.5 + rnd() * 0.8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + (rnd() - 0.5)); ctx.stroke();
  }
  // polished secondary bevel along the edge (bottom of the texture is the edge, v = 0)
  const g = ctx.createLinearGradient(0, 64, 0, 52);
  g.addColorStop(0, 'rgba(14,14,14,1)'); g.addColorStop(1, 'rgba(14,14,14,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 52, 512, 12);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

export function createKnife() {
  const root = new THREE.Group();
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xdde1e6, metalness: 1, roughness: 0.31, roughnessMap: brushedLinear(),
    envMapIntensity: 1.35, anisotropy: 0.5,
  });
  const blade = new THREE.Group();
  for (const side of [1, -1]) {
    const m = new THREE.Mesh(bladeSurface({}, side), steel);
    m.castShadow = true;
    blade.add(m);
  }
  const spine = new THREE.Mesh(spineStrip(), steel);
  blade.add(spine);
  root.add(blade);

  // cream left on the steel after it has been through the cake
  const smearTex = TX.bladeSmear();
  const smearMat = new THREE.MeshStandardMaterial({ map: smearTex, transparent: true, roughness: 0.55, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  for (const side of [1, -1]) {
    const m = new THREE.Mesh(bladeSurface({ u0: 0.04, u1: 0.78, v0: 0, v1: 0.75, offset: 0.0011, Nu: 40, Nv: 6 }, side), smearMat);
    blade.add(m);
  }

  const bolster = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.215, 0.036, 3, 0.012), steel);
  bolster.position.set(-0.026, 0.106, 0);
  bolster.castShadow = true;
  root.add(bolster);

  const handleMat = new THREE.MeshPhysicalMaterial({ color: 0x16171b, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35, envMapIntensity: 0.9 });
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.46, 10, 28), handleMat);
  handle.rotation.z = Math.PI / 2;
  handle.scale.set(1.12, 1, 0.66);
  handle.position.set(-0.33, 0.112, 0);
  handle.castShadow = true;
  root.add(handle);
  const rivetGeo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.072, 16).rotateX(Math.PI / 2);
  for (const x of [-0.16, -0.31, -0.46]) {
    const r = new THREE.Mesh(rivetGeo, steel);
    r.position.set(x, 0.112, 0);
    root.add(r);
  }
  root.visible = false;
  return { root, smearMat };
}

// ---------------------------------------------------------------------------------------
// Crumbs: a handful of small rigid bodies with gravity, bounce, friction and spin.
// ---------------------------------------------------------------------------------------
export function createCrumbs(count) {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const rnd = mulberry32(19);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.75 + rnd() * 0.5), p.getY(i) * (0.7 + rnd() * 0.5), p.getZ(i) * (0.75 + rnd() * 0.5));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: false });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  const sponge = new THREE.Color(0xd8b272), crust = new THREE.Color(0xa9773f), cream = new THREE.Color(0xf3eee6);
  const P = new Float32Array(count * 3), V = new Float32Array(count * 3), RT = new Float32Array(count * 3), W = new Float32Array(count * 3), S = new Float32Array(count);
  const state = new Uint8Array(count);
  let next = 0;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, zero);

  function emit(pos, vel, kind = 'sponge', size = 0.012) {
    const i = next; next = (next + 1) % count;
    P[i * 3] = pos.x; P[i * 3 + 1] = pos.y; P[i * 3 + 2] = pos.z;
    V[i * 3] = vel.x; V[i * 3 + 1] = vel.y; V[i * 3 + 2] = vel.z;
    RT[i * 3] = rnd() * 6; RT[i * 3 + 1] = rnd() * 6; RT[i * 3 + 2] = rnd() * 6;
    W[i * 3] = (rnd() - 0.5) * 14; W[i * 3 + 1] = (rnd() - 0.5) * 14; W[i * 3 + 2] = (rnd() - 0.5) * 14;
    S[i] = size * (0.6 + rnd() * 0.8);
    state[i] = 1;
    mesh.setColorAt(i, kind === 'cream' ? cream : rnd() < 0.25 ? crust : sponge);
    mesh.instanceColor.needsUpdate = true;
  }

  function ground(x, z) {
    const r = Math.hypot(x, z);
    if (r < BOARD_R) return 0;
    if (r < PLINTH_R) return -0.025;
    return -PLINTH_H;
  }

  function update(dt) {
    dt = Math.min(dt, 1 / 30);
    for (let i = 0; i < count; i++) {
      if (state[i] === 0) continue;
      if (state[i] === 1) {
        V[i * 3 + 1] -= 5.2 * dt;
        P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
        RT[i * 3] += W[i * 3] * dt; RT[i * 3 + 1] += W[i * 3 + 1] * dt; RT[i * 3 + 2] += W[i * 3 + 2] * dt;
        const gy = ground(P[i * 3], P[i * 3 + 2]) + S[i] * 0.6;
        // don't let crumbs fall into the cake: if inside the cake radius, rest on the board edge outside it
        if (P[i * 3 + 1] < gy) {
          P[i * 3 + 1] = gy;
          if (Math.abs(V[i * 3 + 1]) < 0.35) {
            state[i] = 2;
          } else {
            V[i * 3 + 1] *= -0.28; V[i * 3] *= 0.5; V[i * 3 + 2] *= 0.5;
            W[i * 3] *= 0.4; W[i * 3 + 1] *= 0.4; W[i * 3 + 2] *= 0.4;
          }
        }
      }
      e.set(RT[i * 3], RT[i * 3 + 1], RT[i * 3 + 2]);
      q.setFromEuler(e);
      sc.set(S[i], S[i] * 0.8, S[i]);
      pv.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
      m.compose(pv, q, sc);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function clear() { state.fill(0); for (let i = 0; i < count; i++) mesh.setMatrixAt(i, zero); mesh.instanceMatrix.needsUpdate = true; }
  return { mesh, emit, update, clear };
}

// ---------------------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------------------
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _z = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();

// Knife aligned with the radial cut line at `theta`: tip toward the axis, edge down.
// yMid: edge height where it crosses r = 0.5. saw: shift along the blade (outward > 0).
// tilt: rocking (negative = tip lower). lean: blade leaning sideways.
function cutPose(theta, yMid, saw, tilt, lean, out) {
  const c = Math.cos(theta), s = Math.sin(theta);
  _x.set(-c, 0, -s);
  _z.set(s, 0, -c);
  _m.makeBasis(_x, UP, _z);
  out.quat.setFromRotationMatrix(_m);
  _qa.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
  _qb.setFromAxisAngle(new THREE.Vector3(1, 0, 0), lean);
  out.quat.multiply(_qa).multiply(_qb);
  const heelY = yMid - (R_HEEL - 0.5) * Math.sin(tilt);
  out.pos.set(c * (R_HEEL + saw), heelY, s * (R_HEEL + saw));
  return out;
}

const pose = () => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });
function lerpPose(a, b, t, arc, out) {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.pos.y += Math.sin(Math.PI * t) * arc;
  out.quat.slerpQuaternions(a.quat, b.quat, t);
  return out;
}

// Depth curve for the push: weighted, with slight resistance changes at layer boundaries.
function depthCurve(p) {
  const s = p * p * p * (p * (p * 6 - 15) + 10);
  return clamp(s + 0.02 * Math.sin(p * Math.PI * 6) * 4 * p * (1 - p), 0, 1);
}

// ---------------------------------------------------------------------------------------
// The sequence
// ---------------------------------------------------------------------------------------
export function createCutting({ gsap, rig, cake, stage, quality, reduced }) {
  const knife = createKnife();
  const crumbs = createCrumbs(quality.mobile ? 40 : 80);
  stage.scene.add(knife.root, crumbs.mesh);
  const TOP_Y = 1.035;           // top of glaze at r = 0.5
  const BOTTOM_Y = 0.006;
  const speed = reduced ? 0.7 : 1;
  const cut = cake.cut;
  const HOVER_Y = 1.8;           // clear of the candle flames
  const k = { mode: 'none', a: pose(), b: pose(), t: 0, arc: 0, theta: 0, yMid: HOVER_Y, saw: 0.12, tilt: -0.13, lean: 0 };
  const cur = pose();
  const rnd = mulberry32(55);
  const camRight = new THREE.Vector3(), camUp = new THREE.Vector3(), camFwd = new THREE.Vector3();
  let focusTarget = null;
  const blade = new THREE.Vector3();

  const tween = (target, vars) => new Promise((res) => gsap.to(target, { ...vars, duration: (vars.duration ?? 1) * speed, onComplete: res }));
  const wait = (s) => new Promise((res) => gsap.delayedCall(s * speed, res));
  // array uniforms can't be handed to GSAP directly (it would treat the array as a list of targets)
  const tweenUniform = (u, i, to, vars) => {
    const proxy = { v: u.value[i] };
    return gsap.to(proxy, { ...vars, v: to, onUpdate: () => { u.value[i] = proxy.v; } });
  };

  function applyPose() {
    if (k.mode === 'lerp') lerpPose(k.a, k.b, k.t, k.arc, cur);
    else if (k.mode === 'cut') cutPose(k.theta, k.yMid, k.saw, k.tilt, k.lean, cur);
    else return;
    knife.root.position.copy(cur.pos);
    knife.root.quaternion.copy(cur.quat);
  }

  function snapshot() { const p = pose(); p.pos.copy(knife.root.position); p.quat.copy(knife.root.quaternion); return p; }

  function emitCrumbs(idx, yAtRim, n) {
    const th = CUTS[idx];
    const c = Math.cos(th), s = Math.sin(th);
    for (let i = 0; i < n; i++) {
      const r = R + 0.015 + rnd() * 0.02;
      const side = rnd() < 0.5 ? -1 : 1;
      const px = c * r - s * side * 0.012, pz = s * r + c * side * 0.012;
      const out = 0.25 + rnd() * 0.45, lat = (rnd() - 0.5) * 0.35;
      crumbs.emit(
        new THREE.Vector3(px, yAtRim + (rnd() - 0.5) * 0.04, pz),
        new THREE.Vector3(c * out - s * lat, 0.15 + rnd() * 0.45, s * out + c * lat),
        'sponge', 0.011
      );
    }
  }

  function emitCream(idx, n) {
    const th = CUTS[idx];
    const c = Math.cos(th), s = Math.sin(th);
    for (let i = 0; i < n; i++) {
      const r = 0.35 + rnd() * 0.6;
      const side = rnd() < 0.5 ? -1 : 1;
      crumbs.emit(
        new THREE.Vector3(c * r - s * side * 0.016, TOP_Y + 0.01, s * r + c * side * 0.016),
        new THREE.Vector3(-s * side * (0.05 + rnd() * 0.12), 0.25 + rnd() * 0.3, c * side * (0.05 + rnd() * 0.12)),
        'cream', 0.008
      );
    }
  }

  // One full cut: contact, weighted push with a little sawing, bottom, exit.
  async function doCut(idx, push) {
    const theta = CUTS[idx];
    // tip meets the glaze
    await tween(k, { yMid: TOP_Y + 0.004, saw: 0.06, tilt: -0.1, duration: push > 2 ? 1.0 : 0.7, ease: 'power2.inOut' });
    emitCream(idx, push > 2 ? 4 : 2);
    cut.uCutSlope.value[idx] = -Math.sin(k.tilt);
    // resistance: a short stall as the edge bites
    await tween(k, { yMid: TOP_Y - 0.006, duration: 0.22, ease: 'power1.in' });
    const st = { p: 0 };
    let lastEmit = TOP_Y;
    const y0 = k.yMid;
    await tween(st, {
      p: 1, duration: push, ease: 'none',
      onUpdate: () => {
        const p = st.p, g = depthCurve(p);
        k.yMid = lerp(y0, BOTTOM_Y, g);
        k.saw = 0.06 + 0.055 * Math.sin(p * Math.PI * 2 * (push > 2 ? 2.5 : 1.5)) * Math.sqrt(Math.sin(Math.PI * p));
        k.tilt = lerp(-0.1, 0, smoothstep(0.1, 0.95, p));
        k.lean = 0.02 * Math.sin(p * 9);
        cut.uCutY.value[idx] = k.yMid;
        cut.uCutSlope.value[idx] = -Math.sin(k.tilt);
        cut.uCutOpen.value[idx] = 0.0075 * smoothstep(0, 0.06, p);
        cut.uCutBulge.value[idx] = 0.007 * smoothstep(0, 0.15, p);
        knife.smearMat.opacity = Math.max(knife.smearMat.opacity, smoothstep(0.05, 0.9, g) * 0.95);
        const yRim = k.yMid - 0.5 * Math.sin(k.tilt);
        if (lastEmit - yRim > (push > 2 ? 0.075 : 0.11) && yRim > 0.05) {
          lastEmit = yRim;
          emitCrumbs(idx, yRim, push > 2 ? 2 : 1);
        }
      },
    });
    // bottom: blade meets the board
    await tween(k, { yMid: BOTTOM_Y + 0.003, duration: 0.14, ease: 'sine.out' });
    // exit: lift and draw back toward the handle
    tweenUniform(cut.uCutOpen, idx, 0.0022, { duration: 0.9 * speed, delay: 0.25 * speed, ease: 'power2.out' });
    tweenUniform(cut.uCutBulge, idx, 0.003, { duration: 1, delay: 0.3 });
    emitCrumbs(idx, 0.5, 2);
    await tween(k, { yMid: HOVER_Y, saw: 0.22, tilt: -0.05, lean: 0, duration: push > 2 ? 1.2 : 0.95, ease: 'power2.inOut' });
  }

  function update(dt, camera) {
    applyPose();
    crumbs.update(dt);
    if (focusTarget && stage.bokeh && stage.bokeh.enabled) {
      knife.root.localToWorld(blade.set(0.7, 0.1, 0));
      const want = focusTarget === 'knife' ? camera.position.distanceTo(blade) : camera.position.distanceTo(rig.target);
      const u = stage.bokeh.uniforms;
      u.focus.value += (want - u.focus.value) * Math.min(1, dt * 4);
    }
  }

  async function play({ shots }) {
    knife.smearMat.opacity = 0;
    const cam = stage.camera;
    // 1. frame the cut point
    await tween(rig.s, { ...shots.cut, duration: 1.6, ease: 'power2.inOut' });
    // 2. knife enters from the right, close to the lens and out of focus
    cam.updateMatrixWorld();
    camRight.setFromMatrixColumn(cam.matrixWorld, 0);
    camUp.setFromMatrixColumn(cam.matrixWorld, 1);
    camFwd.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    const hover = pose();
    k.theta = CUTS[0]; k.yMid = HOVER_Y; k.saw = 0.14; k.tilt = -0.13; k.lean = 0;
    cutPose(k.theta, k.yMid, k.saw, k.tilt, k.lean, hover);
    // in profile, close to the lens on the right: blade pointing left and slightly away,
    // flat of the blade toward the camera so it catches the softbox
    // distance from the lens scales with the viewport so a portrait phone sees a knife, not a wall of steel
    const halfW = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect;
    const camDist = cam.position.distanceTo(rig.target);
    const near = THREE.MathUtils.clamp(1.15 / halfW, 2.3, camDist * 0.72);
    const appear = pose();
    appear.pos.copy(cam.position).addScaledVector(camFwd, near).addScaledVector(camRight, near * halfW * 0.42).addScaledVector(camUp, -near * 0.09);
    const bx = camRight.clone().multiplyScalar(-0.86).addScaledVector(camFwd, 0.5).addScaledVector(camUp, 0.08).normalize();
    const by = camUp.clone().addScaledVector(bx, -camUp.dot(bx)).normalize();
    const bz = new THREE.Vector3().crossVectors(bx, by);
    appear.quat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(bx, by, bz)).multiply(_qa.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.12));
    const off = pose();
    off.pos.copy(appear.pos).addScaledVector(camRight, near * halfW * 1.1 + 0.9).addScaledVector(camUp, -0.05);
    off.quat.copy(appear.quat);
    k.mode = 'lerp'; k.a = off; k.b = appear; k.t = 0; k.arc = 0.04;
    knife.root.visible = true;
    applyPose();
    if (stage.bokeh) {
      focusTarget = 'cake';
      stage.bokeh.uniforms.focus.value = cam.position.distanceTo(rig.target);
      stage.bokeh.uniforms.aperture.value = 0.0;
      stage.bokeh.enabled = true;
      gsap.to(stage.bokeh.uniforms.aperture, { value: 0.012, duration: 0.6 });
    }
    await tween(k, { t: 1, duration: 1.3, ease: 'power3.out' });
    await wait(0.45);
    // 3. focus pulls to the blade
    focusTarget = 'knife';
    await wait(0.9);
    // 4. approach the cake at an angle, along a slight arc
    k.a = snapshot(); k.b = hover; k.t = 0; k.arc = 0.18;
    focusTarget = 'cake';
    if (stage.bokeh) gsap.to(stage.bokeh.uniforms.aperture, { value: 0.0, duration: 1.4 * speed, delay: 0.4 * speed, onComplete: () => { stage.bokeh.enabled = false; focusTarget = null; } });
    gsap.to(rig.s, { ...shots.cutClose, duration: 2.2 * speed, ease: 'power2.inOut' });
    await tween(k, { t: 1, duration: 1.5, ease: 'power2.inOut' });
    // 5–9. first cut, weighted and slow
    k.mode = 'cut';
    await doCut(0, 2.6);
    // move over to the second line
    const from = snapshot();
    const to = pose();
    k.theta = CUTS[1]; k.yMid = HOVER_Y; k.saw = 0.14; k.tilt = -0.12; k.lean = 0;
    cutPose(k.theta, k.yMid, k.saw, k.tilt, k.lean, to);
    k.mode = 'lerp'; k.a = from; k.b = to; k.t = 0; k.arc = 0.12;
    gsap.to(rig.s, { ...shots.cutSecond, duration: 1.4 * speed, ease: 'power2.inOut' });
    await tween(k, { t: 1, duration: 1.0, ease: 'power2.inOut' });
    k.mode = 'cut';
    await doCut(1, 1.6);
    // knife leaves the frame
    const exitFrom = snapshot();
    cam.updateMatrixWorld();
    camRight.setFromMatrixColumn(cam.matrixWorld, 0);
    const exitTo = pose();
    exitTo.pos.copy(exitFrom.pos).addScaledVector(camRight, 2.6).add(new THREE.Vector3(0, 0.5, 0.4));
    exitTo.quat.copy(exitFrom.quat).multiply(_qa.setFromEuler(new THREE.Euler(0.2, -0.4, 0.15)));
    k.mode = 'lerp'; k.a = exitFrom; k.b = exitTo; k.t = 0; k.arc = 0.1;
    gsap.to(k, { t: 1, duration: 1.1 * speed, ease: 'power2.in', onComplete: () => { knife.root.visible = false; k.mode = 'none'; } });
    await wait(0.35);
    // 10. the slice breaks free and is drawn out toward the viewer
    await separate(shots);
  }

  async function separate(shots) {
    const s = cake.slice;
    const dir = new THREE.Vector3(Math.cos(SLICE.mid), 0, Math.sin(SLICE.mid));
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const st = { out: 0, lift: 0, yaw: 0, tip: 0 };
    const apply = () => {
      s.position.copy(cake.pivot).addScaledVector(dir, st.out);
      s.position.y = st.lift;
      s.rotation.set(0, st.yaw, 0);
      // tip about the horizontal axis perpendicular to the direction of travel
      s.rotateOnWorldAxis(perp, st.tip);
      cake.sliceShadow.material.opacity = 0.7 * smoothstep(0.05, 0.4, st.out);
    };
    for (const i of [0, 1]) {
      tweenUniform(cut.uCutOpen, i, 0.012, { duration: 0.4 * speed, ease: 'power2.out' });
      tweenUniform(cut.uCutBulge, i, 0.0015, { duration: 0.8 });
    }
    cake.faceExpose.forEach((e) => gsap.to(e, { value: 1, duration: 1.4 * speed, delay: 0.25 * speed, ease: 'power1.inOut' }));
    // break free: a small jolt and a tilt, as if pried loose
    await tween(st, { out: 0.06, tip: 0.03, duration: 0.5, ease: 'power2.out', onUpdate: apply });
    for (let i = 0; i < 4; i++) {
      const c = Math.cos(SLICE.mid + (rnd() - 0.5) * 0.6), sn = Math.sin(SLICE.mid + (rnd() - 0.5) * 0.6);
      crumbs.emit(new THREE.Vector3(c * 1.0, 0.2 + rnd() * 0.5, sn * 1.0), new THREE.Vector3(c * 0.3, 0.1, sn * 0.3), 'sponge', 0.01);
    }
    gsap.to(rig.s, { ...shots.sliceHero, duration: 2.6 * speed, ease: 'power2.inOut' });
    // slide out with mass: accelerate, carry, slow down
    const lift = { v: 0 };
    gsap.to(lift, { v: 1, duration: 1.8 * speed, ease: 'none', onUpdate: () => { st.lift = 0.028 * Math.sin(Math.PI * lift.v); } });
    gsap.to(st, { yaw: 0.44, duration: 1.75 * speed, delay: 0.15 * speed, ease: 'power2.inOut' });
    await tween(st, { out: 0.62, tip: 0.0, duration: 1.85, ease: 'power3.inOut', onUpdate: apply });
    // settle: a damped wobble of the soft sponge, and the body answers a little
    const wob = { t: 0 };
    await tween(wob, {
      t: 1, duration: 1.3, ease: 'none',
      onUpdate: () => {
        const tt = wob.t * 1.3;
        const amp = Math.exp(-tt * 3.6);
        st.tip = 0.03 * amp * Math.sin(tt * 26);
        st.lift = 0;
        s.scale.set(1, 1 - 0.018 * amp * Math.sin(tt * 26 + 0.6), 1);
        apply();
        cake.body.rotation.z = 0.003 * amp * Math.sin(tt * 21);
        cake.body.rotation.x = -0.002 * amp * Math.sin(tt * 21 + 1);
      },
    });
    s.scale.set(1, 1, 1);
    // hero beat: hold on the slice while the camera drifts slowly around it
    await tween(rig.s, { az: rig.s.az + 0.16, el: rig.s.el + 0.03, duration: 2.6, ease: 'sine.inOut' });
  }

  function reset() {
    knife.root.visible = false;
    k.mode = 'none';
    knife.smearMat.opacity = 0;
    crumbs.clear();
    focusTarget = null;
    if (stage.bokeh) stage.bokeh.enabled = false;
  }

  return { play, update, reset, knife };
}
