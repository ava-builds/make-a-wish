import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { isWeb, type Kind } from './theme';

export type Star = {
  id: string;
  createdAt: number;
  kind: Kind;
  /** Relative path under the documents folder on device; a blob URL on web. */
  audio: string | null;
  x: number;
  y: number;
};

const KEY = 'make-a-wish/stars/v2';
const PREFS = 'make-a-wish/prefs/v1';

export async function loadStars(): Promise<Star[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: Star[] = raw ? JSON.parse(raw) : [];
    // Web recordings are in-memory blobs and don't survive a reload.
    // Older Manifest stars become wishes.
    const fixed = list.map((s) => ((s.kind as number) > 1 ? { ...s, kind: 0 as Kind } : s));
    return isWeb ? fixed.map((s) => ({ ...s, audio: null })) : fixed;
  } catch {
    return [];
  }
}

async function saveAll(list: Star[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // best effort
  }
}

/** Copy a fresh recording into the app's documents folder so it outlives the session. */
function keep(uri: string | null, name: string): string | null {
  if (!uri) return null;
  if (isWeb) return uri;
  try {
    const dir = new Directory(Paths.document, 'stars');
    if (!dir.exists) dir.create({ intermediates: true });
    new File(uri).copy(new File(dir, name));
    return `stars/${name}`;
  } catch {
    return null;
  }
}

export function playableUri(path: string | null): string | null {
  if (!path) return null;
  if (isWeb || path.includes('://')) return path;
  return new File(Paths.document, path).uri;
}

/** Find an open spot in the sky, away from other stars and clear of the title and nav. */
function place(list: Star[]) {
  let best = { x: 0.5, y: 0.45 };
  let bestD = -1;
  for (let i = 0; i < 50; i++) {
    const x = 0.16 + Math.random() * 0.68;
    const y = 0.27 + Math.random() * 0.42;
    const d = list.reduce((m, s) => Math.min(m, Math.hypot(s.x - x, (s.y - y) * 1.7)), 1);
    if (d > bestD) {
      bestD = d;
      best = { x, y };
    }
  }
  return best;
}

export async function addStar(list: Star[], kind: Kind, uri: string | null): Promise<Star[]> {
  const id = `${Date.now()}`;
  const ext = (uri && uri.match(/\.(\w{2,4})$/)?.[1]) || 'm4a';
  const star: Star = { id, createdAt: Date.now(), kind, audio: keep(uri, `${id}.${ext}`), ...place(list) };
  const next = [...list, star];
  await saveAll(next);
  return next;
}

export async function removeStar(list: Star[], id: string): Promise<Star[]> {
  const star = list.find((s) => s.id === id);
  if (star?.audio && !isWeb && !star.audio.includes('://')) {
    try {
      new File(Paths.document, star.audio).delete();
    } catch {
      // already gone
    }
  }
  const next = list.filter((s) => s.id !== id);
  await saveAll(next);
  return next;
}

/** Flat [x, y, brightness, kind] for the sky; recent stars shine brighter. */
export function toSky(list: Star[]): number[] {
  const out: number[] = [];
  list.forEach((s, i) => {
    const age = list.length - 1 - i;
    out.push(s.x, s.y, Math.max(0.35, 1 - age * 0.08), s.kind);
  });
  return out;
}

export async function loadMusicPref(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PREFS);
    return raw ? JSON.parse(raw).music !== false : true;
  } catch {
    return true;
  }
}

export async function saveMusicPref(on: boolean) {
  try {
    await AsyncStorage.setItem(PREFS, JSON.stringify({ music: on }));
  } catch {
    // best effort
  }
}
