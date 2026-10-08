// Canvas-generated textures. Nothing is downloaded: the sponge cross-section, frosting
// relief, candle wax and the soft sprites are all painted here at start-up.
import * as THREE from 'three';
import { createNoise3, fbm, smoothstep, clamp, mulberry32 } from './util.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(c, { srgb = false, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/*
 * The inside of the cake, painted for the cut faces.
 * u (x) runs from the cake's axis (0) to its outer frosting (1); v (y) from the board (0) to the top (1).
 * Three vanilla sponge layers with darker baked crusts, two cream layers streaked with
 * blueberry compote, and the outer/top frosting shell. Returns colour, roughness and bump maps.
 */
export function cakeCrossSection(size = 768) {
  const n = createNoise3(31);
  const colorC = canvas(size, size), roughC = canvas(size, size), bumpC = canvas(size, size);
  const cctx = colorC.getContext('2d'), rctx = roughC.getContext('2d'), bctx = bumpC.getContext('2d');
  const col = cctx.createImageData(size, size), rough = rctx.createImageData(size, size), bump = bctx.createImageData(size, size);

  for (let py = 0; py < size; py++) {
    const v = 1 - (py + 0.5) / size;
    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size;
      const i = (py * size + px) * 4;

      const outer = 0.948 + 0.008 * n(v * 14, 3.1) + 0.004 * n(v * 41, 1.3);
      const top = 0.918 + 0.010 * n(u * 6, 5.5) + 0.004 * n(u * 27, 2.2);
      const c1 = 0.285 + 0.012 * n(u * 5, 1.7), t1 = 0.058 + 0.012 * n(u * 7, 9.1);
      const c2 = 0.600 + 0.012 * n(u * 5, 4.2), t2 = 0.056 + 0.012 * n(u * 7, 6.4);

      let r, g, b, ro, bu;
      if (u > outer || v > top) {
        // frosting shell
        const f = 1 + 0.025 * n(u * 30, v * 30, 4);
        r = 246 * f; g = 242 * f; b = 234 * f; ro = 0.5; bu = 0.62 + 0.05 * n(u * 60, v * 60, 1);
        // thin crumb line where frosting meets sponge
        const edgeDist = Math.min(Math.abs(u - outer), Math.abs(v - top));
        if (edgeDist < 0.006) { const k = 1 - edgeDist / 0.006; r -= 18 * k; g -= 26 * k; b -= 38 * k; }
      } else if ((v > c1 && v < c1 + t1) || (v > c2 && v < c2 + t2)) {
        // cream filling with compote ribbons
        const f = 1 + 0.03 * n(u * 20, v * 50, 2);
        r = 241 * f; g = 233 * f; b = 216 * f; ro = 0.55; bu = 0.6;
        const cp = n(u * 9, v * 26, 7) + 0.35 * n(u * 32, v * 70, 1.5);
        if (cp > 0.18) {
          const k = smoothstep(0.18, 0.32, cp);
          const dark = smoothstep(0.32, 0.55, cp);
          r = r * (1 - k) + (128 - 50 * dark) * k;
          g = g * (1 - k) + (36 - 16 * dark) * k;
          b = b * (1 - k) + (88 - 30 * dark) * k;
          ro = 0.55 - 0.3 * k; bu = 0.62 + 0.04 * k;
          // berry skins
          if (n(u * 120, v * 120, 3) > 0.42) { r *= 0.6; g *= 0.55; b *= 0.7; }
        }
      } else {
        // sponge
        const layerLo = v < c1 ? 0 : v < c2 ? c1 + t1 : c2 + t2;
        const layerHi = v < c1 ? c1 : v < c2 ? c2 : top;
        const crust = Math.max(smoothstep(0.022, 0.0, v - layerLo), smoothstep(0.018, 0.0, layerHi - v) * 0.55);
        const tone = 1 + 0.07 * fbm(n, u * 3, v * 3, 8, 3);
        // brighter crumb in the centre of each layer, slightly denser near the outside
        r = 238 * tone; g = 202 * tone; b = 128 * tone;
        r = r * (1 - crust) + 176 * crust; g = g * (1 - crust) + 118 * crust; b = b * (1 - crust) + 62 * crust;
        // compote stain bleeding into the sponge right above/below the cream
        const near = Math.min(Math.abs(v - c1), Math.abs(v - c1 - t1), Math.abs(v - c2), Math.abs(v - c2 - t2));
        const stain = smoothstep(0.012, 0.0, near) * smoothstep(0.1, 0.35, n(u * 9, v * 26, 7));
        r -= 70 * stain; g -= 95 * stain; b -= 40 * stain;
        // air pockets: two scales of noise, thresholded into holes
        // stretched slightly upward, the way bubbles rise in a baking sponge
        const pn = 0.5 * n(u * 70, v * 52, 0.5) + 0.32 * n(u * 150, v * 115, 2.5) + 0.18 * n(u * 320, v * 260, 6.1);
        const pore = smoothstep(0.12, 0.42, pn);
        const big = smoothstep(0.38, 0.5, n(u * 26, v * 20, 8.8)) * 0.6;
        const lit = smoothstep(-0.2, -0.42, pn);
        const hole = Math.max(pore, big);
        r *= 1 - 0.3 * hole; g *= 1 - 0.34 * hole; b *= 1 - 0.4 * hole;
        r += 12 * lit; g += 11 * lit; b += 6 * lit;
        ro = 0.93; bu = 0.55 - 0.45 * hole + 0.12 * lit;
      }
      col.data[i] = clamp(r, 0, 255); col.data[i + 1] = clamp(g, 0, 255); col.data[i + 2] = clamp(b, 0, 255); col.data[i + 3] = 255;
      const rv = clamp(ro * 255, 0, 255);
      rough.data[i] = rv; rough.data[i + 1] = rv; rough.data[i + 2] = rv; rough.data[i + 3] = 255;
      const bv = clamp(bu * 255, 0, 255);
      bump.data[i] = bv; bump.data[i + 1] = bv; bump.data[i + 2] = bv; bump.data[i + 3] = 255;
    }
  }
  cctx.putImageData(col, 0, 0); rctx.putImageData(rough, 0, 0); bctx.putImageData(bump, 0, 0);
  return { map: toTexture(colorC, { srgb: true }), roughnessMap: toTexture(roughC), bumpMap: toTexture(bumpC) };
}

