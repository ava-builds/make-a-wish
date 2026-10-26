/**
 * The living universe.
 *
 * Every frame this simulates and paints the whole world: pastel sky, drifting clouds,
 * moon, the glowing doorway, the iridescent orb, light streams, the wish-star and its
 * trail, and your personal constellation. Each scene is only a set of targets ("a look");
 * the world eases toward it on its own, while your voice, touch and the phone's tilt
 * keep acting on it directly.
 */
import { BlendMode, BlurStyle, PaintStyle, PathOp, Skia, StrokeCap, TileMode, type SkCanvas, type SkColor, type SkPaint } from '@shopify/react-native-skia';

export type Inputs = {
  scene: number;
  sceneStamp: number;
  voice: number;
  speaking: number;
  pressing: number;
  touchX: number;
  touchY: number;
  touchOn: number;
  tiltX: number;
  tiltY: number;
  waveStamp: number;
  waveX: number;
  waveY: number;
  wishes: number[];
  filter: number;
};

type Look = {
  dusk: number;
  clouds: number;
  cloudY: number;
  sides: number;
  moon: number;
  mx: number;
  my: number;
  mr: number;
  thin: number;
  arch: number;
  orb: number;
  ox: number;
  oy: number;
  oR: number;
  streams: number;
  wave: number;
  star: number;
  sx: number;
  sy: number;
  sR: number;
  trail: number;
  ring: number;
  sky: number;
  glow: number;
  gy: number;
  plume: number;
  swirl: number;
  hud: number;
  cons: number;
};

type Puff = { x: number; dy: number; r: number; c: number; a: number; v: number; ph: number; side: number; y: number };
type Mote = { x: number; y: number; vx: number; vy: number; s: number; b: number; ph: number; c: number };
type Twinkle = { x: number; y: number; s: number; f: number; ph: number; b: number; sparkle: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; s: number; ph: number; gather: boolean; delay: number };
type Stream = { a: number; reach: number; curl: number; ph: number; w: number; speed: number };
type Wave = { t0: number; x: number; y: number };
/** A soft ring of sound leaving the bubble. */
type Ripple = { t0: number; k: number };
/** One silky filament of light. */
/** A star of the constellations behind the sky (0..1 screen space). */
type CStar = { x: number; y: number; s: number; b: number; ph: number };

type Strand = { side: number; ph: number; w: number; col: number; len: number; speed: number; arm: number; off: number; b: number; curl: number };

export type State = {
  w: number;
  h: number;
  t: number;
  scene: number;
  stamp: number;
  sceneT0: number;
  L: Look;
  lvl: number;
  prevLvl: number;
  breath: number;
  flare: number;
  emit: number;
  waveStamp: number;
  puffs: Puff[];
  motes: Mote[];
  twinkles: Twinkle[];
  sparks: Spark[];
  ripples: Ripple[];
  lastBeat: number;
  caustic: number;
  streams: Stream[];
  waves: Wave[];
  strands: Strand[];
  cstars: CStar[];
  cedges: number[];
  silkT: number;
  rot: number;
  dragV: number;
  prevAng: number;
  dragging: number;
};

// Pastel palette (0..1 rgb).
const PUFF_COLORS = [
  [0.97, 0.78, 0.86], // blush
  [0.98, 0.85, 0.8], // peach
  [0.86, 0.8, 0.96], // lavender
  [0.99, 0.9, 0.93], // pearl
  [0.93, 0.8, 0.93], // orchid
];

function look(scene: number): Look {
  'worklet';
  const base: Look = {
    dusk: 0.3, clouds: 1, cloudY: 0.66, sides: 0, moon: 0, mx: 0.5, my: 0.13, mr: 20, thin: 0,
    arch: 0, orb: 0, ox: 0.5, oy: 0.5, oR: 72, streams: 0, wave: 0,
    star: 0, sx: 0.5, sy: 0.36, sR: 1, trail: 0, ring: 0, sky: 0, glow: 0.6, gy: 0.45, plume: 0, swirl: 0, hud: 0, cons: 0,
  };
  switch (scene) {
    case 0: // opening
      return { ...base, dusk: 0.3, cloudY: 0.84, sides: 1, moon: 1, mx: 0.5, my: 0.1, mr: 20, arch: 1, glow: 0.8, gy: 0.5, cons: 0.35 };
    case 1: // home
      return { ...base, dusk: 0, cloudY: 0.7, sides: 0.55, moon: 1, mx: 0.4, my: 0.15, mr: 66, thin: 1, orb: 1, ox: 0.5, oy: 0.53, oR: 74, glow: 0.7, gy: 0.5, cons: 0.85 };
    case 2: // listening
      return { ...base, dusk: 0.85, clouds: 0.3, cloudY: 0.86, moon: 0.3, mx: 0.4, my: 0.15, mr: 66, thin: 1, orb: 1, ox: 0.5, oy: 0.53, oR: 64, wave: 1, hud: 1, glow: 0.5, gy: 0.53, cons: 1 };
    case 3: // star forms
      return { ...base, dusk: 0.5, cloudY: 0.74, sides: 0.4, star: 1, sx: 0.5, sy: 0.36, sR: 1, glow: 0.8, gy: 0.38, cons: 0.6 };
    case 4: // star rises
      return { ...base, dusk: 0.55, cloudY: 0.66, sides: 0.8, moon: 1, mx: 0.84, my: 0.11, mr: 12, star: 1, sx: 0.5, sy: 0.13, sR: 0.62, trail: 1, glow: 0.5, gy: 0.3, cons: 0.6 };
    case 5: // confirmation
      return { ...base, dusk: 0.2, cloudY: 0.64, sides: 0.5, moon: 1, mx: 0.78, my: 0.29, mr: 15, glow: 0.7, gy: 0.55, cons: 0.5 };
    case 6: // my universe
      return { ...base, dusk: 1, clouds: 0.5, cloudY: 0.88, sky: 1, glow: 0.3, gy: 0.5 };
    case 7: // play
      return { ...base, dusk: 1, clouds: 0, star: 1, sx: 0.5, sy: 0.36, sR: 0.72, ring: 1, hud: 0.55, glow: 0.4, gy: 0.36 };
    default:
      return base;
  }
}

export function initState(w: number, h: number): State {
  'worklet';
  const r = Math.random;
  const puffs: Puff[] = [];
  for (let i = 0; i < 30; i++) {
    puffs.push({ x: r() * w * 1.5, dy: Math.pow(r(), 1.4) * 95, r: 48 + r() * 82, c: Math.floor(r() * 5), a: 0.45 + r() * 0.35, v: 2 + r() * 5, ph: r() * 6.28, side: 0, y: 0 });
  }
  for (let i = 0; i < 28; i++) {
    const left = i % 2 === 0;
    puffs.push({
      x: left ? -40 + r() * w * 0.22 : w * 0.8 + r() * w * 0.25,
      dy: 0, y: 0.3 + r() * 0.45, r: 34 + r() * 56, c: Math.floor(r() * 5), a: 0.32 + r() * 0.3, v: 0, ph: r() * 6.28, side: left ? -1 : 1,
    });
  }
  const motes: Mote[] = [];
  for (let i = 0; i < 80; i++) {
    motes.push({ x: r() * w, y: r() * h, vx: 0, vy: 0, s: 0.4 + Math.pow(r(), 3) * 1.8, b: 0.25 + r() * 0.7, ph: r() * 6.28, c: r() });
  }
  const twinkles: Twinkle[] = [];
  for (let i = 0; i < 240; i++) {
    twinkles.push({ x: r() * w, y: r() * h, s: 0.35 + Math.pow(r(), 4) * 1.3, f: 0.3 + r() * 1.5, ph: r() * 6.28, b: 0.2 + Math.pow(r(), 2) * 0.8, sparkle: false });
  }
  for (let i = 0; i < 26; i++) {
    twinkles.push({ x: 10 + r() * (w - 20), y: 20 + r() * h * 0.9, s: 2.5 + r() * 5, f: 0.4 + r() * 0.8, ph: r() * 6.28, b: 0.5 + r() * 0.5, sparkle: true });
  }
  const streams: Stream[] = [];
  for (let i = 0; i < 18; i++) {
    // Denser from above, fanning down around the sides.
    const up = i < 12;
    const a = up ? -Math.PI + (i / 11) * Math.PI + (r() - 0.5) * 0.18 : Math.PI * (0.18 + r() * 0.64);
    streams.push({ a, reach: 0.75 + r() * 0.5, curl: (r() - 0.5) * 2, ph: r() * 6.28, w: 0.6 + r() * 1.8, speed: 0.12 + r() * 0.18 });
  }
  // Silk: filaments of light that rise from the bubble, or spiral around the star.
  const strands: Strand[] = [];
  for (let i = 0; i < 36; i++) {
    strands.push({
      side: (i / 35) * 2 - 1 + (r() - 0.5) * 0.12,
      ph: r() * 6.28,
      w: 0.5 + Math.pow(r(), 2) * 1.4,
      col: Math.floor(r() * 3),
      len: 0.45 + r() * 0.6,
      speed: 0.08 + r() * 0.14,
      arm: i % 2,
      off: (r() - 0.5) * 1.7,
      b: 0.2 + Math.pow(r(), 1.5) * 0.8,
      curl: 0.6 + r() * 1.6,
    });
  }
  // Constellations quietly behind everything, placed in the open sky around the edges.
  const cstars: CStar[] = [];
  const cedges: number[] = [];
  const homes = [
    [0.8, 0.09], [0.93, 0.34], [0.07, 0.36], [0.12, 0.66], [0.88, 0.64], [0.6, 0.04],
  ];
  for (let f = 0; f < homes.length; f++) {
    const count = 4 + Math.floor(r() * 3);
    const first = cstars.length;
    let x = homes[f][0];
    let y = homes[f][1];
    let dir = r() * Math.PI * 2;
    for (let k = 0; k < count; k++) {
      if (k > 0) {
        dir += (r() - 0.5) * 1.6;
        const step = 0.045 + r() * 0.05;
        x = Math.max(0.03, Math.min(0.97, x + Math.cos(dir) * step));
        y = Math.max(0.02, Math.min(0.9, y + Math.sin(dir) * step * 0.55));
        cedges.push(first + k - 1, first + k);
      }
      cstars.push({ x, y, s: 1.4 + r() * 1.8, b: 0.55 + r() * 0.45, ph: r() * 6.28 });
    }
    if (count >= 5 && r() < 0.5) cedges.push(first + 1, first + count - 1);
  }
  return {
    cstars, cedges, ripples: [], lastBeat: 0, caustic: 0,
    strands, silkT: 0, rot: 0, dragV: 0, prevAng: 0, dragging: 0,
    w, h, t: 0, scene: -1, stamp: -1, sceneT0: 0, L: look(0),
    lvl: 0, prevLvl: 0, breath: 0.5, flare: 0, emit: 0, waveStamp: 0,
    puffs, motes, twinkles, sparks: [], streams, waves: [],
  };
}

