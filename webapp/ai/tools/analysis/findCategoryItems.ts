import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Authorizer from '@core/auth/authorizer'
import { ColumnNodeDef } from '@common/model/db/tables/dataNodeDef'

import type { AiTool } from '@webapp/ai/tools/types'

import type { AnalysisApi } from './analysisApi'
import {
  canViewCurrentSurvey,
  fitListToBudget,
  getAnalysisContext,
  toolError,
  toRequestErrorResult,
} from './toolResults'

export const categoryItemsMax = 20

const inputSchema = z.object({
  attribute: z.string().max(100).describe('Name of a code attribute'),
  search: z.string().max(100).nullish().describe('Text contained in the item code or label (empty: all items)'),
})

type Input = z.infer<typeof inputSchema>

/**
 * Returns true when the item code or label contains the text (case insensitive).
 * @param {string} text - Lower case text.
 * @param {string} lang - Label language.
 * @returns {Function} The item predicate.
 */
const matches = (text: string, lang: string) => (item: any) =>
  !text ||
  CategoryItem.getCode(item).toLowerCase().includes(text) ||
  CategoryItem.getLabel(lang)(item).toLowerCase().includes(text)

/**
 * Creates the category_findItems tool.
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API (large categories are searched on the server).
 * @returns {AiTool} The tool.
 */
export const createFindCategoryItemsTool = ({ api }: { api: AnalysisApi }): AiTool<Input, unknown> => {
  /**
   * Gets the items of the attribute's category: from the survey in memory, or searched on the server when big.
   * @param {object} params - Parameters.
   * @param {any} params.ctx - Tool context.
   * @param {any} params.nodeDef - The code attribute.
   * @param {any} params.category - Its category.
   * @param {string} params.search - Lower case search text.
   * @returns {Promise<object[] | null>} The items, or null when the level can't be searched.
   */
  const fetchItems = async ({ ctx, nodeDef, category, search }) => {
    const { survey, surveyId, surveyInfo, lang } = getAnalysisContext(ctx)
    if (!Category.isBigCategory(category)) return Survey.getNodeDefCategoryItems(nodeDef)(survey)
    if (Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey) > 0) return null
    // same survey version the app loaded for this user
    const draft = Authorizer.canEditSurvey(ctx.user, surveyInfo)
    const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
    return api.fetchCategoryItems({ surveyId, categoryUuid, search, lang, draft, signal: ctx.signal })
  }

  /**
   * Finds the category items of a code attribute.
   * @param {Input} input - Tool input.
   * @param {any} ctx - Tool context.
   * @returns {Promise<object>} The items or an error.
   */
  const execute = async ({ attribute, search }: Input, ctx: any) => {
    const { survey, lang } = getAnalysisContext(ctx)
    const nodeDef = Survey.findNodeDefByName(attribute)(survey)
    if (!nodeDef || !NodeDef.isCode(nodeDef)) {
      return toolError('notCodeAttribute', `"${attribute}" is not a code attribute`)
    }
    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    const text = (search ?? '').trim().toLowerCase()
    let items: object[] | null
    try {
      items = await fetchItems({ ctx, nodeDef, category, search: text })
    } catch (error) {
      return toRequestErrorResult(error, 'The search took too long. Use a more specific search text.')
    }
    if (!items) {
      return toolError(
        'largeCategoryLevel',
        `The category of "${attribute}" is too large to search below its first level; filter on a parent code attribute instead`
      )
    }
    const found = items.filter(matches(text, lang))
    const result = {
      attribute,
      columns: ColumnNodeDef.getColumnNames(nodeDef),
      items: found
        .slice(0, categoryItemsMax)
        .map((item: any) => ({ code: CategoryItem.getCode(item), label: CategoryItem.getLabel(lang)(item) })),
      total: found.length,
      truncated: found.length > categoryItemsMax,
    }
    const fitted = fitListToBudget(result, 'items')
    return { ...fitted, truncated: result.truncated || (fitted.truncated ?? false) }
  }

  return {
    name: 'category_findItems',
    description:
      'Finds the items (code and label) of the category of a code attribute, to write filters such as ' +
      'tree_status = "L". Returns at most 20 items and the filter columns of the attribute.',
    inputSchema,
    area: ['analysis'],
    dataClass: 'schema',
    effect: 'read',
    requires: canViewCurrentSurvey,
    execute,
  }
}
