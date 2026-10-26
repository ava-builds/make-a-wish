import { SafeAreaProvider } from 'react-native-safe-area-context';
import SkiaGate from './src/SkiaGate';

/**
 * Make a Wish — a quiet night sky and one living star.
 * Opening → wish (voice) → release → gratitude (voice) → my wishes (constellation).
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <SkiaGate />
    </SafeAreaProvider>
  );
}
