/**
 * Data Explorer assistant: query generation and query summary (shared tasks, gateway model).
 */
import type { LanguageModel } from 'ai'

import {
  generateDataQuery,
  summarizeDataQuery,
  type AiDataQueryGenerateResult,
  type AiDataQuerySummarizeResult,
} from '@common/ai/tasks/dataQuery'

import { resolveModel } from '@webapp/ai/engines/resolveModel'
import { createGatewayTextGenerator } from '../runtime/textGenerators'

/**
 * Generates a Data Explorer query from a plain-language description.
 * @param {object} params - Parameters (survey, surveyId, cycle, lang, description, includeAnalysis, signal, model).
 * @returns {Promise<AiDataQueryGenerateResult>} The query and its explanation.
 */
export const generateDataQueryWorkflow = async ({
  survey,
  surveyId,
  cycle,
  lang,
  description,
  includeAnalysis,
  signal,
  model,
}: {
  survey: any
  surveyId: number
  cycle: string
  lang: string
  description: string
  includeAnalysis: boolean
  signal?: AbortSignal
  model?: LanguageModel
}): Promise<AiDataQueryGenerateResult> => {
  const resolvedModel = model ?? (await resolveModel({ feature: 'dataQueryGenerate', surveyId })).model
  return generateDataQuery({
    generateText: createGatewayTextGenerator(resolvedModel),
    survey,
    cycle,
    lang,
    description,
    includeAnalysis,
    signal,
  })
}

/**
 * Suggests a name, a label and a description for a query.
 * @param {object} params - Parameters (survey, surveyId, query, lang, signal, model).
 * @returns {Promise<AiDataQuerySummarizeResult>} The suggestions.
 */
export const summarizeDataQueryWorkflow = async ({
  survey,
  surveyId,
  query,
  lang,
  signal,
  model,
}: {
  survey: any
  surveyId: number
  query: any
  lang: string
  signal?: AbortSignal
  model?: LanguageModel
}): Promise<AiDataQuerySummarizeResult> => {
  const resolvedModel = model ?? (await resolveModel({ feature: 'dataQuerySummarize', surveyId })).model
  return summarizeDataQuery({ generateText: createGatewayTextGenerator(resolvedModel), survey, query, lang, signal })
}
