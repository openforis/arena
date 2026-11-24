// Captures the frames of index.html with Playwright and encodes them with ffmpeg.
// Usage: node render.mts <work-dir> video <from-frame> <to-frame> <out.mp4> [scale] [crf]
//        node render.mts <work-dir> stills <t1,t2,...> <out-dir>
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const load = (name: string) => {
  try {
    return require(name)
  } catch {
    return null
  }
}
// in the repo, after `yarn install`, @playwright/test (used by the e2e tests) is enough
const { chromium } = load('playwright') ?? load('@playwright/test')
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FPS = 30
// ffmpeg from a fixed system location, not from PATH
const FFMPEG_DIRS = ['/usr/bin', '/usr/local/bin', '/opt/homebrew/bin']
const ffmpegPath = () => {
  const found = FFMPEG_DIRS.map((dir) => path.join(dir, 'ffmpeg')).find((file) => existsSync(file))
  if (!found) throw new Error(`ffmpeg not found in ${FFMPEG_DIRS.join(', ')}`)
  return found
}
const [workDir, mode, ...rest] = process.argv.slice(2)

const spec = JSON.parse(readFileSync(path.join(HERE, 'scenes.json'), 'utf8'))
const timing = JSON.parse(readFileSync(path.join(workDir, 'timing.json'), 'utf8'))

const open = async (scale: number) => {
  // CHROMIUM_PATH: a Chromium other than the one of this Playwright version
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale })
  await page.goto(pathToFileURL(path.join(HERE, 'index.html')).href)
  // the page runs the engine as plain JavaScript
  await page.addScriptTag({ content: stripTypeScriptTypes(readFileSync(path.join(HERE, 'engine.ts'), 'utf8')) })
  await page.evaluate(([s, t]) => window.init(s, t), [spec, timing])
  return { browser, page }
}

if (mode === 'stills') {
  const [times, outDir] = rest
  mkdirSync(outDir, { recursive: true })
  const { browser, page } = await open(1)
  const still = async (t: number) => {
    await page.evaluate((x) => window.render(x), t)
    await page.screenshot({ path: path.join(outDir, `t${t.toFixed(1).padStart(6, '0')}.png`) })
  }
  // one page: the stills are taken one after the other
  await times
    .split(',')
    .map(Number)
    .reduce((previous, t) => previous.then(() => still(t)), Promise.resolve())
  await browser.close()
} else {
  const [from, to, out, scale = '2', crf = '20'] = rest
  const { browser, page } = await open(Number(scale))
  const ff = spawn(
    ffmpegPath(),
    [
      '-y',
      '-v',
      'error',
      '-f',
      'image2pipe',
      '-framerate',
      String(FPS),
      '-c:v',
      'mjpeg',
      '-i',
      '-',
      // few threads per encoder: x264 sizes its buffers on the thread count (all cores: ~2.7 GB each at 4K)
      '-c:v',
      'libx264',
      '-threads',
      '2',
      '-preset',
      'medium',
      '-crf',
      crf,
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      out,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  )
  const done = new Promise<void>((resolve, reject) =>
    ff.on('close', (code) => (code ? reject(new Error(`ffmpeg ${code}`)) : resolve()))
  )
  const frame = async (f: number) => {
    await page.evaluate((x) => window.render(x), f / FPS)
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if ((f - Number(from)) % 300 === 0) console.log(`${out}: frame ${f}/${to}`)
  }
  // one page: the frames are rendered in order, one after the other
  const frames = Array.from({ length: Number(to) - Number(from) }, (_, i) => Number(from) + i)
  await frames.reduce((previous, f) => previous.then(() => frame(f)), Promise.resolve())
  ff.stdin.end()
  await done
  await browser.close()
}
