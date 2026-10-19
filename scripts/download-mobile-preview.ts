import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import AdmZip from 'adm-zip'

// Downloads the Arena Mobile web preview (release asset built by arena-mobile CI) into mobile-preview/,
// served under /mobile-preview by the server and shown in the survey designer.
// Failures are not fatal: without the bundle the mobile preview is hidden.

const ROOT_DIR = resolve(import.meta.dirname, '..')
const OUTPUT_DIR = resolve(ROOT_DIR, 'mobile-preview')
// URL of the downloaded bundle, to skip the download when already done
const SOURCE_FILE = resolve(OUTPUT_DIR, '.source')
const ASSET_NAME = 'arena-mobile-web-preview.zip'

const packageJson = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf8'))
const version: string = process.env.ARENA_MOBILE_WEB_PREVIEW_VERSION || packageJson.arenaMobileWebPreview.version
// URL override: e.g. to test a bundle not released yet
const url =
  process.env.ARENA_MOBILE_WEB_PREVIEW_URL ||
  `https://github.com/openforis/arena-mobile/releases/download/${version}/${ASSET_NAME}`

const download = async (): Promise<void> => {
  if (existsSync(SOURCE_FILE) && readFileSync(SOURCE_FILE, 'utf8') === url) {
    console.log(`Arena Mobile web preview ${version} already downloaded`)
    return
  }
  console.log(`Downloading Arena Mobile web preview ${version} from ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()))
  rmSync(OUTPUT_DIR, { recursive: true, force: true })
  mkdirSync(OUTPUT_DIR, { recursive: true })
  zip.extractAllTo(OUTPUT_DIR, true)
  writeFileSync(SOURCE_FILE, url)
  console.log(`Arena Mobile web preview ${version} extracted into ${OUTPUT_DIR}`)
}

download().catch((error: Error) => {
  console.warn(
    `Arena Mobile web preview ${version} not downloaded (${error.message}): the mobile preview will be hidden`
  )
})
