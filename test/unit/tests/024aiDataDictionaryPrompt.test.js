/**
 * Tests for the prompt builder and renderers used by the data-dictionary
 * feature (Tier 1 #7).
 */
import { buildDataDictionaryPrompt } from '@server/modules/ai/service/prompts/dataDictionary'
import { renderHtml, renderMarkdown } from '@server/modules/ai/service/render/dataDictionaryRenderer'

describe('buildDataDictionaryPrompt', () => {
  test('emits a non-empty system prompt with style guidance', () => {
    const { system } = buildDataDictionaryPrompt({
      surveyName: 'forest_inventory',
      nodeDefs: [{ uuid: 'a', name: 'tree_height', type: 'decimal' }],
    })
    expect(system).toMatch(/Open Foris Arena/)
    expect(system).toMatch(/data dictionary/i)
    expect(system).toMatch(/12-25 words/)
    expect(system).toMatch(/Do not invent units/)
  })

  test('user prompt lists every node-def with its uuid, name, and type', () => {
    const { prompt } = buildDataDictionaryPrompt({
      surveyName: 'forest_inventory',
      nodeDefs: [
        { uuid: 'a', name: 'tree_height', type: 'decimal', parentPath: 'plot/tree' },
        { uuid: 'b', name: 'remarks', type: 'text' },
      ],
    })
    expect(prompt).toMatch(/forest_inventory/)
    // Untrusted fields (uuid, name, type, parentPath) are JSON-stringified
    // before interpolation so the model treats them as data tokens.
    expect(prompt).toMatch(/uuid="a" name="tree_height" type="decimal"/)
    expect(prompt).toMatch(/parent="plot\/tree"/)
    expect(prompt).toMatch(/uuid="b" name="remarks" type="text"/)
  })

  test('system prompt specifies the exact JSON output shape', () => {
    const { system } = buildDataDictionaryPrompt({
      surveyName: 'fi',
      nodeDefs: [{ uuid: 'a', name: 'x', type: 'text' }],
    })
    expect(system).toMatch(/Reply with EXACTLY one JSON object/)
    expect(system).toMatch(/"descriptions"/)
    expect(system).toMatch(/"uuid"/)
    expect(system).toMatch(/Do not wrap the JSON in code fences/)
  })

  test('appends previous-error feedback when retrying', () => {
    const { prompt } = buildDataDictionaryPrompt({
      surveyName: 'fi',
      nodeDefs: [{ uuid: 'a', name: 'x', type: 'text' }],
      previousError: { message: 'Unexpected token } in JSON at position 42' },
    })
    expect(prompt).toMatch(/previous attempt/i)
    expect(prompt).toMatch(/Unexpected token/)
  })
})

describe('dataDictionary renderers', () => {
  const entries = [
    {
      name: 'tree_height',
      type: 'decimal',
      label: 'Tree height',
      description: 'Height of the tree in metres.',
      parentPath: 'plot/tree',
      aiGenerated: false,
    },
    {
      name: 'dbh',
      type: 'decimal',
      label: 'DBH',
      description: 'Diameter at breast height.',
      parentPath: 'plot/tree',
      aiGenerated: true,
    },
  ]

  test('renderMarkdown emits a markdown table with all rows', () => {
    const md = renderMarkdown({ surveyName: 'fi', lang: 'en', entries })
    expect(md).toMatch(/^# Data Dictionary — fi/)
    expect(md).toMatch(/Language: en/)
    expect(md).toMatch(/`tree_height`/)
    expect(md).toMatch(/`dbh`/)
    expect(md).toMatch(/_\(AI\)_/)
  })

  test('renderHtml emits a self-contained HTML page', () => {
    const html = renderHtml({ surveyName: 'fi', lang: 'en', entries })
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toMatch(/<title>Data Dictionary — fi<\/title>/)
    expect(html).toMatch(/<code>tree_height<\/code>/)
    expect(html).toMatch(/<code>dbh<\/code>/)
    expect(html).toMatch(/class="ai-flag"/)
  })

  test('renderHtml escapes HTML in field values', () => {
    const html = renderHtml({
      surveyName: 'fi',
      lang: 'en',
      entries: [
        {
          name: '<script>',
          type: 'text',
          label: '"quote"',
          description: 'a & b',
          parentPath: 'p',
          aiGenerated: false,
        },
      ],
    })
    expect(html).not.toMatch(/<script>/)
    expect(html).toMatch(/&lt;script&gt;/)
    expect(html).toMatch(/&quot;quote&quot;/)
    expect(html).toMatch(/a &amp; b/)
  })
})
