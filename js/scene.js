// Renderer, studio set, lights, reflections, post-processing and the camera rig.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import * as TX from './textures.js';

export const PLINTH_R = 2.05, BOARD_R = 1.78, PLINTH_H = 1.15;

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uFade: { value: 0 },
    uTime: { value: 0 },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.035 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uFade, uTime, uVignette, uGrain, uAspect;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      float v = smoothstep(1.15, 0.25, length(p) / max(1.0, uAspect * 0.62));
      c.rgb *= mix(1.0 - uVignette, 1.0, v);
      float g = hash(vUv * 1024.0 + fract(uTime) * 61.0) - 0.5;
      c.rgb += g * uGrain * (0.4 + 0.6 * (1.0 - dot(c.rgb, vec3(0.333))));
      c.rgb *= uFade;
      gl_FragColor = c;
    }`,
};

// Guards the HDR buffer before bloom: a single NaN/Inf pixel (a rare grazing-angle
// specular sample on some GPUs) would otherwise be smeared across the whole frame.
const SanitizeShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      bool bad = !(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b) || c.r > 6.0e4 || c.g > 6.0e4 || c.b > 6.0e4;
      gl_FragColor = bad ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(min(c.rgb, vec3(6.0)), c.a);
    }`,
};

function buildEnvironment(renderer) {
  // A small dark "room" with a large cool softbox, a blue rim strip and a warm card,
  // pre-filtered into an environment map. This is what the knife, gold topper, pearls and
  // glaze reflect, so the reflections match the scene's actual light placement.
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x020306);
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 24), new THREE.MeshBasicMaterial({ color: 0x05070c, side: THREE.BackSide }));
  env.add(room);
  const panel = (w, h, rgb, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0.5, 0);
    env.add(m);
    return m;
  };
  panel(7, 4.5, [3.2, 3.4, 3.8], [-6.5, 6, 6]);       // key softbox
  panel(1.2, 9, [0.4, 1.1, 3.4], [8, 3.5, -6]);       // blue rim strip
  panel(10, 1.2, [0.25, 0.45, 0.9], [0, 6.8, -8]);     // cool top strip
  panel(2.4, 1.4, [1.5, 0.75, 0.3], [4, 1.2, 7]);      // warm card (candle bounce)
  panel(16, 16, [0.03, 0.035, 0.05], [0, -6.5, 0]);     // floor
  panel(9, 2.6, [0.42, 0.48, 0.62], [0.5, 2.6, 10]);    // dim front fill, behind the camera
  panel(6, 3, [0.5, 0.52, 0.58], [-10, 1.8, -1]);       // soft grey card, left (gives vertical steel something to reflect)
  panel(5, 2.4, [0.22, 0.34, 0.62], [10, 1.6, 3]);      // cool card, right
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.03);
  pmrem.dispose();
  return rt.texture;
}

