// Captures the frames of index.html with Playwright and encodes them with ffmpeg.
// Usage: node render.mjs <work-dir> video <from-frame> <to-frame> <out.mp4> [scale] [crf]
//        node render.mjs <work-dir> stills <t1,t2,...> <out-dir>
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const load = (name) => { try { return require(name) } catch { return null } }
// in the repo, after `yarn install`, @playwright/test (used by the e2e tests) is enough
const { chromium } = load('playwright') ?? load('@playwright/test')
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FPS = 30
const [workDir, mode, ...rest] = process.argv.slice(2)

const spec = JSON.parse(readFileSync(path.join(HERE, 'scenes.json'), 'utf8'))
const timing = JSON.parse(readFileSync(path.join(workDir, 'timing.json'), 'utf8'))

const open = async (scale) => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale })
  await page.goto(pathToFileURL(path.join(HERE, 'index.html')).href)
  await page.evaluate(([s, t]) => window.init(s, t), [spec, timing])
  return { browser, page }
}

if (mode === 'stills') {
  const [times, outDir] = rest
  mkdirSync(outDir, { recursive: true })
  const { browser, page } = await open(1)
  for (const t of times.split(',').map(Number)) {
    await page.evaluate((x) => window.render(x), t)
    await page.screenshot({ path: path.join(outDir, `t${t.toFixed(1).padStart(6, '0')}.png`) })
  }
  await browser.close()
} else {
  const [from, to, out, scale = '2', crf = '20'] = rest
  const { browser, page } = await open(Number(scale))
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((resolve, reject) => ff.on('close', (code) => (code ? reject(new Error(`ffmpeg ${code}`)) : resolve())))
  for (let f = Number(from); f < Number(to); f++) {
    await page.evaluate((x) => window.render(x), f / FPS)
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if ((f - from) % 300 === 0) console.log(`${out}: frame ${f}/${to}`)
  }
  ff.stdin.end()
  await done
  await browser.close()
}
