/**
 * Batch tools of the model: they make many texts at once with batch AI requests (workflows/assistantBatches) and
 * propose them on one card, showing their progress under the tool row. The model asked to translate or describe many
 * texts calls one of them instead of proposing the texts a few at a time.
 */
import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import { SUGGESTION_BATCH_TOOL_NAMES, type SuggestionBatchKind } from '@webapp/ai/suggestions/suggestionBatchTurn'
import {
  type AssistantBatchDeps,
  getAssistantBatchKind,
  loadAssistantBatch,
  runAssistantBatch,
} from '@webapp/ai/workflows/assistantBatches'
import type { resolveBatchModel } from '@webapp/ai/workflows/batchModel'
import { canEditCurrentSurvey } from '../common/toolPermissions'
import { AiToolFailure } from '../toolFailure'
import type { AiTool, AiToolContext } from '../types'

import { requireCategory } from './categoryItemsListMissingLabels'
import { getSurveyLanguages } from './missingTexts'
import { proposeChangeSet } from './proposeChangeSet'
import { requireNodeDefByName, requireSurvey } from './surveyLookup'

const KEYS = 'aiAssistant.missingTextsBatch'

const langSchema = z.string().min(2).max(10).describe('The survey language to translate into')

/**
 * Returns the language when it is a survey language, or fails for the model.
 * @param {object} survey - Survey.
 * @param {string} lang - Language code.
 * @returns {string} The language.
 */
const requireSurveyLanguage = (survey: any, lang: string): string => {
  const languages = getSurveyLanguages(survey)
  if (languages.includes(lang)) return lang
  throw new AiToolFailure('languageNotInSurvey', `"${lang}" is not a survey language (${languages.join(', ')}).`)
}

/**
 * Runs a batch and proposes its texts on one card.
 * @param {object} params - Parameters.
 * @param {SuggestionBatchKind} params.kind - Batch.
 * @param {string} params.lang - Language (translations; '' otherwise).
 * @param {string[]} params.targetKeys - Uuids of the categories or node definitions (none: all).
 * @param {AiToolContext} params.ctx - Tool context.
 * @param {Function} [params.resolveBatch] - Resolves the model of a feature (tests).
 * @param {AssistantBatchDeps} [params.deps] - Test dependencies.
 * @returns {Promise<object>} The card (changeSetId) and the counts, for the model.
 */
export const runBatchTool = async ({
  kind,
  lang,
  targetKeys,
  ctx,
  resolveBatch,
  deps,
}: {
  kind: SuggestionBatchKind
  lang: string
  targetKeys: string[]
  ctx: AiToolContext
  resolveBatch?: typeof resolveBatchModel
  deps?: AssistantBatchDeps
}) => {
  const { messageKeys, getLangLabel } = getAssistantBatchKind(kind)
  const getSurvey = () => ctx.getSurvey?.() ?? requireSurvey(ctx)
  const survey = getSurvey()
  const name = getLangLabel(survey, lang)
  const scope = { kind, key: lang, targetKeys }
  const { rows, skippedCount } = await loadAssistantBatch({ kind, survey, scope, signal: ctx.signal, deps })
  const count = rows.length
  if (count === 0) return { name, count, message: 'Nothing to do: no text is missing or none has a source text.' }
  const reportProgress = (output: object) =>
    ctx.toolCallId && ctx.onToolProgress?.(ctx.toolCallId, { ...output, name, count })
  reportProgress({})
  const { drafts, failedCount, stop } = await runAssistantBatch({
    kind,
    getSurvey,
    lang,
    rows,
    skippedCount,
    providerId: ctx.providerId,
    signal: ctx.signal,
    onProgress: reportProgress,
    resolveBatch,
    deps,
  })
  // shortcut: a stop drops what was made so far (the turn ends with the tool unfinished); the Do it keeps it
  ctx.signal.throwIfAborted()
  if (drafts.length === 0) {
    throw new AiToolFailure('nothingMade', 'The AI requests produced no text. Tell the user and do not retry.')
  }
  const summary = ctx.t(`${KEYS}.${messageKeys.summary}`, { lang: name })
  const proposed = await proposeChangeSet({ ctx: { ...ctx, survey: getSurvey() }, drafts, summary })
  return {
    ...proposed,
    name,
    count,
    failed: failedCount,
    ...(stop?.cause === 'error'
      ? { interrupted: 'The AI provider failed before the end: the card has the texts made until then.' }
      : {}),
  }
}

/**
 * Builds a batch tool.
 * @param {object} params - Parameters.
 * @param {SuggestionBatchKind} params.kind - Batch.
 * @param {string} params.description - For the model.
 * @param {z.ZodType} params.inputSchema - Input.
 * @param {Function} params.toBatch - Language and targets of the input.
 * @returns {AiTool} The tool.
 */
const createBatchTool = <I>({
  kind,
  description,
  inputSchema,
  toBatch,
}: {
  kind: SuggestionBatchKind
  description: string
  inputSchema: z.ZodType<I>
  toBatch: (input: I, survey: any) => { lang: string; targetKeys: string[] }
}): AiTool<I> => ({
  name: SUGGESTION_BATCH_TOOL_NAMES[kind],
  description,
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canEditCurrentSurvey,
  execute: async (input, ctx) => runBatchTool({ kind, ctx, ...toBatch(input, requireSurvey(ctx)) }),
})

const ONE_CARD = 'and proposes them all on one card; the user sees the progress and can stop it. Takes minutes.'

export const missingTextsTranslateTool = createBatchTool({
  kind: 'missingTranslations',
  description:
    'Translates every label and description missing in a survey language (from the other languages) with batch AI ' +
    `requests ${ONE_CARD} Use it when more than 20 texts are missing, instead of labels_proposeSet.`,
  inputSchema: z.object({ lang: langSchema }),
  toBatch: ({ lang }, survey) => ({ lang: requireSurveyLanguage(survey, lang), targetKeys: [] }),
})

export const categoryItemLabelsTranslateTool = createBatchTool({
  kind: 'categoryItemTranslations',
  description:
    'Translates the category item labels missing in a survey language with batch AI requests ' +
    `${ONE_CARD} Use it when more than 20 labels are missing, instead of categoryItemLabels_proposeSet.`,
  inputSchema: z.object({
    lang: langSchema,
    categoryNames: z.array(z.string().min(1).max(100)).max(100).nullish().describe('Categories (default: all)'),
  }),
  toBatch: ({ lang, categoryNames }, survey) => ({
    lang: requireSurveyLanguage(survey, lang),
    targetKeys: (categoryNames ?? []).map((name) => requireCategory(survey, name).uuid),
  }),
})

export const descriptionsWriteTool = createBatchTool({
  kind: 'newEntriesDescriptions',
  description:
    'Writes a short description, in every survey language, for the node definitions that have none, with batch AI ' +
    `requests ${ONE_CARD} Use it for more than 10 descriptions, instead of labels_proposeSet.`,
  inputSchema: z.object({
    nodeDefNames: z
      .array(z.string().min(1).max(100))
      .max(200)
      .nullish()
      .describe('Node definitions to describe (default: all without a description)'),
  }),
  toBatch: ({ nodeDefNames }, survey) => ({
    lang: '',
    targetKeys: (nodeDefNames ?? []).map((name) => NodeDef.getUuid(requireNodeDefByName(survey, name))),
  }),
})

export const batchTools: AiTool[] = [missingTextsTranslateTool, categoryItemLabelsTranslateTool, descriptionsWriteTool]
