// Sound is synthesised with the Web Audio API (no audio files to load or break).
// Only two cues are kept: the crackling candle fire and the distant fireworks.
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
    this.verb.buffer = this.impulse(1.6, 2.6);
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

  // ---- the cues: only the candle fire and the fireworks ---------------------------------
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
  }
}
