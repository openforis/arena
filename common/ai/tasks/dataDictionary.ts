/**
 * Descriptions for the node defs of the data dictionary export (one batch per call).
 */
import { z } from 'zod'

import SystemError, { StatusCodes } from '@core/systemError'
import type { AiGenerateText } from '../llm'
import { safeParseJsonResponse } from '../parsing'
import { buildDataDictionaryPrompt } from '../prompts/dataDictionary'

export type AiDataDictionaryNodeDef = { uuid: string; name: string; label?: string; type: string; parentPath?: string }

const DescriptionsSchema = z.object({
  descriptions: z.array(z.object({ id: z.string(), description: z.string() })),
})

/**
 * Generates a short description for each of the given node defs.
 * @param {object} params - Parameters.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {string} params.surveyName - Survey name (context for the model).
 * @param {AiDataDictionaryNodeDef[]} params.nodeDefs - The batch of node defs.
 * @param {string} [params.language] - Language of the descriptions (English when absent).
 * @returns {Promise<{descriptions: {uuid: string, description: string}[]}>} The descriptions.
 */
export const generateDataDictionaryDescriptions = async ({
  generateText,
  surveyName,
  nodeDefs,
  language,
  signal,
}: {
  generateText: AiGenerateText
  surveyName: string
  nodeDefs: AiDataDictionaryNodeDef[]
  language?: string
  signal?: AbortSignal
}): Promise<{ descriptions: { uuid: string; description: string }[] }> => {
  // short ids keep the prompt and the answer small; the answer is mapped back to the uuids
  const shortNodeDefs = nodeDefs.map((nodeDef, index) => ({ ...nodeDef, id: String(index + 1) }))
  const { system, prompt } = buildDataDictionaryPrompt({ surveyName, nodeDefs: shortNodeDefs, language })
  const { value } = safeParseJsonResponse(await generateText({ system, prompt, signal }), DescriptionsSchema)
  if (!value) throw new SystemError('aiDataDictionaryInvalid', {}, StatusCodes.BAD_GATEWAY)
  // an id the model made up is dropped
  const descriptions = value.descriptions.flatMap(({ id, description }) => {
    const known = shortNodeDefs.some((candidate) => candidate.id === id)
    return known ? [{ uuid: nodeDefs[Number(id) - 1].uuid, description }] : []
  })
  return { descriptions }
}
