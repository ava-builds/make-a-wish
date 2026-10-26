import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { SCENE, setScene, useCosmos } from '../cosmos/controls';
import { hush } from '../presence';
import { duckMusic } from '../music';
import { playableUri, type Star } from '../store';
import { BackGlyph, DotsGlyph, IconButton, Sparkle, Sub } from '../ui/kit';
import { colors, fonts } from '../theme';

const LABEL = ['Wished on', 'Grateful on'];
const LIVES = ['This wish lives in the universe.', 'This gratitude lives in the universe.'];

function clock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

/** 8 · Play wish — the star listens back with you. */
export default function Play({ star, onBack, onDelete }: { star: Star; onBack: () => void; onDelete: () => void }) {
  const c = useCosmos();
  const { width: w, height: h } = useWindowDimensions();
  const uri = playableUri(star.audio);
  const player = useAudioPlayer(uri ? { uri } : null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    hush(c);
    setScene(c, SCENE.PLAY);
    return () => {
      c.speaking.value = 0;
      duckMusic(false);
    };
  }, [c]);

  // While the recording plays, the star carries the rhythm of your voice.
  useEffect(() => {
    c.speaking.value = status.playing ? 1 : 0;
    // The music dips while your own voice plays.
    duckMusic(status.playing);
  }, [status.playing, c]);

  const toggle = async () => {
    if (!uri) return;
    if (status.playing) {
      player.pause();
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) player.seekTo(0);
    player.play();
  };

  const confirmDelete = () => {
    setMenu(false);
    if (Platform.OS === 'web') {
      onDelete();
      return;
    }
    Alert.alert('Release this star?', 'It will leave your universe for good.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Release', style: 'destructive', onPress: onDelete },
    ]);
  };

  const d = new Date(star.createdAt);
  const date = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  const dur = status.duration || 0;
  const pct = dur > 0 ? Math.min(1, status.currentTime / dur) : 0;
  const barW = w - 72;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(900)} style={[styles.back, { top: 54 }]}>
        <IconButton onPress={onBack} label="Back">
          <BackGlyph />
        </IconButton>
      </Animated.View>
      <Animated.View entering={FadeIn.duration(900)} style={[styles.more, { top: 54 }]}>
        <IconButton onPress={() => setMenu((m) => !m)} label="More">
          <DotsGlyph />
        </IconButton>
      </Animated.View>
      {menu && (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={[styles.menu, { top: 100 }]}>
          <Pressable onPress={confirmDelete} hitSlop={6}>
            <Text style={styles.menuText}>Release this star</Text>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View entering={FadeIn.duration(1400).delay(500)} style={[styles.meta, { top: h * 0.36 + 140 }]} pointerEvents="none">
        <Sub>{LABEL[star.kind]}</Sub>
        <Sub style={{ marginTop: 2 }}>{date}</Sub>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(1400).delay(700)} style={[styles.controls, { top: h * 0.36 + 200 }]}>
        <Pressable onPress={toggle} disabled={!uri} style={({ pressed }) => [styles.play, (pressed || !uri) && { opacity: 0.6 }]} accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
          <Svg width={20} height={20} viewBox="0 0 20 20">
            {status.playing ? (
              <>
                <Rect x={5} y={4} width={3} height={12} rx={1} fill="#FFFFFF" />
                <Rect x={12} y={4} width={3} height={12} rx={1} fill="#FFFFFF" />
              </>
            ) : (
              <Path d="M6.5 3.8 L16 10 L6.5 16.2 Z" fill="#FFFFFF" />
            )}
          </Svg>
        </Pressable>
        <View style={[styles.track, { width: barW }]}>
          <View style={[styles.fill, { width: barW * pct }]} />
          <View style={[styles.knob, { left: barW * pct - 4 }]} />
        </View>
        <View style={[styles.times, { width: barW }]}>
          <Text style={styles.time}>{clock(status.currentTime)}</Text>
          <Text style={styles.time}>{clock(dur)}</Text>
        </View>
        {!uri ? <Text style={styles.gone}>This voice stayed in another session.</Text> : null}
      </Animated.View>

      <Animated.View entering={FadeIn.duration(1600).delay(900)} style={[styles.lives, { bottom: h * 0.07 }]} pointerEvents="none">
        <Sub style={{ fontSize: 13.5 }}>{LIVES[star.kind]}</Sub>
        <Sparkle size={10} style={{ marginTop: 12 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', left: 20 },
  more: { position: 'absolute', right: 20 },
  menu: { position: 'absolute', right: 20, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,250,252,0.94)' },
  menuText: { fontFamily: fonts.sans, fontSize: 14, color: colors.plum },
  meta: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  controls: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  play: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252,233,220,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,240,230,0.75)',
    shadowColor: '#FFE2CC',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    marginBottom: 30,
  },
  track: { height: 2, borderRadius: 2, backgroundColor: 'rgba(255,248,251,0.28)' },
  fill: { height: 2, borderRadius: 2, backgroundColor: colors.cream },
  knob: { position: 'absolute', top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.lightFaint },
  gone: { marginTop: 14, fontFamily: fonts.sans, fontSize: 12, color: colors.lightFaint },
  lives: { position: 'absolute', left: 30, right: 30, alignItems: 'center' },
});
