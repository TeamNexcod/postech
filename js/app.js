// Orchestration: one continuous scene, four screens, one visual language.
// Screen 1 intro → 2 cake reveal → 3 cutting → 4 celebration (→ replay).
import * as THREE from 'three';
import { createStage, CameraRig } from './scene.js';
import { createCake, SLICE } from './cake.js';
import { createCutting } from './cutting.js';
import { createBeam, createDust, createBokeh, createFireworks, createConfetti } from './effects.js';
import { Sound } from './audio.js';

const gsap = window.gsap;
const $ = (s) => document.querySelector(s);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const mobile = coarse || Math.max(window.innerWidth, window.innerHeight) < 900;
const quality = {
  mobile,
  dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75),
  msaa: mobile ? 2 : 4,
  shadowSize: mobile ? 1024 : 2048,
  dof: !mobile && !reduced,
};

// ----- shots ------------------------------------------------------------------------------
const H = Math.PI / 2;
const sliceRest = new THREE.Vector3(Math.cos(SLICE.mid), 0, Math.sin(SLICE.mid)).multiplyScalar(SLICE.pivotR + 0.62);
const SHOTS = {
  intro: { tx: 0, ty: 1.7, tz: -3, az: H, el: 0.05, dist: 11.5, fitR: 0, fov: 30, offY: 0 },
  revealWide: { tx: 0, ty: 0.42, tz: 0, az: H - 0.08, el: 0.28, dist: 8.6, fitR: 2.5, fov: 30, offY: 0 },
  reveal: { tx: 0, ty: 0.6, tz: 0, az: H - 0.16, el: 0.33, dist: 5.9, fitR: 1.85, fov: 30, offY: -0.07 },
  lit: { tx: 0, ty: 0.64, tz: 0, az: H - 0.22, el: 0.31, dist: 5.3, fitR: 1.75, fov: 30, offY: -0.07 },
  cut: { tx: 0.62, ty: 0.55, tz: 0.18, az: 1.22, el: 0.42, dist: 4.7, fitR: 1.85, fov: 30, offY: 0 },
  cutClose: { tx: 0.55, ty: 0.55, tz: 0.22, az: 1.3, el: 0.36, dist: 4.2, fitR: 1.7, fov: 30, offY: 0 },
  cutSecond: { tx: 0.62, ty: 0.55, tz: 0.02, az: 1.1, el: 0.4, dist: 4.3, fitR: 1.75, fov: 30, offY: 0 },
  sliceHero: { tx: sliceRest.x - 0.08, ty: 0.42, tz: sliceRest.z + 0.05, az: 1.36, el: 0.27, dist: 2.9, fitR: 0.9, fov: 30, offY: 0 },
  final: { tx: 0.15, ty: 1.2, tz: -0.2, az: H + 0.06, el: 0.1, dist: 8.6, fitR: 2.5, fov: 32, offY: 0.1 },
};

// ----- light states -------------------------------------------------------------------------
const LIGHT = {
  dark: { key: 0, rim: 0, hemi: 0, fill: 0, beam: 1, dust: 1, bokeh: 0.8, beam2: 0.6, exposure: 1.0, env: 0.04 },
  studio: { key: 3.4, rim: 5.5, hemi: 0.55, fill: 0.22, beam: 0.55, dust: 0.75, bokeh: 0.6, beam2: 0.35, exposure: 1.0, env: 1 },
  candle: { key: 2.3, rim: 4.6, hemi: 0.38, fill: 0.12, beam: 0.42, dust: 0.65, bokeh: 0.55, beam2: 0.25, exposure: 1.02, env: 0.85 },
  final: { key: 2.6, rim: 5.5, hemi: 0.45, fill: 0.25, beam: 0.28, dust: 0.55, bokeh: 0.32, beam2: 0.2, exposure: 1.02, env: 0.95 },
};

const CHAPTERS = { intro: ['01', 'Arrival'], cake: ['02', 'The Cake'], cut: ['03', 'The Cut'], final: ['04', 'Celebration'] };

// ---------------------------------------------------------------------------------------
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const wait = (s) => new Promise((r) => gsap.delayedCall(reduced ? s * 0.6 : s, r));
const setProgress = (p) => { $('#loaderFill').style.width = `${Math.round(p * 100)}%`; };

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2')) || !!c.getContext('webgl');
  } catch (e) { return false; }
}

function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.setAttribute('aria-hidden', 'true');
          s.textContent = part;
          frag.appendChild(s);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        if (child.tagName === 'EM') { child.classList.add('w'); child.setAttribute('aria-hidden', 'true'); } else walk(child);
      }
    }
  };
  walk(el);
}

