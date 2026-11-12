import { buildSystemInstructions } from '@server/modules/ai/service/modelClient'
import { docxDocumentXmlToText } from '@server/modules/ai/service/userManualContext'

const paragraph = (text: string, style?: string) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`

describe('Chatbot user manual context', () => {
  test('docx text extraction keeps headings and paragraphs, skips the table of contents', () => {
    const xml =
      '<w:document><w:body>' +
      '<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/></w:docPartObj></w:sdtPr>' +
      `<w:sdtContent>${paragraph('1. Introduction 8')}</w:sdtContent></w:sdt>` +
      paragraph('1. Introduction', 'Heading1') +
      paragraph('Arena &amp; Collect &lt;3') +
      '<w:p><w:r><w:t>Split</w:t></w:r><w:r><w:t xml:space="preserve"> run</w:t></w:r></w:p>' +
      '<w:p/>' +
      paragraph('1.1. Details', 'Heading2') +
      '</w:body></w:document>'

    expect(docxDocumentXmlToText(xml)).toBe('# 1. Introduction\nArena & Collect <3\nSplit run\n\n## 1.1. Details')
  })

  test('system instructions: plain string without cached prefix', () => {
    expect(buildSystemInstructions({ system: 'sys' })).toBe('sys')
  })

  test('system instructions: cached prefix first, marked for prompt caching', () => {
    const instructions = buildSystemInstructions({ system: 'sys', cachedSystemPrefix: 'manual' }) as any[]
    expect(instructions).toHaveLength(2)
    expect(instructions[0]).toMatchObject({
      role: 'system',
      content: 'manual',
      providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
    })
    expect(instructions[1]).toEqual({ role: 'system', content: 'sys' })
  })
})
