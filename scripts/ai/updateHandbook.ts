/**
 * yarn ai:docs:update — downloads the Arena user handbook (Google Doc text export, and the HTML export for the heading
 * anchors) and writes the sections the Help assistant searches to webapp/ai/help/handbook.json. Commit the result
 * when the handbook changes.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { readHeadingAnchors } from '../../webapp/ai/help/handbookAnchors.ts'
import { buildHandbook, checkHandbook, countHeadings } from '../../webapp/ai/help/handbookSplitter.ts'

const SOURCE = 'https://docs.google.com/document/d/1GWerrExvbdT5oOOlwdkE9pptK4pVbQxwtgaSNPasmKA'
const OUTPUT_PATH = resolve(import.meta.dirname, '..', '..', 'webapp', 'ai', 'help', 'handbook.json')

const download = async (format: string): Promise<string> => {
  const response = await fetch(`${SOURCE}/export?format=${format}`)
  if (!response.ok) throw new Error(`Download (${format}) failed: HTTP ${response.status}`)
  return response.text()
}

const main = async (): Promise<void> => {
  const [raw, html] = await Promise.all([download('txt'), download('html')])
  const anchors = readHeadingAnchors(html)
  const handbook = buildHandbook({ raw, source: SOURCE, fetchedAt: new Date().toISOString(), anchors })
  const problem = checkHandbook(handbook)
  if (problem) throw new Error(problem)
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(handbook, null, 2)}\n`)
  const { toc, found } = countHeadings(raw)
  const ids = new Set(handbook.sections.map((section) => section.id)).size
  const linked = new Set(handbook.sections.filter((section) => section.anchor).map((section) => section.id)).size
  process.stdout.write(
    `Handbook ver. ${handbook.version ?? '?'}: ${found} of ${toc} table-of-contents entries found in the body, ` +
      `${handbook.sections.length} sections (${ids} ids, ${linked} with a heading anchor) written to ${OUTPUT_PATH}\n`
  )
}

main().catch((error: Error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
