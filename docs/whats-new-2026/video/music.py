"""Generate a light background track (C - G - Am - F, 100 BPM) of the given length."""
import argparse

import numpy as np
import soundfile as sf

SR = 48000
BPM = 100
BEAT = 60 / BPM
CHORDS = [  # (bass, tones)
    (36, [60, 64, 67, 72]),  # C
    (43, [59, 62, 67, 71]),  # G
    (45, [60, 64, 69, 72]),  # Am
    (41, [60, 65, 69, 72]),  # F
]
ARP = [0, 1, 2, 3, 2, 1, 2, 3]  # chord tone index of each eighth note


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def tone(freq, dur, harmonics=(1.0,), detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for n, amp in enumerate(harmonics, 1):
        for d in ((-detune, detune) if detune else (0,)):
            out += amp * np.sin(2 * np.pi * freq * n * (1 + d) * t + n)
    return out


def add(buf, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= buf.shape[0]:
        return
    sig = sig[:buf.shape[0] - i] * gain
    buf[i:i + len(sig), 0] += sig * (1 - pan) / 2 ** 0.5
    buf[i:i + len(sig), 1] += sig * (1 + pan) / 2 ** 0.5


def envelope(n, attack, release):
    env = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    env[:a] = np.linspace(0, 1, a)
    env[n - r:] *= np.linspace(1, 0, r)
    return env


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('seconds', type=float)
    p.add_argument('out')
    args = p.parse_args()

    rng = np.random.default_rng(7)
    total = args.seconds
    buf = np.zeros((int(total * SR) + SR * 4, 2))
    bar = 4 * BEAT
    chord_len = 2 * bar
    n_chords = int(np.ceil(total / chord_len)) + 1
    tk = np.arange(int(0.35 * SR)) / SR
    kick = np.sin(2 * np.pi * (50 * tk + 70 * (1 - np.exp(-tk * 30)) / 30)) * np.exp(-tk * 9)
    hat = rng.standard_normal(int(0.06 * SR))
    hat = np.diff(hat, prepend=0) * np.exp(-np.arange(len(hat)) / SR * 70)

    for c in range(n_chords):
        start = c * chord_len
        bass, tones = CHORDS[c % len(CHORDS)]
        # pad
        for m in tones:
            sig = tone(hz(m), chord_len + 0.8, (1.0, 0.25, 0.08), detune=0.002)
            add(buf, start, sig * envelope(len(sig), 0.9, 1.2), 0.035, pan=(m % 7 - 3) / 8)
        # bass, one note per bar
        for b in range(2):
            sig = tone(hz(bass), bar, (1.0, 0.3))
            add(buf, start + b * bar, sig * envelope(len(sig), 0.02, 0.4) * np.exp(-np.arange(len(sig)) / SR * 0.6),
                0.11)
        # plucked arpeggio, eighth notes, one octave up
        intro = start < 4 * bar
        for e in range(16):
            m = tones[ARP[e % 8]] + 12
            sig = tone(hz(m), 0.9, (1.0, 0.5, 0.2))
            t = np.arange(len(sig)) / SR
            sig *= np.exp(-t * 5.5) * np.minimum(1, t * 400)
            vel = 0.9 if e % 4 == 0 else 0.6
            add(buf, start + e * BEAT / 2, sig, (0.03 if intro else 0.05) * vel, pan=0.4 if e % 2 else -0.4)
        # soft drums after the intro
        if not intro:
            for b in range(8):
                beat_t = start + b * BEAT
                if b % 2 == 0:
                    add(buf, beat_t, kick, 0.22)
                add(buf, beat_t + BEAT / 2, hat, 0.035, pan=0.2)

    # simple stereo echo for space
    out = buf.copy()
    for delay, gain in ((0.19, 0.25), (0.37, 0.15), (0.61, 0.08)):
        d = int(delay * SR)
        out[d:, 0] += buf[:-d, 1] * gain
        out[d:, 1] += buf[:-d, 0] * gain
    out = out[:int(total * SR)]
    fade_in, fade_out = int(2 * SR), int(5 * SR)
    out[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    out[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    out *= 0.9 / np.max(np.abs(out))
    sf.write(args.out, out.astype(np.float32), SR)


if __name__ == '__main__':
    main()
