"""Synthesise the ad's festive dhol groove, SFX, and mix with the voiceover.

Writes mix.wav (48 kHz stereo). Timeline numbers mirror ad.html.
"""
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, lfilter

SR = 48000
END = 49.5
N = int(END * SR)
rng = np.random.default_rng(5)
D = sys.argv[1]  # working dir

V = {1: 0.6, 2: 5.55, 3: 10.2, 4: 15.45, 5: 21.65, 6: 23.95, 7: 31.85, 8: 35.75, 9: 44.2}
w = lambda n, off: V[n] + off


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def add(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    s = sig[max(0, -i):]
    i = max(0, i)
    n = min(len(s), buf.shape[1] - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + n] += s[:n] * gain * l * 1.414
    buf[1, i:i + n] += s[:n] * gain * r * 1.414


# ---------------- instruments
def dagga():
    t = tt(0.55)
    f = 52 + 70 * np.exp(-t * 22)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 5.5)
    click = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 120) * 0.5
    return np.tanh(1.6 * (body + click)) * 0.9


def tilli(accent=1.0):
    t = tt(0.14)
    n = bp(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t * 48)
    tone = np.sin(2 * np.pi * 540 * t) * np.exp(-t * 38) * 0.6
    return (n * 0.9 + tone) * accent * 0.55


def clap():
    t = tt(0.3)
    env = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) * (160 if d < 0.02 else 18))
    return bp(rng.standard_normal(len(t)), 900, 3200) * env * 0.5


def shaker(a):
    t = tt(0.06)
    return hp(rng.standard_normal(len(t)), 6500) * np.exp(-t * 70) * 0.18 * a


def note_hz(n):  # MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)


def bass(m, dur=0.26):
    t = tt(dur)
    f = note_hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 6)
    return np.tanh(1.4 * s * env) * 0.55


def pad(chord, dur):
    t = tt(dur)
    s = np.zeros_like(t)
    for m in chord:
        for det in (-0.07, 0.0, 0.07):
            f = note_hz(m + det)
            s += 2 * ((t * f + rng.random()) % 1) - 1
    s = lp(s / (len(chord) * 3), 1700)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3)
    return s * env * 0.5


def pluck(m, dur=0.9, bright=0.6):
    f = note_hz(m)
    Np = int(SR / f)
    n = int(dur * SR)
    x = np.zeros(n)
    exc = rng.uniform(-1, 1, Np)
    exc = lp(exc, 2000 + 6000 * bright, 1)
    x[:Np] = exc
    d = 0.996
    a = np.zeros(Np + 2)
    a[0] = 1
    a[Np] = -d * 0.5
    a[Np + 1] = -d * 0.5
    y = lfilter([1.0], a, x)
    # santoor-ish shimmer: add an octave partial
    t = np.arange(n) / SR
    y += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 7)
    return y * np.minimum(1, (dur - t) / 0.05) * 0.5


def bell(f0=1568, dur=1.6, g=1.0):
    t = tt(dur)
    s = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1, 3), (2.0, .5, 4), (3.01, .3, 6), (4.2, .2, 8), (5.43, .12, 10)):
        s += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * dec)
    return s * np.minimum(1, t / 0.002) * 0.25 * g


def impact(dur=1.8, g=1.0):
    t = tt(dur)
    f = 38 + 90 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    crash = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 3.2) * 0.35
    thump = lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 25) * 0.8
    return np.tanh(1.3 * (boom + thump)) * 0.9 * g + crash * g


def whoosh(dur=0.6, g=1.0):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    lo, hi = lp(n, 900), bp(n, 1500, 7000)
    x = t / dur
    env = np.sin(np.pi * x) ** 2
    return (lo * (1 - x) + hi * x * 0.8) * env * 0.6 * g


def riser(dur=1.4, g=1.0):
    t = tt(dur)
    x = t / dur
    n = rng.standard_normal(len(t))
    s = lp(n, 1200) * (1 - x) + hp(n, 2500) * x
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * x ** 2) / SR) * 0.2
    return (s * 0.5 + tone) * x ** 2.2 * g


