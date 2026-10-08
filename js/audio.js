// All sound is synthesised with the Web Audio API (no audio files to load or break).
// The context is created only from a user gesture, as browsers require.
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('amit-bday-muted') === '1'; } catch (e) { /* storage blocked */ }
    this.fireOn = false;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    // shared reverb
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(2.8, 2.6);
    this.verbIn = ctx.createGain();
    this.verbIn.gain.value = 0.5;
    this.verbIn.connect(this.verb).connect(this.master);
    this.noiseBuf = this.makeNoise(2);
    this.brownBuf = this.makeNoise(2, true);
  }

  get ready() { return !!this.ctx; }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('amit-bday-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.08);
  }

  impulse(seconds, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  makeNoise(seconds, brown = false) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  noise(brown = false, loop = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = brown ? this.brownBuf : this.noiseBuf;
    s.loop = loop;
    return s;
  }

  out(node, wet = 0.3) {
    node.connect(this.master);
    if (wet > 0) { const g = this.ctx.createGain(); g.gain.value = wet; node.connect(g).connect(this.verbIn); }
  }

  env(gainNode, t, a, peak, d) {
    const g = gainNode.gain;
    g.value = 0.0001; // silent until the envelope starts, even if the source starts earlier
    g.setValueAtTime(0.0001, t);
    g.linearRampToValueAtTime(peak, t + a);
    g.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  // ---- the cues --------------------------------------------------------------------------
  ambient() {
    if (!this.ctx || this.amb) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.linearRampToValueAtTime(0.16, t + 4);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    bus.connect(lp);
    this.out(lp, 0.5);
    const oscs = [];
    for (const [f, type, g] of [[55, 'sine', 0.5], [82.41, 'triangle', 0.18], [110.3, 'sine', 0.16], [164.8, 'sine', 0.06]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.08;
      const lg = ctx.createGain(); lg.gain.value = g * 0.4;
      lfo.connect(lg).connect(og.gain);
      o.connect(og).connect(bus);
      o.start(t); lfo.start(t);
      oscs.push(o, lfo);
    }
    const air = this.noise(false, true);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
    const ag = ctx.createGain(); ag.gain.value = 0.05;
    air.connect(bp).connect(ag).connect(bus);
    air.start(t);
    oscs.push(air);
    this.amb = { bus, oscs };
  }

  ambientLevel(v, time = 2) {
    if (!this.amb) return;
    this.amb.bus.gain.setTargetAtTime(Math.max(0.0001, 0.16 * v), this.ctx.currentTime, time / 3);
  }

  reveal() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this.noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(180, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 2.6);
    const g = ctx.createGain(); this.env(g, t, 1.8, 0.07, 1.6);
    n.connect(bp).connect(g); this.out(g, 0.8);
    n.start(t); n.stop(t + 4);
    [261.6, 329.6, 392.0, 493.9, 587.3].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); this.env(og, t + 0.4 + i * 0.12, 1.6, 0.028, 3.4);
      o.connect(og); this.out(og, 0.9);
      o.start(t); o.stop(t + 7);
    });
  }

  ignite() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this.noise();
    const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.setValueAtTime(900, t); hp.frequency.exponentialRampToValueAtTime(2600, t + 0.25);
    const g = ctx.createGain(); this.env(g, t, 0.02, 0.18, 0.35);
    n.connect(hp).connect(g); this.out(g, 0.25);
    n.start(t); n.stop(t + 0.6);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    const og = ctx.createGain(); this.env(og, t, 0.01, 0.12, 0.25);
    o.connect(og); this.out(og, 0.1);
    o.start(t); o.stop(t + 0.4);
  }

  fire(on) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (on && !this.fireBus) {
      const bus = ctx.createGain(); bus.gain.value = 0.0001;
      bus.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
      this.out(bus, 0.15);
      const hiss = this.noise(false, true);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.5;
      const hg = ctx.createGain(); hg.gain.value = 0.012;
      hiss.connect(bp).connect(hg).connect(bus); hiss.start();
      this.fireBus = { bus, hiss };
      const crackle = () => {
        if (!this.fireBus) return;
        const t = ctx.currentTime;
        const s = this.noise();
        const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500 + Math.random() * 3000;
        const g = ctx.createGain(); this.env(g, t, 0.001, 0.02 + Math.random() * 0.05, 0.02 + Math.random() * 0.03);
        s.connect(f).connect(g).connect(bus);
        s.start(t, Math.random()); s.stop(t + 0.08);
        this.fireBus.timer = setTimeout(crackle, 70 + Math.random() * 380);
      };
      crackle();
    } else if (!on && this.fireBus) {
      const fb = this.fireBus; this.fireBus = null;
      clearTimeout(fb.timer);
      fb.bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      setTimeout(() => { try { fb.hiss.stop(); } catch (e) { /* already stopped */ } }, 2500);
    }
  }

  knifeIn() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this.noise();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(7000, t + 0.5);
    const g = ctx.createGain(); this.env(g, t, 0.25, 0.035, 0.4);
    n.connect(f).connect(g); this.out(g, 0.6);
    n.start(t); n.stop(t + 1);
  }

  knifeContact() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // inharmonic partials of a thin steel blade, plus a short tick
    [[1840, 0.9], [2770, 0.7], [4130, 0.45], [5930, 0.3], [7310, 0.22]].forEach(([f, dcy], i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
      const g = ctx.createGain(); this.env(g, t, 0.002, 0.03 / (i + 1), dcy);
      o.connect(g); this.out(g, 0.7);
      o.start(t); o.stop(t + dcy + 0.1);
    });
    const n = this.noise();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    const g = ctx.createGain(); this.env(g, t, 0.001, 0.08, 0.05);
    n.connect(hp).connect(g); this.out(g, 0.2);
    n.start(t); n.stop(t + 0.1);
  }

  cutStart() {
    if (!this.ctx || this.cutBus) return;
    const ctx = this.ctx;
    const n = this.noise(true, true);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const bp = ctx.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 2200; bp.gain.value = 6;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    n.connect(lp).connect(bp).connect(g); this.out(g, 0.1);
    n.start();
    this.cutBus = { n, g };
  }

  cutLevel(v) {
    if (!this.cutBus) return;
    this.cutBus.g.gain.setTargetAtTime(Math.max(0.0001, v * 0.22), this.ctx.currentTime, 0.04);
  }

  cutStop() {
    if (!this.cutBus) return;
    const cb = this.cutBus; this.cutBus = null;
    cb.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
    setTimeout(() => { try { cb.n.stop(); } catch (e) { /* ignore */ } }, 600);
  }

  crumb() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this.noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000 + Math.random() * 3000; bp.Q.value = 3;
    const g = ctx.createGain(); this.env(g, t, 0.001, 0.025 + Math.random() * 0.02, 0.03);
    n.connect(bp).connect(g); this.out(g, 0.1);
    n.start(t, Math.random()); n.stop(t + 0.06);
  }

  slide() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this.noise(true);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const g = ctx.createGain(); this.env(g, t, 0.3, 0.12, 1.1);
    n.connect(lp).connect(g); this.out(g, 0.2);
    n.start(t); n.stop(t + 1.6);
  }

  impact() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.6);
    const og = ctx.createGain(); this.env(og, t, 0.01, 0.45, 1.2);
    o.connect(og); this.out(og, 0.5);
    o.start(t); o.stop(t + 1.5);
    [523.3, 659.3, 784, 987.8, 1174.7, 1568].forEach((f, i) => {
      const s = ctx.createOscillator(); s.type = i % 2 ? 'triangle' : 'sine'; s.frequency.value = f;
      const g = ctx.createGain(); this.env(g, t + 0.05 + i * 0.05, 0.4, 0.022, 4.5);
      s.connect(g); this.out(g, 1.0);
      s.start(t); s.stop(t + 6);
    });
  }

  firework(distance = 40) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + Math.min(0.9, distance / 70); // sound arrives after the flash
    const n = this.noise(true);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380 + Math.random() * 200;
    const g = ctx.createGain(); this.env(g, t, 0.005, 0.35, 1.3);
    n.connect(lp).connect(g); this.out(g, 0.9);
    n.start(t); n.stop(t + 1.5);
    for (let k = 0; k < 9; k++) {
      const tt = t + 0.35 + Math.random() * 1.2;
      const c = this.noise();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
      const cg = ctx.createGain(); this.env(cg, tt, 0.001, 0.02 * Math.random(), 0.02);
      c.connect(hp).connect(cg); this.out(cg, 0.6);
      c.start(tt, Math.random()); c.stop(tt + 0.05);
    }
  }

  stopAll() {
    this.fire(false);
    this.cutStop();
  }
}
