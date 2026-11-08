"""Build the narrated "What's new in 2026" video from the deck PDF (see README.md)."""
import argparse
import platform
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
FPS = 30
XF = 0.7  # crossfade seconds
LEAD, TAIL = 0.6, 0.9  # silence before / after each narration
ZOOM = 0.06  # Ken Burns zoom amount
GREEN = '0x1E7A52'


def parse_args():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('pdf', help='deck exported as PDF')
    p.add_argument('out', help='output .mp4 file')
    p.add_argument('--height', type=int, default=2160, choices=(1080, 1440, 2160), help='video height (default 4K)')
    p.add_argument('--crf', type=int, default=27, help='x264 quality, lower is better and bigger (default 27)')
    p.add_argument('--tts', choices=('auto', 'festival', 'say'), default='auto',
                   help='speech synthesizer: festival (Linux) or say (macOS); auto picks say on macOS')
    p.add_argument('--say-voice', default='Samantha',
                   help='macOS voice, e.g. "Ava (Premium)" (download it in System Settings > Accessibility > Spoken Content)')
    p.add_argument('--audio-dir', type=Path,
                   help='use recorded narration instead: one file per slide, named 01.wav (or .mp3, .m4a), 02.wav, ...')
    p.add_argument('--reuse-clips', action='store_true',
                   help='keep the slide clips already in the work dir (when only the narration timing is unchanged)')
    p.add_argument('--work-dir', type=Path, default=HERE / 'build', help='intermediate files (default ./build)')
    return p.parse_args()


def run(cmd, **kwargs):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, **kwargs)


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         check=True, capture_output=True, text=True).stdout
    return float(out)


def recorded_audio(audio_dir, i):
    for ext in ('wav', 'mp3', 'm4a', 'aac', 'flac', 'ogg'):
        f = audio_dir / f'{i + 1:02d}.{ext}'
        if f.exists():
            return f
    raise SystemExit(f'missing narration for slide {i + 1} in {audio_dir}')


def synthesize(args, text, raw):
    """Write the narration of a slide to raw (wav or aiff); returns the extra audio filters to apply."""
    if args.tts == 'say':
        run(['say', '-v', args.say_voice, '-o', str(raw), text])
        return ''
    subprocess.run(['text2wave', '-eval', '(voice_cmu_us_slt_arctic_hts)', '-o', str(raw)], input=text, text=True,
                   check=True)
    # slightly slower and warmer
    return 'atempo=0.94,highpass=f=70,equalizer=f=180:t=q:w=1:g=3,equalizer=f=4500:t=q:w=1:g=-2,'


def narration(args, work, i, text):
    wav = work / 'audio' / f'n{i:02d}.wav'
    if args.audio_dir:
        src, extra = recorded_audio(args.audio_dir, i), ''
    else:
        src = work / 'audio' / f'raw{i:02d}.{"aiff" if args.tts == "say" else "wav"}'
        extra = synthesize(args, text, src)
    run(['ffmpeg', '-y', '-i', str(src), '-af', f'{extra}aresample=48000,aformat=channel_layouts=mono,'
         'pan=stereo|c0=c0|c1=c0', str(wav)])
    return wav


def clip(work, slide, i, dur, width, height, reuse):
    frames = int(dur * FPS)
    out = work / 'clips' / f'c{i:02d}.mp4'
    if reuse and out.exists():
        return out
    z = f'1+{ZOOM}*on/{frames}' if i % 2 == 0 else f'{1 + ZOOM}-{ZOOM}*on/{frames}'
    vf = (f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={width}x{height}:fps={FPS},"
          'format=yuv420p')
    run(['ffmpeg', '-y', '-loop', '1', '-i', str(slide), '-vf', vf, '-frames:v', str(frames), '-c:v', 'libx264',
         '-preset', 'medium', '-crf', '14', '-tune', 'stillimage', str(out)])
    return out


