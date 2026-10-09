/**
 * Trimmed copy of the handbook text export: BOM, CRLF, table of contents, page breaks, a numbered list in the body,
 * a table-of-contents entry without a body heading (2.2), an annex, the unnumbered Acknowledgements and a section
 * longer than 4,000 characters.
 */
const longParagraphs = Array.from({ length: 12 }, (_value, index) =>
  `Paragraph ${index + 1} of the long section. ${'Arena stores the data. '.repeat(16)}`.trimEnd()
)

const lines = [
  'Open Foris Arena',
  'User manual',
  'ver. 2.9',
  '',
  '________________',
  'Content',
  '1. Introduction        3',
  '2. Typical working process        4',
  '2.1. Create a survey        5',
  '2.1.1. Survey details        6',
  '2.2. Missing heading        7',
  '3. Long section        8',
  'Acknowledgements        9',
  'Annex 1. System architecture        10',
  '',
  '________________',
  '1. Introduction',
  'Arena is a cloud platform.',
  '',
  '',
  '________________',
  '2. Typical working process',
  'Steps:',
  '1. Open the Details section.',
  '2. Save.',
  '2.1. Create a survey',
  'Click New.   ',
  '2.1.1. Survey details',
  'Fill the name.',
  'Text of the missing section.',
  '3. Long section',
  ...longParagraphs,
  'Acknowledgements',
  'Thanks to the team.',
  'Annex 1. System architecture',
  'Arena runs on Node.js.',
]

export const handbookFixture = `\uFEFF${lines.join('\r\n')}\r\n`

export const handbookFixtureLongText = longParagraphs.join('\n')
