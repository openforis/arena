/**
 * Scripted turns of the mock provider (and of C's stub local server) for the Analysis area,
 * used by test/e2e/specs/aiAnalysis.spec.ts. Names match the e2e sample survey.
 */
import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'

// type-only import: mockScripts.ts imports this file's scripts (no runtime cycle)
import type { MockScript, MockScriptStep } from './mockScripts'

const proposeAverageByCluster: MockScriptStep = {
  toolCall: {
    toolName: 'query_propose',
    input: {
      entity: 'tree',
      mode: 'aggregate',
      attributes: [],
      dimensions: ['cluster_id'],
      measures: [{ attribute: 'tree_dec_1', functions: ['avg'] }],
      filter: null,
      sort: [{ attribute: 'cluster_id', order: 'asc' }],
      explanation: 'MOCK: average of tree_dec_1 for each cluster.',
    },
  },
}

/**
 * Formats a cell for the scripted answer (numeric averages come back as strings).
 * @param {unknown} value - Cell value.
 * @returns {string} The formatted value.
 */
const formatCell = (value: unknown): string => {
  const number = Number(value)
  return value !== null && value !== '' && Number.isFinite(number) ? String(number) : String(value)
}

/**
 * Builds the scripted answer from the output of query_run.
 * @param {unknown} lastToolOutput - Output of the last tool call.
 * @returns {string} The answer.
 */
export const formatMockQueryAnswer = (lastToolOutput: unknown): string => {
  const output = lastToolOutput as { queryId?: string; rows?: unknown[][] } | null
  if (!output || !Array.isArray(output.rows)) return 'MOCK: I could not run the query.'
  const values = output.rows.map(([group, value]) => `${formatCell(group)}: ${formatCell(value)}`).join('; ')
  return `Average of tree_dec_1 by cluster_id (query ${output.queryId}): ${values}.`
}

export const assistantAnalysisMockScripts: MockScript[] = [
  {
    promptMarker: assistantMarkers.analysis,
    pattern: /^run the average of tree_dec_1 by cluster_id/i,
    steps: [
      proposeAverageByCluster,
      { toolCall: { toolName: 'query_run', input: { queryId: 'q1' } } },
      { text: ({ lastToolOutput }) => formatMockQueryAnswer(lastToolOutput) },
    ],
  },
  {
    promptMarker: assistantMarkers.analysis,
    pattern: /^average of tree_dec_1 by cluster_id/i,
    steps: [
      proposeAverageByCluster,
      { text: 'MOCK: I proposed query q1. Use "Open in Explorer" on the card to see the result.' },
    ],
  },
]