export function createStage(container, quality) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(quality.dpr);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x03050a, 0.034);
  scene.environment = buildEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.05, 220);

  // ----- set: floor, plinth, cake board --------------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(60, 72),
    new THREE.MeshStandardMaterial({ color: 0x06080d, roughness: 0.48, metalness: 0, envMapIntensity: 0.4 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -PLINTH_H;
  floor.receiveShadow = true;
  scene.add(floor);

  const rough = TX.stoneRoughness(quality.mobile ? 128 : 256);
  const pts = [];
  const top = -0.025, bot = -PLINTH_H, r0 = PLINTH_R, bev = 0.035;
  pts.push(new THREE.Vector2(0, bot));
  pts.push(new THREE.Vector2(r0 - 0.06, bot));
  pts.push(new THREE.Vector2(r0 - 0.03, bot + 0.04));
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r0 - bev + Math.cos(a) * bev, top - bev + Math.sin(a) * bev));
  }
  pts.push(new THREE.Vector2(0, top));
  const plinth = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 128),
    new THREE.MeshStandardMaterial({ color: 0x1a1f29, roughness: 0.62, roughnessMap: rough, metalness: 0.0, envMapIntensity: 0.7 })
  );
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  scene.add(plinth);

  // polished black stone board with a thin brushed-champagne edge
  const boardTop = new THREE.MeshPhysicalMaterial({ color: 0x121419, roughness: 0.34, roughnessMap: TX.brushedMetal(quality.mobile ? 256 : 512), clearcoat: 0.55, clearcoatRoughness: 0.18, envMapIntensity: 0.9 });
  const boardEdge = new THREE.MeshStandardMaterial({ color: 0xd9c3a0, metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
  const board = new THREE.Mesh(new THREE.CylinderGeometry(BOARD_R, BOARD_R + 0.004, 0.024, 160, 1), [boardEdge, boardTop, boardTop]);
  board.position.y = -0.012;
  board.receiveShadow = true;
  board.castShadow = true;
  scene.add(board);

  // ----- lights ---------------------------------------------------------------------------
  const lights = {};
  lights.hemi = new THREE.HemisphereLight(0x2a3d60, 0x050608, 0.0);
  scene.add(lights.hemi);

  lights.key = new THREE.SpotLight(0xf2f5ff, 0, 0, 0.38, 0.85, 0);
  lights.key.position.set(-4.6, 7.2, 5.2);
  lights.key.target.position.set(0, 0.4, 0);
  lights.key.castShadow = true;
  lights.key.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  lights.key.shadow.bias = -0.00025;
  lights.key.shadow.normalBias = 0.012;
  lights.key.shadow.camera.near = 4;
  lights.key.shadow.camera.far = 16;
  scene.add(lights.key, lights.key.target);

  lights.rim = new THREE.SpotLight(0x4f8dff, 0, 0, 0.42, 0.9, 0);
  lights.rim.position.set(5.2, 4.2, -5.8);
  lights.rim.target.position.set(0, 0.6, 0);
  scene.add(lights.rim, lights.rim.target);

  lights.fill = new THREE.DirectionalLight(0x9fb8e8, 0);
  lights.fill.position.set(3, 2, 6);
  scene.add(lights.fill);

  // fireworks flash, from far behind
  lights.flash = new THREE.DirectionalLight(0xffffff, 0);
  lights.flash.position.set(0, 6, -10);
  scene.add(lights.flash);

  // ----- post-processing -------------------------------------------------------------------
  const size = new THREE.Vector2();
  renderer.getDrawingBufferSize(size);
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality.msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(quality.dpr);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  composer.addPass(new ShaderPass(SanitizeShader));
  const bokeh = quality.dof ? new BokehPass(scene, camera, { focus: 5, aperture: 0, maxblur: 0.009 }) : null;
  if (bokeh) { bokeh.enabled = false; composer.addPass(bokeh); }
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.4, 0.42, 2.4);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FinishShader);
  composer.addPass(finish);

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setPixelRatio(quality.dpr);
    renderer.setSize(w, h);
    composer.setPixelRatio(quality.dpr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    finish.uniforms.uAspect.value = w / h;
  }
  resize();

  return { renderer, scene, camera, composer, bloom, bokeh, finish, lights, resize, plinth, board, floor };
}

// -----------------------------------------------------------------------------------------
// Camera rig: shots are described as a target, an orbit angle/elevation, a distance and a
// "subject radius". The distance is pushed back whenever the subject would not fit the
// current viewport, so portrait phones never crop the cake, knife or slice.
// -----------------------------------------------------------------------------------------
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.s = { tx: 0, ty: 2, tz: -2, az: Math.PI / 2, el: 0.02, dist: 10, fitR: 0, fov: 30, offY: 0, roll: 0 };
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.parallax = 1;
    this.target = new THREE.Vector3();
    this.shake = 0;
  }

  set(shot) { Object.assign(this.s, shot); }

  setPointer(nx, ny) { this.pointer.x = nx; this.pointer.y = ny; }

  update(dt, w, h, time) {
    const s = this.s, cam = this.camera, p = this.pointer;
    const k = 1 - Math.exp(-dt * 2.2);
    p.sx += (p.x - p.sx) * k;
    p.sy += (p.y - p.sy) * k;
    cam.fov = s.fov;
    const aspect = w / h;
    const vf = THREE.MathUtils.degToRad(s.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const fit = s.fitR > 0 ? s.fitR / Math.sin(Math.min(vf, hf) / 2) : 0;
    const d = Math.max(s.dist, fit);
    // slow handheld drift + pointer parallax
    const drift = this.parallax * 0.006;
    const az = s.az + this.parallax * p.sx * 0.035 + Math.sin(time * 0.21) * drift;
    const el = s.el + this.parallax * p.sy * 0.02 + Math.sin(time * 0.17 + 1.3) * drift * 0.6;
    this.target.set(s.tx, s.ty, s.tz);
    cam.position.set(
      s.tx + Math.cos(el) * Math.cos(az) * d,
      s.ty + Math.sin(el) * d,
      s.tz + Math.cos(el) * Math.sin(az) * d
    );
    if (this.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * this.shake;
      cam.position.y += (Math.random() - 0.5) * this.shake;
    }
    cam.up.set(Math.sin(s.roll), Math.cos(s.roll), 0);
    cam.lookAt(this.target);
    // shift the frame vertically to make room for type, without changing perspective
    if (Math.abs(s.offY) > 1e-4) cam.setViewOffset(w, h, 0, -s.offY * h, w, h);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    return d;
  }
}
