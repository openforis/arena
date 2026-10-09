/**
 * Scripted turns of the mock provider (and of C's stub local server) for the Cleaning area,
 * used by test/e2e/specs/aiCleaning.spec.ts.
 */
import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { parseRowContext } from '@common/ai/prompts/cleaningRowContext'

// type-only import: mockScripts.ts imports this file's script (no runtime cycle)
import type { MockScript, MockScriptParams } from './mockScripts'

export type CleaningMockInputParams = MockScriptParams

// fixes the e2e record: tree_dec_2 must be > 10
export const MOCK_FIXED_VALUE = '25'

/**
 * Builds the records_proposeEdits input from the row context of the user message.
 * @param {CleaningMockInputParams} params - The last user message.
 * @returns {object} The tool input (no edit without a row context).
 */
export const proposeRowFixInput = ({
  lastUserMessage,
}: CleaningMockInputParams): {
  summary: string
  edits: { recordUuid: string; nodeUuid: string; value: string }[]
} => {
  const context = parseRowContext(lastUserMessage ?? '')
  return {
    summary: `MOCK: set the value to ${MOCK_FIXED_VALUE}.`,
    edits: context ? [{ ...context, value: MOCK_FIXED_VALUE }] : [],
  }
}

/**
 * Builds the scripted answer from the output of records_proposeEdits.
 * @param {unknown} lastToolOutput - Output of the last tool call.
 * @returns {string} The answer.
 */
export const formatMockProposalAnswer = (lastToolOutput: unknown): string => {
  const output = lastToolOutput as { proposed?: unknown } | null
  if (!output || typeof output.proposed !== 'number') return 'MOCK: I could not prepare the edit.'
  return `MOCK: I proposed ${output.proposed} edit(s). Review them in the card, then apply.`
}

export const assistantCleaningMockScripts: MockScript[] = [
  {
    promptMarker: assistantMarkers.cleaning,
    pattern: /^Why is this value invalid, and how can I fix it\?/i,
    steps: [
      { toolCall: { toolName: 'records_proposeEdits', input: proposeRowFixInput } },
      { text: ({ lastToolOutput }) => formatMockProposalAnswer(lastToolOutput) },
    ],
  },
]
