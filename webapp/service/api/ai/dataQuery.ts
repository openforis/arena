/**
 * Frontend client for the natural-language → Data Explorer query feature.
 * Calls the backend's `/api/ai/survey/:surveyId/data-query/generate` route.
 */
import axios from 'axios'

export type AiDataQueryGenerateResult = {
  query: object
  summary: { name: string; label: string; description: string }
  explanation: string
}

/**
 * Generates a Data Explorer query from a plain-language description.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - Survey ID.
 * @param {string} params.cycle - Survey cycle key.
 * @param {string} params.lang - Language for the labels and for the suggested query label / description.
 * @param {string} params.description - The user's plain-language request.
 * @returns {Promise<AiDataQueryGenerateResult>} - The generated query and the suggested summary props.
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
