# Happy Birthday, Shining Star — a four-screen birthday film

A small interactive, cinematic birthday experience built from the
"Realistic Birthday Experience" spec (made for Shining Star): a dark studio intro, a cake reveal,
candles, a weighted knife cut with a separating slice, and a celebration with
fireworks.

Everything is one continuous WebGL scene, so the four screens flow into each other
instead of loading separate pages:

| # | Screen | What happens |
|---|--------|--------------|
| 1 | **Arrival** | Fade up from black; blue volumetric beams, drifting dust and soft bokeh; "Happy Birthday, Shining Star"; **Begin the Surprise**. |
| 2 | **The Cake** | The camera moves forward and down into the set while the studio lights come up; "Your cake is ready." **Light the Moment** ignites four candles one by one, then **Cut the Cake**. |
| 3 | **The Cut** | The knife enters from the right out of focus, focus pulls to the blade, it approaches at an angle, the tip meets the glaze, and the blade is pushed through with weighted easing and a little sawing. The frosting opens exactly where the steel is, cream lips rise, crumbs fall, a second cut follows, and the slice is drawn out with mass, wobbles and settles; the camera gives it a hero moment. |
| 4 | **Celebration** | Wider shot, fireworks in the distance, a light fall of foil confetti, the title, the birthday message and **Replay**. |

## Run it

It is a static page. Serve the folder with any static server and open `index.html`:

```
cd birthday-experience
python3 -m http.server 8080      # then open http://localhost:8080
```

(Opening the file straight from disk with `file://` won't work: browsers block ES modules there.)

On the nexcodpos.in host it is reachable at `/birthday-experience/` (the folder's
`.htaccess` sets `index.html` as the index). With the site's local `php -S … tools/router.php`,
open `/birthday-experience/index.html`.

### OneCompiler

`onecompiler/index.html` is the same experience as **one self-contained file** (styles and
all local modules inlined; three.js and GSAP load from their CDNs). Paste it into
OneCompiler's HTML editor as `index.html` and run. Rebuild it after editing anything:

```
npm install --no-save esbuild
node tools/build-single-file.mjs
```

## How it's built

```
index.html          markup for the UI overlay, import map (three.js 0.160.0), GSAP 3.12.5
css/style.css       the overlay: type, buttons (hover / pressed / disabled / loading), focus ring
js/app.js           screens, camera shots, light states, the render loop, adaptive resolution
js/scene.js         renderer, studio set, lights, environment reflections, post-processing, camera rig
js/cake.js          procedural cake, glaze and drips, decorations, topper, candles and flames, cut shader
js/cutting.js       knife model, crumbs, and the choreography of the cut and the slice
js/effects.js       beams, dust, bokeh, fireworks, confetti
js/audio.js         candle-fire and fireworks sound, synthesised with Web Audio
js/textures.js      canvas-painted textures (sponge cross-section, frosting relief, wax, steel...)
js/topper-font.js   Droid Serif Bold, cut down to the letters the topper uses
js/util.js          seeded random numbers and noise
tools/              single-file build for OneCompiler
onecompiler/        the generated single file
```

There are no model, texture or audio files to download or break; everything is generated
at start-up, which also keeps the page light (about 130 KB of our own code).

**The cake.** A real 3D cake, not CSS: an ivory frosted cylinder with a rounded top edge and
small irregularities (noise in radius and top height, a frosting foot at the base, scraper
marks in patches), a glossy blueberry glaze with uneven drips of different lengths, piped
rosettes, blueberries with their dusty bloom (sheen), silver sugar pearls, a mirror-gold acrylic
"SHINING STAR" topper with a star, on two stakes pushed into the cake, and four spiral wax candles. All of it is
lit with PBR materials and a pre-filtered environment that matches the set's lights.

**The cut.** The cake is built from the start as two pieces — the body and the slice — whose
shared cut faces carry a painted cross-section: three vanilla sponge layers with baked
crusts and air pockets, two cream layers with blueberry compote, and the frosting shell. A
vertex shader driven by the knife's actual edge height pushes the frosting apart by the
blade's thickness only above the edge, so the slit appears exactly where the steel is and
the cream lips rise beside it. Crumbs are small rigid bodies with gravity, bounce and spin;
the slice moves with eased mass, then wobbles and settles while the body answers slightly.

**Flames** are a shader on a camera-facing card: the shape is deformed by noise travelling
upward, with a blue base, a white-yellow core and an orange edge, so it flickers and licks
rather than scaling. Each candle carries a warm flickering point light (two on phones).

**Lighting.** Large cool key from upper-left front with soft shadows, blue rim from rear
right, a soft hemispheric fill, and warm candle light; bloom is limited to the brightest
values (flames, glints), and an HDR guard stops any stray pixel from flaring.

**Sound** is kept to two cues only (mute button top-right, remembered between visits): the soft crackle of the candle flames and the distant fireworks, whose bangs arrive a little after their flashes. Audio only starts after the first click, as browsers require.

**Phones and slower devices.** Shots are described by a subject radius, and the camera backs
off whenever the subject wouldn't fit the viewport, so portrait phones never crop the cake,
knife or slice. Phones get a lower pixel ratio cap (1.5), smaller shadow maps, fewer
particles, two candle lights and no depth of field; on any device the resolution steps down
automatically if frames stay slow. `prefers-reduced-motion` shortens camera moves and drops
parallax but keeps the whole sequence.

If WebGL isn't available the page shows the birthday message instead of a blank screen.

Add `?debug` to the URL to reach the scene internals from the console (`window.__bday`).

## Notes against the spec

- The spec's suggested layout has separate `cake.html` / `cutting.html` / `final.html`
  pages. They are screens of one page here, because the spec also asks for continuous,
  non-abrupt transitions between them, which separate pages can't give.
- The spec prefers GLB models; none were supplied, so the cake and knife are procedural
  geometry built to the same brief (layers, drips, irregularity, a reflective blade with a
  dark handle). Real models could replace them later.
- Interaction in the cut is cinematic (one **Cut the Cake** click plays the sequence)
  rather than dragging the knife, so the motion keeps the weight and timing the spec
  describes on every device.