/*
 * Relief for the outside frosting: faint horizontal scraper lines and soft palette-knife
 * marks. Tileable horizontally (noise is sampled on a circle) so it wraps around the cake.
 */
export function frostingRelief(w = 512, h = 512) {
  const n = createNoise3(5);
  const c = canvas(w, h), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const rc = canvas(w, h), rctx = rc.getContext('2d');
  const rimg = rctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const a = (x / w) * Math.PI * 2;
      const cx = Math.cos(a), cz = Math.sin(a);
      // scraper lines only show in patches, like a real hand-smoothed cake
      const patch = smoothstep(-0.1, 0.4, n(cx * 2 + 9, cz * 2, v * 3));
      const streak = (0.5 * n(cx * 1.5, cz * 1.5, v * 34) + 0.2 * n(cx * 4, cz * 4, v * 80)) * patch;
      const knife = fbm(n, cx * 1.2 + 4, cz * 1.2, v * 4, 3);
      const fine = 0.08 * n(cx * 18, cz * 18, v * 18);
      const val = 0.5 + 0.16 * streak + 0.4 * knife + fine;
      const i = (y * w + x) * 4;
      const bv = clamp(val * 255, 0, 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = bv; img.data[i + 3] = 255;
      const ro = clamp((0.5 + 0.18 * knife + 0.08 * streak) * 255, 0, 255);
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = ro; rimg.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0); rctx.putImageData(rimg, 0, 0);
  return { bumpMap: toTexture(c, { repeat: true }), roughnessMap: toTexture(rc, { repeat: true }) };
}

