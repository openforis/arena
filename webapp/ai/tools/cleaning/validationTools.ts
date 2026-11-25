import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import {
  expandMessageTypeFilterCategoriesToKeys,
  MessageTypeFilterCategoryIds,
} from '@core/validation/messageTypeFilterCategories'
import { toRequestFailure } from '@webapp/ai/tools/analysis/toolResults'
import { canCleanseCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import { fitListToBudget, getResultBudget } from '@webapp/ai/tools/common/toolResult'
import { attributeNamesSchema, uuidSchema } from '@webapp/ai/tools/common/toolSchemas'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiTool } from '@webapp/ai/tools/types'

import type { CleaningApi } from './cleaningApi'
import { describeUnknownAttributes, getCleaningContext, resolveAttributeDefs } from './cleaningContext'
import { LIST_ROWS_MAX, pageValidationRows, toValidationListItems } from './validationList'
import type { CleaningI18n } from './validationRows'
import { summarizeValidationRows } from './validationSummary'

const SUMMARY_ROWS_MAX = 1000

// far beyond any report a model can page through
const OFFSET_MAX = 1_000_000

const summarizeInputSchema = z.object({
  attributes: attributeNamesSchema(50).optional().describe('Only these attribute names; omit for all attributes.'),
  recordUuid: uuidSchema.nullish().describe('Only this record (UUID); omit for the whole cycle.'),
})

const listInputSchema = z.object({
  attributes: attributeNamesSchema(50).optional().describe('Attribute names; omit for all attributes.'),
  categories: z
    .array(z.enum(MessageTypeFilterCategoryIds as [string, ...string[]]))
    .optional()
    .describe('Message categories; omit for all.'),
  recordUuid: uuidSchema.nullish().describe('Only this record (UUID).'),
  offset: z.number().int().min(0).max(OFFSET_MAX).optional().describe('Rows to skip (paging).'),
})

type Deps = { api: CleaningApi; getI18n: () => CleaningI18n }

const TIMEOUT_HINT = 'The report is too large. Filter by record, attribute or category and retry.'

const common: Pick<AiTool, 'area' | 'dataClass' | 'requires'> = {
  area: ['cleaning'],
  dataClass: 'data',
  requires: canCleanseCurrentSurvey,
}

/**
 * Returns the UUIDs of the named attributes, refusing unknown names.
 * @param {object} params - Parameters.
 * @param {string[]} [params.attributes] - Attribute names.
 * @returns {string[]} The UUIDs (empty: all attributes).
 */
const resolveAttributeDefUuids = ({ survey, attributes = [] }: { survey: any; attributes?: string[] }): string[] => {
  const { nodeDefs, unknownNames } = resolveAttributeDefs({ survey, names: attributes })
  if (unknownNames.length > 0) {
    throw new AiToolFailure(
      'unknownAttribute',
      `Unknown attributes: ${describeUnknownAttributes({ survey, names: unknownNames })}.`
    )
  }
  return nodeDefs.map(NodeDef.getUuid)
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
    'message category and severity, optionally for one record or for some attributes. Start here to find the ' +
    'patterns to fix, then list the rows with validation_list.',
  inputSchema: summarizeInputSchema,
  /**
   * Fetches up to 1,000 report rows and the total, then groups them.
   * @returns {Promise<object>} The summary.
   */
  execute: async ({ attributes, recordUuid }, ctx) => {
    const { survey, surveyId, cycle } = getCleaningContext(ctx)
    const attributeDefUuids = resolveAttributeDefUuids({ survey, attributes })
    const filter = { surveyId, cycle, recordUuid: recordUuid ?? null, attributeDefUuids, signal: ctx.signal }
    let rows: any[]
    let total: number
    try {
      ;[rows, total] = await Promise.all([
        api.fetchValidationReportRows({ ...filter, offset: 0, limit: SUMMARY_ROWS_MAX }),
        api.countValidationReportRows(filter),
      ])
    } catch (error) {
      throw toRequestFailure(error, TIMEOUT_HINT)
    }
    const summary = summarizeValidationRows({ survey, rows, total, i18n: getI18n(), cycle })
    // a small model otherwise stops at the counts
    const next = 'These are counts. For the records and values behind a group, call validation_list with its attribute.'
    return fitListToBudget({ ...summary, next }, 'groups', getResultBudget(ctx))
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
   * @returns {Promise<object>} The rows, the total and the truncated flag.
   */
  execute: async ({ attributes, categories, recordUuid, offset = 0 }, ctx) => {
    const { survey, surveyId, cycle, lang } = getCleaningContext(ctx)
    const filter = {
      surveyId,
      cycle,
      signal: ctx.signal,
      recordUuid: recordUuid ?? null,
      attributeDefUuids: resolveAttributeDefUuids({ survey, attributes }),
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
      throw toRequestFailure(error, TIMEOUT_HINT)
    }
    const { rows: pageRows, hasMore } = pageValidationRows(fetched)
    const rows = toValidationListItems({ survey, rows: pageRows, user: ctx.user, i18n: getI18n(), lang })
    const fitted = fitListToBudget({ rows, total, truncated: hasMore, offset }, 'rows', getResultBudget(ctx))
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
