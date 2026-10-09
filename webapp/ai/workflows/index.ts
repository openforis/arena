/**
 * Entry point of the AI features for the UI. Each workflow module (and the AI SDK) is loaded on first use,
 * keeping it out of the main bundle.
 */
import type { AiExpressionResult } from '@common/ai/tasks/expression'

import { runStreamWithCallbacks } from '../runtime/streamCallbacks'

export { getAiErrorKey, getAiErrorMessage, isAiAbortError } from '../runtime/runtimeErrors'

type StreamCallbacks = { onChunk: (chunk: string) => void; onDone?: () => void; onError?: (error: unknown) => void }

type ExpressionWorkflows = Awaited<ReturnType<typeof loadExpression>>

/**
 * Loads the expression workflow module on first use.
 * @returns {Promise<object>} The module.
 */
const loadExpression = () => import('./expression')

/**
 * Generates an expression (see workflows/expression).
 * @param {object} params - Workflow parameters.
 * @returns {Promise<AiExpressionResult>} The result.
 */
const generateExpression = async (
  params: Parameters<ExpressionWorkflows['generateExpressionWorkflow']>[0]
): Promise<AiExpressionResult> => (await loadExpression()).generateExpressionWorkflow(params)

/**
 * Streams the explanation of an expression.
 * @param {object} params - Workflow parameters and callbacks.
 * @returns {Function} cancel().
 */
const explainExpression = ({
  onChunk,
  onDone,
  onError,
  ...params
}: StreamCallbacks & {
  survey: any
  surveyId: number
  nodeDefUuid: string
  expression: string
  errorMessage?: string
}): (() => void) =>
  runStreamWithCallbacks({
    run: async (signal) => (await loadExpression()).explainExpressionWorkflow({ ...params, onChunk, signal }),
    onDone,
    onError,
  })

/**
 * Loads the translation workflow module on first use.
 * @returns {Promise<object>} The module.
 */
const loadTranslation = () => import('./translation')

/**
 * Translates labels (see workflows/translation).
 * @param {object} params - Workflow parameters.
 * @returns {Promise<object>} The translations.
 */
const translateLabels = async (
  params: Parameters<Awaited<ReturnType<typeof loadTranslation>>['translateLabelsWorkflow']>[0]
) => (await loadTranslation()).translateLabelsWorkflow(params)

/**
 * Loads the activity log workflow module on first use.
 * @returns {Promise<object>} The module.
 */
const loadActivityLog = () => import('./activityLog')

/**
 * Streams the activity log summary.
 * @param {object} params - Survey id/name and callbacks.
 * @returns {Function} cancel().
 */
const summarizeActivityLog = ({
  onChunk,
  onDone,
  onError,
  ...params
}: StreamCallbacks & { surveyId: number; surveyName: string }): (() => void) =>
  runStreamWithCallbacks({
    run: async (signal) => (await loadActivityLog()).summarizeActivityLogWorkflow({ ...params, onChunk, signal }),
    onDone,
    onError,
  })

export const AiWorkflows = {
  generateExpression,
  explainExpression,
  translateLabels,
  summarizeActivityLog,
}
