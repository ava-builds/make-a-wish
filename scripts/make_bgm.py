"""Compose a calm, seamless ambient loop for Make a Wish (original, generated from scratch)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
CHORD_S = 12.0
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# Dreamy D-major progression (MIDI notes), 12 s each, 96 s loop.
CHORDS = [
    [50, 57, 61, 64, 66, 69],  # Dmaj9
    [47, 54, 57, 61, 64, 66],  # Bm11
    [43, 50, 54, 57, 61, 64],  # Gmaj9(#11-ish)
    [45, 52, 57, 59, 64, 66],  # Asus2/add9
    [42, 50, 54, 57, 61, 66],  # Dmaj7/F#
    [40, 47, 54, 57, 59, 62],  # Em9
    [43, 50, 54, 59, 62, 66],  # Gmaj7
    [45, 52, 57, 59, 61, 64],  # Asus
]
LOOP = CHORD_S * len(CHORDS)
TAIL = 22.0
N = int(SR * (LOOP + TAIL))
t = np.arange(N) / SR


def pad_voice(freq, start, dur):
    """A soft, slowly breathing pad note: detuned sines with a gentle triangle body."""
    n0 = int(start * SR)
    n = int(dur * SR)
    tt = np.arange(n) / SR
    att, rel = 4.0, 5.0
    env = np.minimum(1, tt / att) * np.minimum(1, (dur - tt) / rel)
    env = np.clip(env, 0, 1) ** 1.6
    sig = np.zeros(n)
    for det in (-0.06, 0.0, 0.055):
        f = freq * 2 ** (det / 12)
        ph = rng.uniform(0, 2 * np.pi)
        sig += np.sin(2 * np.pi * f * tt + ph)
        # a little soft triangle colour
        sig += 0.18 * (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * tt + ph))
    # slow shimmer
    sig *= 1 + 0.06 * np.sin(2 * np.pi * rng.uniform(0.05, 0.12) * tt + rng.uniform(0, 6))
    return n0, sig * env / 3.5


left = np.zeros(N)
right = np.zeros(N)

for i, chord in enumerate(CHORDS):
    start = i * CHORD_S - 2.0  # overlap so chords melt into each other
    dur = CHORD_S + 6.0
    for k, note in enumerate(chord):
        if start < 0:
            start_eff = start + LOOP  # wrap the first chord's fade-in to the end
        else:
            start_eff = start
        n0, sig = pad_voice(midi(note + 12), start_eff, dur)
        gain = 0.55 if k == 0 else 0.42
        pan = 0.5 + (k / (len(chord) - 1) - 0.5) * 0.7
        end = min(N, n0 + len(sig))
        seg = sig[: end - n0] * gain
        left[n0:end] += seg * np.cos(pan * np.pi / 2)
        right[n0:end] += seg * np.sin(pan * np.pi / 2)
    # warm low root
    n0, sig = pad_voice(midi(chord[0] - 12 + 12), (start if start >= 0 else start + LOOP), dur)
    end = min(N, n0 + len(sig))
    left[n0:end] += sig[: end - n0] * 0.5
    right[n0:end] += sig[: end - n0] * 0.5

# Gentle chimes on a D-major pentatonic scale.
PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93]
tc = 1.0
while tc < LOOP - 1:
    note = PENTA[rng.integers(len(PENTA))]
    f = midi(note)
    dur = 4.5
    n0 = int(tc * SR)
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = np.exp(-tt * 1.3) * np.minimum(1, tt / 0.006)
    bell = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 2.5) + 0.12 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 4)
    bell *= env * 0.11
    pan = rng.uniform(0.2, 0.8)
    end = min(N, n0 + n)
    left[n0:end] += bell[: end - n0] * np.cos(pan * np.pi / 2)
    right[n0:end] += bell[: end - n0] * np.sin(pan * np.pi / 2)
    tc += rng.uniform(1.8, 4.5)

# Warmth: soften the highs a little.
sos = butter(2, 5200, btype="low", fs=SR, output="sos")
left, right = sosfilt(sos, left), sosfilt(sos, right)

# Soft hall reverb from a synthetic impulse response.
ir_len = int(3.8 * SR)
irt = np.arange(ir_len) / SR
ir_sos = butter(2, 3500, btype="low", fs=SR, output="sos")
irL = sosfilt(ir_sos, rng.standard_normal(ir_len)) * np.exp(-irt * 1.6)
irR = sosfilt(ir_sos, rng.standard_normal(ir_len)) * np.exp(-irt * 1.6)
irL /= np.sqrt(np.sum(irL ** 2))
irR /= np.sqrt(np.sum(irR ** 2))
wetL = fftconvolve(left, irL)[:N]
wetR = fftconvolve(right, irR)[:N]
left = 0.62 * left + 0.55 * wetL
right = 0.62 * right + 0.55 * wetR

# Seamless loop: fold the tail back onto the start.
L = int(LOOP * SR)
outL = left[:L].copy()
outR = right[:L].copy()
tail = N - L
outL[:tail] += left[L:L + tail]
outR[:tail] += right[L:L + tail]

stereo = np.stack([outL, outR], axis=1)
stereo /= np.max(np.abs(stereo)) / 0.7  # gentle level, plenty of headroom
wavfile.write("calm.wav", SR, (stereo * 32767).astype(np.int16))
print("ok", LOOP, "s")
