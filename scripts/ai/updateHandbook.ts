/**
 * yarn ai:docs:update — reads the Arena user manual (the Word files in docs/user-manual) and writes the sections the
 * Help assistant searches to webapp/ai/help/handbook-<lang>.json. Run it and commit the result when the manual changes.
 */
import AdmZip from 'adm-zip'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildHandbook, checkHandbook, HANDBOOK_LANGS } from '../../webapp/ai/help/handbookSplitter.ts'

const ROOT = resolve(import.meta.dirname, '..', '..')

for (const lang of HANDBOOK_LANGS) {
  const docx = resolve(ROOT, 'docs', 'user-manual', `arena-user-manual-${lang}.docx`)
  const xml = new AdmZip(docx).readAsText('word/document.xml') // NOSONAR: a zip entry, not FileReader#readAsText
  const handbook = buildHandbook({ xml, lang })
  const problem = checkHandbook(handbook)
  if (problem) throw new Error(`${docx}: ${problem}`)
  const output = resolve(ROOT, 'webapp', 'ai', 'help', `handbook-${lang}.json`)
  writeFileSync(output, `${JSON.stringify(handbook, null, 2)}\n`)
  const ids = new Set(handbook.sections.map((section) => section.id)).size
  process.stdout.write(`${handbook.sections.length} sections (${ids} ids) written to ${output}\n`)
}
