"""Narrate scenes.json with the Kokoro voice; writes the narration track, the timeline and the subtitles."""
import argparse
import json
import re
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).parent
MODEL_URL = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/'
SR = 24000
LEAD, FIRST_LEAD = 0.7, 1.4  # silence before the first sentence of a scene (seconds)
GAP = 0.35  # between sentences
TAIL = 0.9  # after the last sentence
XF = 0.6  # scene overlap (transition)
VOICE_RE = re.compile(r'^[a-z]{2}_[a-z]+$')


def safe_path(value, suffix=None):
    """Resolve a path given on the command line; it must be in this folder or in the temp folder."""
    path = Path(value).resolve()
    if not any(path.is_relative_to(root) for root in (HERE.resolve(), Path(tempfile.gettempdir()).resolve())):
        raise SystemExit(f'{value}: use a path in {HERE} or in {tempfile.gettempdir()}')
    if suffix and path.suffix != suffix:
        raise SystemExit(f'{value}: expected a {suffix} file')
    return path


def ensure_model(model_dir, voice):
    if not VOICE_RE.match(voice):
        raise SystemExit(f'invalid voice: {voice}')
    model_dir.mkdir(parents=True, exist_ok=True)
    model = model_dir / 'model.onnx'
    if not model.exists():
        print('downloading the Kokoro model (310 MB)...', flush=True)
        urllib.request.urlretrieve(MODEL_URL + 'onnx/model.onnx', model)
    voices = model_dir / f'voices-{voice}.npz'
    if not voices.exists():
        raw = model_dir / f'{voice}.bin'
        urllib.request.urlretrieve(MODEL_URL + f'voices/{voice}.bin', raw)
        np.savez(voices, **{voice: np.fromfile(raw, dtype=np.float32).reshape(-1, 1, 256)})
    return model, voices


def srt_time(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--work-dir', type=Path, default=HERE / 'build')
    p.add_argument('--model-dir', type=Path, default=HERE / 'build' / 'kokoro')
    args = p.parse_args()
    work_dir, model_dir = safe_path(args.work_dir), safe_path(args.model_dir)

    from kokoro_onnx import Kokoro

    spec = json.loads((HERE / 'scenes.json').read_text())
    voice, speed = spec['voice'], spec.get('speed', 1.0)
    lang = 'en-gb' if voice.startswith('b') else 'en-us'
    model, voices = ensure_model(model_dir, voice)
    kokoro = Kokoro(str(model), str(voices))

    clips, scenes, subtitles = [], [], []
    start = 0.0
    for k, scene in enumerate(spec['scenes']):
        t = start + (FIRST_LEAD if k == 0 else LEAD)
        segs = []
        for text in scene['say']:
            audio, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang)
            assert sr == SR
            dur = len(audio) / SR
            clips.append((t, audio))
            segs.append({'start': round(t, 3), 'dur': round(dur, 3)})
            subtitles.append((t, t + dur, text.replace('A-I', 'AI').replace('A-O-I', 'AOI').replace('O-D-K', 'ODK')
                              .replace('G-P-S', 'GPS').replace('P-D-F', 'PDF').replace('Q-R', 'QR')
                              .replace('K-M-L', 'KML').replace('W-M-S', 'WMS')))
            t += dur + GAP
        dur = t - GAP + TAIL - start
        scenes.append({'id': scene['id'], 'start': round(start, 3), 'dur': round(dur, 3), 'segs': segs})
        print(f"{scene['id']}: {dur:.1f}s", flush=True)
        start += dur - XF
    total = scenes[-1]['start'] + scenes[-1]['dur']

    track = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for t, audio in clips:
        i = int(t * SR)
        track[i:i + len(audio)] += audio
    work_dir.mkdir(parents=True, exist_ok=True)
    sf.write(work_dir / 'narration.wav', track[:int(total * SR)], SR)
    (work_dir / 'timing.json').write_text(json.dumps({'total': round(total, 3), 'xf': XF, 'scenes': scenes}))
    (work_dir / 'timing.js').write_text('window.TIMING = ' + json.dumps({'total': total, 'xf': XF, 'scenes': scenes}))
    srt = [f'{i}\n{srt_time(a)} --> {srt_time(b)}\n{text}\n' for i, (a, b, text) in enumerate(subtitles, 1)]
    (work_dir / 'subtitles.srt').write_text('\n'.join(srt))
    print(f'total: {total:.1f}s')


if __name__ == '__main__':
    main()
