import type { Cosmos } from './cosmos/controls';

/**
 * A quiet presence. There is no spoken voice; instead, at the moments the app would
 * "say" something, the light gently pulses for about as long as the words would take,
 * so the star still feels like it's responding to you.
 */
let timer: ReturnType<typeof setTimeout> | null = null;

export function say(c: Cosmos, text: string) {
  if (timer) clearTimeout(timer);
  c.speaking.value = 1;
  timer = setTimeout(() => {
    c.speaking.value = 0;
    timer = null;
  }, Math.min(3500, 600 + text.length * 55));
}

export function hush(c: Cosmos) {
  if (timer) clearTimeout(timer);
  timer = null;
  c.speaking.value = 0;
}
