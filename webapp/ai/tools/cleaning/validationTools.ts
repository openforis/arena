import { z } from 'zod'

import {
  MessageTypeFilterCategoryIds,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'
import * as NodeDef from '@core/survey/nodeDef'

import type { AiTool } from '@webapp/ai/tools/types'
import { fitListToBudget, toolError, toRequestErrorResult } from '@webapp/ai/tools/analysis/toolResults'

import type { CleaningApi } from './cleaningApi'
import { canCleanseCurrentSurvey, getCleaningContext, resolveAttributeDefs } from './cleaningContext'
import type { CleaningI18n } from './validationRows'
import { summarizeValidationRows } from './validationSummary'
import { LIST_ROWS_MAX, pageValidationRows, toValidationListItems } from './validationList'

const SUMMARY_ROWS_MAX = 1000

const summarizeInputSchema = z.object({
  recordUuid: z.string().nullish().describe('Only this record (UUID); omit for the whole cycle.'),
})

const listInputSchema = z.object({
  attributes: z.array(z.string()).max(50).optional().describe('Attribute names; omit for all attributes.'),
  categories: z
    .array(z.enum(MessageTypeFilterCategoryIds as [string, ...string[]]))
    .optional()
    .describe('Message categories; omit for all.'),
  recordUuid: z.string().nullish().describe('Only this record (UUID).'),
  offset: z.number().int().min(0).optional().describe('Rows to skip (paging).'),
})

type Deps = { api: CleaningApi; getI18n: () => CleaningI18n }

const TIMEOUT_HINT = 'The report is too large. Filter by record, attribute or category and retry.'

const common: Pick<AiTool, 'area' | 'dataClass' | 'effect' | 'requires'> = {
  area: ['cleaning'],
  dataClass: 'data',
  effect: 'read',
  requires: canCleanseCurrentSurvey,
}

/**
 * Creates validation_summarize.
 * @param {Deps} deps - API and translator.
 * @returns {AiTool} The tool.
 */
const createSummarizeTool = ({ api, getI18n }: Deps): AiTool<z.infer<typeof summarizeInputSchema>, unknown> => ({
  ...common,
  name: 'validation_summarize',
  description:
    'Counts the errors and warnings of the validation report of the current cycle, grouped by attribute path, ' +
    'message category and severity, optionally for one record. Start here to find the patterns to fix.',
  inputSchema: summarizeInputSchema,
  /**
   * Fetches up to 1,000 report rows and the total, then groups them.
   * @param {object} input - Tool input.
   * @param {object} ctx - Tool context.
   * @returns {Promise<object>} The summary.
   */
  execute: async ({ recordUuid }, ctx) => {
    const { survey, surveyId, cycle } = getCleaningContext(ctx)
    const filter = { surveyId, cycle, recordUuid: recordUuid ?? null, signal: ctx.signal }
    let rows: any[]
    let total: number
    try {
      ;[rows, total] = await Promise.all([
        api.fetchValidationReportRows({ ...filter, offset: 0, limit: SUMMARY_ROWS_MAX }),
        api.countValidationReportRows(filter),
      ])
    } catch (error) {
      return toRequestErrorResult(error, TIMEOUT_HINT)
    }
    const summary = summarizeValidationRows({ survey, rows, total, i18n: getI18n(), cycle })
    return fitListToBudget(summary, 'groups')
  },
})

/**
 * Creates validation_list.
 * @param {Deps} deps - API and translator.
 * @returns {AiTool} The tool.
 */
const createListTool = ({ api, getI18n }: Deps): AiTool<z.infer<typeof listInputSchema>, unknown> => ({
  ...common,
  name: 'validation_list',
  description:
    'Lists validation report rows (at most 50): record keys and UUID, node UUID, path with entity keys, messages, ' +
    'record step and whether the user can edit the record. Filter by attribute names, message categories, record. ' +
    'When more rows exist the result has nextOffset: pass it as offset to get the next page.',
  inputSchema: listInputSchema,
  /**
   * Fetches one row more than the cap to know whether there are others.
   * @param {object} input - Tool input.
   * @param {object} ctx - Tool context.
   * @returns {Promise<object>} The rows, the total and the truncated flag.
   */
  execute: async ({ attributes, categories, recordUuid, offset = 0 }, ctx) => {
    const { survey, surveyId, cycle, lang } = getCleaningContext(ctx)
    const { nodeDefs, unknownNames } = resolveAttributeDefs({ survey, names: attributes ?? [] })
    if (unknownNames.length > 0) {
      return toolError('unknownAttribute', `Unknown attributes: ${unknownNames.join(', ')}. Use nodeDef_search.`)
    }
    const filter = {
      surveyId,
      cycle,
      signal: ctx.signal,
      recordUuid: recordUuid ?? null,
      attributeDefUuids: nodeDefs.map(NodeDef.getUuid),
      messageTypeKeys: categories?.length ? expandMessageTypeFilterCategoriesToKeys(categories) : null,
    }
    let fetched: any[]
    let total: number
    try {
      fetched = await api.fetchValidationReportRows({ ...filter, offset, limit: LIST_ROWS_MAX + 1 })
      total = pageValidationRows(fetched).hasMore
        ? await api.countValidationReportRows(filter)
        : offset + fetched.length
    } catch (error) {
      return toRequestErrorResult(error, TIMEOUT_HINT)
    }
    const { rows: pageRows, hasMore } = pageValidationRows(fetched)
    const rows = toValidationListItems({ survey, rows: pageRows, user: ctx.user, i18n: getI18n(), lang })
    const fitted = fitListToBudget({ rows, total, truncated: hasMore, offset }, 'rows')
    // the budget may cut rows of the page: the next page starts after the last one returned
    const moreRows = hasMore || fitted.rows.length < rows.length
    return moreRows ? { ...fitted, truncated: true, nextOffset: offset + fitted.rows.length } : fitted
  },
})

/**
 * Creates the validation tools of the cleaning area.
 * @param {Deps} deps - API and translator.
 * @returns {AiTool[]} validation_summarize and validation_list.
 */
export const createValidationTools = (deps: Deps): AiTool<any, unknown>[] => [
  createSummarizeTool(deps),
  createListTool(deps),
]
