"""Build the animated, narrated "What's new in 2026" video (see README.md)."""
import argparse
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
FPS = 30
MUSIC = 'music.wav'


def safe_path(value, suffix=None):
    """Resolve a path given on the command line; it must be in this folder or in the temp folder."""
    path = Path(value).resolve()
    if not any(path.is_relative_to(root) for root in (HERE.resolve(), Path(tempfile.gettempdir()).resolve())):
        raise SystemExit(f'{value}: use a path in {HERE} or in {tempfile.gettempdir()}')
    if suffix and path.suffix != suffix:
        raise SystemExit(f'{value}: expected a {suffix} file')
    return path


def run(cmd, **kwargs):
    print('$', ' '.join(str(c) for c in cmd[:4]), '...', flush=True)
    subprocess.run([str(c) for c in cmd], check=True, **kwargs)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('out', help='output .mp4 file')
    p.add_argument('--height', type=int, default=2160, choices=(1080, 2160), help='video height (default 4K)')
    p.add_argument('--crf', type=int, default=24, help='x264 quality, lower is better and bigger (default 24)')
    p.add_argument('--workers', type=int, default=os.cpu_count() or 4, help='parallel browser renderers')
    p.add_argument('--work-dir', type=Path, default=HERE / 'build', help='intermediate files (default ./build)')
    p.add_argument('--skip-audio', action='store_true', help='reuse the narration and music already in the work dir')
    args = p.parse_args()
    work = safe_path(args.work_dir)
    out = safe_path(args.out, '.mp4')
    work.mkdir(parents=True, exist_ok=True)

    if not args.skip_audio:
        run([sys.executable, HERE / 'tts.py', '--work-dir', work, '--model-dir', work / 'kokoro'])
    timing = json.loads((work / 'timing.json').read_text())
    total = float(timing['total'])
    if not args.skip_audio or not (work / MUSIC).exists():
        run([sys.executable, HERE / 'music.py', f'{total:.3f}', work / MUSIC])

    frames = int(total * FPS)
    chunk = -(-frames // args.workers)
    parts, jobs = [], []
    for i in range(args.workers):
        a, b = i * chunk, min(frames, (i + 1) * chunk)
        if a >= b:
            break
        part = work / f'part{i:02d}.mp4'
        parts.append(part)
        jobs.append(['node', HERE / 'render.mjs', work, 'video', a, b, part, args.height // 1080, args.crf])
    with ThreadPoolExecutor(len(jobs)) as pool:
        for f in [pool.submit(run, job) for job in jobs]:
            f.result()
    (work / 'parts.txt').write_text(''.join(f"file '{part}'\n" for part in parts))
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', work / 'parts.txt', '-c', 'copy',
         work / 'video.mp4'])

    mix = ('[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=2[voice][sc];'
           '[2:a]volume=0.2[music];[music][sc]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=600[ducked];'
           '[voice][ducked]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]')
    run(['ffmpeg', '-y', '-v', 'error', '-i', work / 'video.mp4', '-i', work / 'narration.wav', '-i', work / MUSIC,
         '-i', work / 'subtitles.srt', '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-map', '3:s',
         '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng',
         '-movflags', '+faststart', '-t', f'{total:.3f}', out])
    print(f'done: {out}')


if __name__ == '__main__':
    main()
