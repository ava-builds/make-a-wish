import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SCENE, sendWave, setScene, useCosmos } from '../cosmos/controls';
import { hush } from '../presence';
import type { Star } from '../store';
import { HomeGlyph, IconButton, CloseGlyph, PersonGlyph, Sparkle, Sub, Title } from '../ui/kit';
import { colors, fonts, KINDS } from '../theme';

const FILTERS = ['All', ...KINDS];

/** 7 · My Universe — every wish becomes a star. Touch one to hear it again. */
export default function Universe({
  stars,
  fresh,
  register,
  onOpen,
  onHome,
  onNew,
  musicOn,
  onMusic,
}: {
  stars: Star[];
  fresh: boolean;
  register: (fn: ((x: number, y: number) => void) | null) => void;
  onOpen: (s: Star) => void;
  onHome: () => void;
  onNew: () => void;
  musicOn: boolean;
  onMusic: (on: boolean) => void;
}) {
  const c = useCosmos();
  const { width: w, height: h } = useWindowDimensions();
  const [filter, setFilter] = useState(-1);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    hush(c);
    setScene(c, SCENE.UNIVERSE);
    c.filter.value = -1;
    if (fresh && stars.length) {
      const last = stars[stars.length - 1];
      const t = setTimeout(() => sendWave(c, last.x * w, last.y * h), 1200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    register((x, y) => {
      let best: Star | null = null;
      let bestD = 44;
      for (const s of stars) {
        if (filter >= 0 && s.kind !== filter) continue;
        const d = Math.hypot(s.x * w - x, s.y * h - y);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (best) {
        Haptics.selectionAsync().catch(() => {});
        sendWave(c, best.x * w, best.y * h);
        const chosen = best;
        setTimeout(() => onOpen(chosen), 350);
      }
    });
    return () => register(null);
  }, [stars, filter, w, h, register, onOpen, c]);

  const pick = (f: number) => {
    setFilter(f);
    c.filter.value = f;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(1400)} style={[styles.top, { top: h * 0.075 }]} pointerEvents="none">
        <Title style={styles.title}>My Universe</Title>
        <Sparkle size={10} style={{ marginTop: 10 }} />
      </Animated.View>

      <Animated.View entering={FadeIn.duration(1400).delay(300)} style={[styles.chips, { top: h * 0.075 + 76 }]}>
        {FILTERS.map((label, i) => {
          const f = i - 1;
          const on = f === filter;
          return (
            <Pressable key={label} onPress={() => pick(f)} style={[styles.chip, on && styles.chipOn]} hitSlop={6}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {stars.length === 0 && (
        <Animated.View entering={FadeIn.duration(1600).delay(600)} style={[styles.empty, { top: h * 0.45 }]} pointerEvents="none">
          <Sub>Your universe is waiting for its first star.</Sub>
        </Animated.View>
      )}

      <Animated.View entering={FadeIn.duration(1400).delay(500)} style={[styles.nav, { bottom: 30 }]}>
        <Pressable onPress={onHome} hitSlop={10} style={styles.navSide} accessibilityLabel="Home">
          <HomeGlyph color={colors.plum} />
        </Pressable>
        <Pressable onPress={onNew} hitSlop={6} style={styles.navCenter} accessibilityLabel="Make a wish">
          <Sparkle size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={() => setSheet(true)} hitSlop={10} style={styles.navSide} accessibilityLabel="Profile">
          <PersonGlyph color="rgba(77,67,128,0.7)" />
        </Pressable>
      </Animated.View>

      {sheet && (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.sheetBack}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Your space</Text>
              <IconButton onPress={() => setSheet(false)} label="Close" size={32}>
                <CloseGlyph color={colors.plum} />
              </IconButton>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Music</Text>
                <Text style={styles.rowSub}>Calm music in the background</Text>
              </View>
              <Switch value={musicOn} onValueChange={onMusic} trackColor={{ true: '#B9A6E8', false: 'rgba(77,67,128,0.2)' }} thumbColor="#FFFFFF" />
            </View>
            <Text style={styles.count}>
              {stars.length === 1 ? 'One star in your universe' : `${stars.length} stars in your universe`}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 32 },
  chips: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,250,252,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,250,252,0.35)',
  },
  chipOn: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: '#FFFFFF' },
  chipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.lightSoft },
  chipTextOn: { color: colors.plum },
  empty: { position: 'absolute', left: 40, right: 40, alignItems: 'center' },
  nav: {
    position: 'absolute',
    alignSelf: 'center',
    width: 230,
    height: 64,
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,250,252,0.78)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF',
  },
  navSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9B9B4',
    shadowColor: '#F3C2B5',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  sheetBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,24,60,0.35)', justifyContent: 'flex-end' },
  sheet: { margin: 14, marginBottom: 28, padding: 22, borderRadius: 26, backgroundColor: 'rgba(255,250,252,0.94)' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.plum },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.plum },
  rowSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.plumSoft, marginTop: 3 },
  count: { marginTop: 20, fontFamily: fonts.serifItalic, fontSize: 17, color: colors.plumSoft },
});