function ease(cur: number, target: number, rate: number, dt: number) {
  'worklet';
  return cur + (target - cur) * Math.min(1, rate * dt);
}

function spawnGather(s: State, fx: number, fy: number) {
  'worklet';
  const r = Math.random;
  for (let i = 0; i < 150; i++) {
    const ang = r() * Math.PI * 2;
    const rad = 60 + Math.pow(r(), 0.7) * Math.max(s.w, s.h) * 0.55;
    s.sparks.push({
      x: fx + Math.cos(ang) * rad,
      y: fy + Math.sin(ang) * rad,
      vx: -Math.sin(ang) * (30 + r() * 50),
      vy: Math.cos(ang) * (30 + r() * 50),
      age: 0, life: 99, s: 0.5 + Math.pow(r(), 2) * 1.8, ph: r() * 6.28, gather: true, delay: r() * 1.6,
    });
  }
}

export function step(s: State, inp: Inputs, dt: number) {
  'worklet';
  s.t += dt;
  const t = s.t;
  const w = s.w;
  const h = s.h;
  const L = s.L;

  if (inp.sceneStamp !== s.stamp) {
    const prev = s.scene;
    s.stamp = inp.sceneStamp;
    s.scene = inp.scene;
    s.sceneT0 = t;
    if (prev === 0 && inp.scene === 1) {
      // Walking through the door: the bubble is born from the door's light, sparkles drift past.
      L.ox = 0.5;
      L.oy = 0.53;
      L.oR = 10;
      L.orb = 0;
      L.glow = 1.5;
      const r = Math.random;
      for (let i = 0; i < 90; i++) {
        const ang = r() * Math.PI * 2;
        const sp = 40 + r() * 170;
        const d0 = 10 + r() * 50;
        s.sparks.push({
          x: w / 2 + Math.cos(ang) * d0,
          y: h * 0.53 + Math.sin(ang) * d0,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          age: 0, life: 1.4 + r() * 1.6, s: 0.5 + Math.pow(r(), 2) * 1.6, ph: r() * 6.28, gather: false, delay: r() * 0.5,
        });
      }
    }
    if (inp.scene === 3) {
      // Light gathers into a star, from where the voice was.
      spawnGather(s, L.ox * w, L.oy * h);
      L.sx = L.ox;
      L.sy = L.oy;
      L.sR = 0.05;
    }
    if (prev === -1) {
      // First frame: start already at the look, nothing slides in from nowhere.
      const first = look(inp.scene);
      const keys = Object.keys(first) as (keyof Look)[];
      for (let i = 0; i < keys.length; i++) (L as any)[keys[i]] = (first as any)[keys[i]];
      L.moon = 0;
      L.arch = 0;
      L.clouds = 0.3;
    }
  }
  const T = look(s.scene);
  const st = t - s.sceneT0;
  // Energy from voice; while the app speaks or a wish replays, the light carries that rhythm.
  let target = inp.voice;
  if (inp.speaking > 0.5) {
    const syll = Math.abs(Math.sin(t * 7.3)) * 0.6 + Math.abs(Math.sin(t * 2.9 + 0.6)) * 0.4;
    target = Math.max(target, 0.12 + 0.45 * syll * (0.55 + 0.45 * (Math.sin(t * 1.3) * 0.5 + 0.5)));
  }
  target = Math.max(target, inp.pressing * 0.15);
  s.lvl = ease(s.lvl, target, target > s.lvl ? 16 : 3, dt);
  const lv = s.lvl;
  const dl = lv - s.prevLvl;
  s.prevLvl = lv;
  s.breath = 0.5 + 0.2 * Math.sin(t * 0.83) + 0.15 * Math.sin(t * 1.37 + 1.3) + 0.12 * Math.sin(t * 0.29 + 0.7);
  s.flare = ease(s.flare, 0, 1.2, dt);

  // Ease every part of the world toward the scene's look.
  const r1 = 1.1;
  L.dusk = ease(L.dusk, T.dusk, 0.9, dt);
  L.clouds = ease(L.clouds, T.clouds, 0.8, dt);
  L.cloudY = ease(L.cloudY, T.cloudY, 0.7, dt);
  L.sides = ease(L.sides, T.sides, 0.8, dt);
  L.moon = ease(L.moon, T.moon, 0.8, dt);
  L.mx = ease(L.mx, T.mx, 0.75, dt);
  L.my = ease(L.my, T.my, 0.75, dt);
  L.mr = ease(L.mr, T.mr, 0.75, dt);
  L.thin = ease(L.thin, T.thin, 0.75, dt);
  L.arch = ease(L.arch, T.arch, 0.9, dt);
  L.orb = ease(L.orb, T.orb, 1.6, dt);
  L.ox = ease(L.ox, T.ox, 2, dt);
  L.oy = ease(L.oy, T.oy, 2, dt);
  L.oR = ease(L.oR, T.oR, 2, dt);
  L.streams = ease(L.streams, T.streams, 1.2, dt);
  L.wave = ease(L.wave, T.wave, 1.5, dt);
  L.ring = ease(L.ring, T.ring, 1.2, dt);
  L.sky = ease(L.sky, T.sky, 1.2, dt);
  L.glow = ease(L.glow, T.glow, 0.7, dt);
  L.gy = ease(L.gy, T.gy, 1, dt);
  L.trail = ease(L.trail, T.trail, 1.5, dt);
  L.plume = ease(L.plume, T.plume, 1.1, dt);
  // The listening rings unfold quickly and fold away a little faster.
  L.hud = ease(L.hud, T.hud, T.hud > L.hud ? 1.6 : 2.6, dt);
  L.cons = ease(L.cons, T.cons, 0.8, dt);
  L.swirl = ease(L.swirl, T.swirl, 0.9, dt);
  L.star = ease(L.star, T.star, s.scene === 3 ? 0.7 : 1.4, dt);
  // The star is born small and grows as the light reaches it; it rises slowly.
  const starRate = s.scene === 3 ? (st > 1.2 ? 0.9 : 0.15) : s.scene === 4 ? 0.55 : 1.4;
  L.sR = ease(L.sR, T.sR, starRate, dt);
  L.sy = ease(L.sy, T.sy, s.scene === 4 ? 0.5 : 1.6, dt);
  L.sx = ease(L.sx, T.sx, 1.6, dt);

  if (inp.waveStamp !== s.waveStamp) {
    s.waveStamp = inp.waveStamp;
    s.waves.push({ t0: t, x: inp.waveX, y: inp.waveY });
    if (inp.waveX < 0) s.flare = Math.max(s.flare, 0.6);
  }
  if (s.waves.length && t - s.waves[0].t0 > 3.4) s.waves.shift();

  // While listening, each rise in your voice sends out a ripple and a few sparkles: your words becoming stars.
  if (s.scene === 2 && dl > 0.035 && t - s.lastBeat > 0.16) {
    s.lastBeat = t;
    s.ripples.push({ t0: t, k: Math.min(1, 0.35 + lv) });
    const r = Math.random;
    const n = 2 + Math.floor(lv * 4);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2.2;
      const R = L.oR * 0.95;
      s.sparks.push({
        x: L.ox * w + Math.cos(ang) * R,
        y: L.oy * h + Math.sin(ang) * R,
        vx: Math.cos(ang) * (25 + r() * 40),
        vy: Math.sin(ang) * (25 + r() * 40) - 25,
        age: 0, life: 2.4 + r() * 2, s: 0.6 + r() * 1.6, ph: r() * 6.28, gather: false, delay: 0,
      });
    }
  }
  while (s.ripples.length && t - s.ripples[0].t0 > 2.2) s.ripples.shift();
  s.caustic += dt * (0.4 + lv * 2.2);

  // Where attention is: the orb when it's there, otherwise the star.
  const fx = L.orb > 0.5 ? L.ox * w : L.sx * w;
  const fy = L.orb > 0.5 ? L.oy * h : L.sy * h;

  // Silk flows faster as you speak or hold the light.
  s.silkT += dt * (0.35 + lv * 1.4 + inp.pressing * 0.4);
  // Turn the spiral with your finger; let go and it glides on.
  let onSpiral = false;
  if (inp.touchOn > 0.5 && L.swirl > 0.3) {
    const dx = inp.touchX - L.sx * w;
    const dy = inp.touchY - L.sy * h;
    if (dx * dx + dy * dy > 40 * 40) {
      onSpiral = true;
      const ang = Math.atan2(dy, dx);
      if (s.dragging > 0.5) {
        let da = ang - s.prevAng;
        if (da > Math.PI) da -= Math.PI * 2;
        if (da < -Math.PI) da += Math.PI * 2;
        s.rot += da;
        s.dragV = ease(s.dragV, da / Math.max(dt, 0.001), 10, dt);
      } else {
        s.dragV = 0;
      }
      s.prevAng = ang;
    }
  }
  s.dragging = onSpiral ? 1 : 0;
  if (!onSpiral) {
    s.rot += s.dragV * dt;
    s.dragV *= Math.exp(-1.1 * dt);
  }
  s.dragV = Math.max(-6, Math.min(6, s.dragV));

  // Motes drift upward on a slow curling current, swirl around a finger, and scatter on voice.
  const damp = Math.exp(-1.4 * dt);
  for (let i = 0; i < s.motes.length; i++) {
    const m = s.motes[i];
    let ax = Math.sin(m.y * 0.012 + t * 0.2 + m.ph) * 8;
    let ay = -6 + Math.cos(m.x * 0.013 - t * 0.18 + m.ph) * 6;
    if (inp.touchOn > 0.5) {
      const dx = inp.touchX - m.x;
      const dy = inp.touchY - m.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1;
      if (d < 220) {
        const f = 1 - d / 220;
        ax += (dx / d) * f * 120 + (-dy / d) * f * 140;
        ay += (dy / d) * f * 120 + (dx / d) * f * 140;
      }
    }
    const pull = Math.max(L.streams, L.hud);
    if (pull > 0.3) {
      // While listening, the sky leans in: motes spiral into the bubble.
      const dx = fx - m.x;
      const dy = fy - m.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1;
      ax += (dx / d) * 45 * pull * (0.5 + lv) + (-dy / d) * 35 * pull;
      ay += (dy / d) * 45 * pull * (0.5 + lv) + (dx / d) * 35 * pull;
      if (d < L.oR * 0.9) {
        m.x = Math.random() * w;
        m.y = Math.random() < 0.5 ? -10 : h + 10;
        m.vx = 0;
        m.vy = 0;
      }
    }
    if (dl > 0.015) {
      const dx = m.x - fx;
      const dy = m.y - fy;
      const d = Math.sqrt(dx * dx + dy * dy) + 1;
      const near = Math.max(0, 1 - d / 300);
      ax += (dx / d) * dl * 2400 * near;
      ay += (dy / d) * dl * 2400 * near;
    }
    m.vx = (m.vx + ax * dt) * damp;
    m.vy = (m.vy + ay * dt) * damp;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (m.x < -20) m.x += w + 40;
    if (m.x > w + 20) m.x -= w + 40;
    if (m.y < -20) m.y += h + 40;
    if (m.y > h + 20) m.y -= h + 40;
  }

  // The star's trail: as it rises it sheds light that slowly falls and fades.
  const sxNow = L.sx * w + Math.sin(L.sy * 9) * w * 0.07 * L.trail;
  const syNow = L.sy * h;
  if (L.trail > 0.05 && L.star > 0.1) {
    s.emit += dt * 110 * L.trail;
    while (s.emit > 1) {
      s.emit -= 1;
      const r = Math.random;
      s.sparks.push({
        x: sxNow + (r() - 0.5) * 10,
        y: syNow + 8 + r() * 6,
        vx: (r() - 0.5) * 10,
        vy: 6 + r() * 14,
        age: 0, life: 2.6 + r() * 3, s: 0.4 + Math.pow(r(), 2) * 1.8, ph: r() * 6.28, gather: false, delay: 0,
      });
    }
  }

  let keep = 0;
  for (let i = 0; i < s.sparks.length; i++) {
    const p = s.sparks[i];
    p.age += dt;
    if (p.gather) {
      if (p.age < p.delay) {
        s.sparks[keep++] = p;
        continue;
      }
      const dx = sxNow - p.x;
      const dy = syNow - p.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1;
      // Spiral in toward the star.
      p.vx = (p.vx + ((dx / d) * 260 + (-dy / d) * 60) * dt) * Math.exp(-1.2 * dt);
      p.vy = (p.vy + ((dy / d) * 260 + (dx / d) * 60) * dt) * Math.exp(-1.2 * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (d < 10 || p.age > 7) {
        s.flare = Math.min(0.9, s.flare + 0.012);
        continue;
      }
    } else {
      if (p.age > p.life) continue;
      p.vx += Math.sin(t * 1.3 + p.ph) * 6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    s.sparks[keep++] = p;
  }
  s.sparks.length = keep;
}

// ---------- drawing ----------

function rgba(r: number, g: number, b: number, a: number): SkColor {
  'worklet';
  return new Float32Array([r, g, b, Math.max(0, Math.min(1, a))]);
}

function mixc(a: number[], b: number[], k: number, alpha: number): SkColor {
  'worklet';
  return rgba(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, alpha);
}

/** A slender four-pointed star, optionally turned by `rot` radians. */
function sparkle(x: number, y: number, R: number, waist: number, rot = 0) {
  'worklet';
  const k = R * waist;
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const X = (dx: number, dy: number) => {
    'worklet';
    return x + dx * c - dy * sn;
  };
  const Y = (dx: number, dy: number) => {
    'worklet';
    return y + dx * sn + dy * c;
  };
  return Skia.PathBuilder.Make()
    .moveTo(X(0, -R), Y(0, -R))
    .quadTo(X(k, -k), Y(k, -k), X(R, 0), Y(R, 0))
    .quadTo(X(k, k), Y(k, k), X(0, R), Y(0, R))
    .quadTo(X(-k, k), Y(-k, k), X(-R, 0), Y(-R, 0))
    .quadTo(X(-k, -k), Y(-k, -k), X(0, -R), Y(0, -R))
    .close()
    .build();
}

function glowPaint(sigma: number): SkPaint {
  'worklet';
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setBlendMode(BlendMode.Plus);
  p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, sigma, true));
  return p;
}

