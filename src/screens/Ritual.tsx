import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SCENE, sendWave, setScene, useCosmos } from '../cosmos/controls';
import { say } from '../presence';
import { PillButton, Sparkle, TextLink, Title } from '../ui/kit';
import type { Kind } from '../theme';

const FORM_COPY: Record<Kind, { text: string; spoken: string }> = {
  0: { text: 'Your wish is\nin the universe.', spoken: 'Your wish is in the universe.' },
  1: { text: 'Your gratitude is\nin the universe.', spoken: 'Your gratitude is in the universe.' },
};

/**
 * 4 · Star forms → 5 · Star rises → 6 · Confirmation.
 * Light gathers into a star, the star rises with a trail, and the sky goes quiet.
 */
export default function Ritual({ kind, onUniverse, onAgain }: { kind: Kind; onUniverse: () => void; onAgain: () => void }) {
  const c = useCosmos();
  const { height: h } = useWindowDimensions();
  const [step, setStep] = useState(0);

  useEffect(() => {
    setScene(c, SCENE.FORM);
    const timers = [
      setTimeout(() => {
        sendWave(c);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        say(c, FORM_COPY[kind].spoken);
      }, 2400),
      setTimeout(() => {
        setStep(1);
        setScene(c, SCENE.RISE);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }, 6400),
      setTimeout(() => say(c, 'Let it go, and trust.'), 7600),
      setTimeout(() => {
        setStep(2);
        setScene(c, SCENE.DONE);
      }, 12000),
      setTimeout(() => say(c, 'It’s in the universe.'), 13200),
      setTimeout(() => setStep(3), 15500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [c, kind]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {step === 0 && (
        <Animated.View key="form" entering={FadeIn.duration(1800).delay(2200)} exiting={FadeOut.duration(700)} style={[styles.block, { top: h * 0.63 }]} pointerEvents="none">
          <Title style={styles.text}>{FORM_COPY[kind].text}</Title>
          <Sparkle size={11} style={styles.spark} />
        </Animated.View>
      )}
      {step === 1 && (
        <Animated.View key="rise" entering={FadeIn.duration(1800).delay(900)} exiting={FadeOut.duration(800)} style={[styles.block, { top: h * 0.74 }]} pointerEvents="none">
          <Title style={styles.text}>{'Let it go\nand trust.'}</Title>
          <Sparkle size={11} style={styles.spark} />
        </Animated.View>
      )}
      {step >= 2 && (
        <Animated.View key="done" entering={FadeIn.duration(2000).delay(800)} style={[styles.block, { top: h * 0.46 }]} pointerEvents="none">
          <Title style={styles.done}>It’s in the universe.</Title>
          <Sparkle size={11} style={styles.spark} />
        </Animated.View>
      )}
      {step >= 3 && (
        <Animated.View entering={FadeIn.duration(1400)} style={[styles.actions, { bottom: h * 0.09 }]}>
          <PillButton label="See my universe" onPress={onUniverse} wide />
          <View style={{ height: 18 }} />
          <TextLink label="Make another wish" onPress={onAgain} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  text: { fontSize: 31, lineHeight: 37 },
  done: { fontSize: 30 },
  spark: { marginTop: 14 },
  actions: { position: 'absolute', alignSelf: 'center', alignItems: 'center' },
});
