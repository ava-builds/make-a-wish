import { View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/** On web, Skia's renderer (CanvasKit) has to load before the sky can draw. */
export default function SkiaGate() {
  return (
    <WithSkiaWeb
      getComponent={() => import('./Main')}
      // Load the renderer next to the page, so it works at any address (e.g. GitHub Pages).
      opts={{ locateFile: (file: string) => new URL(file, window.location.origin + window.location.pathname.replace(/[^/]*$/, '')).href }}
      fallback={<View style={{ flex: 1, backgroundColor: '#070B18' }} />}
    />
  );
}
