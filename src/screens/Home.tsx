import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SCENE, setScene, useCosmos } from '../cosmos/controls';
import { MIN_MS, useVoice } from '../useVoice';
import { CloseGlyph, ConstellationGlyph, HeartGlyph, IconButton, MicGlyph, Sparkle, Sub, Title } from '../ui/kit';
import { colors, fonts, KINDS, type Kind } from '../theme';

const COPY: Record<Kind, { title: string; sub: string }> = {
  0: { title: 'Make a Wish', sub: 'Speak from your heart' },
  1: { title: 'Give Thanks', sub: 'Speak what you’re grateful for' },
};

function TabIcon({ kind, color }: { kind: Kind; color: string }) {
  if (kind === 0) return <Sparkle size={15} color={color} />;
  return <HeartGlyph size={16} color={color} />;
}

/** 2 · Home and 3 · Listening — the painted bubble; tap and hold it, speak, let go. */
export default function Home({
  kind,
  onKind,
  onRecorded,
  onUniverse,
}: {
  kind: Kind;
  onKind: (k: Kind) => void;
  onRecorded: (uri: string | null) => void;
  onUniverse: () => void;
}) {
  const c = useCosmos();
  const { width: w, height: h } = useWindowDimensions();
  const [listening, setListening] = useState(false);
  const [latched, setLatched] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const phase = useRef<'idle' | 'listening'>('idle');
  const latchedRef = useRef(false);
  const pressedAt = useRef(0);
  const finishRef = useRef<() => void>(() => {});
  const voice = useVoice(c, () => finishRef.current());
  const p = useSharedValue(0);
  // On arrival the words wait until you're through the door, then fade in.
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArrived(true), 2600);
    return () => clearTimeout(t);
  }, []);
  const wait = arrived ? 0 : 1300;
  const pr = useSharedValue(0); // finger on the button
  const ring = useSharedValue(0); // listening pulse

  // The bubble stays where your finger is; it just settles a little smaller while listening.
  const homeOrb = { x: w / 2, y: h * 0.53 };
  const homeR = 74;
  const listenOrb = homeOrb;
  const listenR = 64;
  const titleY = h * 0.27 + 26;
  const hintY = homeOrb.y + homeR + 14;

  useEffect(() => {
    if (c.scene.value !== SCENE.HOME) setScene(c, SCENE.HOME);
  }, [c]);

  const toIdle = useCallback(() => {
    phase.current = 'idle';
    latchedRef.current = false;
    setLatched(false);
    setListening(false);
    c.pressing.value = 0;
    p.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    setScene(c, SCENE.HOME);
  }, [c, p]);

  const finish = useCallback(async () => {
    if (phase.current !== 'listening') return;
    phase.current = 'idle';
    const r = await voice.stop();
    if (!r) {
      toIdle();
      setNote('Hold a little longer, and speak from your heart.');
      return;
    }
    onRecorded(r.uri);
  }, [voice, toIdle, onRecorded]);
  finishRef.current = finish;

  const onPressIn = async () => {
    pr.value = withSpring(1, { damping: 14, stiffness: 260 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (phase.current === 'listening') {
      if (latchedRef.current) finish();
      return;
    }
    phase.current = 'listening';
    pressedAt.current = Date.now();
    c.pressing.value = 1;
    setNote(null);
    setListening(true);
    p.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    setScene(c, SCENE.LISTEN);
    const err = await voice.start();
    if (err) {
      toIdle();
      setNote(err);
    }
  };

  const onPressOut = () => {
    pr.value = withSpring(0, { damping: 12, stiffness: 180 });
    c.pressing.value = 0;
    if (phase.current !== 'listening' || latchedRef.current) return;
    const held = Date.now() - pressedAt.current;
    if (held >= MIN_MS + 150 && voice.isLive()) {
      finish();
    } else {
      // A quick tap keeps the light listening until it's tapped again.
      latchedRef.current = true;
      setLatched(true);
    }
  };

  const cancel = async () => {
    phase.current = 'idle';
    await voice.stop();
    toIdle();
  };

  // A soft ring keeps pulsing out of the bubble while it listens.
  useEffect(() => {
    ring.value = listening ? withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false) : withTiming(0, { duration: 300 });
  }, [listening, ring]);

  // The mic sinks a little under your finger and swells with your voice.
  const mic = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pr.value * 0.12 + c.voice.value * 0.18 }],
  }));
  const micIdle = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  const micLive = useAnimatedStyle(() => ({ opacity: p.value }));
  const press = useAnimatedStyle(() => ({ opacity: pr.value * 0.35, transform: [{ scale: 0.9 + pr.value * 0.1 }] }));
  const pulse = useAnimatedStyle(() => ({
    opacity: listening ? (1 - ring.value) * 0.7 : 0,
    transform: [{ scale: 1 + ring.value * 0.45 }],
  }));

  // The touch area follows the bubble as it settles.
  const orb = useAnimatedStyle(() => {
    const r = interpolate(p.value, [0, 1], [homeR, listenR]);
    const cx = interpolate(p.value, [0, 1], [homeOrb.x, listenOrb.x]);
    const cy = interpolate(p.value, [0, 1], [homeOrb.y, listenOrb.y]);
    return { width: r * 2, height: r * 2, borderRadius: r, left: cx - r, top: cy - r };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {!listening && (
        <Animated.View key={`t${kind}`} entering={FadeIn.duration(1400).delay(wait)} exiting={FadeOut.duration(400)} style={[styles.top, { top: titleY - 26 }]} pointerEvents="none">
          <Text style={styles.title}>{COPY[kind].title}</Text>
          <Text style={styles.sub}>{COPY[kind].sub}</Text>
        </Animated.View>
      )}

      {!listening && (
        <Animated.View entering={FadeIn.duration(1200).delay(wait + 400)} exiting={FadeOut.duration(300)} style={styles.corner}>
          <IconButton onPress={onUniverse} label="My Universe">
            <ConstellationGlyph color={colors.plum} />
          </IconButton>
        </Animated.View>
      )}

      <Animated.View style={[styles.orb, orb]}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          pressRetentionOffset={{ top: 400, bottom: 400, left: 400, right: 400 }}
          style={styles.orbHit}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Finish speaking' : 'Tap and hold to speak'}
        >
          <Animated.View pointerEvents="none" style={[styles.ring, pulse]} />
          <Animated.View pointerEvents="none" style={[styles.pressGlow, press]} />
          <Animated.View pointerEvents="none" style={mic}>
            <Animated.View style={micIdle}>
              <MicGlyph size={Math.round(homeR * 0.62)} color="#6A5C9C" />
            </Animated.View>
            <Animated.View style={[styles.micOver, micLive]}>
              <MicGlyph size={Math.round(homeR * 0.62)} color="#5E4F94" />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {!listening && (
        <Animated.View entering={FadeIn.duration(1200).delay(wait + 300)} exiting={FadeOut.duration(300)} style={[styles.hint, { top: hintY }]} pointerEvents="none">
          <Text style={styles.hintText}>Tap and hold to speak</Text>
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </Animated.View>
      )}

      {listening && (
        <>
          <Animated.View entering={FadeIn.duration(900).delay(300)} exiting={FadeOut.duration(300)} style={[styles.close, { top: 54 }]}>
            <IconButton onPress={cancel} label="Cancel">
              <CloseGlyph />
            </IconButton>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(900).delay(500)} exiting={FadeOut.duration(300)} style={[styles.listen, { top: h * 0.53 + listenR * 2.75 }]} pointerEvents="none">
            <Title style={styles.listenTitle}>Listening…</Title>
            <Sub>{latched ? 'Speak freely · tap the light when you’re done' : 'Speak freely'}</Sub>
          </Animated.View>
        </>
      )}

      {!listening && (
        <Animated.View entering={FadeIn.duration(1200).delay(wait + 600)} exiting={FadeOut.duration(300)} style={[styles.tabs, { bottom: 26 }]}>
          {([0, 1] as Kind[]).map((k) => {
            const on = k === kind;
            const col = on ? colors.plum : 'rgba(77,67,128,0.62)';
            return (
              <Pressable key={k} onPress={() => onKind(k)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                <TabIcon kind={k} color={col} />
                <Text style={[styles.tabText, { color: col }]}>{KINDS[k]}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, color: '#4F4479', textAlign: 'center', letterSpacing: 0.3 },
  sub: { marginTop: 10, fontFamily: fonts.sans, fontSize: 14, color: 'rgba(79,68,121,0.78)', textAlign: 'center', letterSpacing: 0.3 },
  corner: { position: 'absolute', top: 54, right: 20 },
  orb: { position: 'absolute' },
  orbHit: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  micOver: { position: 'absolute', top: 0, left: 0 },
  ring: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,240,230,0.9)' },
  pressGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, backgroundColor: '#FFFFFF' },
  hint: { position: 'absolute', left: 30, right: 30, alignItems: 'center' },
  hintText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 19, color: 'rgba(79,68,121,0.82)', textAlign: 'center' },
  note: { marginTop: 8, fontFamily: fonts.sans, fontSize: 12, color: '#4F4479', textAlign: 'center' },
  close: { position: 'absolute', right: 20 },
  listen: { position: 'absolute', left: 24, right: 24, alignItems: 'center', gap: 8 },
  listenTitle: { fontSize: 30 },
  tabs: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 5,
    borderRadius: 30,
    backgroundColor: 'rgba(255,250,252,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  tab: { width: 118, paddingVertical: 9, alignItems: 'center', borderRadius: 24, gap: 4 },
  tabOn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#C9B5F0',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  tabText: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 0.2 },
});
