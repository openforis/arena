# What's new in 2026: narrated video

- `narration.txt`: one paragraph per slide of `../arena-whats-new-2026.pdf` (acronyms spelled out, e.g. "A O I", for the
  speech synthesizer).
- `build.py`: turns the slides and the narration into a video (slow zoom, crossfades, progress bar, background pad,
  loudness normalized to -16 LUFS).
- `arena-whats-new-2026.mp4`: the video built with the Festival voice (4K, 3840×2160, 4 min 15 s, about 70 MB).

## Building the video

Requirements: Python 3, ffmpeg and poppler (`pdftoppm`), plus a speech synthesizer:

- macOS: `brew install ffmpeg poppler`; the built-in `say` command is used. For a natural voice, download a
  *Premium* or *Enhanced* voice in System Settings > Accessibility > Spoken Content > System voice > Manage voices.
- Linux: `apt-get install ffmpeg poppler-utils festival festvox-us-slt-hts`.

```bash
cd docs/whats-new-2026/video
# 4K (default), voice chosen by the OS (say on macOS, Festival on Linux)
python3 build.py ../arena-whats-new-2026.pdf arena-whats-new-2026.mp4
# macOS premium voice, 1080p
python3 build.py ../arena-whats-new-2026.pdf arena-whats-new-2026.mp4 --tts say --say-voice "Ava (Premium)" --height 1080
# recorded narration or audio from a TTS service (e.g. ElevenLabs): one file per slide, 01.wav ... 20.wav
python3 build.py ../arena-whats-new-2026.pdf arena-whats-new-2026.mp4 --audio-dir ~/narration
```

`say -v '?'` lists the installed macOS voices. Intermediate files go to `build/` (not committed). A 4K build takes
about 15 minutes; `--reuse-clips` skips the slide clips already rendered (only if the narration durations did not change).
After changing the deck, export it again as PDF and keep `narration.txt` with one paragraph per slide.
