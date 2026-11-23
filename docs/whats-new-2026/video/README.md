# What's new in 2026: animated video

A motion-graphics video of the "What's new in 2026" deck, narrated with the [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)
neural voice (Apache 2.0), with background music and English subtitles.

- `arena-whats-new-2026.mp4`: the video (4K, 3840×2160, about 5 minutes), grouped by area: look and feel, survey design,
  maps, data, analysis, users and security, and a short AI scene (AI features have a video of their own).
- `arena-whats-new-2026-720p.mp4`: a 1280×720 copy of the video, light enough to share in a Zoom call. Made from the
  4K video with:
  `ffmpeg -i arena-whats-new-2026.mp4 -map 0 -vf "scale=1280:720:flags=lanczos:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 20 -c:a copy -c:s copy -movflags +faststart arena-whats-new-2026-720p.mp4`
- `arena-ai-v5.mp4`: the AI features video (1920×1080, about 3 minutes).
- `scenes.json`: the script: for each scene, the narration (`say`, one entry per sentence) and the animated items
  (screenshots, chips, cards, ...). An item with `"at": n` appears when sentence `n` starts (plus `delay` seconds).
  Acronyms are spelled with hyphens (e.g. "A-O-I") so that the voice pronounces them letter by letter.
- `index.html`, `style.css`, `engine.js`: the animation; `render(t)` draws the frame at time `t`.
- `tts.py`: narration (Kokoro), scene timeline and subtitles. `music.py`: background track. `render.mjs`: frame capture
  with Playwright. `build.py`: runs everything.
- Images come from `web-resources/img/whats-new/` and `docs/whats-new-2026/`; fonts (Rubik, Nunito Sans, OFL) are in `fonts/`.

## Building

Requirements: Python 3, ffmpeg, the repo dependencies (`yarn install`, for Playwright) with Chromium
(`npx playwright install chromium`), and the Python packages for the voice:

```bash
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
# without ensurepip (Debian/Ubuntu without python3-venv), with uv:
uv venv .venv && uv pip install --python .venv/bin/python kokoro-onnx soundfile
```

If Playwright asks for a browser version that is not installed, `CHROMIUM_PATH` can point to another Chromium
(e.g. `~/.cache/ms-playwright/chromium_headless_shell-<version>/chrome-headless-shell-linux64/chrome-headless-shell`).

```bash
cd docs/whats-new-2026/video
../../../.venv/bin/python build.py arena-whats-new-2026.mp4             # 4K
../../../.venv/bin/python build.py out.mp4 --height 1080                 # faster
../../../.venv/bin/python build.py out.mp4 --skip-audio                  # reuse narration and music in build/
```

The first run downloads the Kokoro model (310 MB) from Hugging Face into `build/kokoro`. Change the voice in
`scenes.json` (`voice`, e.g. `af_heart`, `af_bella`, `am_michael`, `bf_emma`, `bm_george`).

To check a layout without rendering the whole video, render a few stills (after a first build, which writes
`build/timing.json`): `node render.mjs build stills 12,40.5 build/stills`.
