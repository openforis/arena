import { z } from 'zod'

import { Authorizer } from '@openforis/arena-core'

import { ColumnNodeDef } from '@common/model/db/tables/dataNodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { findNodeDefByName, getCurrentNodeDefs } from '@webapp/ai/tools/common/nodeDefLookup'
import { canViewCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import { fitListToBudget, getResultBudget } from '@webapp/ai/tools/common/toolResult'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiTool } from '@webapp/ai/tools/types'

import { type AnalysisApi, categoryItemsFetchLimit } from './analysisApi'
import { getAnalysisContext, toRequestFailure } from './toolResults'

export const categoryItemsMax = 20

const inputSchema = z.object({
  attribute: z
    .string()
    .max(100)
    .nullish()
    .describe('Name of a code attribute; leave empty to search every code attribute (then "search" is required)'),
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

const OTHER_ATTRIBUTES_MAX = 10
const OTHER_ITEMS_MAX = 5

const toResultItem = (lang: string) => (item: any) => ({
  code: CategoryItem.getCode(item),
  label: CategoryItem.getLabel(lang)(item),
})

/**
 * Finds the code attributes with items containing the text: a value named in a question tells which attribute holds it.
 * Big categories are left out: their items are not in the survey.
 * @param {object} params - Parameters.
 * @param {string} params.text - Lower case search text.
 * @param {string} [params.except] - Attribute name to leave out.
 * @returns {object[]} The attributes with their filter columns and matching items.
 */
const searchCodeAttributes = ({ ctx, text, except }: { ctx: any; text: string; except?: string }) => {
  const { survey, lang, includeAnalysis } = getAnalysisContext(ctx)
  const found: object[] = []
  for (const nodeDef of getCurrentNodeDefs(survey, { includeAnalysis })) {
    if (found.length >= OTHER_ATTRIBUTES_MAX) break
    if (!NodeDef.isCode(nodeDef) || NodeDef.getName(nodeDef) === except) continue
    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    if (!category || Category.isBigCategory(category)) continue
    const items = Survey.getNodeDefCategoryItems(nodeDef)(survey).filter(matches(text, lang))
    if (items.length === 0) continue
    found.push({
      attribute: NodeDef.getName(nodeDef),
      columns: ColumnNodeDef.getColumnNames(nodeDef),
      items: items.slice(0, OTHER_ITEMS_MAX).map(toResultItem(lang)),
    })
  }
  return found
}

/**
 * Searches every code attribute (no attribute given).
 * @param {object} params - Parameters.
 * @param {string|null} [params.search] - Search text.
 * @returns {object} The attributes found, with a note when there is none.
 */
const searchAllAttributes = ({ ctx, search }: { ctx: any; search?: string | null }) => {
  const text = (search ?? '').trim().toLowerCase()
  if (!text) throw new AiToolFailure('searchRequired', 'Give "attribute", or "search" to search every code attribute.')
  const attributes = searchCodeAttributes({ ctx, text })
  const note = `No item of a code attribute contains "${search}". Try one other word, or say that no category has it.`
  return fitListToBudget(
    { search, attributes, ...(attributes.length === 0 ? { note } : {}) },
    'attributes',
    getResultBudget(ctx)
  )
}

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
   * @param {any} params.nodeDef - The code attribute.
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
   * @returns {Promise<object>} The items or an error.
   */
  const execute = async ({ attribute, search }: Input, ctx: any) => {
    if (!attribute) return searchAllAttributes({ ctx, search })
    const { survey, lang, includeAnalysis } = getAnalysisContext(ctx)
    const nodeDef = findNodeDefByName(survey, attribute, { includeAnalysis })
    if (!nodeDef || !NodeDef.isCode(nodeDef)) {
      throw new AiToolFailure('notCodeAttribute', `"${attribute}" is not a code attribute`)
    }
    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    const text = (search ?? '').trim().toLowerCase()
    let items: object[] | null
    try {
      items = await fetchItems({ ctx, nodeDef, category, search: text })
    } catch (error) {
      throw toRequestFailure(error, 'The search took too long. Use a more specific search text.')
    }
    if (!items) {
      throw new AiToolFailure(
        'largeCategoryLevel',
        `The category of "${attribute}" is too large to search below its first level; filter on a parent code attribute instead`
      )
    }
    const found = items.filter(matches(text, lang))
    // the server stops at the fetch limit: a full page means more items may exist, so there is no exact total
    const totalIsLowerBound = items.length >= categoryItemsFetchLimit
    const result = {
      attribute,
      columns: ColumnNodeDef.getColumnNames(nodeDef),
      items: found.slice(0, categoryItemsMax).map(toResultItem(lang)),
      // total is omitted when the fetch hit its limit
      ...(totalIsLowerBound ? {} : { total: found.length }),
      truncated: totalIsLowerBound || found.length > categoryItemsMax,
    }
    const fitted = fitListToBudget(result, 'items', getResultBudget(ctx))
    // the value may belong to another attribute with a similar name
    const otherAttributes = text && found.length === 0 ? searchCodeAttributes({ ctx, text, except: attribute }) : []
    return {
      ...fitted,
      truncated: result.truncated || (fitted.truncated ?? false),
      ...(otherAttributes.length > 0 ? { otherAttributes } : {}),
    }
  }

  return {
    name: 'category_findItems',
    description:
      'Finds the items (code and label) of the category of a code attribute, to write filters such as ' +
      'tree_status = "L". Returns at most 20 items and the filter columns of the attribute. When the question ' +
      'names a value (e.g. "slight damage"), pass it as "search" with no attribute: every code attribute is ' +
      'searched and the result says which one has that value.',
    inputSchema,
    area: ['analysis'],
    dataClass: 'schema',
    requires: canViewCurrentSurvey,
    execute,
  }
}
