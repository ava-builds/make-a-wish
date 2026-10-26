import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';

/** Small four-pointed sparkle used as a typographic ornament. */
export function Sparkle({ size = 12, color = colors.light, style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const c = size / 2;
  const k = c * 0.16;
  return (
    <View style={style}>
      <Svg width={size} height={size}>
        <Path d={`M ${c} 0 Q ${c + k} ${c - k} ${size} ${c} Q ${c + k} ${c + k} ${c} ${size} Q ${c - k} ${c + k} 0 ${c} Q ${c - k} ${c - k} ${c} 0 Z`} fill={color} />
      </Svg>
    </View>
  );
}

export function Title({ children, dark, style }: { children: string; dark?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, dark ? styles.dark : styles.lightShadow, style]}>{children}</Text>;
}

export function Sub({ children, dark, style }: { children: string; dark?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sub, dark ? styles.darkSoft : styles.lightShadow, style]}>{children}</Text>;
}

/** The cream glowing pill from the opening screen. */
export function PillButton({ label, onPress, wide }: { label: string; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.pillWrap, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}>
      <LinearGradient colors={['#FFF6EE', '#FBE3D6', '#F6D3D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pill, wide && { paddingHorizontal: 34 }]}>
        <Text style={styles.pillText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function TextLink({ label, onPress, dark }: { label: string; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.55 }}>
      <Text style={[styles.link, dark ? styles.darkSoft : styles.lightShadow]}>{label}</Text>
    </Pressable>
  );
}

/** A round, softly glassy icon button. */
export function IconButton({ onPress, children, label, size = 38 }: { onPress: () => void; children: ReactNode; label: string; size?: number }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.icon, { width: size, height: size, borderRadius: size }, pressed && { opacity: 0.6 }]}>
      {children}
    </Pressable>
  );
}

export function CloseGlyph({ color = colors.light }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path d="M3 3 L13 13 M13 3 L3 13" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function BackGlyph({ color = colors.light }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path d="M10.5 2.5 L5 8 L10.5 13.5" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DotsGlyph({ color = colors.light }: { color?: string }) {
  return (
    <Svg width={18} height={6} viewBox="0 0 18 6">
      <Circle cx={3} cy={3} r={1.5} fill={color} />
      <Circle cx={9} cy={3} r={1.5} fill={color} />
      <Circle cx={15} cy={3} r={1.5} fill={color} />
    </Svg>
  );
}

export function MicGlyph({ size = 34, color = colors.light }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3.2a2.9 2.9 0 0 1 2.9 2.9v5.6a2.9 2.9 0 0 1-5.8 0V6.1A2.9 2.9 0 0 1 12 3.2Z" fill="none" stroke={color} strokeWidth={1.2} />
      <Path d="M6.2 11.4a5.8 5.8 0 0 0 11.6 0M12 17.3v3.3M9.2 20.6h5.6" fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

export function HeartGlyph({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function MoonGlyph({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function HomeGlyph({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-5.5H9V20H4.5a.5.5 0 0 1-.5-.5Z" fill={color} />
    </Svg>
  );
}

export function PersonGlyph({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.5} r={3.6} fill="none" stroke={color} strokeWidth={1.5} />
      <Path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function ConstellationGlyph({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 17 10 8l5 6 4-8" fill="none" stroke={color} strokeWidth={1} strokeLinejoin="round" />
      <Circle cx={5} cy={17} r={1.6} fill={color} />
      <Circle cx={10} cy={8} r={1.6} fill={color} />
      <Circle cx={15} cy={14} r={1.6} fill={color} />
      <Circle cx={19} cy={6} r={1.6} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40, textAlign: 'center', color: colors.light, letterSpacing: 0.2 },
  sub: { fontFamily: fonts.sansLight, fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.lightSoft, letterSpacing: 0.3 },
  dark: { color: colors.plum },
  darkSoft: { color: colors.plumSoft },
  lightShadow: { textShadowColor: colors.shadow, textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } },
  pillWrap: {
    borderRadius: 30,
    shadowColor: '#FFE6D6',
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  pill: { borderRadius: 30, paddingHorizontal: 52, paddingVertical: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  pillText: { fontFamily: fonts.sans, fontSize: 15, color: colors.plum, letterSpacing: 0.4, textAlign: 'center' },
  link: { fontFamily: fonts.sans, fontSize: 13, color: colors.lightSoft, letterSpacing: 0.3, textAlign: 'center' },
  icon: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassLine },
});