def audio_filters(n, starts, total):
    filters = []
    for i in range(n):
        ms = int((starts[i] + LEAD) * 1000)
        filters.append(f'[{n + i}:a]adelay={ms}|{ms}[a{i}]')
    # soft ambient pad (A major add9) with a slow swell, ducked under the voice
    filters.append(
        "aevalsrc=exprs='(0.05*sin(2*PI*110*t)+0.035*sin(2*PI*164.81*t)+0.03*sin(2*PI*220*t)"
        "+0.025*sin(2*PI*277.18*t)+0.02*sin(2*PI*329.63*t)+0.012*sin(2*PI*493.88*t))*(0.75+0.25*sin(2*PI*0.08*t))'"
        f':s=48000:d={total:.3f},aecho=0.8:0.7:120|240:0.35|0.25,lowpass=f=1800,'
        f'afade=t=in:d=3,afade=t=out:st={total - 4:.3f}:d=4,pan=stereo|c0=c0|c1=c0,volume=0.55[pad]')
    voices = ''.join(f'[a{i}]' for i in range(n))
    filters.append(f'{voices}amix=inputs={n}:normalize=0,apad=whole_dur={total:.3f},asplit=2[voice][sc]')
    filters.append('[pad][sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=600[padd]')
    filters.append('[voice][padd]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]')
    return filters


def main():
    args = parse_args()
    if args.tts == 'auto':
        args.tts = 'say' if platform.system() == 'Darwin' else 'festival'
    tools = ['ffmpeg', 'ffprobe', 'pdftoppm']
    if not args.audio_dir:
        tools.append('say' if args.tts == 'say' else 'text2wave')
    for tool in tools:
        if not shutil.which(tool):
            raise SystemExit(f'{tool} not found, see README.md')
    width, height = args.height * 16 // 9, args.height
    work = args.work_dir
    for sub in ('slides', 'audio', 'clips'):
        (work / sub).mkdir(parents=True, exist_ok=True)

    lines = [line.strip() for line in (HERE / 'narration.txt').read_text().splitlines() if line.strip()]
    # slides rendered larger than the video, so that the zoom stays sharp
    for old in (work / 'slides').glob('s-*.png'):
        old.unlink()
    run(['pdftoppm', '-png', '-scale-to-x', str(width * 3 // 2), '-scale-to-y', str(height * 3 // 2), args.pdf,
         str(work / 'slides' / 's')])
    slides = sorted((work / 'slides').glob('s-*.png'))
    if len(slides) != len(lines):
        raise SystemExit(f'{len(slides)} slides but {len(lines)} narration paragraphs')

    durations, clips, wavs = [], [], []
    for i, (slide, text) in enumerate(zip(slides, lines)):
        wavs.append(narration(args, work, i, text))
        durations.append(LEAD + duration(wavs[-1]) + TAIL)
        clips.append(clip(work, slide, i, durations[-1], width, height, args.reuse_clips))
        print(f'slide {i + 1}/{len(slides)}: {durations[-1]:.1f}s', flush=True)

    n = len(slides)
    filters, starts, prev, offset = [], [0.0], '0:v', 0.0
    for i in range(1, n):
        offset += durations[i - 1] - XF
        starts.append(offset)
        transition = 'fadeblack' if i in (1, n - 1) else 'smoothleft' if i % 3 == 0 else 'fade'
        filters.append(f'[{prev}][{i}:v]xfade=transition={transition}:duration={XF}:offset={offset:.3f}[v{i}]')
        prev = f'v{i}'
    total = starts[-1] + durations[-1]
    bar = max(4, height // 135)
    filters.append(f'color=c={GREEN}:s={width}x{bar}:r={FPS}:d={total:.3f}[bar]')
    filters.append(f"[{prev}][bar]overlay=x='-W+W*t/{total:.3f}':y=H-{bar}:shortest=1,format=yuv420p[vout]")
    filters += audio_filters(n, starts, total)

    script = work / 'filter.txt'
    script.write_text(';\n'.join(filters))
    inputs = [x for f in clips + wavs for x in ('-i', str(f))]
    run(['ffmpeg', '-y', *inputs, '-filter_complex_script', str(script), '-map', '[vout]', '-map', '[aout]',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', str(args.crf), '-tune', 'stillimage', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', f'{total:.3f}', args.out])
    print(f'done: {args.out} ({total:.1f}s, {width}x{height})')


if __name__ == '__main__':
    main()