// Spiral-striped wax for the candles: ivory with a soft blue ribbon.
export function candleWax() {
  const w = 128, h = 256;
  const c = canvas(w, h), ctx = c.getContext('2d');
  const n = createNoise3(17);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const s = ((u + v * 1.6) * 2) % 1;
      const band = smoothstep(0.02, 0.06, s) * smoothstep(0.42, 0.38, s);
      const g = 1 + 0.03 * n(u * 12, v * 24);
      const r = (242 * (1 - band) + 120 * band) * g;
      const gg = (238 * (1 - band) + 170 * band) * g;
      const b = (228 * (1 - band) + 232 * band) * g;
      const i = (y * w + x) * 4;
      img.data[i] = clamp(r, 0, 255); img.data[i + 1] = clamp(gg, 0, 255); img.data[i + 2] = clamp(b, 0, 255); img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { srgb: true, repeat: true });
}

// Soft radial sprite (glows, contact shadows). `stops` are [offset, alpha] pairs.
export function radialSprite(size = 128, stops = [[0, 1], [0.35, 0.45], [1, 0]], rgb = '255,255,255') {
  const c = canvas(size, size), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, a] of stops) g.addColorStop(o, `rgba(${rgb},${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

// Smear of cream (with a streak of glaze and a few crumbs) left on the blade after the cut.
export function bladeSmear() {
  const w = 512, h = 128;
  const c = canvas(w, h), ctx = c.getContext('2d');
  const n = createNoise3(23);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = 1 - y / h; // v: 0 at the cutting edge, 1 at spine
      const reach = 0.55 + 0.25 * n(u * 6, 1.3); // how far up the blade the cream reached
      const body = smoothstep(reach, reach - 0.18, v) * smoothstep(0.0, 0.06, u) * smoothstep(1.0, 0.86, u);
      const blot = smoothstep(-0.1, 0.35, n(u * 18, v * 8, 2) + 0.4 * n(u * 50, v * 30, 5));
      let a = body * blot * 0.95;
      let r = 245, g = 239, b = 228;
      const glaze = smoothstep(0.05, 0.0, Math.abs(v - (reach - 0.12))) * smoothstep(0.1, 0.4, n(u * 9, 4.4));
      r = r * (1 - glaze) + 70 * glaze; g = g * (1 - glaze) + 34 * glaze; b = b * (1 - glaze) + 84 * glaze;
      if (n(u * 140, v * 60, 9) > 0.5 && v < reach) { r = 214; g = 168; b = 104; a = Math.max(a, 0.9); }
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = clamp(a * 255, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { srgb: true });
}

// Dark stone relief for the plinth.
export function stoneRoughness(size = 256) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  const n = createNoise3(41);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = (x / size) * Math.PI * 2;
      const v = fbm(n, Math.cos(a) * 2, Math.sin(a) * 2, (y / size) * 6, 4);
      const val = clamp((0.42 + 0.22 * v) * 255, 0, 255);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { repeat: true });
}

// Fine radial brushing for the metal cake board (used as a roughness map).
export function brushedMetal(size = 512) {
  const c = canvas(size, size), ctx = c.getContext('2d');
  const rnd = mulberry32(3);
  ctx.fillStyle = 'rgb(90,90,90)';
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  for (let i = 0; i < 2200; i++) {
    const r = rnd() * size * 0.5;
    const a0 = rnd() * Math.PI * 2;
    const len = 0.05 + rnd() * 0.4;
    const shade = 60 + rnd() * 70;
    ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.35)`;
    ctx.lineWidth = 0.6 + rnd();
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a0 + len);
    ctx.stroke();
  }
  return toTexture(c);
}
