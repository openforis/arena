/**
 * Natural language → Arena expression, and the request used to explain an expression.
 * The model answers with <expression>/<explanation> tags (JSON mode is unreliable on small local models);
 * the Arena parser validates the expression and a parse error triggers one retry with feedback.
 */
import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import SystemError, { StatusCodes } from '@core/systemError'

import type { AiGenerateText, AiTextRequest } from '../llm'
import { AiLimits } from '../limits'
import { extractTaggedValue, stripCodeFences, withOneRetry } from '../parsing'
import type { RetryFeedback } from '../parsing'
import { buildExpressionExplainPrompt } from '../prompts/expressionExplain'
import { buildExpressionGeneratePrompt } from '../prompts/expressionGenerate'

export const AiExpressionType = {
  validation: 'validation',
  applicableIf: 'applicableIf',
  defaultValue: 'defaultValue',
} as const

export type AiExpressionResult = {
  expression: string
  explanation: string
  isValid: boolean
  parseError?: string
}

const badRequest = (key: string, params?: object) => new SystemError(key, params, StatusCodes.BAD_REQUEST)

const assertMaxLength = (value: string | undefined, field: string, limit: number): void => {
  if (typeof value === 'string' && value.length > limit) throw badRequest('aiInputTooLong', { field, limit })
}

const getTargetNodeDef = ({ survey, nodeDefUuid }: { survey: any; nodeDefUuid: string }) => {
  if (!nodeDefUuid) throw badRequest('aiExpressionNodeDefMissing')
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  if (!nodeDef) throw badRequest('aiExpressionNodeDefNotFound', { nodeDefUuid })
  return nodeDef
}

/**
 * Extracts the expression and its explanation from the model answer.
 * @param {string} text - Raw model output.
 * @returns {{expression: string, explanation: string}} The parsed pieces (the whole text when tags are missing).
 */
export const parseTaggedExpressionResponse = (text: string): { expression: string; explanation: string } => {
  const stripped = stripCodeFences(text)
  const tagged = extractTaggedValue(stripped, 'expression')
  return {
    expression: tagged === null ? stripped : stripCodeFences(tagged),
    explanation: extractTaggedValue(stripped, 'explanation') ?? '',
  }
}

/**
 * Checks the expression syntax with the Arena expression parser.
 * @param {string} expression - Candidate expression.
 * @returns {{valid: boolean, error?: string}} The parser verdict.
 */
export const tryParseExpression = (expression: string): { valid: boolean; error?: string } => {
  try {
    Expression.fromString(expression, Expression.modes.json)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error?.message ?? String(error) }
  }
}

const validateGenerateInput = ({ expressionType, description }: { expressionType: string; description: string }) => {
  if (!description?.trim()) throw badRequest('aiExpressionDescriptionMissing')
  assertMaxLength(description, 'description', AiLimits.expressionDescriptionMaxChars)
  if (!Object.values<string>(AiExpressionType).includes(expressionType)) {
    throw badRequest('aiExpressionTypeInvalid', { expressionType })
  }
}

/**
 * Generates an expression for the given node def from a plain-language description.
 * @param {object} params - Parameters.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {object} params.survey - Survey with its node defs.
 * @param {string} params.nodeDefUuid - Target node def.
 * @param {string} params.expressionType - One of AiExpressionType.
 * @param {string} params.description - The user's description.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<AiExpressionResult>} The expression, its explanation and the syntax check result.
 */
export const generateExpression = async ({
  generateText,
  survey,
  nodeDefUuid,
  expressionType,
  description,
  signal,
}: {
  generateText: AiGenerateText
  survey: any
  nodeDefUuid: string
  expressionType: string
  description: string
  signal?: AbortSignal
}): Promise<AiExpressionResult> => {
  validateGenerateInput({ expressionType, description })
  const nodeDef = getTargetNodeDef({ survey, nodeDefUuid })

  const run = async (previousError: RetryFeedback | null) => {
    const { system, prompt } = buildExpressionGeneratePrompt({
      survey,
      nodeDef,
      expressionType,
      description,
      previousError: previousError ?? undefined,
    })
    const parsed = parseTaggedExpressionResponse(await generateText({ system, prompt, signal }))
    return { ...parsed, check: tryParseExpression(parsed.expression) }
  }
  const result = await withOneRetry({
    run,
    getRetryFeedback: ({ expression, check }) => (check.valid ? null : { expression, message: check.error }),
  })
  return {
    expression: result.expression,
    explanation: result.explanation,
    isValid: result.check.valid,
    parseError: result.check.valid ? undefined : result.check.error,
  }
}

/**
 * Validates the input and builds the request that explains an expression (streamed by the caller).
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs.
 * @param {string} params.nodeDefUuid - Node def owning the expression.
 * @param {string} params.expression - The expression to explain.
 * @param {string} [params.errorMessage] - Parser / validation error to diagnose.
 * @returns {AiTextRequest} The system prompt and prompt.
 */
export const buildExplainExpressionRequest = ({
  survey,
  nodeDefUuid,
  expression,
  errorMessage,
}: {
  survey: any
  nodeDefUuid: string
  expression: string
  errorMessage?: string
}): AiTextRequest => {
  if (!expression?.trim()) throw badRequest('aiExpressionExpressionMissing')
  assertMaxLength(expression, 'expression', AiLimits.expressionMaxChars)
  assertMaxLength(errorMessage, 'errorMessage', AiLimits.expressionErrorMessageMaxChars)
  const nodeDef = getTargetNodeDef({ survey, nodeDefUuid })
  return buildExpressionExplainPrompt({ survey, nodeDef, expression, errorMessage })
}
