"""Build the narrated "What's new in 2026" video from the deck PDF."""
import subprocess
import sys
from pathlib import Path

D = Path(__file__).parent
PDF = sys.argv[1]
OUT = sys.argv[2]
FPS = 30
XF = 0.7  # crossfade seconds
LEAD, TAIL = 0.6, 0.9  # silence before / after each narration
GREEN = '0x1E7A52'


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         check=True, capture_output=True, text=True).stdout
    return float(out)


lines = [line.strip() for line in (D / 'narration.txt').read_text().splitlines() if line.strip()]
(D / 'slides').mkdir(exist_ok=True)
(D / 'audio').mkdir(exist_ok=True)
(D / 'clips').mkdir(exist_ok=True)
run(['pdftoppm', '-png', '-scale-to-x', '3840', '-scale-to-y', '2160', PDF, str(D / 'slides' / 's')])
slides = sorted((D / 'slides').glob('s-*.png'))
assert len(slides) == len(lines), (len(slides), len(lines))

durations = []
for i, (slide, text) in enumerate(zip(slides, lines)):
    raw = D / 'audio' / f'raw{i:02d}.wav'
    wav = D / 'audio' / f'n{i:02d}.wav'
    subprocess.run(['text2wave', '-eval', '(voice_cmu_us_slt_arctic_hts)', '-o', str(raw)], input=text, text=True,
                   check=True)
    # slightly slower and warmer narration, 48 kHz stereo
    run(['ffmpeg', '-y', '-i', str(raw), '-af',
         'atempo=0.94,highpass=f=70,equalizer=f=180:t=q:w=1:g=3,equalizer=f=4500:t=q:w=1:g=-2,'
         'aresample=48000,pan=stereo|c0=c0|c1=c0', str(wav)])
    dur = LEAD + duration(wav) + TAIL
    durations.append(dur)
    frames = int(dur * FPS)
    zoom_in = i % 2 == 0
    z = f"1+0.06*on/{frames}" if zoom_in else f"1.06-0.06*on/{frames}"
    vf = (f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps={FPS},"
          "format=yuv420p")
    clip = D / 'clips' / f'c{i:02d}.mp4'
    if not clip.exists():
      run(['ffmpeg', '-y', '-loop', '1', '-i', str(slide), '-vf', vf, '-frames:v', str(frames), '-c:v', 'libx264',
         '-preset', 'medium', '-crf', '18', str(D / 'clips' / f'c{i:02d}.mp4')])
    print(f'slide {i + 1}: {dur:.1f}s', flush=True)

# video: crossfade chain
inputs, filters = [], []
for i in range(len(slides)):
    inputs += ['-i', str(D / 'clips' / f'c{i:02d}.mp4')]
prev, offset = '0:v', 0.0
starts = [0.0]
for i in range(1, len(slides)):
    offset += durations[i - 1] - XF
    starts.append(offset)
    out = f'v{i}'
    transition = 'fadeblack' if i in (1, len(slides) - 1) else 'smoothleft' if i % 3 == 0 else 'fade'
    filters.append(f'[{prev}][{i}:v]xfade=transition={transition}:duration={XF}:offset={offset:.3f}[{out}]')
    prev = out
total = starts[-1] + durations[-1]

# progress bar
filters.append(f'color=c={GREEN}:s=1920x8:r={FPS}:d={total:.3f}[bar]')
filters.append(f"[{prev}][bar]overlay=x='-W+W*t/{total:.3f}':y=H-8:shortest=1,format=yuv420p[vout]")

# narration placed at slide starts
n = len(slides)
for i in range(n):
    inputs += ['-i', str(D / 'audio' / f'n{i:02d}.wav')]
    ms = int((starts[i] + LEAD) * 1000)
    filters.append(f'[{n + i}:a]adelay={ms}|{ms}[a{i}]')
# soft ambient pad (A major add9), slow swell, ducked under the voice
pad = ('aevalsrc=exprs=\'('
       '0.05*sin(2*PI*110*t)+0.035*sin(2*PI*164.81*t)+0.03*sin(2*PI*220*t)+0.025*sin(2*PI*277.18*t)'
       '+0.02*sin(2*PI*329.63*t)+0.012*sin(2*PI*493.88*t)'
       ')*(0.75+0.25*sin(2*PI*0.08*t))\''
       f':s=48000:d={total:.3f},aecho=0.8:0.7:120|240:0.35|0.25,lowpass=f=1800,'
       f'afade=t=in:d=3,afade=t=out:st={total - 4:.3f}:d=4,pan=stereo|c0=c0|c1=c0,volume=0.55[pad]')
filters.append(pad)
voice_labels = ''.join(f'[a{i}]' for i in range(n))
filters.append(f'{voice_labels}amix=inputs={n}:normalize=0,apad=whole_dur={total:.3f},asplit=2[voice][sc]')
filters.append('[pad][sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=600[padd]')
filters.append('[voice][padd]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]')

(D / 'filter.txt').write_text(';\n'.join(filters))
run(['ffmpeg', '-y', *inputs, '-filter_complex_script', str(D / 'filter.txt'), '-map', '[vout]', '-map', '[aout]',
     '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
     '-movflags', '+faststart', '-t', f'{total:.3f}', OUT])
print(f'done: {OUT} ({total:.1f}s)')
