import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

import { TOOL_RESULT_BUDGET_CHARS } from '@webapp/ai/tools/common/toolResult'
import { categoriesListTool, taxonomiesListTool } from '@webapp/ai/tools/design/refLists'
import { getTools, runTool } from '@webapp/ai/tools/registry'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildRefSurvey()
})

const withItemsCount = (target: any, name: string, count: number) =>
  Survey.assocCategory(Category.assocItemsCount(count)(Survey.getCategoryByName(name)(target)))(target)

// the ref survey has one taxonomy
const withTaxaCount = (target: any, count: unknown) => {
  const taxonomy = Survey.getTaxonomyByName('trees')(target)
  return Survey.assocTaxonomies({ [Taxonomy.getUuid(taxonomy)]: { ...taxonomy, taxaCount: count } })(target)
}

const run = (tool: any, target: any): Promise<any> => runTool(tool, {}, createToolContext({ survey: target }))

describe('categories_list and taxonomies_list (224)', () => {
  test('categories by name, with level names and the item count when known', async () => {
    expect(await run(categoriesListTool, withItemsCount(survey, 'countries', 12))).toEqual({
      total: 2,
      truncated: false,
      categories: [
        { name: 'countries', levels: ['country', 'region'], itemsCount: 12 },
        { name: 'land_use', levels: ['class'], itemsCount: null },
      ],
    })
  })

  test('taxonomies by name, with the taxa count as a number when known', async () => {
    expect(await run(taxonomiesListTool, withTaxaCount(survey, '1'))).toEqual({
      total: 1,
      truncated: false,
      taxonomies: [{ name: 'trees', taxaCount: 1 }],
    })
    expect((await run(taxonomiesListTool, survey)).taxonomies).toEqual([{ name: 'trees', taxaCount: null }])
  })

  test('hundreds of categories stay within the result budget, with truncated', async () => {
    const many: Record<string, any> = {}
    for (let index = 0; index < 400; index += 1) {
      const category = Category.newCategory({ [Category.keysProps.name]: `category_${String(index).padStart(3, '0')}` })
      many[Category.getUuid(category)] = category
    }
    const result = await run(categoriesListTool, Survey.assocCategories(many)(survey))
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(TOOL_RESULT_BUDGET_CHARS)
    expect(result.total).toBe(400)
    expect(result.truncated).toBe(true)
    expect(result.categories[0].name).toBe('category_000')
    expect(result.categories.length).toBeLessThan(400)
  })

  test('are Design read tools on the survey schema, also for viewers', () => {
    const ctx = createToolContext({ survey, canEditSurvey: false })
    const names = getTools({
      area: 'design',
      ctx,
      effective: { schema: 'cloud', data: 'off' },
      hostingClass: 'cloud',
    }).map((tool) => tool.name)
    expect(names).toEqual(expect.arrayContaining(['categories_list', 'taxonomies_list']))
    for (const tool of [categoriesListTool, taxonomiesListTool]) {
      expect(tool).toMatchObject({ dataClass: 'schema', area: ['design'] })
    }
  })
})