function addPaint(): SkPaint {
  'worklet';
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setBlendMode(BlendMode.Plus);
  return p;
}

function drawStar(canvas: SkCanvas, x: number, y: number, R: number, energy: number, t: number) {
  'worklet';
  const e = Math.max(0, Math.min(1.25, energy));
  const c = Skia.Point(x, y);
  const p = addPaint();
  // Wide warm halo.
  p.setShader(Skia.Shader.MakeRadialGradient(c, R * 7, [rgba(1, 0.9, 0.86, 0.26 * e), rgba(0.98, 0.78, 0.88, 0.09 * e), rgba(0.9, 0.8, 1, 0)], [0, 0.35, 1], TileMode.Clamp));
  canvas.drawCircle(x, y, R * 7, p);
  p.setShader(Skia.Shader.MakeRadialGradient(c, R * 1.6, [rgba(1, 1, 1, 0.55 * Math.min(1, e)), rgba(1, 0.92, 0.86, 0.18 * e), rgba(1, 0.9, 0.9, 0)], [0, 0.3, 1], TileMode.Clamp));
  canvas.drawCircle(x, y, R * 1.6, p);
  p.setShader(null);

  // Long rays — the vertical one longest.
  const ray = addPaint();
  ray.setStyle(PaintStyle.Stroke);
  const shimmer = 0.85 + 0.15 * Math.sin(t * 2.7);
  const rays = [
    [0, 1, 7.5, 1.2],
    [1, 0, 4.2, 1.0],
    [0.7071, 0.7071, 1.7, 0.7],
    [0.7071, -0.7071, 1.7, 0.7],
  ];
  for (let i = 0; i < rays.length; i++) {
    const [dx, dy, m, wd] = rays[i];
    const l = R * m * (0.85 + 0.15 * shimmer);
    const p0 = Skia.Point(x - dx * l, y - dy * l);
    const p1 = Skia.Point(x + dx * l, y + dy * l);
    ray.setStrokeWidth(wd);
    ray.setShader(Skia.Shader.MakeLinearGradient(p0, p1, [rgba(1, 0.95, 0.9, 0), rgba(1, 0.98, 0.95, 0.85 * Math.min(1.2, e)), rgba(1, 0.95, 0.9, 0)], [0, 0.5, 1], TileMode.Clamp));
    canvas.drawLine(p0.x, p0.y, p1.x, p1.y, ray);
  }

  // The star body: a soft blurred copy under a crisp one.
  const body = sparkle(x, y, R, 0.13);
  const g = glowPaint(R * 0.35);
  g.setColor(rgba(1, 0.86, 0.78, 0.8 * Math.min(1, e)));
  canvas.drawPath(body, g);
  const fill = addPaint();
  fill.setShader(Skia.Shader.MakeRadialGradient(c, R, [rgba(1, 1, 1, Math.min(1, e)), rgba(1, 0.93, 0.85, 0.9 * Math.min(1, e)), rgba(1, 0.85, 0.8, 0.5 * Math.min(1, e))], [0, 0.35, 1], TileMode.Clamp));
  canvas.drawPath(body, fill);
  const small = sparkle(x, y, R * 0.42, 0.18, Math.PI / 4);
  fill.setShader(null);
  fill.setColor(rgba(1, 1, 1, 0.6 * Math.min(1, e)));
  canvas.drawPath(small, fill);
  fill.setColor(rgba(1, 1, 1, Math.min(1, e)));
  canvas.drawCircle(x, y, R * 0.12, fill);
}

