/**
 * Service for the natural-language → Arena expression feature (Tier 1 #2).
 *
 * Pipeline:
 *   1. Load the target node def + parent context via SurveyManager.
 *   2. Build the prompt with a glossary of Arena's allowed operators and
 *      built-in functions, plus the names of sibling fields the user can
 *      reference.
 *   3. Call `modelClient.generate` (plain text) and parse the model's
 *      response, which is wrapped in <expression>/<explanation> XML tags.
 *      JSON / tool-calling modes were dropped because tiny local models
 *      (LM Studio, Ollama) frequently can't produce schema-conformant JSON;
 *      every model can produce simple tagged text.
 *   4. Validate the parsed expression by feeding it through the existing
 *      `JavascriptExpressionParser` from `@openforis/arena-core`. On parse
 *      error, retry the prompt once with the parser's error message
 *      attached.
 *   5. Return `{ expression, explanation, isValid, parseError? }`.
 */
import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'

import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ModelClient from './modelClient'
import { buildExpressionGeneratePrompt } from './prompts/expressionGenerate'
import { buildExpressionExplainPrompt } from './prompts/expressionExplain'

const logger = Log.getLogger('AiExpressionService')

const SUPPORTED_TYPES = new Set(['validation', 'applicableIf', 'defaultValue'])

// Hard caps on user-controlled strings before they enter an LLM prompt.
// Bounds cost amplification against paid providers and limits the surface
// for prompt-injection payloads.
const MAX_DESCRIPTION_LEN = 4000
const MAX_EXPRESSION_LEN = 4000
const MAX_ERROR_MESSAGE_LEN = 4000

const EXPRESSION_TAG_RE = /<expression>([\s\S]*?)<\/expression>/i
const EXPLANATION_TAG_RE = /<explanation>([\s\S]*?)<\/explanation>/i
const FENCE_RE = /^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/

/**
 * Strip a single wrapping triple-backtick code fence if the model decided
 * to add one despite being told not to.
 * @param {string} value - Raw extracted text.
 * @returns {string} Cleaned text.
 */
const stripFence = (value) => {
  const trimmed = value.trim()
  const match = FENCE_RE.exec(trimmed)
  return (match ? match[1] : trimmed).trim()
}

/**
 * Parse the model's tagged text response into `{ expression, explanation }`.
 * Tolerates models that omit the explanation tag, drop tags entirely, or
 * wrap output in a code fence — the Arena parser is the real validator
 * downstream so a generous extractor here is fine.
 * @param {string} text - Raw model output.
 * @returns {{ expression: string, explanation: string }} Parsed pieces.
 */
const parseTaggedResponse = (text) => {
  const stripped = stripFence(text || '')
  const exprMatch = EXPRESSION_TAG_RE.exec(stripped)
  const explMatch = EXPLANATION_TAG_RE.exec(stripped)
  const expression = exprMatch ? stripFence(exprMatch[1]) : stripped
  const explanation = explMatch ? explMatch[1].trim() : ''
  return { expression, explanation }
}

/**
 * Validate the LLM's expression by feeding it through the Arena parser.
 * @param {string} expression - The candidate expression string.
 * @returns {{ valid: boolean, error?: string }} Parser result.
 */
const tryParse = (expression) => {
  try {
    Expression.fromString(expression, Expression.modes.json)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error?.message || String(error) }
  }
}

/**
 * Generates an Arena expression from a natural-language description.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID for permission + context fetch.
 * @param {string} args.nodeDefUuid - Target node def.
 * @param {string} args.expressionType - validation | applicableIf | defaultValue.
 * @param {string} args.description - User's plain-language description.
 * @returns {Promise<{ expression: string, explanation: string, isValid: boolean, parseError?: string }>}
 *   The generated expression and validation status.
 */
export const generate = async ({ user, surveyId, nodeDefUuid, expressionType, description }) => {
  if (!description?.trim()) {
    throw new SystemError('aiExpressionDescriptionMissing')
  }
  if (description.length > MAX_DESCRIPTION_LEN) {
    throw new SystemError('aiInputTooLong', { field: 'description', limit: MAX_DESCRIPTION_LEN })
  }
  if (!SUPPORTED_TYPES.has(expressionType)) {
    throw new SystemError('aiExpressionTypeInvalid', { expressionType })
  }
  if (!nodeDefUuid) {
    throw new SystemError('aiExpressionNodeDefMissing')
  }

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    advanced: true,
    draft: true,
  })
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  if (!nodeDef) {
    throw new SystemError('aiExpressionNodeDefNotFound', { nodeDefUuid })
  }

  const runOnce = async (previousError) => {
    const { system, prompt } = buildExpressionGeneratePrompt({
      survey,
      nodeDef,
      expressionType,
      description,
      previousError,
    })
    const { text } = await ModelClient.generate({
      user,
      feature: 'expressionGenerate',
      prompt,
      system,
    })
    return parseTaggedResponse(text)
  }

  // First attempt
  let result = await runOnce()
  let parseResult = tryParse(result.expression)

  // Retry once on parse failure with the error fed back
  if (!parseResult.valid) {
    logger.info(`expressionGenerate parse failed on first try: ${parseResult.error}; retrying once with feedback`)
    result = await runOnce({ expression: result.expression, message: parseResult.error })
    parseResult = tryParse(result.expression)
  }

  return {
    expression: result.expression,
    explanation: result.explanation,
    isValid: parseResult.valid,
    parseError: parseResult.valid ? undefined : parseResult.error,
  }
}

/**
 * Streams a plain-language explanation of an existing Arena expression
 * for display in a side panel. Returns the Vercel AI SDK stream handle
 * whose `textStream` async-iterates over chunks.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.nodeDefUuid - Target node def UUID.
 * @param {string} args.expression - The expression to explain.
 * @param {string} [args.errorMessage] - Optional error to diagnose.
 * @param {AbortSignal} [args.signal] - Cancellation signal from the route.
 * @returns {Promise<{textStream: AsyncIterable<string>, usage: Promise<object>}>}
 *   The streaming result.
 */
export const explain = async ({ user, surveyId, nodeDefUuid, expression, errorMessage, signal }) => {
  if (!expression || !expression.trim()) {
    throw new SystemError('aiExpressionExpressionMissing')
  }
  if (expression.length > MAX_EXPRESSION_LEN) {
    throw new SystemError('aiInputTooLong', { field: 'expression', limit: MAX_EXPRESSION_LEN })
  }
  if (typeof errorMessage === 'string' && errorMessage.length > MAX_ERROR_MESSAGE_LEN) {
    throw new SystemError('aiInputTooLong', { field: 'errorMessage', limit: MAX_ERROR_MESSAGE_LEN })
  }
  if (!nodeDefUuid) {
    throw new SystemError('aiExpressionNodeDefMissing')
  }

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    advanced: true,
    draft: true,
  })
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  if (!nodeDef) {
    throw new SystemError('aiExpressionNodeDefNotFound', { nodeDefUuid })
  }

  const { system, prompt } = buildExpressionExplainPrompt({
    survey,
    nodeDef,
    expression,
    errorMessage,
  })

  return ModelClient.stream({
    user,
    feature: 'expressionExplain',
    prompt,
    system,
    signal,
  })
}
