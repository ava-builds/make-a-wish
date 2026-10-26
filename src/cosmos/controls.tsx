import { createContext, useContext, useMemo } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/** Each scene is a "look" the living sky eases toward. Nothing is a fixed animation. */
export const SCENE = {
  OPENING: 0,
  HOME: 1,
  LISTEN: 2,
  FORM: 3,
  RISE: 4,
  DONE: 5,
  UNIVERSE: 6,
  PLAY: 7,
} as const;

export type Cosmos = {
  scene: SharedValue<number>;
  sceneStamp: SharedValue<number>;
  voice: SharedValue<number>; // 0..1 live microphone level
  speaking: SharedValue<number>; // 1 while the app's voice (or a replayed wish) is playing
  pressing: SharedValue<number>; // 1 while a finger holds the orb
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  touchOn: SharedValue<number>;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
  waveStamp: SharedValue<number>;
  waveX: SharedValue<number>;
  waveY: SharedValue<number>;
  /** flat [x, y, brightness, kind, …] in 0..1 screen space */
  wishes: SharedValue<number[]>;
  filter: SharedValue<number>; // -1 all, else kind index
};

export function useCosmosState(): Cosmos {
  const scene = useSharedValue<number>(SCENE.OPENING);
  const sceneStamp = useSharedValue(0);
  const voice = useSharedValue(0);
  const speaking = useSharedValue(0);
  const pressing = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const touchOn = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const waveStamp = useSharedValue(0);
  const waveX = useSharedValue(-1);
  const waveY = useSharedValue(-1);
  const wishes = useSharedValue<number[]>([]);
  const filter = useSharedValue(-1);
  return useMemo(
    () => ({ scene, sceneStamp, voice, speaking, pressing, touchX, touchY, touchOn, tiltX, tiltY, waveStamp, waveX, waveY, wishes, filter }),
    // shared values are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

export const CosmosContext = createContext<Cosmos | null>(null);

export function useCosmos(): Cosmos {
  const c = useContext(CosmosContext);
  if (!c) throw new Error('useCosmos must be used inside CosmosContext');
  return c;
}

export function setScene(c: Cosmos, scene: number) {
  c.scene.value = scene;
  c.sceneStamp.value = c.sceneStamp.value + 1;
}

/** A soft ring of light. With no point given it leaves the current focus (orb or star). */
export function sendWave(c: Cosmos, x = -1, y = -1) {
  c.waveX.value = x;
  c.waveY.value = y;
  c.waveStamp.value = c.waveStamp.value + 1;
}
