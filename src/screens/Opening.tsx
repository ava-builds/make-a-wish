import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SCENE, setScene, useCosmos } from '../cosmos/controls';
import { PillButton, Sparkle, Sub, Title } from '../ui/kit';

/** 1 · Opening — a doorway of light over still water, clouds, the moon. */
export default function Opening({ onEnter }: { onEnter: () => void }) {
  const c = useCosmos();
  const { height: h } = useWindowDimensions();

  useEffect(() => {
    if (c.scene.value !== SCENE.OPENING) setScene(c, SCENE.OPENING);
  }, [c]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(2200).delay(900)} style={[styles.top, { top: h * 0.19 }]} pointerEvents="none">
        <Title style={styles.title}>{'Welcome to\nYour Universe'}</Title>
        <Sparkle size={11} style={styles.spark} />
        <Sub>Speak it. Feel it. It’s already on its way.</Sub>
      </Animated.View>
      <Animated.View entering={FadeIn.duration(1600).delay(2600)} style={[styles.bottom, { bottom: h * 0.075 }]}>
        <PillButton
          label="Enter"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
            onEnter();
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  title: { fontSize: 36, lineHeight: 42 },
  spark: { marginVertical: 14 },
  bottom: { position: 'absolute', alignSelf: 'center' },
});
