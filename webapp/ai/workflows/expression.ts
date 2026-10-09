/**
 * Expression assistant: generation (shared task, gateway model) and streamed explanation.
 */
import type { LanguageModel } from 'ai'

import { buildExplainExpressionRequest, generateExpression, type AiExpressionResult } from '@common/ai/tasks/expression'

import { resolveModel } from '@webapp/ai/engines/resolveModel'
import { createGatewayTextGenerator, streamTextChunks } from '../runtime/textGenerators'

type ExpressionContext = { survey: any; surveyId: number; nodeDefUuid: string; model?: LanguageModel }

/**
 * Generates an expression from a plain-language description.
 * @param {object} params - Parameters (survey, surveyId, nodeDefUuid, expressionType, description, signal, model).
 * @returns {Promise<AiExpressionResult>} The expression, its explanation and the syntax check result.
 */
export const generateExpressionWorkflow = async ({
  survey,
  surveyId,
  nodeDefUuid,
  expressionType,
  description,
  signal,
  model,
}: ExpressionContext & {
  expressionType: string
  description: string
  signal?: AbortSignal
}): Promise<AiExpressionResult> => {
  const resolvedModel = model ?? (await resolveModel({ feature: 'expressionGenerate', surveyId })).model
  return generateExpression({
    generateText: createGatewayTextGenerator(resolvedModel),
    survey,
    nodeDefUuid,
    expressionType,
    description,
    signal,
  })
}

/**
 * Streams the explanation of an expression.
 * @param {object} params - Parameters (survey, surveyId, nodeDefUuid, expression, errorMessage, onChunk, signal, model).
 * @returns {Promise<void>} Resolves when the explanation is complete.
 */
export const explainExpressionWorkflow = async ({
  survey,
  surveyId,
  nodeDefUuid,
  expression,
  errorMessage,
  onChunk,
  signal,
  model,
}: ExpressionContext & {
  expression: string
  errorMessage?: string
  onChunk: (chunk: string) => void
  signal?: AbortSignal
}): Promise<void> => {
  // validated before resolving the model: an empty expression never reaches the network
  const request = buildExplainExpressionRequest({ survey, nodeDefUuid, expression, errorMessage })
  const resolvedModel = model ?? (await resolveModel({ feature: 'expressionExplain', surveyId })).model
  await streamTextChunks({ model: resolvedModel, ...request, onChunk, signal })
}
