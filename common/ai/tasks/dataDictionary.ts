/**
 * Descriptions for the node defs of the data dictionary export (one batch per call).
 */
import { z } from 'zod'

import SystemError, { StatusCodes } from '@core/systemError'

import type { AiGenerateText } from '../llm'
import { safeParseJsonResponse, withOneRetry } from '../parsing'
import type { RetryFeedback } from '../parsing'
import { buildDataDictionaryPrompt } from '../prompts/dataDictionary'

export type AiDataDictionaryNodeDef = { uuid: string; name: string; type: string; parentPath?: string }

const DescriptionsSchema = z.object({
  descriptions: z.array(z.object({ uuid: z.string(), description: z.string() })),
})

/**
 * Generates a short description for each of the given node defs.
 * @param {object} params - Parameters.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {string} params.surveyName - Survey name (context for the model).
 * @param {AiDataDictionaryNodeDef[]} params.nodeDefs - The batch of node defs.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<{descriptions: {uuid: string, description: string}[]}>} The descriptions.
 */
export const generateDataDictionaryDescriptions = async ({
  generateText,
  surveyName,
  nodeDefs,
  signal,
}: {
  generateText: AiGenerateText
  surveyName: string
  nodeDefs: AiDataDictionaryNodeDef[]
  signal?: AbortSignal
}): Promise<{ descriptions: { uuid: string; description: string }[] }> => {
  const run = async (previousError: RetryFeedback | null) => {
    const { system, prompt } = buildDataDictionaryPrompt({ surveyName, nodeDefs, previousError })
    return safeParseJsonResponse(await generateText({ system, prompt, signal }), DescriptionsSchema)
  }
  const { value } = await withOneRetry({
    run,
    getRetryFeedback: ({ error }) => (error ? { message: error } : null),
  })
  if (!value) throw new SystemError('aiDataDictionaryInvalid', {}, StatusCodes.BAD_GATEWAY)
  return value
}
