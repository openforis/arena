/**
 * Canned LanguageModelV4 for e2e tests (AI_MOCK_PROVIDER_ENABLED=true, provider "mock"): answers with a
 * fixed text recognisable per feature, streamed in two chunks. Never enable on a real deployment.
 */
import type { LanguageModelV4, LanguageModelV4Prompt, LanguageModelV4StreamPart } from '@ai-sdk/provider'

import { stopFinishReason, unknownUsageV4 } from '@common/ai/sseParser'

import { getScriptedStep, toScriptedContent, toScriptedStream } from '@server/modules/ai/service/mockScripts'

export const MOCK_PROVIDER = 'mock'

const promptText = (prompt: LanguageModelV4Prompt): string =>
  prompt
    .map((message) =>
      typeof message.content === 'string'
        ? message.content
        : message.content.map((part) => ('text' in part ? part.text : '')).join('')
    )
    .join('\n')

// matched against the system prompts of common/ai/prompts (keep in sync with test/e2e/specs/aiFeatures.spec.ts)
const CANNED_ANSWERS: [RegExp, string][] = [
  // node def names of the e2e sample survey (test/e2e/fixtures/seed/sampleSurveyModel.ts)
  [/<expression>/, '<expression>tree_dec_1 > 0</expression><explanation>MOCK: must be positive.</explanation>'],
  [/translate survey labels/i, '{"translations":[]}'],
  // the two data-query prompts both mention the Data Explorer: match the summarize one first
  [/names data queries/i, '{"name":"mock_query","label":"MOCK label","description":"MOCK"}'],
  [/builds data queries/i, '{"entity":"tree","mode":"raw","attributes":["tree_dec_1"],"explanation":"MOCK query"}'],
  [/activity log/i, 'MOCK activity summary.'],
]

/**
 * Returns the canned answer for the feature the prompt belongs to.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @returns {string} The answer.
 */
export const mockAnswerFor = (prompt: LanguageModelV4Prompt): string => {
  const text = promptText(prompt)
  const match = CANNED_ANSWERS.find(([pattern]) => pattern.test(text))
  return match ? match[1] : 'MOCK answer.'
}

const streamOf = (text: string): ReadableStream<LanguageModelV4StreamPart> => {
  const half = Math.ceil(text.length / 2)
  const parts: LanguageModelV4StreamPart[] = [
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 'mock' },
    { type: 'text-delta', id: 'mock', delta: text.slice(0, half) },
    { type: 'text-delta', id: 'mock', delta: text.slice(half) },
    { type: 'text-end', id: 'mock' },
    { type: 'finish', finishReason: stopFinishReason(), usage: unknownUsageV4() },
  ]
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part)
      controller.close()
    },
  })
}

/**
 * Creates the mock model.
 * @param {object} [options] - Options.
 * @param {string} [options.text] - Fixed answer (default: the assistant scripts, then the per-feature canned answers).
 * @returns {LanguageModelV4} The model.
 */
export const createMockModel = ({ text }: { text?: string } = {}): LanguageModelV4 => ({
  specificationVersion: 'v4',
  provider: MOCK_PROVIDER,
  modelId: MOCK_PROVIDER,
  supportedUrls: {},
  async doGenerate(options) {
    // a fixed text wins; then the assistant scripts; then the canned answers
    const step = text === undefined ? getScriptedStep(options.prompt) : null
    if (step) {
      const { content, finishReason } = toScriptedContent(step, options.prompt)
      return { content, finishReason, usage: unknownUsageV4(), warnings: [] }
    }
    return {
      content: [{ type: 'text', text: text ?? mockAnswerFor(options.prompt) }],
      finishReason: stopFinishReason(),
      usage: unknownUsageV4(),
      warnings: [],
    }
  },
  async doStream(options) {
    const step = text === undefined ? getScriptedStep(options.prompt) : null
    if (step) return { stream: toScriptedStream(step, options.prompt) }
    return { stream: streamOf(text ?? mockAnswerFor(options.prompt)) }
  },
})
