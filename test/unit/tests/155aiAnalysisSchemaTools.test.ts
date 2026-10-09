import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'
import { uuidv4 } from '@core/uuid'

import { listEntitiesTool } from '@webapp/ai/tools/analysis/listEntities'
import { createFindCategoryItemsTool } from '@webapp/ai/tools/analysis/findCategoryItems'

import {
  newAnalysisToolContext,
  newFakeAnalysisApi,
  runTool,
  userWithoutAccess,
} from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

let survey: any = null

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

const withBigCategory = (categoryName: string) => {
  const categories = Survey.getCategories(survey)
  const updated = Object.fromEntries(
    Object.entries(categories).map(([uuid, category]: [string, any]) => [
      uuid,
      category.props?.name === categoryName ? Category.assocItemsCount(5000)(category) : category,
    ])
  )
  return Survey.assocCategories(updated)(survey)
}

const findNodeDef = (name: string) =>
  Survey.getNodeDefsArray(survey).find((nodeDef: any) => NodeDef.getName(nodeDef) === name)

// tree_type becomes the second level of a hierarchy whose first level is tree_status
const withTreeTypeAtSecondLevel = (bigSurvey: any) => {
  const parentUuid = NodeDef.getUuid(findNodeDef('tree_status'))
  const nodeDef = NodeDef.assocProp({ key: NodeDef.propKeys.parentCodeDefUuid, value: parentUuid })(
    findNodeDef('tree_type')
  )
  return Survey.assocNodeDef({ nodeDef })(bigSurvey)
}

// adds attributes with long names to the tree entity
const withManyTreeAttributes = (count: number) => {
  const template = findNodeDef('dbh')
  let updated = survey
  for (let idx = 0; idx < count; idx += 1) {
    const name = `long_attribute_name_for_the_size_budget_${String(idx).padStart(3, '0')}`
    const nodeDef = {
      ...template,
      uuid: uuidv4(),
      props: { ...template.props, name, labels: { en: `Long attribute label number ${idx}` } },
    }
    updated = Survey.assocNodeDef({ nodeDef })(updated)
  }
  return updated
}

describe('query_listEntities', () => {
  test('lists the queryable entities with dimension and measure flags', async () => {
    const result = await runTool(listEntitiesTool, {}, newAnalysisToolContext({ survey }))
    expect(result.entities.map((entity) => entity.name)).toEqual(['cluster', 'plot', 'tree'])
    const tree = result.entities.find((entity) => entity.name === 'tree')
    expect(tree.parentEntity).toBe('plot')
    const byName = Object.fromEntries(tree.attributes.map((attribute) => [attribute.name, attribute]))
    expect(byName.dbh).toMatchObject({ type: 'decimal', dimension: false, measure: true })
    expect(byName.tree_type).toMatchObject({ type: 'code', dimension: true, measure: false })
    expect(byName.cluster_id).toMatchObject({ dimension: true, measure: false })
  })

  test('one entity on request, unknown entity is an error with the valid names', async () => {
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(listEntitiesTool, { entity: 'tree' }, ctx)
    expect(result.entities.map((entity) => entity.name)).toEqual(['tree'])
    const error = await runTool(listEntitiesTool, { entity: 'trees' }, ctx)
    expect(error.error.code).toBe('unknownEntity')
    expect(error.error.message).toContain('cluster, plot, tree')
  })

  test('normal single entity result is not truncated', async () => {
    const result = await runTool(listEntitiesTool, { entity: 'tree' }, newAnalysisToolContext({ survey }))
    expect(result.truncated).toBe(false)
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(7000)
  })

  test('over the budget: attributes are omitted with a hint, one entity is truncated', async () => {
    const big = withManyTreeAttributes(150)
    const ctx = newAnalysisToolContext({ survey: big })
    const all = await runTool(listEntitiesTool, {}, ctx)
    expect(all.attributesOmitted).toBe(true)
    expect(all.hint).toContain('entity')
    expect(all.entities.map((entity) => entity.name)).toEqual(['cluster', 'plot', 'tree'])
    expect(all.entities[0].attributes).toBeUndefined()
    expect(JSON.stringify(all).length).toBeLessThanOrEqual(7000)

    const one = await runTool(listEntitiesTool, { entity: 'tree' }, ctx)
    expect(one.truncated).toBe(true)
    expect(one.entities[0].attributes.length).toBeGreaterThan(0)
    expect(one.entities[0].attributes.length).toBeLessThan(150)
    expect(JSON.stringify(one).length).toBeLessThanOrEqual(7000)
  })

  test('requires a survey the user can view', () => {
    expect(listEntitiesTool.requires(newAnalysisToolContext({ survey }))).toBe(true)
    expect(listEntitiesTool.requires(newAnalysisToolContext({ survey, user: userWithoutAccess }))).toBe(false)
    expect(listEntitiesTool.requires(newAnalysisToolContext({ survey: null }))).toBe(false)
  })

  test('is a schema read tool of the analysis area', () => {
    expect(listEntitiesTool).toMatchObject({
      name: 'query_listEntities',
      dataClass: 'schema',
      effect: 'read',
      area: ['analysis'],
    })
  })
})

