import { useRef } from 'react';
import { StyleSheet, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';
import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { draw, initState, step, type Inputs, type State } from './engine';
import { useCosmos } from './controls';

/** The whole living world, simulated and painted every frame. */
export default function Cosmos({ onTap }: { onTap?: (x: number, y: number) => void }) {
  const c = useCosmos();
  const { width: w, height: h } = useWindowDimensions();
  const S = useSharedValue<State | null>(null);
  const clock = useSharedValue(0);

  const read = (): Inputs => {
    'worklet';
    return {
      scene: c.scene.value,
      sceneStamp: c.sceneStamp.value,
      voice: c.voice.value,
      speaking: c.speaking.value,
      pressing: c.pressing.value,
      touchX: c.touchX.value,
      touchY: c.touchY.value,
      touchOn: c.touchOn.value,
      tiltX: c.tiltX.value,
      tiltY: c.tiltY.value,
      waveStamp: c.waveStamp.value,
      waveX: c.waveX.value,
      waveY: c.waveY.value,
      wishes: c.wishes.value,
      filter: c.filter.value,
    };
  };

  useFrameCallback((f) => {
    'worklet';
    // Keep real time even when frames drop, in small stable sub-steps.
    let left = Math.min(0.5, Math.max(0.001, (f.timeSincePreviousFrame ?? 16) / 1000));
    let s = S.value;
    if (!s || s.w !== w || s.h !== h) {
      s = initState(w, h);
      S.value = s;
    }
    const inp = read();
    while (left > 0) {
      const dt = Math.min(0.034, left);
      step(s, inp, dt);
      left -= dt;
    }
    clock.value = f.timeSinceFirstFrame;
  });

  const picture = useDerivedValue(() => {
    clock.value; // redraw every frame
    const s = S.value;
    const inp = read();
    return createPicture((canvas) => {
      if (s) draw(canvas, s, inp);
    }, { width: w, height: h });
  });

  const start = useRef({ x: 0, y: 0, moved: false });
  const onGrant = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    start.current = { x: locationX, y: locationY, moved: false };
    c.touchX.value = locationX;
    c.touchY.value = locationY;
    c.touchOn.value = 1;
  };
  const onMove = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    if (Math.hypot(locationX - start.current.x, locationY - start.current.y) > 10) start.current.moved = true;
    c.touchX.value = locationX;
    c.touchY.value = locationY;
  };
  const onEnd = () => {
    c.touchOn.value = 0;
    if (!start.current.moved) onTap?.(start.current.x, start.current.y);
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: '#8E85C4' }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onEnd}
      onResponderTerminate={() => (c.touchOn.value = 0)}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}
