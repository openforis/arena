import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

import {
  buildHandbook,
  checkHandbook,
  HANDBOOK_LANGS,
  readDocxBlocks,
  SECTION_MAX_CHARS,
  splitHandbook,
} from '@webapp/ai/help/handbookSplitter'

import { handbookFixture, handbookFixtureLongText } from './resources/handbookFixture'

const sections = splitHandbook(readDocxBlocks(handbookFixture))

const byTitle = (title: string) => {
  const section = sections.find((candidate) => candidate.title === title)
  if (!section) throw new Error(`no section ${title}`)
  return section
}

describe('handbook splitter', () => {
  test('splits at the headings, in document order (the cover and the table of contents are dropped)', () => {
    expect(sections.map((section) => section.id)).toEqual([
      '1',
      '2',
      '2.1',
      '2.1.1',
      '3',
      '3',
      'Acknowledgements',
      'A1',
    ])
  })

  test('joins the runs of a paragraph: tabs, entities, no field instructions, no empty paragraphs', () => {
    expect(byTitle('Introduction').text).toBe('Arena is a cloud platform & more.')
    expect(byTitle('Create a survey').text).toBe('Click New.')
  })

  test('list items get a dash, a table row is one line (a nested table stays in its cell)', () => {
    expect(byTitle('Typical working process').text).toBe('Steps:\n- Open the Details section.\n- Save.')
    expect(byTitle('Survey details').text).toBe('Name | Label (optional)\nCycle | nested')
  })

  test('paths, annexes and the unnumbered Acknowledgements', () => {
    expect(byTitle('Survey details').path).toEqual(['2. Typical working process', '2.1. Create a survey'])
    expect(byTitle('Long section (1/2)').path).toEqual([])
    expect(byTitle('Architecture du système')).toEqual({
      id: 'A1',
      title: 'Architecture du système',
      path: [],
      text: 'Arena runs on Node.js.',
      anchor: 'nameddest=5Fannex',
    })
    expect(byTitle('Acknowledgements').id).toBe('Acknowledgements')
  })

  test('the anchor is the PDF destination of the bookmark, of the parent section without one', () => {
    expect(byTitle('Introduction').anchor).toBe('nameddest=5Fs5o1khyfunlc')
    expect(byTitle('Create a survey').anchor).toBe('nameddest=5FToc000001')
    expect(byTitle('Survey details').anchor).toBe('nameddest=5Fgwliesivalmp')
  })

  test('a long section is split into parts with the same id', () => {
    const parts = sections.filter((section) => section.id === '3')
    expect(parts.map((part) => part.title)).toEqual(['Long section (1/2)', 'Long section (2/2)'])
    for (const part of parts) expect(part.text.length).toBeLessThanOrEqual(SECTION_MAX_CHARS)
    expect(parts.map((part) => part.text).join('\n')).toBe(handbookFixtureLongText)
  })

  test('handbook of a language and the minimum-size check', () => {
    const handbook = buildHandbook({ xml: handbookFixture, lang: 'fr' })
    expect(handbook).toEqual({
      source: 'https://github.com/openforis/arena/raw/master/docs/user-manual/arena-user-manual-fr.docx',
      pdf: 'https://openforis.github.io/arena/arena-user-manual-fr.pdf',
      sections,
    })
    expect(checkHandbook(handbook)).toBe(
      'Only 7 handbook sections found (at least 50 expected): did the heading styles change?'
    )
    expect(checkHandbook(handbook, 5)).toBeNull()
  })
})

describe('the committed handbooks', () => {
  test.each(HANDBOOK_LANGS)('%s is up to date with the manual (else run yarn ai:docs:update)', (lang) => {
    const docx = path.resolve(process.cwd(), `docs/user-manual/arena-user-manual-${lang}.docx`)
    const committed = path.resolve(process.cwd(), `webapp/ai/help/handbook-${lang}.json`)
    const handbook = buildHandbook({ xml: new AdmZip(docx).readAsText('word/document.xml'), lang })
    expect(JSON.parse(fs.readFileSync(committed, 'utf8'))).toEqual(handbook)
  })
})