async function main() {
  if (!webglAvailable() || !gsap) {
    $('#loader').classList.add('is-done');
    $('#fallback').hidden = false;
    return;
  }
  setProgress(0.08);
  await nextFrame();

  const container = $('#stage');
  const stage = createStage(container, quality);
  const { scene, camera, renderer, lights, finish } = stage;
  const rig = new CameraRig(camera);
  rig.parallax = reduced ? 0 : 1;
  rig.set(SHOTS.intro);
  setProgress(0.25);
  await nextFrame();

  const cake = createCake({ quality });
  scene.add(cake.root);
  setProgress(0.7);
  await nextFrame();

  // atmosphere
  const beam = createBeam({ from: new THREE.Vector3(-5.5, 9, -6), to: new THREE.Vector3(0.6, -1.1, -1.2), radius: 3.4, color: 0x2f6dff });
  const beam2 = createBeam({ from: new THREE.Vector3(6.5, 8, -9), to: new THREE.Vector3(2.5, -1.1, -4), radius: 2.4, color: 0x1fb6ff });
  scene.add(beam.mesh, beam2.mesh);
  const dust = createDust({ count: mobile ? 260 : 650, beam, pixelRatio: quality.dpr });
  scene.add(dust.points);
  const bokeh = createBokeh({ count: mobile ? 26 : 46, pixelRatio: quality.dpr });
  scene.add(bokeh.points);
  const sound = new Sound();
  let flash = 0;
  const fireworks = createFireworks({
    max: mobile ? 1100 : 2600,
    pixelRatio: quality.dpr,
    onBurst: ({ x, y, z, color }) => {
      flash = Math.min(1.2, flash + 0.55);
      lights.flash.color.setRGB(color[0], color[1], color[2]);
      lights.flash.position.set(x * 0.3, 6, -10);
      sound.firework(Math.hypot(x - camera.position.x, y - camera.position.y, z - camera.position.z));
    },
  });
  scene.add(fireworks.points);
  const confetti = createConfetti({ count: mobile ? 46 : 96 });
  scene.add(confetti.mesh);

  const cutting = createCutting({ gsap, rig, cake, stage, quality, reduced });
  setProgress(0.9);

  // ----- light state application -----------------------------------------------------
  const L = { ...LIGHT.dark };
  // image-based light scales with the light state, so the set is truly dark before the reveal
  const envMaterials = new Map();
  scene.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) if (m.envMapIntensity !== undefined && !envMaterials.has(m)) envMaterials.set(m, m.envMapIntensity);
  });
  let lastEnv = -1;
  const toLight = (name, duration, delay = 0, ease = 'power2.inOut') => gsap.to(L, { ...LIGHT[name], duration: reduced ? duration * 0.6 : duration, delay, ease });

  function applyLights() {
    lights.key.intensity = L.key;
    lights.rim.intensity = L.rim;
    lights.hemi.intensity = L.hemi;
    lights.fill.intensity = L.fill;
    lights.flash.intensity = flash * 0.9;
    beam.uniforms.uIntensity.value = 0.22 * L.beam;
    beam2.uniforms.uIntensity.value = 0.16 * L.beam2;
    dust.uniforms.uOpacity.value = L.dust;
    bokeh.uniforms.uOpacity.value = L.bokeh;
    renderer.toneMappingExposure = L.exposure;
    if (L.env !== lastEnv) {
      lastEnv = L.env;
      for (const [m, base] of envMaterials) m.envMapIntensity = base * L.env;
    }
  }

  function updateScales() {
    const buf = new THREE.Vector2();
    renderer.getDrawingBufferSize(buf);
    const s = buf.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    dust.uniforms.uScale.value = s;
    bokeh.uniforms.uScale.value = s;
    fireworks.uniforms.uScale.value = s;
  }

  // ----- render loop -------------------------------------------------------------------
  const clock = new THREE.Clock();
  let elapsed = 0;
  let frameAvg = 16, sampleT = 0, downgrades = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    const w = container.clientWidth, h = container.clientHeight;
    rig.update(dt, w, h, elapsed);
    flash *= Math.exp(-dt * 3.2);
    applyLights();
    cake.update(dt, elapsed, camera);
    cutting.update(dt, camera);
    fireworks.update(dt);
    confetti.update(dt);
    beam.uniforms.uTime.value = elapsed;
    dust.uniforms.uTime.value = elapsed;
    bokeh.uniforms.uTime.value = elapsed;
    finish.uniforms.uTime.value = elapsed;
    stage.composer.render(dt);
    // adaptive resolution: if frames are consistently slow, render fewer pixels
    frameAvg += (dt * 1000 - frameAvg) * 0.05;
    sampleT += dt;
    if (sampleT > 3 && downgrades < 3 && document.visibilityState === 'visible') {
      sampleT = 0;
      if (frameAvg > 27 && quality.dpr > 1) {
        quality.dpr = Math.max(1, quality.dpr - 0.25);
        downgrades++;
        stage.resize(); updateScales();
      }
    }
  });

  const onResize = () => { stage.resize(); updateScales(); };
  window.addEventListener('resize', onResize);
  updateScales();

  // pointer parallax (pointer events cover mouse, pen and touch)
  window.addEventListener('pointermove', (e) => {
    rig.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  // ----- UI helpers --------------------------------------------------------------------
  const ui = $('#ui');
  const screens = [...document.querySelectorAll('.screen')];
  function setScreen(name) {
    screens.forEach((s) => {
      const on = s.dataset.screen === name;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    const ch = CHAPTERS[name] || CHAPTERS.intro;
    $('#chapterNum').textContent = ch[0];
    $('#chapterName').textContent = ch[1];
  }
  function revealIn(el, { delay = 0, stagger = 0.11 } = {}) {
    const words = el.classList.contains('split') ? el.querySelectorAll('.w') : [el];
    gsap.set(el, { opacity: 1 });
    return gsap.fromTo(words, { opacity: 0, y: 14, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: reduced ? 0.4 : 1.5, ease: 'power3.out', stagger: reduced ? 0 : stagger, delay });
  }
  function revealOut(els, duration = 0.7) {
    return new Promise((res) => gsap.to(els, { opacity: 0, y: -10, filter: 'blur(6px)', duration: reduced ? 0.3 : duration, ease: 'power2.in', onComplete: res }));
  }
  function resetEl(els) { gsap.set(els, { clearProps: 'all' }); }
  document.querySelectorAll('.split').forEach(splitWords);
  function setBusy(btn, busy) {
    btn.disabled = busy;
    btn.classList.toggle('is-loading', busy);
  }
  const caption = (step) => document.querySelector(`.caption-block[data-step="${step}"]`);

  // mute
  const muteBtn = $('#muteBtn');
  const syncMute = () => {
    muteBtn.setAttribute('aria-pressed', sound.muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', sound.muted ? 'Unmute sound' : 'Mute sound');
  };
  syncMute();
  muteBtn.addEventListener('click', () => { sound.init(); sound.setMuted(!sound.muted); syncMute(); });

  // ----- screen 1: intro ------------------------------------------------------------------
  const introEls = ['.screen--intro .eyebrow', '.screen--intro .hero-title', '.screen--intro .lede', '#beginBtn'].map((s) => $(s));
  async function intro(first) {
    setScreen('intro');
    resetEl(introEls);
    resetEl(introEls[1].querySelectorAll('.w'));
    introEls.forEach((e) => { if (!e.classList.contains('split')) gsap.set(e, { opacity: 0 }); });
    rig.set(SHOTS.intro);
    Object.assign(L, LIGHT.dark);
    finish.uniforms.uFade.value = 0;
    gsap.to(finish.uniforms.uFade, { value: 1, duration: reduced ? 1 : 3.4, ease: 'power2.inOut', delay: first ? 0.5 : 0.1 });
    // the camera breathes forward very slowly while the title sits there
    gsap.fromTo(rig.s, { dist: 12.4 }, { dist: 11.5, duration: 9, ease: 'sine.out' });
    ui.classList.add('is-live');
    await wait(first ? 1.6 : 0.8);
    revealIn(introEls[0]);
    revealIn(introEls[1], { delay: 0.35, stagger: 0.16 });
    revealIn(introEls[2], { delay: 1.3 });
    await wait(2.2);
    revealIn(introEls[3]);
    $('#beginBtn').disabled = false;
  }

  // ----- screen 2: cake reveal ------------------------------------------------------------
  $('#beginBtn').addEventListener('click', async () => {
    const btn = $('#beginBtn');
    if (btn.disabled) return;
    setBusy(btn, true);
    sound.init();
    await revealOut(introEls);
    setBusy(btn, false);
    setScreen('cake');
    // continuous move forward and down into the set while the studio lights come up
    gsap.killTweensOf(rig.s);
    gsap.to(rig.s, { ...SHOTS.revealWide, duration: reduced ? 2 : 3.6, ease: 'power2.inOut' });
    toLight('studio', 4.2, 0.6);
    await wait(3.6);
    gsap.to(rig.s, { ...SHOTS.reveal, duration: reduced ? 2.5 : 6, ease: 'power1.out' });
    await wait(1.6);
    const ready = caption('ready');
    ready.classList.add('is-active');
    resetEl(ready.children);
    revealIn(ready.children[0]);
    await wait(0.8);
    revealIn(ready.children[1]);
    $('#lightBtn').disabled = false;
  });

  $('#lightBtn').addEventListener('click', async () => {
    const btn = $('#lightBtn');
    if (btn.disabled) return;
    setBusy(btn, true);
    sound.init();
    const ready = caption('ready');
    await revealOut([...ready.children], 0.6);
    ready.classList.remove('is-active');
    setBusy(btn, false);
    gsap.to(rig.s, { ...SHOTS.lit, duration: reduced ? 2 : 4.5, ease: 'power2.inOut' });
    toLight('candle', 3.2, 0.4);
    sound.fire(true);
    cake.candles.forEach((c, i) => {
      gsap.delayedCall((reduced ? 0.25 : 0.55) * i + 0.3, () => {
        gsap.fromTo(c, { life: 0 }, { life: 1, duration: 1.1, ease: 'back.out(1.6)' });
      });
    });
    await wait(3.4);
    const wish = caption('wish');
    wish.classList.add('is-active');
    resetEl(wish.children);
    revealIn(wish.children[0]);
    await wait(1.0);
    revealIn(wish.children[1]);
    $('#cutBtn').disabled = false;
  });

  // ----- screen 3: the cut ----------------------------------------------------------------
  $('#cutBtn').addEventListener('click', async () => {
    const btn = $('#cutBtn');
    if (btn.disabled) return;
    setBusy(btn, true);
    const wish = caption('wish');
    await revealOut([...wish.children], 0.6);
    wish.classList.remove('is-active');
    setBusy(btn, false);
    btn.disabled = true;
    setScreen('cut');
    gsap.killTweensOf(rig.s);
    await cutting.play({ shots: SHOTS });
    finale();
  });

  // ----- screen 4: celebration ------------------------------------------------------------
  const finalEls = ['.final-title', '.screen--final .message', '#replayBtn'].map((s) => $(s));
  async function finale() {
    setScreen('final');
    resetEl(finalEls);
    resetEl(finalEls[0].querySelectorAll('.w'));
    gsap.set([finalEls[1], finalEls[2]], { opacity: 0 });
    gsap.to(rig.s, { ...SHOTS.final, duration: reduced ? 2.4 : 4.2, ease: 'power2.inOut' });
    toLight('final', 3);
    await wait(1.1);
    fireworks.start(mobile ? 0.6 : 1);
    await wait(0.8);
    revealIn(finalEls[0], { stagger: 0.16 });
    confetti.start(new THREE.Vector3(0.2, 1.1, 2.6));
    await wait(1.6);
    revealIn(finalEls[1]);
    await wait(2.2);
    revealIn(finalEls[2]);
    $('#replayBtn').disabled = false;
  }

  $('#replayBtn').addEventListener('click', async () => {
    const btn = $('#replayBtn');
    if (btn.disabled) return;
    btn.disabled = true;
    await revealOut(finalEls, 0.6);
    await new Promise((res) => gsap.to(finish.uniforms.uFade, { value: 0, duration: reduced ? 0.4 : 1.1, ease: 'power2.inOut', onComplete: res }));
    gsap.killTweensOf(rig.s);
    gsap.killTweensOf(L);
    fireworks.clear();
    confetti.clear();
    sound.fire(false);
    cake.reset();
    cutting.reset();
    flash = 0;
    intro(false);
  });

  ['#beginBtn', '#lightBtn', '#cutBtn', '#replayBtn'].forEach((s) => ($(s).disabled = true));

  setProgress(1);
  // let the shaders compile before revealing anything
  renderer.compile(scene, camera);
  await nextFrame();
  await nextFrame();
  $('#loader').classList.add('is-done');
  intro(true);

  // add ?debug to the URL to reach the internals from the console
  if (new URLSearchParams(location.search).has('debug')) window.__bday = { stage, rig, cake, cutting, SHOTS, L, LIGHT, fireworks, confetti, sound, finale };
}

main().catch((err) => {
  console.error(err);
  const l = document.getElementById('loader');
  if (l) l.classList.add('is-done');
  const f = document.getElementById('fallback');
  if (f) f.hidden = false;
});
