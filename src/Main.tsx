import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { DeviceMotion } from 'expo-sensors';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_300Light, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import Cosmos from './cosmos/Cosmos';
import { CosmosContext, useCosmosState } from './cosmos/controls';
import { hush } from './presence';
import { setMusicOn, startMusic } from './music';
import { addStar, loadStars, loadMusicPref, removeStar, saveMusicPref, toSky, type Star } from './store';
import Opening from './screens/Opening';
import Home from './screens/Home';
import Ritual from './screens/Ritual';
import Universe from './screens/Universe';
import Play from './screens/Play';
import { isWeb, type Kind } from './theme';
import { warmUpMicrophone } from './useVoice';

type Route = 'opening' | 'home' | 'ritual' | 'universe' | 'play';

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export default function Main() {
  const c = useCosmosState();
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });
  const [route, setRoute] = useState<Route>('opening');
  const [kind, setKind] = useState<Kind>(0);
  const [ritualKind, setRitualKind] = useState<Kind>(0);
  const [stars, setStars] = useState<Star[]>([]);
  const [fresh, setFresh] = useState(false);
  const [open, setOpen] = useState<Star | null>(null);
  const [musicOn, setMusicOnState] = useState(true);
  const tap = useRef<((x: number, y: number) => void) | null>(null);
  const starsRef = useRef<Star[]>([]);
  starsRef.current = stars;

  useEffect(() => {
    loadStars().then(setStars);
    // Calm music fades in as the app opens (on the web, it starts at the first tap).
    loadMusicPref().then((on) => {
      setMusicOnState(on);
      setMusicOn(on, !isWeb);
    });
  }, []);

  useEffect(() => {
    c.wishes.value = toSky(stars);
  }, [stars, c]);

  // The whole world shifts gently with the phone's tilt, like looking through a window.
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    DeviceMotion.isAvailableAsync()
      .then((ok) => {
        if (!ok) return;
        if (!isWeb) DeviceMotion.setUpdateInterval(40);
        sub = DeviceMotion.addListener((m) => {
          const r = m.rotation;
          if (!r) return;
          c.tiltX.value = clamp(r.gamma / 0.6);
          c.tiltY.value = clamp((r.beta - 0.9) / 0.6);
        });
      })
      .catch(() => {});
    return () => sub?.remove();
  }, [c]);

  const go = useCallback(
    (r: Route) => {
      hush(c);
      setRoute(r);
    },
    [c],
  );

  const onRecorded = useCallback(
    async (uri: string | null) => {
      setRitualKind(kind);
      go('ritual');
      const list = await addStar(starsRef.current, kind, uri);
      setStars(list);
      setFresh(true);
    },
    [kind, go],
  );

  const toUniverse = useCallback(() => go('universe'), [go]);
  const toHome = useCallback(() => {
    setFresh(false);
    go('home');
  }, [go]);
  const openStar = useCallback(
    (s: Star) => {
      setFresh(false);
      setOpen(s);
      go('play');
    },
    [go],
  );
  const register = useCallback((fn: ((x: number, y: number) => void) | null) => {
    tap.current = fn;
  }, []);
  const onMusic = useCallback((on: boolean) => {
    setMusicOnState(on);
    setMusicOn(on);
    saveMusicPref(on);
  }, []);
  const deleteOpen = useCallback(async () => {
    if (!open) return;
    const list = await removeStar(starsRef.current, open.id);
    setStars(list);
    setOpen(null);
    go('universe');
  }, [open, go]);

  let screen: React.ReactNode = null;
  if (route === 'opening') screen = (
      <Opening
        onEnter={() => {
          startMusic();
          warmUpMicrophone();
          go('home');
        }}
      />
    );
  else if (route === 'home') screen = <Home kind={kind} onKind={setKind} onRecorded={onRecorded} onUniverse={toUniverse} />;
  else if (route === 'ritual') screen = <Ritual kind={ritualKind} onUniverse={toUniverse} onAgain={toHome} />;
  else if (route === 'universe')
    screen = (
      <Universe stars={stars} fresh={fresh} register={register} onOpen={openStar} onHome={toHome} onNew={toHome} musicOn={musicOn} onMusic={onMusic} />
    );
  else if (route === 'play' && open) screen = <Play star={open} onBack={toUniverse} onDelete={deleteOpen} />;

  return (
    <CosmosContext.Provider value={c}>
      <View style={styles.root}>
        <StatusBar style="light" />
        <Cosmos onTap={(x, y) => tap.current?.(x, y)} />
        {fontsLoaded && (
          <Animated.View key={route} entering={FadeIn.duration(900)} exiting={FadeOut.duration(450)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {screen}
          </Animated.View>
        )}
      </View>
    </CosmosContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#8E85C4' },
});
