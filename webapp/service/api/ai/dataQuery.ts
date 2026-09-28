/**
 * Frontend client for the Data Explorer AI features.
 * Calls the backend's `/api/ai/survey/:surveyId/data-query/*` routes.
 */
import axios from 'axios'

export type AiDataQueryGenerateResult = {
  query: object
  explanation: string
}

export type AiDataQuerySummarizeResult = {
  name: string
  label: string
  description: string
}

/**
 * Generates a Data Explorer query from a plain-language description.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - Survey ID.
 * @param {string} params.cycle - Survey cycle key.
 * @param {string} params.lang - Language for the labels and for the explanation.
 * @param {string} params.description - The user's plain-language request.
 * @returns {Promise<AiDataQueryGenerateResult>} - The generated query and its explanation.
 */
export const generate = async ({
  surveyId,
  cycle,
  lang,
  description,
}: {
  surveyId: number
  cycle: string
  lang: string
  description: string
}): Promise<AiDataQueryGenerateResult> => {
  const { data } = await axios.post(`/api/ai/survey/${surveyId}/data-query/generate`, { cycle, lang, description })
  return data
}

/**
 * Suggests a name, a label and a description for a Data Explorer query, based on its selections.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - Survey ID.
 * @param {string} params.cycle - Survey cycle key.
 * @param {string} params.lang - Language for the suggested label / description.
 * @param {object} params.query - The Data Explorer query.
 * @returns {Promise<AiDataQuerySummarizeResult>} - The suggested name, label and description.
 */
export const summarize = async ({
  surveyId,
  cycle,
  lang,
  query,
}: {
  surveyId: number
  cycle: string
  lang: string
  query: object
}): Promise<AiDataQuerySummarizeResult> => {
  const { data } = await axios.post(`/api/ai/survey/${surveyId}/data-query/summarize`, { cycle, lang, query })
  return data
}
