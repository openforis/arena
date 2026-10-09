/**
 * yarn ai:docs:update — downloads the Arena user handbook (Google Doc text export) and writes the sections the Help
 * assistant searches to webapp/ai/help/handbook.json. Commit the result when the handbook changes.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildHandbook, checkHandbook, countHeadings } from '../../webapp/ai/help/handbookSplitter.ts'

const SOURCE = 'https://docs.google.com/document/d/1GWerrExvbdT5oOOlwdkE9pptK4pVbQxwtgaSNPasmKA'
const OUTPUT_PATH = resolve(import.meta.dirname, '..', '..', 'webapp', 'ai', 'help', 'handbook.json')

const main = async (): Promise<void> => {
  const response = await fetch(`${SOURCE}/export?format=txt`)
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`)
  const raw = await response.text()
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
