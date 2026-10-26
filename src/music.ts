import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Calm background music: an original ambient loop (see scripts/make_bgm.py).
 * It fades in gently, steps aside while you speak (so it isn't recorded into your wish),
 * comes back softly afterwards, and dips while you replay a wish.
 */
const TRACK = require('../assets/audio/calm.mp3');
const LEVEL = 0.5;

let player: AudioPlayer | null = null;
let enabled = true;
let micHold = false;
let duck = 1;
let timer: ReturnType<typeof setInterval> | null = null;

function ensure(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(TRACK);
    player.loop = true;
    player.volume = 0;
  }
  return player;
}

function level() {
  return enabled && !micHold ? LEVEL * duck : 0;
}

/** Smoothly move the volume to `to` over `ms`. */
function fadeTo(to: number, ms: number, done?: () => void) {
  const p = ensure();
  if (timer) clearInterval(timer);
  const from = p.volume;
  const steps = Math.max(1, Math.round(ms / 50));
  let i = 0;
  timer = setInterval(() => {
    i++;
    const k = i / steps;
    const eased = k * k * (3 - 2 * k);
    try {
      p.volume = from + (to - from) * eased;
    } catch {
      // player released
    }
    if (i >= steps) {
      if (timer) clearInterval(timer);
      timer = null;
      done?.();
    }
  }, 50);
}

async function playbackMode() {
  try {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false, interruptionMode: 'mixWithOthers' });
  } catch {
    // keep going
  }
}

function play() {
  try {
    // play() is safe to call again; `playing` can lag behind a recent pause.
    ensure().play();
  } catch {
    // web may block sound until the first tap; Enter starts it again
  }
}

export async function startMusic() {
  if (!enabled || micHold) return;
  await playbackMode();
  play();
  fadeTo(level(), 3000);
}

/** Fade out and pause before the microphone opens. */
export function quietForMic(): Promise<void> {
  micHold = true;
  return new Promise((resolve) => {
    if (!player || !player.playing) {
      resolve();
      return;
    }
    fadeTo(0, 250, () => {
      try {
        player?.pause();
      } catch {
        // ignore
      }
      resolve();
    });
  });
}

/** Bring the music back softly after listening. */
export async function releaseMic() {
  micHold = false;
  if (!enabled) return;
  await playbackMode();
  play();
  fadeTo(level(), 2500);
}

/** Dip the music while a recorded wish plays. */
export function duckMusic(on: boolean) {
  duck = on ? 0.15 : 1;
  if (player?.playing) fadeTo(level(), 600);
}

/**
 * Turn music on/off. `start` is false at launch on the web, where browsers only allow
 * sound after the first tap; the Enter button starts it there.
 */
export function setMusicOn(on: boolean, start = true) {
  enabled = on;
  if (on && start) startMusic();
  else if (player) {
    fadeTo(0, 800, () => {
      try {
        player?.pause();
      } catch {
        // ignore
      }
    });
  }
}