def pop_crackle(seed):
    r = np.random.default_rng(seed)
    t = tt(1.6)
    pop = lp(r.standard_normal(len(t)), 900) * np.exp(-t * 30) * 0.8
    cr = np.zeros(len(t))
    for _ in range(70):
        i = int(r.uniform(0.15, 1.5) * SR)
        L = int(0.004 * SR)
        if i + L < len(t):
            cr[i:i + L] += r.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * r.uniform(.2, 1)
    cr = hp(cr, 2500) * np.exp(-t * 1.5)
    return pop + cr * 0.5


def click():
    t = tt(0.03)
    return bp(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t * 300) * 0.5


# ---------------- arrangement
music = np.zeros((2, N))
sfx = np.zeros((2, N))
BPM = 110
beat = 60 / BPM
step = beat / 4
# D | G | Bm | A
CHORDS = [[62, 66, 69], [62, 67, 71], [62, 66, 71], [61, 64, 69]]
ROOTS = [38, 43, 47, 45]
MEL = [  # (16th step within 4 bars, midi, len16)
    (0, 81, 2), (3, 78, 1), (4, 81, 2), (6, 83, 2), (8, 81, 2), (10, 78, 2), (12, 76, 4),
    (16, 74, 3), (19, 76, 1), (20, 78, 2), (22, 81, 4), (26, 78, 2), (28, 76, 4),
    (32, 83, 2), (35, 81, 1), (36, 83, 2), (38, 86, 2), (40, 83, 2), (42, 81, 2), (44, 78, 4),
    (48, 76, 2), (50, 78, 2), (52, 76, 2), (54, 74, 2), (56, 76, 4), (60, 73, 2), (62, 74, 2)]

DAG = {0, 3, 8, 11}
TIL = {2, 4, 6, 7, 10, 12, 14, 15}
BREAK = (21.5, 22.2)
FINAL = 47.35

def section(t):
    """Returns (drums, melody, pad) intensity at time t."""
    if BREAK[0] <= t < BREAK[1] or t >= FINAL:
        return 0, 0, 0
    if t < 5.4:
        return 1.0, 0.0, 0.0
    if t < 21.5:
        return 0.9, 0.55 if t < 10.1 else 0.0, 1.0
    if t < 35.6:
        return 1.0, 0.75, 1.0
    return 0.95, 0.7, 1.0

