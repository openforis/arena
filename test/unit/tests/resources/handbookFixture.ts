/**
 * Trimmed word/document.xml of the handbook: a cover and a table of contents before the first heading, headings with
 * and without a bookmark, a heading without the space after its number, an empty heading paragraph, text split in
 * runs with a tab and entities, a field instruction, a list, a table with a nested table, an annex, the unnumbered
 * Acknowledgements and a section longer than 4,000 characters.
 */
const longParagraphs = Array.from({ length: 12 }, (_value, index) =>
  `Paragraph ${index + 1} of the long section. ${'Arena stores the data. '.repeat(16)}`.trimEnd()
)

const run = (text: string) => `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`
const paragraph = (content: string, properties = '') =>
  `<w:p w:rsidR="00A1"><w:pPr>${properties}</w:pPr>${content}</w:p>`
const text = (content: string) => paragraph(run(content))
const heading = (level: number, content: string, bookmark?: string) =>
  paragraph(
    (bookmark ? `<w:bookmarkStart w:id="1" w:name="${bookmark}"/><w:bookmarkEnd w:id="1"/>` : '') + run(content),
    `<w:pStyle w:val="Heading${level}"/>`
  )
const listItem = (content: string) =>
  paragraph(run(content), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr>')
const cell = (content: string) => `<w:tc><w:tcPr/>${content}</w:tc>`
const table = (rows: string[][]) =>
  `<w:tbl><w:tblPr/>${rows.map((cells) => `<w:tr>${cells.map(cell).join('')}</w:tr>`).join('')}</w:tbl>`

const body = [
  text('Open Foris Arena'),
  paragraph(run('1. Introduction') + '<w:r><w:tab/></w:r>' + run('3'), '<w:pStyle w:val="TOC1"/>'),
  heading(1, '1. Introduction', '_s5o1khyfunlc'),
  paragraph(run('Arena is a ') + run('cloud') + '<w:r><w:tab/></w:r>' + run('platform &amp; more.')),
  '<w:p/>',
  heading(1, '2. Typical working process', '_Toc000001'),
  paragraph('<w:r><w:instrText>HYPERLINK "https://example.org"</w:instrText></w:r>' + run('Steps:')),
  listItem('Open the Details section.'),
  listItem('Save.'),
  heading(2, '2.1.Create a survey'),
  text('Click New.   '),
  heading(2, ''),
  heading(3, '2.1.1. Survey details', '_gwliesivalmp'),
  table([
    [text('Name'), text('Label') + text('(optional)')],
    [text('Cycle'), table([[text('nested')]])],
  ]),
  heading(1, '3. Long section', '_long'),
  ...longParagraphs.map(text),
  heading(1, 'Acknowledgements', '_thanks'),
  text('Thanks to the team.'),
  heading(1, 'Annexe 1. Architecture du système', '_annex'),
  text('Arena runs on Node.js.'),
].join('')

export const handbookFixture =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`

export const handbookFixtureLongText = longParagraphs.join('\n')
