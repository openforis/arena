/**
 * Scripted turns of the mock provider for the Design suggestions (test/e2e/specs/aiSuggestionsDesign.spec.ts):
 * the prompts of the missing translations and the new entries descriptions suggestions.
 */
import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'

// type-only import: mockScripts.ts imports this file's scripts (no runtime cycle)
import type { MockScript, MockScriptParams } from './mockScripts'

// buildMissingTranslationsPrompt: "... missing in French (fr). ..."
export const TRANSLATE_PATTERN = /Translate the survey texts that are missing in .+? \(([a-z]{2,3})\)/
// buildNewEntriesDescriptionsPrompt
export const DESCRIBE_PATTERN = /Write a short description \(one sentence/

type MockMissingTextsPage = { items?: { nodeDefName: string; kind: 'labels' | 'descriptions'; sourceText: string }[] }

/**
 * Returns the language of a translations prompt.
 * @param {string} message - The user message.
 * @returns {string} The language code (en when the message has none).
 */
export const getTranslateLang = (message: string): string => TRANSLATE_PATTERN.exec(message ?? '')?.[1] ?? 'en'

/**
 * Returns the items of a survey_listMissingTexts page.
 * @param {unknown} output - Output of the last tool call.
 * @returns {object[]} The items (none when the output is not a page).
 */
const getPageItems = (output: unknown): NonNullable<MockMissingTextsPage['items']> => {
  const items = (output as MockMissingTextsPage | null)?.items
  return Array.isArray(items) ? items : []
}

/**
 * Builds the labels_proposeSet input from the listed page: each source text with the language appended.
 * @param {MockScriptParams} params - The user message and the listed page.
 * @returns {object} The tool input.
 */
export const buildMockTranslationsInput = ({ lastUserMessage, lastToolOutput }: MockScriptParams) => {
  const lang = getTranslateLang(lastUserMessage)
  return {
    summary: `MOCK: texts in ${lang}`,
    items: getPageItems(lastToolOutput).map(({ nodeDefName, kind, sourceText }) => ({
      nodeDefName,
      kind,
      lang,
      text: `${sourceText} (${lang})`,
    })),
  }
}

/**
 * Names the entries the descriptions list returned (the e2e checks the suggestion scope with it).
 * @param {unknown} lastToolOutput - Output of survey_listMissingTexts.
 * @returns {string} The answer.
 */
export const formatMockDescriptionsAnswer = (lastToolOutput: unknown): string => {
  const names = [...new Set(getPageItems(lastToolOutput).map((item) => item.nodeDefName))].sort((a, b) =>
    a.localeCompare(b)
  )
  return `MOCK: ${names.length} entries without a description: ${names.join(', ')}.`
}

export const assistantSuggestionMockScripts: MockScript[] = [
  {
    promptMarker: assistantMarkers.design,
    pattern: TRANSLATE_PATTERN,
    steps: [
      {
        toolCall: {
          toolName: 'survey_listMissingTexts',
          input: ({ lastUserMessage }: MockScriptParams) => ({ lang: getTranslateLang(lastUserMessage) }),
        },
      },
      { toolCall: { toolName: 'labels_proposeSet', input: buildMockTranslationsInput } },
      { text: 'MOCK: I proposed the missing texts. Review the card and click Apply.' },
    ],
  },
  {
    promptMarker: assistantMarkers.design,
    pattern: DESCRIBE_PATTERN,
    steps: [
      { toolCall: { toolName: 'survey_listMissingTexts', input: { kind: 'descriptions', onlyEmpty: true } } },
      { text: ({ lastToolOutput }) => formatMockDescriptionsAnswer(lastToolOutput) },
    ],
  },
]
