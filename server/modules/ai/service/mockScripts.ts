/**
 * Scripted mock turns of the assistant (e2e): chosen by the area marker of the system prompt and a pattern on the
 * last user message. Each model call plays the next step: a tool call, then the closing text.
 */
import type { LanguageModelV4Content, LanguageModelV4Prompt, LanguageModelV4StreamPart } from '@ai-sdk/provider'

import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { stopFinishReason, unknownUsageV4 } from '@common/ai/sseParser'

export type MockScriptStep = { toolCall: { toolName: string; input: unknown } } | { text: string }

export type MockScript = { promptMarker: string; pattern: RegExp; steps: MockScriptStep[] }

// default answer of a marked prompt without a matching script (never A's canned answers, deviation 8)
export const MOCK_SCRIPT_DEFAULT_TEXT = 'MOCK answer.'

// D2 / D3 append their scripts here
export const MOCK_SCRIPTS: MockScript[] = [
  {
    promptMarker: assistantMarkers.design,
    pattern: /label/i,
    steps: [
      { toolCall: { toolName: 'nodeDef_get', input: { name: 'cluster_id' } } },
      {
        toolCall: {
          toolName: 'labels_proposeSet',
          input: {
            summary: 'New label of cluster_id',
            items: [{ nodeDefName: 'cluster_id', kind: 'labels', lang: 'en', text: 'Cluster identifier' }],
          },
        },
      },
      { text: 'MOCK: I proposed a new label for `cluster_id`. Review the card and click Apply.' },
    ],
  },
  {
    promptMarker: assistantMarkers.design,
    pattern: /remarks/i,
    steps: [
      {
        toolCall: {
          toolName: 'nodeDef_proposeCreate',
          input: {
            summary: 'Add a remarks field to cluster',
            nodeDefs: [
              {
                parentName: 'cluster',
                type: 'text',
                name: 'cluster_remarks',
                labels: [{ lang: 'en', text: 'Remarks' }],
              },
            ],
          },
        },
      },
      { text: 'MOCK: I proposed a new text attribute `cluster_remarks`. Review the card and click Apply.' },
    ],
  },
  {
    promptMarker: assistantMarkers.help,
    pattern: /publish/i,
    steps: [
      { toolCall: { toolName: 'docs_search', input: { query: 'publish survey' } } },
      { text: 'MOCK help: publish the survey from the survey list (see the cited section).' },
    ],
  },
]

/**
 * Returns the text of a message content.
 * @param {LanguageModelV4Prompt[number]['content']} content - The content.
 * @returns {string} The text parts joined.
 */
const contentText = (content: LanguageModelV4Prompt[number]['content']): string =>
  typeof content === 'string' ? content : content.map((part: any) => (part.type === 'text' ? part.text : '')).join('')

/**
 * Finds the assistant marker in the system messages.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @returns {string|null} The marker, or null.
 */
const findMarker = (prompt: LanguageModelV4Prompt): string | null => {
  const system = prompt.filter((message) => message.role === 'system').map((message) => contentText(message.content))
  return Object.values(assistantMarkers).find((marker) => system.some((text) => text.includes(marker))) ?? null
}

/**
 * Returns the index of the last user message.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @returns {number} The index, -1 when none.
 */
const lastUserIndex = (prompt: LanguageModelV4Prompt): number => {
  for (let index = prompt.length - 1; index >= 0; index -= 1) {
    if (prompt[index].role === 'user') return index
  }
  return -1
}

// tool results since the last user message = steps already played in this turn
/**
 * Counts the tool results after a message index.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @param {number} fromIndex - Index of the last user message.
 * @returns {number} The count.
 */
const countToolResults = (prompt: LanguageModelV4Prompt, fromIndex: number): number =>
  prompt
    .slice(fromIndex + 1)
    .filter((message) => message.role === 'tool')
    .reduce(
      (count, message) => count + (message.content as any[]).filter((part) => part.type === 'tool-result').length,
      0
    )

/**
 * Returns the scripted step to play for a prompt.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @param {MockScript[]} [scripts] - Scripts.
 * @returns {MockScriptStep|null} The step; null when the prompt has no assistant marker (A's canned answers apply).
 */
export const getScriptedStep = (
  prompt: LanguageModelV4Prompt,
  scripts: MockScript[] = MOCK_SCRIPTS
): MockScriptStep | null => {
  const marker = findMarker(prompt)
  if (!marker) return null
  const userIndex = lastUserIndex(prompt)
  const userText = userIndex >= 0 ? contentText(prompt[userIndex].content) : ''
  const script = scripts.find((candidate) => candidate.promptMarker === marker && candidate.pattern.test(userText))
  const step = script?.steps[countToolResults(prompt, userIndex)]
  return step ?? { text: MOCK_SCRIPT_DEFAULT_TEXT }
}

/**
 * Returns the id of the scripted tool call.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @returns {string} The id.
 */
const toolCallId = (prompt: LanguageModelV4Prompt): string => `mock-call-${prompt.length}`

/**
 * Returns the generate content of a step.
 * @param {MockScriptStep} step - Step.
 * @param {LanguageModelV4Prompt} prompt - Prompt (for the tool call id).
 * @returns {{content: LanguageModelV4Content[], finishReason: object}} Content and finish reason.
 */
export const toScriptedContent = (step: MockScriptStep, prompt: LanguageModelV4Prompt) => {
  if ('text' in step)
    return {
      content: [{ type: 'text', text: step.text }] as LanguageModelV4Content[],
      finishReason: stopFinishReason(),
    }
  const { toolName, input } = step.toolCall
  return {
    content: [
      { type: 'tool-call', toolCallId: toolCallId(prompt), toolName, input: JSON.stringify(input) },
    ] as LanguageModelV4Content[],
    finishReason: { unified: 'tool-calls', raw: undefined } as const,
  }
}

/**
 * Returns the stream parts of a step.
 * @param {MockScriptStep} step - Step.
 * @param {LanguageModelV4Prompt} prompt - Prompt (for the tool call id).
 * @returns {LanguageModelV4StreamPart[]} The parts, finish included.
 */
export const toScriptedStreamParts = (
  step: MockScriptStep,
  prompt: LanguageModelV4Prompt
): LanguageModelV4StreamPart[] => {
  const { content, finishReason } = toScriptedContent(step, prompt)
  const [first] = content as any[]
  const body: LanguageModelV4StreamPart[] =
    first.type === 'text'
      ? [
          { type: 'text-start', id: 'mock' },
          { type: 'text-delta', id: 'mock', delta: first.text },
          { type: 'text-end', id: 'mock' },
        ]
      : [first]
  return [{ type: 'stream-start', warnings: [] }, ...body, { type: 'finish', finishReason, usage: unknownUsageV4() }]
}

/**
 * Returns the stream of a step.
 * @param {MockScriptStep} step - Step.
 * @param {LanguageModelV4Prompt} prompt - Prompt.
 * @returns {ReadableStream<LanguageModelV4StreamPart>} The stream.
 */
export const toScriptedStream = (
  step: MockScriptStep,
  prompt: LanguageModelV4Prompt
): ReadableStream<LanguageModelV4StreamPart> => {
  const parts = toScriptedStreamParts(step, prompt)
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part)
      controller.close()
    },
  })
}
