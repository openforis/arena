import {
  SECTION_MAX_CHARS,
  buildHandbook,
  checkHandbook,
  countHeadings,
  readHandbookVersion,
  splitHandbook,
} from '@webapp/ai/help/handbookSplitter'

import { handbookFixture, handbookFixtureLongText } from './resources/handbookFixture'

const sections = splitHandbook(handbookFixture)

const byTitle = (title: string) => {
  const section = sections.find((candidate) => candidate.title === title)
  if (!section) throw new Error(`no section ${title}`)
  return section
}

describe('handbook splitter', () => {
  test('splits at the table-of-contents headings, in document order', () => {
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
    expect(countHeadings(handbookFixture)).toEqual({ toc: 8, found: 7 })
  })

  test('numbered steps in the body are not taken as headings', () => {
    expect(byTitle('Typical working process').text).toBe('Steps:\n1. Open the Details section.\n2. Save.')
  })

  test('removes the BOM, CRLF, page breaks, trailing spaces and blank runs', () => {
    expect(byTitle('Introduction').text).toBe('Arena is a cloud platform.')
    expect(byTitle('Create a survey').text).toBe('Click New.')
  })

  test('the text of an entry without a body heading stays in the previous section', () => {
    expect(byTitle('Survey details').text).toBe('Fill the name.\nText of the missing section.')
  })

  test('paths, annexes and the unnumbered Acknowledgements', () => {
    expect(byTitle('Survey details').path).toEqual(['2. Typical working process', '2.1. Create a survey'])
    expect(byTitle('Long section (1/2)').path).toEqual([])
    expect(byTitle('System architecture')).toEqual({
      id: 'A1',
      title: 'System architecture',
      path: [],
      text: 'Arena runs on Node.js.',
    })
    expect(byTitle('Acknowledgements').id).toBe('Acknowledgements')
  })

  test('a long section is split into parts with the same id', () => {
    const parts = sections.filter((section) => section.id === '3')
    expect(parts.map((part) => part.title)).toEqual(['Long section (1/2)', 'Long section (2/2)'])
    for (const part of parts) expect(part.text.length).toBeLessThanOrEqual(SECTION_MAX_CHARS)
    expect(parts.map((part) => part.text).join('\n')).toBe(handbookFixtureLongText)
  })

  test('version, handbook and the minimum-size check', () => {
    expect(readHandbookVersion(handbookFixture)).toBe('2.9')
    expect(readHandbookVersion('no version here')).toBeNull()
    const handbook = buildHandbook({ raw: handbookFixture, source: 'https://example.org/doc', fetchedAt: '2026-10-06' })
    expect(handbook).toMatchObject({ source: 'https://example.org/doc', version: '2.9', fetchedAt: '2026-10-06' })
    expect(handbook.sections).toEqual(sections)
    expect(checkHandbook(handbook)).toBe(
      'Only 7 handbook sections found (at least 50 expected): did the export format change?'
    )
    expect(checkHandbook(handbook, 5)).toBeNull()
  })
})
