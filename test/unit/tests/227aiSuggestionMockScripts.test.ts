import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { MOCK_SCRIPTS, getScriptedStep } from '@server/modules/ai/service/mockScripts'
import {
  assistantSuggestionMockScripts,
  formatMockDescriptionsAnswer,
} from '@server/modules/ai/service/mockScriptsSuggestions'
import {
  buildMissingTranslationsPrompt,
  buildNewEntriesDescriptionsPrompt,
} from '@webapp/ai/suggestions/prompts/designPrompts'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'

const system = (text: string): any => ({ role: 'system', content: text })
const user = (text: string): any => ({ role: 'user', content: [{ type: 'text', text }] })
const toolCall = (id: string, toolName: string): any => ({
  role: 'assistant',
  content: [{ type: 'tool-call', toolCallId: id, toolName, input: {} }],
})
const toolResult = (id: string, toolName: string, value: unknown): any => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName, output: { type: 'json', value } }],
})

const designSystem = system(`${assistantMarkers.design}\nYou are the design assistant.`)

const parseInput = (toolName: string, input: unknown): boolean => {
  const tool = ALL_TOOLS.find((candidate) => candidate.name === toolName)
  return Boolean(tool?.inputSchema.safeParse(input).success)
}

const translatePrompt = buildMissingTranslationsPrompt({ lang: 'fr', langLabel: 'French' })
const describePrompt = buildNewEntriesDescriptionsPrompt({ languages: ['en'] })

const frenchPage = {
  lang: 'fr',
  total: 2,
  items: [
    { nodeDefName: 'cluster_id', kind: 'labels', sourceLang: 'en', sourceText: 'Cluster id' },
    { nodeDefName: 'plot', kind: 'labels', sourceLang: 'en', sourceText: 'Plot' },
  ],
  nextCursor: null,
}

const descriptionsPage = {
  lang: null,
  total: 2,
  items: [
    { nodeDefName: 'cluster_note_b', kind: 'descriptions', sourceLang: null, sourceText: '' },
    { nodeDefName: 'cluster_note_a', kind: 'descriptions', sourceLang: null, sourceText: '' },
  ],
  nextCursor: null,
}

describe('suggestion mock scripts (227)', () => {
  test('translations: list the language, propose each text with the language appended, then answer', () => {
    const start = [designSystem, user(translatePrompt)]
    const list: any = getScriptedStep(start)
    expect(list).toEqual({ toolCall: { toolName: 'survey_listMissingTexts', input: { lang: 'fr' } } })
    expect(parseInput('survey_listMissingTexts', list.toolCall.input)).toBe(true)

    const listed = [
      ...start,
      toolCall('a', 'survey_listMissingTexts'),
      toolResult('a', 'survey_listMissingTexts', frenchPage),
    ]
    const propose: any = getScriptedStep(listed)
    expect(propose).toEqual({
      toolCall: {
        toolName: 'labels_proposeSet',
        input: {
          summary: 'MOCK: texts in fr',
          items: [
            { nodeDefName: 'cluster_id', kind: 'labels', lang: 'fr', text: 'Cluster id (fr)' },
            { nodeDefName: 'plot', kind: 'labels', lang: 'fr', text: 'Plot (fr)' },
          ],
        },
      },
    })
    expect(parseInput('labels_proposeSet', propose.toolCall.input)).toBe(true)

    const proposed = [...listed, toolCall('b', 'labels_proposeSet'), toolResult('b', 'labels_proposeSet', {})]
    expect(getScriptedStep(proposed)).toEqual({
      text: 'MOCK: I proposed the missing texts. Review the card and click Apply.',
    })
  })

  test('descriptions: list the empty descriptions, then name what the list returned', () => {
    const start = [designSystem, user(describePrompt)]
    const list: any = getScriptedStep(start)
    expect(list).toEqual({
      toolCall: { toolName: 'survey_listMissingTexts', input: { kind: 'descriptions', onlyEmpty: true } },
    })
    expect(parseInput('survey_listMissingTexts', list.toolCall.input)).toBe(true)
    const listed = [
      ...start,
      toolCall('a', 'survey_listMissingTexts'),
      toolResult('a', 'survey_listMissingTexts', descriptionsPage),
    ]
    expect(getScriptedStep(listed)).toEqual({
      text: 'MOCK: 2 entries without a description: cluster_note_a, cluster_note_b.',
    })
    expect(formatMockDescriptionsAnswer(null)).toBe('MOCK: 0 entries without a description: .')
  })

  test('the scripts come first: the prompts name labels_proposeSet, and the label script still answers its request', () => {
    expect(/label/i.test(translatePrompt)).toBe(true)
    expect(MOCK_SCRIPTS.slice(0, assistantSuggestionMockScripts.length)).toEqual(assistantSuggestionMockScripts)
    expect(getScriptedStep([designSystem, user('Change the label of cluster_id to Cluster identifier')])).toEqual({
      toolCall: { toolName: 'nodeDef_get', input: { name: 'cluster_id' } },
    })
  })
})
