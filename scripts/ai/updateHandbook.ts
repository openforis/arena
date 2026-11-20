/**
 * yarn ai:docs:update — downloads the Arena user manual (the English PDF published on GitHub Pages), extracts its
 * text with pdftotext (poppler-utils, must be installed) and writes the sections the Help assistant searches to
 * webapp/ai/help/handbook.json. Commit the result when the manual changes.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildHandbook, checkHandbook, countHeadings } from '../../webapp/ai/help/handbookSplitter.ts'

const SOURCE = 'https://openforis.github.io/arena/arena-user-manual-en.pdf'
const OUTPUT_PATH = resolve(import.meta.dirname, '..', '..', 'webapp', 'ai', 'help', 'handbook.json')

const download = async (): Promise<Buffer> => {
  const response = await fetch(SOURCE)
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

// -layout keeps a list item or a table row on one line
const toText = (pdf: Buffer): string =>
  execFileSync('pdftotext', ['-layout', '-', '-'], { input: pdf, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const main = async (): Promise<void> => {
  const raw = toText(await download())
  const handbook = buildHandbook({ raw, source: SOURCE, fetchedAt: new Date().toISOString() })
  const problem = checkHandbook(handbook)
  if (problem) throw new Error(problem)
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(handbook, null, 2)}\n`)
  const { toc, found } = countHeadings(raw)
  const ids = new Set(handbook.sections.map((section) => section.id)).size
  process.stdout.write(
    `Handbook ver. ${handbook.version ?? '?'}: ${found} of ${toc} table-of-contents entries found in the body, ` +
      `${handbook.sections.length} sections (${ids} ids) written to ${OUTPUT_PATH}\n`
  )
}

main().catch((error: Error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
