# What's new in 2026: narrated video

`narration.txt` has one paragraph per slide of `../arena-whats-new-2026.pdf`; `build.py` turns the slides and the
narration into a 1080p video (slow zoom, crossfades, progress bar, background pad), using Festival with the
`cmu_us_slt_arctic_hts` voice (`apt-get install festival festvox-us-slt-hts`) and ffmpeg:

```bash
python3 build.py ../arena-whats-new-2026.pdf arena-whats-new-2026.mp4
```

The video itself is not committed (about 35 MB). Acronyms are spelled out in `narration.txt` (e.g. "A O I") for the
speech synthesizer.
