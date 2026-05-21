/**
 * Service for the data-dictionary feature (Tier 1 #7).
 *
 * Synchronous MVP: fetches the survey schema, asks the LLM to draft
 * descriptions for fields lacking one (capped at MAX_AI_DESCRIPTIONS to
 * keep response time bounded), and renders the result to either
 * Markdown or HTML. PDF rendering and the background-job variant are
 * deferred per the plan.
 *
 * Each LLM batch goes through `ModelClient.generate` (plain text) and a
 * tolerant JSON parser; the parsed object is then validated against the
 * Zod schema. The structured-output path (`generateStructured`) was
 * dropped for the same reason as the translation feature: tiny local
 * models 400 even when asked for `response_format: json_object`.
 */
import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'

import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ModelClient from './modelClient'
import { buildDataDictionaryPrompt } from './prompts/dataDictionary'
import { renderHtml, renderMarkdown } from './render/dataDictionaryRenderer'
import { parseJsonResponse } from './responseParsers'

const logger = Log.getLogger('AiDataDictionaryService')

const MAX_AI_DESCRIPTIONS = 50
const AI_BATCH_SIZE = 10

const DescriptionsSchema = z.object({
  descriptions: z.array(z.object({ uuid: z.string(), description: z.string() })),
})

const SUPPORTED_FORMATS = new Set(['html', 'md'])

/**
 * Walks the parent chain to build a slash-separated path string for the
 * given node def.
 * @param {object} nodeDef - The leaf node def.
 * @param {object} survey - The full survey.
 * @returns {string} Path like "plot/tree".
 */
const getParentPath = (nodeDef, survey) => {
  const parts = []
  let cur = Survey.getNodeDefParent(nodeDef)(survey)
  while (cur && !NodeDef.isRoot(cur)) {
    parts.unshift(String(NodeDef.getName(cur) || ''))
    cur = Survey.getNodeDefParent(cur)(survey)
  }
  return parts.join('/')
}

const buildEntries = (survey, langToUse) =>
  Survey.getNodeDefsArray(survey)
    .filter((nd) => !NodeDef.isDeleted(nd) && !NodeDef.isRoot(nd))
    .map((nd) => ({
      uuid: NodeDef.getUuid(nd),
      name: NodeDef.getName(nd),
      type: NodeDef.getType(nd),
      label: NodeDef.getLabel(nd, langToUse) || '',
      description: NodeDef.getDescription(langToUse)(nd) || '',
      parentPath: getParentPath(nd, survey),
      aiGenerated: false,
    }))

const runDescriptionBatch = async ({ user, surveyName, batch, previousError }) => {
  const batchNodeDefs = batch.map((e) => ({ uuid: e.uuid, name: e.name, type: e.type, parentPath: e.parentPath }))
  const { system, prompt } = buildDataDictionaryPrompt({ surveyName, nodeDefs: batchNodeDefs, previousError })
  const { text } = await ModelClient.generate({ user, feature: 'dataDictionary', prompt, system })
  const json = parseJsonResponse(text)
  return DescriptionsSchema.parse(json)
}

const runDescriptionBatchWithRetry = async ({ user, surveyName, batch, batchIndex }) => {
  try {
    return await runDescriptionBatch({ user, surveyName, batch })
  } catch (firstError) {
    logger.info(
      `dataDictionary batch ${batchIndex} parse/validate failed on first try: ${firstError?.message || firstError}; retrying once with feedback`
    )
    return runDescriptionBatch({
      user,
      surveyName,
      batch,
      previousError: { message: firstError?.message || String(firstError) },
    })
  }
}

const applyDescriptions = (batch, descriptions) => {
  const byUuid = new Map(descriptions.map((d) => [d.uuid, d.description]))
  let filled = 0
  for (const entry of batch) {
    const desc = byUuid.get(entry.uuid)
    if (desc) {
      entry.description = desc
      entry.aiGenerated = true
      filled += 1
    }
  }
  return filled
}

const fillMissingDescriptions = async ({ user, surveyName, entries }) => {
  const missing = entries.filter((e) => !e.description.trim()).slice(0, MAX_AI_DESCRIPTIONS)
  let aiCount = 0
  for (let i = 0; i < missing.length; i += AI_BATCH_SIZE) {
    const batch = missing.slice(i, i + AI_BATCH_SIZE)
    try {
      const result = await runDescriptionBatchWithRetry({ user, surveyName, batch, batchIndex: i })
      aiCount += applyDescriptions(batch, result.descriptions)
    } catch (error) {
      logger.warn(`dataDictionary batch ${i}: ${error?.message || error}`)
      // keep going with whatever filled successfully
    }
  }
  return aiCount
}

/**
 * Generates a data dictionary for the survey.
 * @param {object} args - Args.
 * @param {object} args.user - Acting user.
 * @param {number} args.surveyId - Survey ID.
 * @param {string} args.format - "html" or "md".
 * @param {string} [args.lang] - Language for labels (default: survey default).
 * @param {boolean} [args.fillMissingDescriptions] - When true, draft descriptions
 *   for fields lacking one via the LLM. Capped at MAX_AI_DESCRIPTIONS.
 * @returns {Promise<{filename: string, contentType: string, content: string, aiCount: number}>}
 *   The rendered dictionary plus metadata for the download.
 */
export const generate = async ({ user, surveyId, format, lang, fillMissingDescriptions: shouldFill = true }) => {
  if (!SUPPORTED_FORMATS.has(format)) {
    throw new SystemError('aiDataDictionaryFormatInvalid', { format })
  }

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    advanced: true,
    draft: true,
  })
  const surveyName = Survey.getName(Survey.getSurveyInfo(survey)) || `survey-${surveyId}`
  const langToUse = lang || Survey.getDefaultLanguage(survey) || 'en'

  const entries = buildEntries(survey, langToUse)
  const aiCount = shouldFill ? await fillMissingDescriptions({ user, surveyName, entries }) : 0

  const content =
    format === 'html'
      ? renderHtml({ surveyName, lang: langToUse, entries })
      : renderMarkdown({ surveyName, lang: langToUse, entries })

  const ext = format === 'html' ? 'html' : 'md'
  const safeName = surveyName.replaceAll(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60) || 'survey'
  const filename = `data_dictionary_${safeName}_${langToUse}.${ext}`

  return {
    filename,
    contentType: format === 'html' ? 'text/html; charset=utf-8' : 'text/markdown; charset=utf-8',
    content,
    aiCount,
    totalEntries: entries.length,
  }
}