export function draw(canvas: SkCanvas, s: State, inp: Inputs) {
  'worklet';
  const w = s.w;
  const h = s.h;
  const t = s.t;
  const L = s.L;
  const lv = s.lvl;
  const D = L.dusk;
  const tx = inp.tiltX;
  const ty = inp.tiltY;

  // ---- sky ----
  const dreamy = [[0.36, 0.35, 0.61], [0.56, 0.52, 0.77], [0.79, 0.66, 0.85], [0.95, 0.79, 0.86]];
  const deep = [[0.15, 0.15, 0.36], [0.25, 0.24, 0.5], [0.38, 0.34, 0.62], [0.52, 0.45, 0.71]];
  const sky = Skia.Paint();
  sky.setShader(
    Skia.Shader.MakeLinearGradient(Skia.Point(0, 0), Skia.Point(0, h), [
      mixc(dreamy[0], deep[0], D, 1), mixc(dreamy[1], deep[1], D, 1), mixc(dreamy[2], deep[2], D, 1), mixc(dreamy[3], deep[3], D, 1),
    ], [0, 0.38, 0.72, 1], TileMode.Clamp),
  );
  canvas.drawRect(Skia.XYWHRect(0, 0, w, h), sky);

  // Soft light in the heart of the scene.
  const gp = addPaint();
  const gc = Skia.Point(w / 2, L.gy * h);
  const gR = Math.max(w, h) * 0.6;
  gp.setShader(Skia.Shader.MakeRadialGradient(gc, gR, [rgba(1, 0.86, 0.9, 0.22 * L.glow), rgba(0.9, 0.75, 0.95, 0.08 * L.glow), rgba(0.8, 0.7, 1, 0)], [0, 0.45, 1], TileMode.Clamp));
  canvas.drawCircle(gc.x, gc.y, gR, gp);

  // ---- stars ----
  const p = addPaint();
  for (let i = 0; i < s.twinkles.length; i++) {
    const k = s.twinkles[i];
    const tw = 0.5 + 0.5 * Math.sin(t * k.f + k.ph);
    const x = k.x + tx * 6;
    const y = k.y + ty * 6;
    if (k.sparkle) {
      // Warm glints: a bright point with fine cross rays.
      const a = k.b * (0.45 + 0.55 * tw) * (0.5 + 0.5 * D);
      const gl = glowPaint(k.s * 0.8);
      gl.setColor(rgba(1, 0.86, 0.68, a * 0.75));
      canvas.drawCircle(x, y, k.s * 0.55, gl);
      const rl = k.s * (2.2 + tw);
      const rp = addPaint();
      rp.setStyle(PaintStyle.Stroke);
      rp.setStrokeWidth(0.7);
      rp.setShader(Skia.Shader.MakeLinearGradient(Skia.Point(x - rl, y), Skia.Point(x + rl, y), [rgba(1, 0.9, 0.75, 0), rgba(1, 0.95, 0.88, a), rgba(1, 0.9, 0.75, 0)], [0, 0.5, 1], TileMode.Clamp));
      canvas.drawLine(x - rl, y, x + rl, y, rp);
      rp.setShader(Skia.Shader.MakeLinearGradient(Skia.Point(x, y - rl), Skia.Point(x, y + rl), [rgba(1, 0.9, 0.75, 0), rgba(1, 0.95, 0.88, a), rgba(1, 0.9, 0.75, 0)], [0, 0.5, 1], TileMode.Clamp));
      canvas.drawLine(x, y - rl, x, y + rl, rp);
      p.setColor(rgba(1, 0.98, 0.94, Math.min(1, a * 1.2)));
      canvas.drawCircle(x, y, k.s * 0.28, p);
    } else {
      const warm = k.ph > 2.5;
      const a = k.b * (0.35 + 0.65 * tw) * (0.45 + 0.55 * D);
      p.setColor(warm ? rgba(1, 0.88, 0.7, a) : rgba(1, 0.97, 1, a));
      canvas.drawCircle(x, y, k.s, p);
    }
  }

  // ---- constellations behind ----
  if (L.cons > 0.01) {
    const C = L.cons * (0.5 + 0.5 * D) * (1 - L.sky);
    const px = tx * 4;
    const py = ty * 4;
    const lp = addPaint();
    lp.setStyle(PaintStyle.Stroke);
    lp.setStrokeWidth(0.6);
    for (let e = 0; e < s.cedges.length; e += 2) {
      const a = s.cstars[s.cedges[e]];
      const b = s.cstars[s.cedges[e + 1]];
      lp.setColor(rgba(1, 0.95, 0.97, (0.3 + 0.3 * lv) * C * (0.85 + 0.15 * Math.sin(t * 0.6 + e))));
      canvas.drawLine(a.x * w + px, a.y * h + py, b.x * w + px, b.y * h + py, lp);
    }
    const cp = addPaint();
    for (let i = 0; i < s.cstars.length; i++) {
      const st = s.cstars[i];
      const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + st.b) + st.ph);
      const x = st.x * w + px;
      const y = st.y * h + py;
      const a = st.b * tw * C * (0.8 + 0.5 * lv);
      cp.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(x, y), st.s * 3.2, [rgba(1, 0.92, 0.86, 0.45 * a), rgba(1, 0.9, 0.9, 0)], [0, 1], TileMode.Clamp));
      canvas.drawCircle(x, y, st.s * 3.2, cp);
      cp.setShader(null);
      cp.setColor(rgba(1, 0.98, 0.95, Math.min(1, a * 1.1)));
      canvas.drawPath(sparkle(x, y, st.s * (0.9 + 0.3 * tw), 0.14), cp);
    }
  }

  // ---- moon ----
  if (L.moon > 0.01) {
    const mx = L.mx * w + tx * 10;
    const my = L.my * h + ty * 10;
    const mr = L.mr;
    const mg = addPaint();
    const halo = mr * (2.6 - L.thin * 1.3);
    mg.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(mx, my), halo, [rgba(1, 0.92, 0.82, 0.45 * L.moon * (1 - L.thin * 0.6)), rgba(1, 0.86, 0.86, 0)], [0.25, 1], TileMode.Clamp));
    canvas.drawCircle(mx, my, halo, mg);
    const off = mr * (0.42 - L.thin * 0.3);
    const a = Skia.Path.Circle(mx, my, mr);
    const b = Skia.Path.Circle(mx + off, my - off * 0.75, mr * (0.95 + L.thin * 0.04));
    const cres = Skia.Path.MakeFromOp(a, b, PathOp.Difference);
    if (cres) {
      const glow = glowPaint(3 + L.thin * 3);
      glow.setColor(rgba(1, 0.9, 0.78, 0.7 * L.moon));
      canvas.drawPath(cres, glow);
      const mf = addPaint();
      mf.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(mx - mr * 0.4, my + mr * 0.2), mr * 1.3, [rgba(1, 0.97, 0.9, L.moon), rgba(1, 0.86, 0.72, 0.9 * L.moon)], [0, 1], TileMode.Clamp));
      canvas.drawPath(cres, mf);
    }
  }

  // ---- the doorway ----
  if (L.arch > 0.01) {
    const A = L.arch;
    // As the door fades it grows toward you, as if you're walking through it.
    const thru = 1 + (1 - A) * 2.6;
    canvas.save();
    canvas.translate(w / 2, h * 0.53);
    canvas.scale(thru, thru);
    canvas.translate(-w / 2, -h * 0.53);
    const cx = w / 2 + tx * 4;
    const base = h * 0.66;
    const aw = w * 0.3;
    const top = h * 0.4;
    const rr = aw / 2;
    const path = Skia.PathBuilder.Make()
      .moveTo(cx - rr, base)
      .lineTo(cx - rr, top + rr)
      .arcToTangent(cx - rr, top, cx, top, rr)
      .arcToTangent(cx + rr, top, cx + rr, top + rr, rr)
      .lineTo(cx + rr, base)
      .close()
      .build();
    // Light pouring out of the door: a warm glow behind, a luminous but see-through interior.
    const out = glowPaint(30);
    out.setColor(rgba(1, 0.8, 0.66, 0.28 * A * (0.9 + 0.1 * s.breath)));
    canvas.drawPath(path, out);
    const inner = Skia.Paint();
    inner.setAntiAlias(true);
    inner.setShader(Skia.Shader.MakeLinearGradient(Skia.Point(cx, top), Skia.Point(cx, base), [rgba(1, 0.95, 0.84, 0.62 * A), rgba(1, 0.84, 0.74, 0.4 * A), rgba(0.97, 0.74, 0.8, 0.22 * A)], [0, 0.55, 1], TileMode.Clamp));
    canvas.drawPath(path, inner);
    // A soft core of light deep inside the doorway.
    const core = addPaint();
    core.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(cx, top + rr * 1.3), rr * 1.5, [rgba(1, 0.97, 0.9, 0.55 * A), rgba(1, 0.9, 0.8, 0)], [0, 1], TileMode.Clamp));
    canvas.save();
    canvas.clipPath(path, 1, true);
    canvas.drawCircle(cx, top + rr * 1.3, rr * 1.5, core);
    // Faint rays falling from the top of the arch.
    const beam = addPaint();
    beam.setStyle(PaintStyle.Stroke);
    beam.setStrokeWidth(5);
    for (let i = -2; i <= 2; i++) {
      const bx = cx + i * rr * 0.32 + Math.sin(t * 0.4 + i) * 3;
      beam.setShader(Skia.Shader.MakeLinearGradient(Skia.Point(bx, top), Skia.Point(bx, base), [rgba(1, 0.97, 0.9, 0.2 * A), rgba(1, 0.9, 0.85, 0)], [0, 1], TileMode.Clamp));
      canvas.drawLine(bx, top, bx + i * 6, base, beam);
    }
    canvas.restore();
    const frameGlow = glowPaint(4);
    frameGlow.setStyle(PaintStyle.Stroke);
    frameGlow.setStrokeWidth(5);
    frameGlow.setColor(rgba(1, 0.84, 0.62, 0.55 * A));
    canvas.drawPath(path, frameGlow);
    const frame = addPaint();
    frame.setStyle(PaintStyle.Stroke);
    frame.setStrokeWidth(2);
    frame.setColor(rgba(1, 0.9, 0.72, 0.95 * A));
    canvas.drawPath(path, frame);
    // Steps leading down to the water.
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      const sw = aw * (0.62 + k * 0.6);
      const sy = base + 4 + i * 10;
      const sp = addPaint();
      sp.setColor(rgba(1, 0.9, 0.86, (0.5 - k * 0.3) * A));
      canvas.drawRect(Skia.XYWHRect(cx - sw / 2, sy, sw, 3), sp);
    }
    // Water with the door's reflection.
    const wy = base + 64;
    const water = addPaint();
    water.setShader(Skia.Shader.MakeLinearGradient(Skia.Point(0, wy), Skia.Point(0, h), [rgba(0.75, 0.72, 0.95, 0.18 * A), rgba(0.85, 0.75, 0.92, 0.05 * A)], [0, 1], TileMode.Clamp));
    canvas.drawRect(Skia.XYWHRect(0, wy, w, h - wy), water);
    const refl = glowPaint(10);
    refl.setColor(rgba(1, 0.9, 0.82, 0.32 * A));
    canvas.drawOval(Skia.XYWHRect(cx - aw * 0.32, wy, aw * 0.64, h * 0.16), refl);
    const rip = addPaint();
    for (let i = 0; i < 9; i++) {
      const ry = wy + 6 + i * 11;
      const rw = aw * (0.9 - i * 0.05) * (0.8 + 0.2 * Math.sin(t * 1.1 + i));
      rip.setColor(rgba(1, 0.95, 0.9, (0.38 - i * 0.03) * A));
      canvas.drawRect(Skia.XYWHRect(cx - rw / 2 + Math.sin(t * 0.8 + i * 1.7) * 6, ry, rw, 1.2), rip);
    }
    canvas.restore();
  }

  // ---- clouds ----
  if (L.clouds > 0.01) {
    const cy0 = L.cloudY * h;
    const spanW = w * 1.5;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < s.puffs.length; i++) {
        const q = s.puffs[i];
        let x: number;
        let y: number;
        let a = q.a * L.clouds;
        if (q.side !== 0) {
          a *= L.sides;
          if (a < 0.01) continue;
          x = q.x + Math.sin(t * 0.15 + q.ph) * 8 + tx * 14 + q.side * (1 - L.sides) * 80;
          y = q.y * h + Math.sin(t * 0.2 + q.ph) * 5 + ty * 10;
        } else {
          x = ((q.x + t * q.v) % spanW) - w * 0.25 + tx * 14;
          y = cy0 + q.dy + Math.sin(t * 0.25 + q.ph) * 5 + ty * 10;
        }
        const col = PUFF_COLORS[q.c];
        // Deeper, cooler clouds at night.
        const cr = col[0] * (1 - D * 0.35);
        const cg = col[1] * (1 - D * 0.38);
        const cb = col[2] * (1 - D * 0.2);
        if (pass === 0) {
          const cp = Skia.Paint();
          cp.setAntiAlias(true);
          cp.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, q.r * (q.side !== 0 ? 0.45 : 0.32), true));
          cp.setColor(rgba(cr, cg, cb, a));
          canvas.drawCircle(x, y, q.r, cp);
        } else {
          // Sunlit tops give the clouds volume.
          const hp = Skia.Paint();
          hp.setAntiAlias(true);
          hp.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, q.r * 0.3, true));
          hp.setColor(rgba(1, 0.95, 0.96, a * 0.22 * (1 - D * 0.6)));
          canvas.drawCircle(x - q.r * 0.18, y - q.r * 0.38, q.r * 0.55, hp);
        }
      }
    }
    const bed = Skia.Paint();
    const bedTop = cy0 + 50;
    bed.setShader(
      Skia.Shader.MakeLinearGradient(Skia.Point(0, bedTop), Skia.Point(0, h), [
        rgba(0.97 * (1 - D * 0.35), 0.82 * (1 - D * 0.38), 0.88 * (1 - D * 0.2), 0),
        rgba(0.96 * (1 - D * 0.35), 0.8 * (1 - D * 0.38), 0.88 * (1 - D * 0.2), 0.7 * L.clouds),
      ], [0, 0.6], TileMode.Clamp),
    );
    canvas.drawRect(Skia.XYWHRect(0, bedTop, w, h - bedTop), bed);
  }

  // ---- silk light ----
  const silkA = Math.max(L.plume, L.swirl);
  if (silkA > 0.01) {
    const k = L.swirl / (L.plume + L.swirl + 1e-4);
    const ox = L.ox * w + tx * 5;
    const oy = L.oy * h + ty * 5;
    const oR = L.oR;
    const scx = L.sx * w + tx * 6;
    const scy = L.sy * h + ty * 6;
    const T = s.silkT;
    // Long spiral arms need more points to stay smooth.
    const N = k > 0.4 ? 44 : 24;
    const maxR = Math.max(w, h) * 0.58;
    // A warm nebula haze where the silk gathers.
    const neb = addPaint();
    const nx0 = ox * (1 - k) + scx * k;
    const ny0 = (oy - h * 0.28) * (1 - k) + scy * k;
    const nR = Math.max(w, h) * 0.5;
    neb.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(nx0, ny0), nR, [rgba(1, 0.8, 0.86, 0.16 * silkA * (1 + lv)), rgba(0.85, 0.75, 1, 0.06 * silkA), rgba(0.8, 0.7, 1, 0)], [0, 0.5, 1], TileMode.Clamp));
    canvas.drawCircle(nx0, ny0, nR, neb);

    // Glow comes from layered soft strokes (no blur), so it stays light on the GPU.
    const glowP = addPaint();
    glowP.setStyle(PaintStyle.Stroke);
    glowP.setStrokeCap(StrokeCap.Round);
    const coreP = addPaint();
    coreP.setStyle(PaintStyle.Stroke);
    const beadG = addPaint();
    const beadP = addPaint();
    const COLS = [[1, 0.8, 0.55], [1, 0.72, 0.62], [1, 0.7, 0.84]];
    const px: number[] = [];
    const py: number[] = [];
    for (let i = 0; i < s.strands.length; i++) {
      const st = s.strands[i];
      // Rise from the bubble's upper rim and fan out across the sky.
      const th = -Math.PI / 2 + st.side * 1.35;
      const x0 = ox + Math.cos(th) * oR * 0.92;
      const y0 = oy + Math.sin(th) * oR * 0.92;
      const xT = ox + st.side * w * 0.95 + Math.sin(st.ph) * w * 0.12;
      const yT = oy - (oy - h * 0.02) * st.len;
      const sway = 1 + lv * 1.3;
      px.length = 0;
      py.length = 0;
      for (let j = 0; j <= N; j++) {
        const u = j / N;
        // plume point
        const e = 1 - Math.pow(1 - u, 1.6);
        let ax = x0 + (xT - x0) * e + Math.sin(u * Math.PI * 1.4 * st.curl + st.ph + T * 0.8) * (10 + 70 * u) * sway * st.curl * 0.6;
        let ay = y0 + (yT - y0) * u + Math.cos(u * Math.PI * 1.1 * st.curl + st.ph + T * 0.6) * 26 * u * st.curl;
        if (inp.touchOn > 0.5 && L.plume > 0.05) {
          // The silk leans toward your finger.
          const dx = inp.touchX - ax;
          const dy = inp.touchY - ay;
          const wgt = Math.exp(-(dx * dx + dy * dy) / (2 * 130 * 130)) * 0.45 * u;
          ax += dx * wgt;
          ay += dy * wgt;
        }
        // spiral point
        const ang = st.arm * Math.PI + st.off + T * 0.18 + s.rot + u * Math.PI * (1.2 + st.curl * 0.35);
        const rr = (10 + u * maxR * st.len) * (1 + 0.12 * lv);
        const wob = Math.sin(u * 5 + st.ph + T * 0.8) * 14 * u * st.curl;
        const bx = scx + Math.cos(ang) * (rr + wob);
        const by = scy + Math.sin(ang) * (rr + wob) * 0.86;
        px.push(ax + (bx - ax) * k);
        py.push(ay + (by - ay) * k);
      }
      const pb = Skia.PathBuilder.Make().moveTo(px[0], py[0]);
      for (let j = 1; j <= N; j++) pb.lineTo(px[j], py[j]);
      const path = pb.build();
      const c = COLS[st.col];
      const al = (0.12 + 0.6 * st.b + 0.4 * lv) * silkA * (0.8 + 0.2 * Math.sin(T * 1.7 + st.ph));
      const sh = Skia.Shader.MakeLinearGradient(Skia.Point(px[0], py[0]), Skia.Point(px[N], py[N]), [rgba(1, 0.9, 0.74, Math.min(1, al * 1.1)), rgba(c[0], c[1], c[2], al * 0.7), rgba(c[0] * 0.95, c[1] * 0.9, c[2], 0)], [0, 0.5, 1], TileMode.Clamp);
      glowP.setShader(sh);
      glowP.setAlphaf(0.12);
      glowP.setStrokeWidth(st.w * 7);
      canvas.drawPath(path, glowP);
      glowP.setAlphaf(0.28);
      glowP.setStrokeWidth(st.w * 2.6);
      canvas.drawPath(path, glowP);
      coreP.setStrokeWidth(st.w * 0.7);
      coreP.setShader(sh);
      canvas.drawPath(path, coreP);
      // Beads of light travel the silk toward the centre.
      for (let b = 0; b < 2; b++) {
        const u = 1 - ((T * st.speed * 1.6 + b * 0.5 + st.ph) % 1);
        const fj = u * N;
        const j0 = Math.floor(fj);
        const j1 = Math.min(N, j0 + 1);
        const f = fj - j0;
        const bx = px[j0] + (px[j1] - px[j0]) * f;
        const by = py[j0] + (py[j1] - py[j0]) * f;
        const ba = Math.sin(u * Math.PI) * (0.55 + 0.45 * st.b) * silkA * (0.8 + 0.6 * lv);
        beadG.setColor(rgba(1, 0.86, 0.66, ba * 0.22));
        canvas.drawCircle(bx, by, 4.5 + st.w * 2, beadG);
        beadG.setColor(rgba(1, 0.9, 0.75, ba * 0.4));
        canvas.drawCircle(bx, by, 2.2 + st.w, beadG);
        beadP.setColor(rgba(1, 0.97, 0.9, ba));
        if (i % 6 === 0 && b === 0) canvas.drawPath(sparkle(bx, by, 4 + st.w * 2, 0.12), beadP);
        else canvas.drawCircle(bx, by, 0.9 + st.w * 0.5, beadP);
      }
    }
  }

  // ---- light streams ----
  if (L.streams > 0.01) {
    const ox = L.ox * w;
    const oy = L.oy * h;
    const far = Math.max(w, h) * 0.85;
    const glow = glowPaint(4);
    glow.setStyle(PaintStyle.Stroke);
    const line = addPaint();
    line.setStyle(PaintStyle.Stroke);
    const dot = addPaint();
    for (let i = 0; i < s.streams.length; i++) {
      const sm = s.streams[i];
      const a = sm.a + Math.sin(t * 0.3 + sm.ph) * 0.08;
      const R = far * sm.reach;
      const sx = ox + Math.cos(a) * R;
      const sy = oy + Math.sin(a) * R;
      const ex = ox + Math.cos(a) * L.oR * 0.92;
      const ey = oy + Math.sin(a) * L.oR * 0.92;
      // Curl sideways so each stream swirls in, swaying with voice.
      const nx = -Math.sin(a);
      const ny = Math.cos(a);
      const sway = (sm.curl * 120 + Math.sin(t * 0.7 + sm.ph) * 40) * (1 + lv * 0.8);
      const c1x = sx + (ex - sx) * 0.35 + nx * sway;
      const c1y = sy + (ey - sy) * 0.35 + ny * sway;
      const c2x = sx + (ex - sx) * 0.75 - nx * sway * 0.35;
      const c2y = sy + (ey - sy) * 0.75 - ny * sway * 0.35;
      const path = Skia.PathBuilder.Make().moveTo(sx, sy).cubicTo(c1x, c1y, c2x, c2y, ex, ey).build();
      const bright = L.streams * (0.45 + 0.55 * lv + 0.15 * Math.sin(t * 1.7 + sm.ph));
      const sh = Skia.Shader.MakeLinearGradient(Skia.Point(sx, sy), Skia.Point(ex, ey), [rgba(0.95, 0.8, 1, 0), rgba(1, 0.82, 0.9, 0.55 * bright), rgba(1, 0.93, 0.85, 0.95 * bright)], [0, 0.55, 1], TileMode.Clamp);
      glow.setStrokeWidth(sm.w * 3);
      glow.setShader(sh);
      canvas.drawPath(path, glow);
      line.setStrokeWidth(sm.w * 0.6);
      line.setShader(sh);
      canvas.drawPath(path, line);
      // Sparks of light travel the stream into the orb.
      for (let j = 0; j < 3; j++) {
        const u = (t * sm.speed * (1 + lv * 2) + j / 3 + sm.ph) % 1;
        const iu = 1 - u;
        const bx = iu * iu * iu * sx + 3 * iu * iu * u * c1x + 3 * iu * u * u * c2x + u * u * u * ex;
        const by = iu * iu * iu * sy + 3 * iu * iu * u * c1y + 3 * iu * u * u * c2y + u * u * u * ey;
        dot.setColor(rgba(1, 0.95, 0.9, bright * u));
        canvas.drawCircle(bx, by, 0.8 + u * 1.4, dot);
      }
    }
  }

  // ---- the orb ----
  if (L.orb > 0.01) {
    const O = L.orb;
    const ox = L.ox * w + tx * 5;
    const oy = L.oy * h + ty * 5;
    const R = L.oR * (1 + 0.025 * Math.sin(t * 1.4) + 0.14 * lv + inp.pressing * 0.04);
    const c = Skia.Point(ox, oy);
    const halo = addPaint();
    // Soft halo; drawn to its full radius so it fades out with no edge.
    halo.setShader(Skia.Shader.MakeRadialGradient(c, R * 2.2, [rgba(1, 0.82, 0.78, (0.24 + 0.22 * lv) * O), rgba(1, 0.76, 0.86, 0.08 * O), rgba(0.9, 0.8, 1, 0)], [0.42, 0.66, 1], TileMode.Clamp));
    canvas.drawCircle(ox, oy, R * 2.2, halo);
    const body = Skia.Paint();
    body.setAntiAlias(true);
    body.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(ox - R * 0.15, oy - R * 0.2), R * 1.1, [rgba(0.9, 0.62, 0.84, 0.62 * O), rgba(0.82, 0.6, 0.9, 0.55 * O), rgba(0.72, 0.62, 0.95, 0.6 * O), rgba(1, 0.84, 0.8, 0.85 * O)], [0, 0.45, 0.82, 1], TileMode.Clamp));
    canvas.drawCircle(ox, oy, R, body);
    // Iridescent rim, slowly turning.
    const rim = Skia.Paint();
    rim.setAntiAlias(true);
    rim.setStyle(PaintStyle.Stroke);
    rim.setStrokeWidth(2.2);
    const m = Skia.Matrix();
    m.translate(ox, oy);
    m.rotate(t * 0.35);
    m.translate(-ox, -oy);
    rim.setShader(Skia.Shader.MakeSweepGradient(ox, oy, [rgba(1, 0.8, 0.9, 0.9 * O), rgba(0.82, 0.78, 1, 0.9 * O), rgba(0.75, 0.9, 1, 0.8 * O), rgba(1, 0.9, 0.78, 0.9 * O), rgba(1, 0.8, 0.9, 0.9 * O)], null, TileMode.Clamp, m));
    canvas.drawCircle(ox, oy, R - 1, rim);
    const rimGlow = glowPaint(6);
    rimGlow.setStyle(PaintStyle.Stroke);
    rimGlow.setStrokeWidth(5);
    rimGlow.setColor(rgba(1, 0.9, 0.95, (0.3 + 0.3 * lv) * O));
    canvas.drawCircle(ox, oy, R, rimGlow);
    // Iridescent light swirling inside the bubble, livelier as you speak.
    const cA = Math.min(0.42, 0.1 + 0.14 * L.hud + 0.28 * lv) * O;
    if (cA > 0.02) {
      const inside = Skia.Path.Circle(ox, oy, R * 0.96);
      canvas.save();
      canvas.clipPath(inside, 1, true);
      const cm = Skia.Matrix();
      cm.translate(ox, oy);
      cm.rotate(s.caustic);
      cm.translate(-ox, -oy);
      const cp = addPaint();
      cp.setShader(Skia.Shader.MakeSweepGradient(ox, oy, [rgba(1, 0.8, 0.9, cA), rgba(0.8, 0.85, 1, 0), rgba(1, 0.9, 0.75, cA), rgba(0.85, 0.78, 1, 0), rgba(1, 0.8, 0.9, cA)], null, TileMode.Clamp, cm));
      canvas.drawCircle(ox, oy, R, cp);
      const cm2 = Skia.Matrix();
      cm2.translate(ox, oy);
      cm2.rotate(-s.caustic * 0.7);
      cm2.translate(-ox, -oy);
      cp.setShader(Skia.Shader.MakeSweepGradient(ox, oy, [rgba(0.85, 0.9, 1, 0), rgba(1, 0.95, 0.9, cA * 0.8), rgba(0.85, 0.9, 1, 0)], null, TileMode.Clamp, cm2));
      canvas.drawCircle(ox, oy, R * 0.7, cp);
      canvas.restore();
    }
    // Glassy highlights.
    const hl = glowPaint(4);
    hl.setColor(rgba(1, 1, 1, 0.55 * O));
    canvas.drawOval(Skia.XYWHRect(ox - R * 0.62, oy - R * 0.7, R * 0.55, R * 0.28), hl);
    hl.setColor(rgba(1, 1, 1, 0.22 * O));
    canvas.drawOval(Skia.XYWHRect(ox + R * 0.25, oy + R * 0.45, R * 0.35, R * 0.16), hl);
  }


  // ---- listening rings (Jarvis-style) ----
  if (L.hud > 0.01) {
    const cx = L.ox * w + tx * 5;
    const cy = L.oy * h + ty * 5;
    const R0 = L.orb > 0.3 ? L.oR : 26 * L.sR * 2.6;
    const H = L.hud;
    const prog = (i: number) => {
      'worklet';
      const v = Math.max(0, Math.min(1, (H - i * 0.13) / 0.6));
      return v * v * (3 - 2 * v);
    };
    const line = addPaint();
    line.setStyle(PaintStyle.Stroke);
    line.setStrokeCap(StrokeCap.Round);
    const glowL = glowPaint(2.5);
    glowL.setStyle(PaintStyle.Stroke);
    const spin = 1 + lv * 2.5;
    const arcPath = (R: number, startRad: number, sweepRad: number) => {
      'worklet';
      return Skia.PathBuilder.Make()
        .addArc(Skia.XYWHRect(cx - R, cy - R, R * 2, R * 2), (startRad * 180) / Math.PI, (sweepRad * 180) / Math.PI)
        .build();
    };

    // 1 · inner ring that draws itself on, with three bright arcs chasing around it
    let pr = prog(0);
    if (pr > 0.01) {
      const R = R0 * (1.18 + 0.06 * pr);
      line.setStrokeWidth(0.8);
      line.setColor(rgba(1, 0.95, 0.92, 0.35 * pr));
      canvas.drawPath(arcPath(R, -Math.PI / 2, Math.PI * 2 * pr), line);
      for (let k = 0; k < 3; k++) {
        const a0 = t * 0.7 * spin + (k * Math.PI * 2) / 3;
        const path = arcPath(R, a0, 0.55 * pr);
        glowL.setStrokeWidth(5);
        glowL.setColor(rgba(1, 0.86, 0.72, 0.5 * pr));
        canvas.drawPath(path, glowL);
        line.setStrokeWidth(2);
        line.setColor(rgba(1, 0.97, 0.92, 0.95 * pr));
        canvas.drawPath(path, line);
      }
    }

    // 2 · tick dial, turning the other way
    pr = prog(1);
    if (pr > 0.01) {
      const R = R0 * (1.38 + 0.08 * pr);
      const n = 72;
      const shown = Math.floor(n * pr);
      line.setStrokeWidth(1);
      for (let i = 0; i < shown; i++) {
        const a = (i / n) * Math.PI * 2 - t * 0.18 * spin;
        const long = i % 6 === 0;
        const len = long ? 9 : 4;
        // Level meter: ticks light up from the top, both ways, with your loudness.
        const fromTop = Math.abs(((i / n) * 2 + 1) % 2 - 1);
        const lit = fromTop < lv * 1.15 ? 1 : 0;
        line.setColor(lit ? rgba(1, 0.88, 0.7, (0.95) * pr) : rgba(1, 0.95, 0.92, (long ? 0.75 : 0.4) * pr));
        canvas.drawLine(cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len), line);
      }
    }

    // 3 · a ring of light bars that dances with your voice
    pr = prog(2);
    if (pr > 0.01) {
      const R = R0 * (1.62 + 0.08 * pr);
      const n = 64;
      line.setStrokeWidth(2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.08;
        const wob = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 9) * Math.sin(i * 0.63 - t * 5.3);
        const len = (2.5 + (lv * 30 + inp.pressing * 4) * wob) * pr;
        line.setColor(rgba(1, 0.9, 0.8, (0.35 + 0.6 * lv) * pr));
        canvas.drawLine(cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len), line);
      }
    }

    // 4 · dashed ring with a slow sweep of light, like a radar
    pr = prog(3);
    if (pr > 0.01) {
      const R = R0 * (2.0 + 0.12 * pr);
      line.setStrokeWidth(1.2);
      line.setColor(rgba(1, 0.95, 0.95, 0.4 * pr));
      for (let i = 0; i < 28; i++) {
        const a0 = (i / 28) * Math.PI * 2 + t * 0.22 * spin;
        canvas.drawPath(arcPath(R, a0, 0.12 * pr), line);
      }
      const sweepA = -t * 1.1 * spin;
      const sw = addPaint();
      sw.setStyle(PaintStyle.Stroke);
      sw.setStrokeWidth(3);
      const m = Skia.Matrix();
      m.translate(cx, cy);
      m.rotate(sweepA);
      m.translate(-cx, -cy);
      sw.setShader(Skia.Shader.MakeSweepGradient(cx, cy, [rgba(1, 0.9, 0.8, 0), rgba(1, 0.9, 0.8, 0), rgba(1, 0.95, 0.9, 0.8 * pr)], [0, 0.75, 1], TileMode.Clamp, m));
      canvas.drawCircle(cx, cy, R, sw);
    }

    // 5 · two outer arcs drifting slowly, with small nodes at their ends
    pr = prog(4);
    if (pr > 0.01) {
      const R = R0 * (2.45 + 0.15 * pr);
      line.setStrokeWidth(0.8);
      line.setColor(rgba(0.95, 0.9, 1, 0.3 * pr));
      const dot = addPaint();
      dot.setColor(rgba(1, 0.97, 0.93, 0.8 * pr));
      for (let k = 0; k < 2; k++) {
        const a0 = -t * 0.08 + k * Math.PI;
        const sweep = 2.1 * pr;
        canvas.drawPath(arcPath(R, a0, sweep), line);
        canvas.drawCircle(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, 2, dot);
        canvas.drawCircle(cx + Math.cos(a0 + sweep) * R, cy + Math.sin(a0 + sweep) * R, 2, dot);
      }
    }
  }

  // ---- voice ripples ----
  if (s.ripples.length && L.orb > 0.1) {
    const rp = glowPaint(2);
    rp.setStyle(PaintStyle.Stroke);
    const rl = addPaint();
    rl.setStyle(PaintStyle.Stroke);
    for (let i = 0; i < s.ripples.length; i++) {
      const rip = s.ripples[i];
      const e = Math.min(1, (t - rip.t0) / 2.2);
      const ee = 1 - Math.pow(1 - e, 2.5);
      const R = L.oR * (1.02 + ee * 2.4);
      const a = Math.pow(1 - e, 1.8) * rip.k;
      rp.setStrokeWidth(4);
      rp.setColor(rgba(1, 0.86, 0.8, a * 0.45));
      canvas.drawCircle(L.ox * w, L.oy * h, R, rp);
      rl.setStrokeWidth(1.2);
      rl.setColor(rgba(1, 0.97, 0.94, a * 0.8));
      canvas.drawCircle(L.ox * w, L.oy * h, R, rl);
    }
  }

  // ---- voice line ----
  if (L.wave > 0.01) {
    const y0 = h * 0.9;
    const x0 = w * 0.14;
    const x1 = w * 0.86;
    const pb = Skia.PathBuilder.Make();
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const x = x0 + (x1 - x0) * u;
      const env = Math.exp(-Math.pow((u - 0.5) / 0.16, 2));
      const amp = (2 + 34 * lv) * env;
      const y = y0 + Math.sin(u * 46 + t * 11) * amp * Math.sin(u * 9 - t * 3) + Math.sin(u * 13 + t * 2) * 1.5;
      if (i === 0) pb.moveTo(x, y);
      else pb.lineTo(x, y);
    }
    const path = pb.build();
    const sh = Skia.Shader.MakeLinearGradient(Skia.Point(x0, y0), Skia.Point(x1, y0), [rgba(1, 0.9, 0.95, 0), rgba(1, 0.95, 0.9, 0.95 * L.wave), rgba(1, 0.9, 0.95, 0)], [0, 0.5, 1], TileMode.Clamp);
    const g = glowPaint(3);
    g.setStyle(PaintStyle.Stroke);
    g.setStrokeWidth(3);
    g.setShader(sh);
    canvas.drawPath(path, g);
    const l = addPaint();
    l.setStyle(PaintStyle.Stroke);
    l.setStrokeWidth(1);
    l.setShader(sh);
    canvas.drawPath(path, l);
    const spark = glowPaint(6);
    spark.setColor(rgba(1, 0.92, 0.85, (0.3 + 0.6 * lv) * L.wave));
    canvas.drawCircle(w / 2, y0, 4 + lv * 8, spark);
  }

  // ---- personal constellation ----
  const n = Math.floor(inp.wishes.length / 4);
  if (n > 0 && L.sky > 0.01) {
    const vis = (i: number) => {
      'worklet';
      return inp.filter < 0 || inp.wishes[i * 4 + 3] === inp.filter ? 1 : 0.12;
    };
    const ln = Skia.Paint();
    ln.setAntiAlias(true);
    ln.setStyle(PaintStyle.Stroke);
    ln.setStrokeWidth(0.7);
    for (let i = 1; i < n; i++) {
      ln.setColor(rgba(1, 0.92, 0.9, 0.22 * L.sky * Math.min(vis(i), vis(i - 1))));
      canvas.drawLine(inp.wishes[(i - 1) * 4] * w, inp.wishes[(i - 1) * 4 + 1] * h, inp.wishes[i * 4] * w, inp.wishes[i * 4 + 1] * h, ln);
    }
    const ring = addPaint();
    ring.setStyle(PaintStyle.Stroke);
    ring.setStrokeWidth(0.8);
    for (let i = 0; i < n; i++) {
      const x = inp.wishes[i * 4] * w + tx * 6;
      const y = inp.wishes[i * 4 + 1] * h + ty * 6;
      const b = inp.wishes[i * 4 + 2];
      const v = vis(i) * L.sky;
      const tw = 0.85 + 0.15 * Math.sin(t * (0.8 + i * 0.13) + i);
      ring.setColor(rgba(1, 0.9, 0.85, 0.28 * v));
      canvas.drawCircle(x, y, 24 + 6 * b, ring);
      drawStar(canvas, x, y, (8 + 6 * b) * tw, (0.55 + 0.45 * b) * v, t + i);
    }
  }

  // ---- falling trail & gathering light ----
  const sp = addPaint();
  const sg = glowPaint(1.5);
  for (let i = 0; i < s.sparks.length; i++) {
    const q = s.sparks[i];
    let a: number;
    if (q.gather) {
      if (q.age < q.delay) continue;
      a = Math.min(1, (q.age - q.delay) * 1.5) * 0.9;
    } else {
      const e = q.age / q.life;
      a = Math.pow(1 - e, 1.3) * (0.6 + 0.4 * Math.sin(t * 6 + q.ph));
    }
    sg.setColor(rgba(1, 0.88, 0.8, a * 0.45));
    canvas.drawCircle(q.x, q.y, q.s * 1.5, sg);
    sp.setColor(rgba(1, 0.98, 0.94, a));
    canvas.drawCircle(q.x, q.y, Math.max(0.3, q.s * 0.7), sp);
  }

  // ---- the wish-star ----
  if (L.star > 0.01) {
    const x = L.sx * w + Math.sin(L.sy * 9) * w * 0.07 * L.trail + tx * 6;
    const y = L.sy * h + ty * 6;
    const R = 26 * L.sR * (1 + 0.06 * s.breath + 0.35 * lv);
    const e = L.star * (0.85 + 0.15 * s.breath + 0.6 * lv) + s.flare;
    if (L.ring > 0.01) {
      const rg = glowPaint(3);
      rg.setStyle(PaintStyle.Stroke);
      rg.setStrokeWidth(2.5);
      const rr = 112 * (1 + 0.04 * lv);
      rg.setColor(rgba(1, 0.88, 0.8, 0.35 * L.ring * (0.8 + 0.4 * lv)));
      canvas.drawCircle(x, y, rr, rg);
      const rl = addPaint();
      rl.setStyle(PaintStyle.Stroke);
      rl.setStrokeWidth(0.9);
      rl.setColor(rgba(1, 0.94, 0.88, 0.75 * L.ring));
      canvas.drawCircle(x, y, rr, rl);
      for (let k = 0; k < 4; k++) {
        const ang = t * (0.25 + k * 0.07) + k * 1.57;
        const dp = addPaint();
        dp.setColor(rgba(1, 0.97, 0.92, 0.85 * L.ring));
        canvas.drawPath(sparkle(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, 3.2, 0.14), dp);
      }
    }
    drawStar(canvas, x, y, R, e, t);
  }

  // ---- motes ----
  const mp = addPaint();
  for (let i = 0; i < s.motes.length; i++) {
    const m = s.motes[i];
    const a = m.b * (0.6 + 0.4 * Math.sin(t * 1.5 + m.ph)) * (0.6 + 0.8 * lv);
    mp.setColor(m.c < 0.6 ? rgba(1, 0.97, 0.98, a * 0.75) : rgba(1, 0.88, 0.85, a * 0.75));
    canvas.drawCircle(m.x, m.y, m.s * 0.7, mp);
  }

  // ---- waves of light ----
  if (s.waves.length) {
    const ring = glowPaint(1.8);
    ring.setStyle(PaintStyle.Stroke);
    ring.setStrokeWidth(1.4);
    const fx = L.orb > 0.5 ? L.ox * w : L.sx * w;
    const fy = L.orb > 0.5 ? L.oy * h : L.sy * h;
    for (let i = 0; i < s.waves.length; i++) {
      const wv = s.waves[i];
      const e = Math.min(1, (t - wv.t0) / 3.2);
      const ee = 1 - Math.pow(1 - e, 3);
      ring.setColor(rgba(1, 0.93, 0.9, Math.pow(1 - e, 2) * 0.55));
      canvas.drawCircle(wv.x < 0 ? fx : wv.x, wv.x < 0 ? fy : wv.y, 16 + ee * Math.max(w, h) * 0.75, ring);
    }
  }
}
