import { createManualLinks, linkManualReferences } from '@webapp/ai/help/handbookLinks'
import type { Handbook } from '@webapp/ai/help/handbookSplitter'

const DOC = 'https://docs.google.com/document/d/doc'

const handbook: Handbook = {
  source: DOC,
  version: '1',
  fetchedAt: '2026-10-10',
  sections: [
    { id: '5.2', title: 'Publish a survey', path: [], text: 'Click Publish.', anchor: 'h.publish' },
    { id: '9', title: 'Data export (1/2)', path: [], text: 'Export.', anchor: 'h.export' },
    { id: '9', title: 'Data export (2/2)', path: [], text: 'More.', anchor: 'h.export' },
    { id: 'A1', title: 'System architecture', path: [], text: 'Node.js.', anchor: 'h.annex' },
    { id: '10', title: 'No anchor', path: [], text: 'Text.', anchor: null },
  ],
}

const links = createManualLinks(handbook)
const link = (source: string) => linkManualReferences(source, links)

describe('manual links in assistant answers', () => {
  test('a citation with its title links both to the section', () => {
    expect(link('See §5.2 Publish a survey.')).toBe(`See [§5.2 Publish a survey](${DOC}/edit#heading=h.publish).`)
  })

  test('the title is matched without the part suffix and ignoring case, with an optional dot after the id', () => {
    expect(link('**§9. data export** and §A1 System architecture')).toBe(
      `**[§9. data export](${DOC}/edit#heading=h.export)** and [§A1 System architecture](${DOC}/edit#heading=h.annex)`
    )
  })

  test('a translated title: only the id is linked', () => {
    expect(link('Ver §5.2 Publicar una encuesta')).toBe(
      `Ver [§5.2](${DOC}/edit#heading=h.publish) Publicar una encuesta`
    )
  })

  test('several citations, with or without a space after §', () => {
    expect(link('(§ 5.2, §9)')).toBe(`([§ 5.2](${DOC}/edit#heading=h.publish), [§9](${DOC}/edit#heading=h.export))`)
  })

  test('a dot after the id without title ends the sentence', () => {
    expect(link('See §5.2.')).toBe(`See [§5.2](${DOC}/edit#heading=h.publish).`)
  })

  test('a section without anchor links to the manual', () => {
    expect(link('§10 No anchor')).toBe(`[§10 No anchor](${DOC}/edit)`)
  })

  test('an unknown section stays text', () => {
    expect(link('§7.7 Nothing')).toBe('§7.7 Nothing')
  })

  test('code and existing web links are left alone', () => {
    const source = `\`§5.2\` and [§5.2 here](https://example.org)\n\n\`\`\`\n§9 Data export\n\`\`\``
    expect(link(source)).toBe(source)
  })

  test('the manual and section placeholders become links', () => {
    expect(link('Read the [user manual](manual) or [this part](§5.2) or [x](#9)')).toBe(
      `Read the [user manual](${DOC}/edit) or [this part](${DOC}/edit#heading=h.publish) or [x](#9)`
    )
  })

  test('a link to an unknown section stays as it is', () => {
    expect(link('[x](§7.7)')).toBe('[x](§7.7)')
  })
})