describe('category_findItems', () => {
  test('searches code and label in the survey ref data', async () => {
    const { api, calls } = newFakeAnalysisApi()
    const tool = createFindCategoryItemsTool({ api })
    const result = await runTool(tool, { attribute: 'tree_status', search: 'liv' }, newAnalysisToolContext({ survey }))
    expect(result).toEqual({
      attribute: 'tree_status',
      columns: ['tree_status', 'tree_status_label'],
      items: [{ code: 'L', label: 'Live' }],
      total: 1,
      truncated: false,
    })
    expect(calls).toHaveLength(0)
  })

  test('without search returns the items of the level', async () => {
    const tool = createFindCategoryItemsTool({ api: newFakeAnalysisApi().api })
    const result = await runTool(tool, { attribute: 'tree_type' }, newAnalysisToolContext({ survey }))
    expect(result.items.map((item) => item.code).sort()).toEqual(['F', 'L', 'P', 'T'])
  })

  test('only code attributes', async () => {
    const tool = createFindCategoryItemsTool({ api: newFakeAnalysisApi().api })
    const ctx = newAnalysisToolContext({ survey })
    expect((await runTool(tool, { attribute: 'dbh', search: 'x' }, ctx)).error.code).toBe('notCodeAttribute')
    expect((await runTool(tool, { attribute: 'nope', search: 'x' }, ctx)).error.code).toBe('notCodeAttribute')
  })

  test('large categories are searched on the server, at most 20 items', async () => {
    const items = Array.from({ length: 30 }, (_, idx) => ({
      props: { code: `C${idx}`, labels: { en: `Item ${idx}` } },
    }))
    const { api, calls } = newFakeAnalysisApi({ fetchCategoryItems: () => items })
    const tool = createFindCategoryItemsTool({ api })
    const ctx = newAnalysisToolContext({ survey: withBigCategory('tree_type') })
    const result = await runTool(tool, { attribute: 'tree_type', search: 'item' }, ctx)
    expect(calls[0].name).toBe('fetchCategoryItems')
    expect(calls[0].params).toMatchObject({
      search: 'item',
      lang: 'en',
      categoryUuid: NodeDef.getCategoryUuid(findNodeDef('tree_type')),
      draft: true,
    })
    expect(result.items).toHaveLength(20)
    expect(result).toMatchObject({ total: 30, truncated: true })
  })

  test('below the first level of a large category: largeCategoryLevel, no request', async () => {
    const { api, calls } = newFakeAnalysisApi({ fetchCategoryItems: () => [] })
    const tool = createFindCategoryItemsTool({ api })
    const ctx = newAnalysisToolContext({ survey: withTreeTypeAtSecondLevel(withBigCategory('tree_type')) })
    const result = await runTool(tool, { attribute: 'tree_type', search: 'x' }, ctx)
    expect(result.error.code).toBe('largeCategoryLevel')
    expect(calls).toHaveLength(0)
  })

  test('result JSON stays within the budget', async () => {
    const items = Array.from({ length: 30 }, (_, idx) => ({
      props: { code: `C${idx}`, labels: { en: `${'long label '.repeat(60)}${idx}` } },
    }))
    const tool = createFindCategoryItemsTool({ api: newFakeAnalysisApi({ fetchCategoryItems: () => items }).api })
    const ctx = newAnalysisToolContext({ survey: withBigCategory('tree_type') })
    const result = await runTool(tool, { attribute: 'tree_type', search: 'long' }, ctx)
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(7000)
    expect(result.truncated).toBe(true)
  })
})
