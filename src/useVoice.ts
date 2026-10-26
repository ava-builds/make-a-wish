import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import type { Cosmos } from './cosmos/controls';
import { hush } from './presence';
import { quietForMic, releaseMic } from './music';

const MAX_MS = 60000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Turn system audio errors into words a person can act on. */
function friendly(e: unknown): string {
  const msg = String((e as Error)?.message ?? e);
  // 561017449 = '!pri': another app (a call, music, video, Siri) is holding the audio.
  if (msg.includes('561017449') || msg.includes('!pri')) {
    return 'Another app is using the sound right now (music, a video, a call or Siri). Pause it, then hold the light again.';
  }
  if (msg.includes('did not respond')) return 'The microphone didn’t answer. Hold the light again in a moment.';
  return 'The microphone isn’t available right now. Hold the light again in a moment.';
}
export const MIN_MS = 700;

/** Records one spoken moment and feeds the live loudness of the voice into the universe. */
export function useVoice(c: Cosmos, onAutoStop: () => void) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const st = useAudioRecorderState(recorder, 50);
  const [listening, setListening] = useState(false);
  const busy = useRef(false);
  const live = useRef(false);
  const startedAt = useRef(0);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!listening) {
      c.voice.value = 0;
      return;
    }
    const db = st.metering;
    // Roughly -52dB (quiet room) … -10dB (clear speech) onto 0..1, with a soft curve.
    c.voice.value = typeof db === 'number' ? Math.pow(Math.max(0, Math.min(1, (db + 52) / 42)), 1.3) : 0.25;
  }, [st.metering, listening, c]);

  useEffect(() => {
    if (listening && Math.max(st.durationMillis ?? 0, Date.now() - startedAt.current) >= MAX_MS) onAutoStop();
  }, [listening, st.durationMillis, onAutoStop]);

  /** Returns an error message, or null once the mic is open. */
  const start = useCallback(async (): Promise<string | null> => {
    if (busy.current || live.current) return null;
    busy.current = true;
    cancelled.current = false;
    const wasSpeaking = c.speaking.value > 0.5;
    hush(c);
    try {
      // The music steps aside so it isn't recorded into your wish.
      await quietForMic();
      await sleep(wasSpeaking ? 200 : 80);
      // Usually already granted at Enter, so the light can start listening at once.
      let perm = await getRecordingPermissionsAsync();
      if (!perm.granted) perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        releaseMic();
        return 'Allow the microphone so the universe can hear you.';
      }
      // iPhone can briefly refuse the mic while audio is still switching over.
      // Take the audio session cleanly, and try a few times with short pauses.
      const open = async () => {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          interruptionMode: 'doNotMix',
          shouldRouteThroughEarpiece: false,
        });
        await setIsAudioActiveAsync(true).catch(() => {});
        await Promise.race([
          recorder.prepareToRecordAsync(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('the microphone did not respond')), 5000)),
        ]);
      };
      let lastError: unknown = null;
      for (const wait of [0, 400, 900, 1500]) {
        if (wait) await sleep(wait);
        try {
          await open();
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (lastError) throw lastError;
      // You may have let go (or cancelled) while the mic was still opening.
      if (cancelled.current) {
        releaseMic();
        return null;
      }
      recorder.record();
      startedAt.current = Date.now();
      live.current = true;
      setListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return null;
    } catch (e) {
      releaseMic();
      return friendly(e);
    } finally {
      busy.current = false;
    }
  }, [recorder, c]);

  /** Close the mic. Returns the recording, or null if nothing usable was said. */
  const stop = useCallback(async (): Promise<{ uri: string | null; ms: number } | null> => {
    if (!live.current) {
      // The mic was still opening: make sure it doesn't start, and bring the music back.
      cancelled.current = true;
      setListening(false);
      releaseMic();
      return null;
    }
    live.current = false;
    const ms = Math.max(st.durationMillis ?? 0, Date.now() - startedAt.current);
    try {
      await recorder.stop();
    } catch {
      // ignore
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    setListening(false);
    releaseMic();
    if (ms < MIN_MS) return null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    return { uri: recorder.uri, ms };
  }, [recorder, st.durationMillis]);

  return { listening, start, stop, isLive: () => live.current };
}

/** Ask for the microphone up front (at Enter), before the first wish. */
export async function warmUpMicrophone() {
  try {
    const perm = await getRecordingPermissionsAsync();
    if (!perm.granted && perm.canAskAgain !== false) await requestRecordingPermissionsAsync();
  } catch {
    // asked again when speaking
  }
}