nsteps = int(END / step) + 1
for i in range(nsteps):
    t0 = i * step
    s16 = i % 16
    bar = (i // 16) % 4
    dr, me, pd = section(t0)
    if dr > 0:
        if s16 in DAG:
            add(music, dagga(), t0, 0.9 * dr)
        if s16 in TIL:
            add(music, tilli(1.0 if s16 in (4, 12) else 0.7), t0, 0.8 * dr, pan=0.25)
        if t0 > 22.2 and s16 in (1, 5, 9, 13):  # busier second half
            add(music, tilli(0.5), t0, 0.6 * dr, pan=-0.3)
        if s16 in (4, 12) and t0 > 5.4:
            add(music, clap(), t0, 0.7 * dr, pan=-0.1)
        add(music, shaker(1.0 if s16 % 2 else 0.55), t0, dr, pan=-0.35)
        if s16 in DAG and t0 > 5.4:
            add(music, bass(ROOTS[bar]), t0, 0.75 * dr)
    if pd > 0 and s16 == 0:
        add(music, pad(CHORDS[bar], 16 * step + 0.1), t0, 0.32 * pd, pan=0.0)
for i in range(nsteps):
    t0 = i * step
    _, me, _ = section(t0)
    if me <= 0:
        continue
    s64 = i % 64
    for (st, m, ln) in MEL:
        if st == s64:
            add(music, pluck(m, max(0.35, ln * step + 0.4)), t0, 0.5 * me, pan=0.2)

# break riser into Diwali dhamaka, and the big hits
add(music, riser(1.2, 0.9), 22.23 - 1.2)
add(music, impact(2.2, 1.1), 22.23)
add(music, impact(1.6, 0.8), 0.22)
add(music, impact(1.4, 0.7), 5.42)
add(music, impact(1.4, 0.75), w(7, -0.05))
add(music, impact(3.0, 1.0), FINAL)
add(music, pad(CHORDS[0], 2.2), FINAL, 0.5)
add(music, bell(1175, 2.5, 1.2), FINAL, 1.0)
add(music, pluck(86, 2.0), FINAL, 0.6)

# SFX
for t0 in (5.3, 9.9, 15.15, 23.75, w(7, 1.9), 35.45):
    add(sfx, whoosh(0.6, 0.9), t0 - 0.15, pan=0.0)
add(sfx, impact(1.0, 0.55), w(1, 4.13))
for t0 in (w(6, .74), w(6, 2.75), w(6, 6.06)):
    add(sfx, bell(1568, 1.6, 1.0), t0)
    add(sfx, bell(2349, 1.2, 0.6), t0 + 0.06, pan=0.3)
add(sfx, bell(1760, 1.8, 1.2), w(7, 0))
for t0 in (w(3, .35), w(3, .8), w(3, 1.35), w(3, 2.22)):
    add(sfx, bell(2093, 0.6, 0.45), t0)
for t0 in (w(4, -.1), w(4, 1.01), w(4, 2.88), w(4, 4.01)):
    add(sfx, bell(1319, 0.7, 0.5), t0)
for o in (1.06, 1.39, 1.72, 2.05, 2.38, 2.82, 3.2, 3.58, 3.96, 4.34):
    add(sfx, click(), w(8, o), 0.5)
for j in range(12):
    add(sfx, click(), w(8, 6.2) + j * 1.75 / 12, 0.6, pan=0.2)
FW = [0.25, 0.55, 4.8, 4.95, 22.2, 22.65, 23.2, 23.45, 23.6, 31.9, 32.2, 45.55, 46.25, 46.9, 47.6, 48.3]
for j, t0 in enumerate(FW):
    add(sfx, pop_crackle(j), t0, 0.35, pan=np.sin(j * 1.7) * 0.6)

# ---------------- voice
vo = np.zeros(N)
for n, t0 in V.items():
    with wave.open(f"{D}/vo3/{n:02d}p.wav") as f:
        a = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    i = int(t0 * SR)
    vo[i:i + len(a)] += a[:N - i]

# sidechain duck the music under the voice
env = np.abs(vo)
win = int(0.03 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
env = env / (env.max() + 1e-9)
target = np.clip(env * 6, 0, 1)
g = np.empty_like(target)
att, rel = np.exp(-1 / (0.02 * SR)), np.exp(-1 / (0.35 * SR))
cur = 0.0
for i in range(0, N, 32):  # coarse but plenty smooth
    v = target[i]
    cur = (att if v > cur else rel) * cur + (1 - (att if v > cur else rel)) * v
    g[i:i + 32] = cur
# per-sample IIR is slow in python; the 32-sample hop at 48 kHz is <1 ms
duck = 1 - 0.62 * g

music = np.tanh(music * 0.8) * 0.5
mix = music * duck * 1.1 + sfx * 0.5 + vo[None, :] * 1.0
# gentle fade in/out
fade = np.ones(N)
fi, fo = int(0.05 * SR), int(0.6 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade
mix /= max(1e-9, np.abs(mix).max()) / 0.95
with wave.open(f"{D}/mix.wav", 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print("ok", mix.shape)
act = np.abs(vo) > 0.02
act = np.convolve(act.astype(float), np.ones(4800) / 4800, mode='same') > 0.3
m_bed = (music * duck * 1.1).mean(0)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print("VO rms (speech) %.1f dB | music under speech %.1f dB | music in gaps %.1f dB | sfx %.1f dB" % (db(vo[act]), db(m_bed[act]), db(m_bed[~act]), db(sfx.mean(0))))
