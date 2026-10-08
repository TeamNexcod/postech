// Atmosphere and celebration: dust in the light, background bokeh, volumetric-looking beams,
// distant fireworks and a light fall of foreground confetti. Particles are GPU points or
// instanced meshes; no per-particle DOM nodes and no per-frame allocations.
import * as THREE from 'three';
import { mulberry32 } from './util.js';

// ---------------------------------------------------------------------------------------
// Light beam (fake volumetric cone)
// ---------------------------------------------------------------------------------------
export function createBeam({ from, to, radius, color, intensity = 1 }) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius * 0.12, radius, len, 64, 24, true);
  geo.translate(0, -len / 2, 0);
  const uniforms = {
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: 0 },
    uTime: { value: 0 },
    uLen: { value: len },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vP;
      uniform float uLen;
      void main() {
        vH = -position.y / uLen;
        vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uIntensity; uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vP;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      void main() {
        float facing = abs(dot(normalize(vN), normalize(vV)));
        float edge = pow(facing, 2.2);
        float along = smoothstep(0.0, 0.08, vH) * pow(1.0 - vH, 1.6);
        float ang = atan(vP.x, vP.z);
        float streak = 0.65 + 0.35 * vnoise(vec2(ang * 6.0, vH * 3.0 - uTime * 0.05));
        float a = edge * along * streak * uIntensity;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  mesh.userData.base = intensity;
  mesh.renderOrder = 2;
  return { mesh, uniforms, from: from.clone(), dir: dir.clone(), len, radius };
}

// ---------------------------------------------------------------------------------------
// Dust: soft points drifting slowly, brighter where they cross the main beam
// ---------------------------------------------------------------------------------------
export function createDust({ count, beam, pixelRatio }) {
  const rnd = mulberry32(11);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rnd() - 0.5) * 9;
    pos[i * 3 + 1] = rnd() * 5.5 - 0.6;
    pos[i * 3 + 2] = (rnd() - 0.5) * 9 - 0.5;
    seed[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uScale: { value: 200 * pixelRatio },
    uBeamPos: { value: beam.from },
    uBeamDir: { value: beam.dir },
    uBeamSlope: { value: beam.radius / beam.len },
    uColor: { value: new THREE.Color(0.62, 0.78, 1.0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`
      attribute float aSeed;
      uniform float uTime, uScale, uBeamSlope;
      uniform vec3 uBeamPos, uBeamDir;
      varying float vLight; varying float vTw;
      void main() {
        vec3 p = position;
        float t = uTime * 0.06 + aSeed * 6.2831;
        p.x += sin(t * 1.3 + aSeed * 10.0) * 0.35;
        p.z += cos(t * 1.1 + aSeed * 3.0) * 0.35;
        p.y += mod(uTime * (0.01 + aSeed * 0.02) + aSeed * 5.5, 5.5) - 2.75 + sin(t * 0.9) * 0.15;
        vec3 rel = p - uBeamPos;
        float along = dot(rel, uBeamDir);
        float rad = length(rel - along * uBeamDir);
        float cone = max(along * uBeamSlope, 0.001);
        vLight = 0.12 + 1.6 * smoothstep(cone, cone * 0.35, rad) * step(0.0, along);
        vTw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 40.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * (0.006 + aSeed * 0.012) / -mv.z;
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity; uniform vec3 uColor;
      varying float vLight; varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor * vLight * vTw * a * uOpacity, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}

// ---------------------------------------------------------------------------------------
// Background bokeh: large, very soft out-of-focus discs far behind the set
// ---------------------------------------------------------------------------------------
export function createBokeh({ count, pixelRatio }) {
  const rnd = mulberry32(5);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const palette = [[0.25, 0.5, 1.0], [0.2, 0.75, 1.0], [0.45, 0.6, 1.0], [1.0, 0.62, 0.32]];
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI - Math.PI;
    const r = 16 + rnd() * 16;
    pos[i * 3] = Math.cos(a) * r * 0.9;
    pos[i * 3 + 1] = -1 + rnd() * 9;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.7 - 6;
    const c = palette[rnd() < 0.12 ? 3 : Math.floor(rnd() * 3)];
    col.set(c, i * 3);
    size[i] = 0.5 + rnd() * 1.1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uScale: { value: 300 * pixelRatio } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`
      attribute float aSize; attribute vec3 color;
      uniform float uTime, uScale;
      varying vec3 vColor; varying float vSeed;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.07 + position.x) * 0.3;
        p.x += sin(uTime * 0.05 + position.z) * 0.4;
        vColor = color; vSeed = fract(position.x * 1.37);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * aSize / -mv.z;
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity; uniform float uTime;
      varying vec3 vColor; varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float disc = smoothstep(0.5, 0.3, d);
        float rim = 0.75 + 0.25 * smoothstep(0.15, 0.45, d);
        float pulse = 0.75 + 0.25 * sin(uTime * 0.3 + vSeed * 30.0);
        gl_FragColor = vec4(vColor * disc * rim * pulse * uOpacity * 0.11, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}

// ---------------------------------------------------------------------------------------
// Fireworks: a fixed pool of point particles simulated on the CPU (one typed array, no
// garbage), drawn with additive blending far behind the set. Each shell rises with a faint
// trail, then breaks into a peony, ring or willow in a restrained palette.
// ---------------------------------------------------------------------------------------
export function createFireworks({ max, pixelRatio, onBurst }) {
  const rnd = Math.random;
  const pos = new Float32Array(max * 3);
  const col = new Float32Array(max * 3);
  const alpha = new Float32Array(max);
  const size = new Float32Array(max);
  const vel = new Float32Array(max * 3);
  const life = new Float32Array(max);
  const maxLife = new Float32Array(max);
  const kind = new Uint8Array(max); // 0 dead, 1 spark, 2 rocket, 3 ember
  const drag = new Float32Array(max);
  const base = new Float32Array(max * 3);
  let cursor = 0;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  const uniforms = { uScale: { value: 500 * pixelRatio } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`
      attribute float aAlpha; attribute float aSize; attribute vec3 color;
      uniform float uScale;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vColor = color; vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aAlpha > 0.001 ? max(1.5, uScale * aSize / -mv.z) : 0.0;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = a * a;
        gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const palettes = [
    [[1.0, 0.78, 0.46], [1.0, 0.9, 0.7]],   // champagne gold
    [[0.55, 0.8, 1.0], [0.85, 0.95, 1.0]],  // ice blue
    [[0.3, 0.85, 1.0], [0.7, 0.95, 1.0]],   // cyan
    [[0.92, 0.94, 1.0], [1.0, 1.0, 1.0]],   // silver
  ];

  function alloc() {
    for (let n = 0; n < max; n++) {
      const i = cursor;
      cursor = (cursor + 1) % max;
      if (kind[i] === 0) return i;
    }
    return -1;
  }

  function spawn(k, x, y, z, vx, vy, vz, lifeS, c, sz, dr) {
    const i = alloc();
    if (i < 0) return -1;
    kind[i] = k;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    life[i] = lifeS; maxLife[i] = lifeS;
    base[i * 3] = c[0]; base[i * 3 + 1] = c[1]; base[i * 3 + 2] = c[2];
    size[i] = sz; drag[i] = dr;
    return i;
  }

  const rockets = [];
  let active = false, timer = 0, sparkBudget = 1;

  function launch() {
    // keep the column behind the title fairly clear: favour the sides
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * (4 + Math.pow(rnd(), 0.8) * 15);
    const z = -32 - rnd() * 14;
    const apex = 4.5 + rnd() * 5.5;
    const pal = palettes[Math.floor(rnd() * palettes.length)];
    const type = rnd() < 0.2 ? 'ring' : rnd() < 0.35 ? 'willow' : 'peony';
    const i = spawn(2, x, -1.5, z, (rnd() - 0.5) * 0.8, 11 + rnd() * 2.5, 0, 4, pal[1], 0.3, 0.4);
    if (i >= 0) rockets.push({ i, apex, pal, type });
  }

  function burst(x, y, z, pal, type) {
    const n = Math.floor((type === 'willow' ? 110 : 150) * sparkBudget);
    const speed = type === 'willow' ? 5 : 7 + rnd() * 2;
    const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    const u = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize();
    const w = new THREE.Vector3().crossVectors(axis, u);
    for (let k = 0; k < n; k++) {
      let vx, vy, vz;
      if (type === 'ring') {
        const a = (k / n) * Math.PI * 2;
        vx = (u.x * Math.cos(a) + w.x * Math.sin(a)) * speed;
        vy = (u.y * Math.cos(a) + w.y * Math.sin(a)) * speed;
        vz = (u.z * Math.cos(a) + w.z * Math.sin(a)) * speed;
      } else {
        const t = Math.acos(2 * rnd() - 1), p = rnd() * Math.PI * 2;
        const s = speed * (0.82 + rnd() * 0.18);
        vx = Math.sin(t) * Math.cos(p) * s; vy = Math.cos(t) * s; vz = Math.sin(t) * Math.sin(p) * s;
      }
      const c = rnd() < 0.75 ? pal[0] : pal[1];
      const lifeS = type === 'willow' ? 3.2 + rnd() * 1.2 : 1.7 + rnd() * 0.8;
      spawn(1, x, y, z, vx, vy, vz, lifeS, c, type === 'willow' ? 0.34 : 0.42, type === 'willow' ? 1.6 : 1.1);
    }
    if (onBurst) onBurst({ x, y, z, color: pal[0] });
  }

  function update(dt) {
    if (active) {
      timer -= dt;
      if (timer <= 0) { launch(); timer = 0.6 + rnd() * 1.1; }
    }
    for (let r = rockets.length - 1; r >= 0; r--) {
      const rk = rockets[r];
      const i = rk.i;
      if (kind[i] !== 2) { rockets.splice(r, 1); continue; }
      // trail
      if (rnd() < 0.5) spawn(3, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], (rnd() - 0.5) * 0.3, -0.5, 0, 0.4, [0.6, 0.42, 0.24], 0.16, 2);
      if (vel[i * 3 + 1] < 2.5 || pos[i * 3 + 1] > rk.apex) {
        burst(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], rk.pal, rk.type);
        kind[i] = 0; alpha[i] = 0;
        rockets.splice(r, 1);
      }
    }
    const g = 3.2;
    for (let i = 0; i < max; i++) {
      if (kind[i] === 0) continue;
      life[i] -= dt;
      if (life[i] <= 0) { kind[i] = 0; alpha[i] = 0; continue; }
      const dr = Math.exp(-drag[i] * dt);
      vel[i * 3] *= dr; vel[i * 3 + 1] = vel[i * 3 + 1] * dr - g * dt * (kind[i] === 2 ? 1.6 : 1); vel[i * 3 + 2] *= dr;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      // sparks shed faint embers, which reads as a trail at this distance
      if (kind[i] === 1 && rnd() < dt * 9) spawn(3, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], vel[i * 3] * 0.1, vel[i * 3 + 1] * 0.1, vel[i * 3 + 2] * 0.1, 0.45, [base[i * 3] * 0.5, base[i * 3 + 1] * 0.42, base[i * 3 + 2] * 0.36], 0.2, 3);
      const t = life[i] / maxLife[i];
      // sparks bloom open over the first moments instead of starting as one blinding point
      let a = kind[i] === 1 ? Math.min(1, t * 2.2) * Math.min(1, (1 - t) * 9 + 0.08) : t;
      if (kind[i] === 1 && t < 0.35) a *= 0.55 + 0.45 * Math.sin(life[i] * 60 + i); // crackle as it dies
      alpha[i] = a;
      const heat = kind[i] === 1 ? 1 + 0.8 * Math.max(0, t - 0.75) * 4 : 1;
      col[i * 3] = base[i * 3] * 2.2 * heat; col[i * 3 + 1] = base[i * 3 + 1] * 2.2 * heat; col[i * 3 + 2] = base[i * 3 + 2] * 2.2 * heat;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
  }

  function start(budget = 1) { sparkBudget = budget; active = true; timer = 0.2; }
  function stop() { active = false; }
  function clear() {
    active = false; rockets.length = 0;
    kind.fill(0); alpha.fill(0);
    geo.attributes.aAlpha.needsUpdate = true;
  }
  return { points, uniforms, update, start, stop, clear, burst };
}

// ---------------------------------------------------------------------------------------
// Confetti: a small number of metallic foil flakes fluttering down in the foreground.
// ---------------------------------------------------------------------------------------
export function createConfetti({ count }) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, metalness: 0.65, roughness: 0.32, envMapIntensity: 1.4 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const palette = [0xdfe6f2, 0xcfd9ea, 0x9fc4ff, 0xe6cfa3, 0xf2efe8, 0x6fa8ff].map((h) => new THREE.Color(h));
  const rnd = mulberry32(77);
  const P = [], V = [], ROT = [], SPIN = [], SC = [], PH = [];
  const alive = new Uint8Array(count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) {
    P.push(new THREE.Vector3()); V.push(new THREE.Vector3()); ROT.push(new THREE.Vector3()); SPIN.push(new THREE.Vector3());
    SC.push(new THREE.Vector2(0.03 + rnd() * 0.02, 0.05 + rnd() * 0.03)); PH.push(rnd() * 10);
    mesh.setColorAt(i, palette[Math.floor(rnd() * palette.length)]);
    mesh.setMatrixAt(i, zero);
  }
  mesh.instanceColor.needsUpdate = true;
  let emitting = false, center = new THREE.Vector3(0, 0, 3), time = 0;

  function respawn(i, initial) {
    P[i].set(center.x + (rnd() - 0.5) * 6, center.y + 3.2 + rnd() * (initial ? 3 : 0.6), center.z + (rnd() - 0.5) * 3.2);
    V[i].set((rnd() - 0.5) * 0.25, -(0.3 + rnd() * 0.3), (rnd() - 0.5) * 0.2);
    ROT[i].set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
    SPIN[i].set((rnd() - 0.5) * 7, (rnd() - 0.5) * 4, (rnd() - 0.5) * 7);
    alive[i] = 1;
  }

  function update(dt) {
    time += dt;
    let any = false;
    for (let i = 0; i < count; i++) {
      if (!alive[i]) { if (emitting && rnd() < dt * 0.6) respawn(i, false); else continue; }
      any = true;
      const v = V[i];
      // flutter: tumbling flakes drift sideways while falling
      const fl = Math.sin(time * 3 + PH[i]);
      P[i].x += (v.x + fl * 0.18) * dt;
      P[i].y += v.y * (0.75 + 0.25 * Math.abs(Math.cos(ROT[i].x))) * dt;
      P[i].z += (v.z + Math.cos(time * 2.3 + PH[i]) * 0.1) * dt;
      ROT[i].addScaledVector(SPIN[i], dt);
      if (P[i].y < center.y - 2.2) {
        if (emitting) respawn(i, false);
        else { alive[i] = 0; mesh.setMatrixAt(i, zero); continue; }
      }
      e.set(ROT[i].x, ROT[i].y, ROT[i].z);
      q.setFromEuler(e);
      s.set(SC[i].x, SC[i].y, 1);
      p.copy(P[i]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.visible = any;
    mesh.instanceMatrix.needsUpdate = true;
  }
  function start(c) {
    if (c) center.copy(c);
    emitting = true;
    for (let i = 0; i < count; i++) if (rnd() < 0.55) respawn(i, true);
  }
  function stop() { emitting = false; }
  function clear() { emitting = false; alive.fill(0); for (let i = 0; i < count; i++) mesh.setMatrixAt(i, zero); mesh.instanceMatrix.needsUpdate = true; mesh.visible = false; }
  return { mesh, update, start, stop, clear };
}
