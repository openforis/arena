import { createManualLinks, linkManualReferences } from '@webapp/ai/help/handbookLinks'
import type { Handbook } from '@webapp/ai/help/handbookSplitter'

const DOC = 'https://github.com/openforis/arena/raw/master/docs/user-manual/arena-user-manual-en.docx'
const PDF = 'https://openforis.github.io/arena/arena-user-manual-en.pdf'

const handbook: Handbook = {
  source: DOC,
  pdf: PDF,
  sections: [
    { id: '5.2', title: 'Publish a survey', path: [], text: 'Click Publish.', anchor: 'nameddest=5Fpublish' },
    { id: '9', title: 'Data export (1/2)', path: [], text: 'Export.', anchor: 'nameddest=5Fexport' },
    { id: '9', title: 'Data export (2/2)', path: [], text: 'More.', anchor: 'nameddest=5Fexport' },
    { id: 'A1', title: 'System architecture', path: [], text: 'Node.js.', anchor: 'nameddest=5Fannex' },
    { id: '10', title: 'No anchor', path: [], text: 'Text.', anchor: null },
  ],
}

const PUBLISH = `${PDF}#nameddest=5Fpublish`
const EXPORT = `${PDF}#nameddest=5Fexport`

const links = createManualLinks(handbook)
const link = (source: string) => linkManualReferences(source, links)

describe('manual links in assistant answers', () => {
  test('a citation with its title links both to the section in the PDF', () => {
    expect(link('See §5.2 Publish a survey.')).toBe(`See [§5.2 Publish a survey](${PUBLISH}).`)
  })

  test('the title is matched without the part suffix and ignoring case, with an optional dot after the id', () => {
    expect(link('**§9. data export** and §A1 System architecture')).toBe(
      `**[§9. data export](${EXPORT})** and [§A1 System architecture](${PDF}#nameddest=5Fannex)`
    )
  })

  test('a translated title: only the id is linked', () => {
    expect(link('Ver §5.2 Publicar una encuesta')).toBe(`Ver [§5.2](${PUBLISH}) Publicar una encuesta`)
  })

  test('several citations, with or without a space after §', () => {
    expect(link('(§ 5.2, §9)')).toBe(`([§ 5.2](${PUBLISH}), [§9](${EXPORT}))`)
  })

  test('a dot after the id without title ends the sentence', () => {
    expect(link('See §5.2.')).toBe(`See [§5.2](${PUBLISH}).`)
  })

  test('a section without anchor links to the PDF', () => {
    expect(link('§10 No anchor')).toBe(`[§10 No anchor](${PDF})`)
  })

  test('an unknown section stays text', () => {
    expect(link('§7.7 Nothing')).toBe('§7.7 Nothing')
  })

  test('code and existing web links are left alone', () => {
    const source = `\`§5.2\` and [§5.2 here](https://example.org)\n\n\`\`\`\n§9 Data export\n\`\`\``
    expect(link(source)).toBe(source)
  })

  test('the manual placeholder links to the Word file, a section placeholder to the section in the PDF', () => {
    expect(link('Read the [user manual](manual) or [this part](§5.2) or [x](#9)')).toBe(
      `Read the [user manual](${DOC}) or [this part](${PUBLISH}) or [x](#9)`
    )
  })

  test('a link to an unknown section stays as it is', () => {
    expect(link('[x](§7.7)')).toBe('[x](§7.7)')
  })
})
