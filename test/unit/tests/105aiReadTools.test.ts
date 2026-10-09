import * as NodeDef from '@core/survey/nodeDef'

import { buildSurveyOverview, surveyGetOverviewTool } from '@webapp/ai/tools/design/surveyGetOverview'
import { nodeDefGetTool } from '@webapp/ai/tools/design/nodeDefGet'
import { nodeDefSearchTool } from '@webapp/ai/tools/design/nodeDefSearch'
import { expressionCheckTool } from '@webapp/ai/tools/design/expressionCheck'
import { getClosestNames } from '@webapp/ai/tools/design/surveyLookup'
import { viewGetCurrentTool } from '@webapp/ai/tools/common/viewGetCurrent'
import { AiLimits } from '@common/ai/limits'
import { runTool } from '@webapp/ai/tools/registry'
import { buildAssistantSurvey, createToolContext, getDefByName, testUser } from '@test/unit/utils/assistantTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildAssistantSurvey()
})

const ctxWithSurvey = (overrides = {}) => createToolContext({ survey, ...overrides })

describe('survey_getOverview', () => {
  test('lists languages, cycles and the entity tree', async () => {
    const result: any = await runTool(surveyGetOverviewTool, {}, ctxWithSurvey())
    expect(result.languages).toEqual(['en'])
    expect(result.currentCycle).toBe('0')
    expect(result.truncated).toBe(false)
    expect(result.nodeDefs.map((def: any) => def.name)).toEqual([
      'cluster',
      'cluster_id',
      'cluster_notes',
      'plot',
      'plot_id',
      'tree',
      'tree_dec_1',
    ])
    expect(result.nodeDefs[1]).toEqual({
      name: 'cluster_id',
      type: 'integer',
      label: 'Cluster id',
      parent: 'cluster',
      key: true,
    })
    expect(result.nodeDefs.find((def: any) => def.name === 'tree')).toMatchObject({ multiple: true, parent: 'plot' })
  })

  test('is capped, with truncated', () => {
    const overview = buildSurveyOverview({ survey, cycle: '0', lang: 'en', maxNodeDefs: 3 })
    expect(overview.nodeDefs).toHaveLength(3)
    expect(overview.truncated).toBe(true)
    expect(overview.total).toBe(7)
  })

  test('requires an open survey the user can view', () => {
    expect(surveyGetOverviewTool.requires(ctxWithSurvey())).toBe(true)
    expect(surveyGetOverviewTool.requires(ctxWithSurvey({ canViewSurvey: false }))).toBe(false)
    expect(surveyGetOverviewTool.requires(createToolContext())).toBe(false)
  })
})

describe('nodeDef_get', () => {
  test('returns props, expressions and the parent path', async () => {
    const result: any = await runTool(nodeDefGetTool, { name: 'tree_dec_1' }, ctxWithSurvey())
    expect(result).toMatchObject({
      name: 'tree_dec_1',
      type: 'decimal',
      path: ['cluster', 'plot', 'tree'],
      parent: 'tree',
      labels: { en: 'Tree dec 1' },
      descriptions: {},
      key: false,
      multiple: false,
      readOnly: false,
      expressions: { defaultValues: [], applicable: [], 'validations.expressions': [], visibleIf: [], editableIf: [] },
    })
  })

  test('lists the children of an entity', async () => {
    const result: any = await runTool(nodeDefGetTool, { name: 'plot' }, ctxWithSurvey())
    expect(result.children).toEqual(['plot_id', 'tree'])
  })

  test('an unknown name lists the closest names', async () => {
    const result: any = await runTool(nodeDefGetTool, { name: 'tree_dec' }, ctxWithSurvey())
    expect(result.error.code).toBe('nodeDefNotFound')
    expect(result.error.closestNames[0]).toBe('tree_dec_1')
  })

  test('closest names are ordered by edit distance', () => {
    expect(getClosestNames(survey, 'plot_idd', 2)).toEqual(['plot_id', 'plot'])
  })
})

describe('nodeDef_search', () => {
  test('matches names and labels, case-insensitive', async () => {
    const byName: any = await runTool(nodeDefSearchTool, { text: 'PLOT' }, ctxWithSurvey())
    expect(byName.results.map((def: any) => def.name)).toEqual(['plot', 'plot_id'])
    const byLabel: any = await runTool(nodeDefSearchTool, { text: 'notes' }, ctxWithSurvey())
    expect(byLabel.results.map((def: any) => def.name)).toEqual(['cluster_notes'])
    expect(byLabel.truncated).toBe(false)
  })

  test('empty text is an input error', async () => {
    const result: any = await runTool(nodeDefSearchTool, { text: '' }, ctxWithSurvey())
    expect(result.error.code).toBe('invalidInput')
  })
})

describe('view_getCurrent', () => {
  test('returns the module and the selected node definition by name', async () => {
    const treeUuid = NodeDef.getUuid(getDefByName(survey, 'tree'))
    const ctx = ctxWithSurvey({
      getCurrentView: () => ({ module: 'designer', subModule: 'formDesigner', selectedNodeDefUuid: treeUuid }),
    })
    expect(await runTool(viewGetCurrentTool, {}, ctx)).toEqual({
      module: 'designer',
      subModule: 'formDesigner',
      selectedNodeDef: 'tree',
    })
  })

  test('in Help (no survey) only the module names', async () => {
    const ctx = createToolContext({
      getCurrentView: () => ({ module: 'data', subModule: 'records', selectedNodeDefUuid: 'x' }),
    })
    expect(await runTool(viewGetCurrentTool, {}, ctx)).toEqual({ module: 'data', subModule: 'records' })
    expect(viewGetCurrentTool.area).toEqual(expect.arrayContaining(['design', 'help']))
  })
})

describe('expression_check', () => {
  test('a valid validation expression is ok', async () => {
    const input = { nodeDefName: 'tree_dec_1', prop: 'validations.expressions', expression: 'tree_dec_1 > 0' }
    expect(await runTool(expressionCheckTool, input, ctxWithSurvey())).toEqual({ ok: true })
  })

  test('an unknown attribute is reported with the translated message', async () => {
    const input = { nodeDefName: 'tree_dec_1', prop: 'validations.expressions', expression: 'unknown_attr > 0' }
    const result: any = await runTool(expressionCheckTool, input, ctxWithSurvey())
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatch(/^validationErrors:/)
  })

  test('a syntax error is reported', async () => {
    const input = { nodeDefName: 'cluster_notes', prop: 'applicable', expression: 'cluster_id >' }
    const result: any = await runTool(expressionCheckTool, input, ctxWithSurvey())
    expect(result.ok).toBe(false)
  })

  test('the applyIf part is checked too', async () => {
    const input = {
      nodeDefName: 'tree_dec_1',
      prop: 'defaultValues',
      expression: '1',
      applyIf: 'not_there = 1',
    }
    const result: any = await runTool(expressionCheckTool, input, ctxWithSurvey())
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatch(/^applyIf: /)
  })
})

describe('result budget', () => {
  const buildBigSurvey = async () => {
    const { text } = NodeDef.nodeDefType
    const SB = await import('@test/utils/surveyBuilder')
    const attrs = (prefix: string, count: number) =>
      Array.from({ length: count }, (_v, i) =>
        SB.attribute(`${prefix}_${i}`, text).label(`A long descriptive label for attribute ${prefix} number ${i}`)
      )
    const big: any = await SB.survey(
      testUser,
      SB.entity(
        'root',
        SB.attribute('root_id', NodeDef.nodeDefType.integer).key(),
        ...attrs('a', 400),
        SB.entity('wide', ...attrs('w', 200)).multiple()
      )
    ).build()
    return { ...big, id: 9 }
  }

  test('survey_getOverview stays valid JSON under the budget', async () => {
    const big = await buildBigSurvey()
    const result: any = await runTool(surveyGetOverviewTool, {}, createToolContext({ survey: big }))
    expect(result.json).toBeUndefined()
    expect(JSON.stringify(result).length).toBeLessThan(AiLimits.assistantToolResultMaxChars)
    expect(result.truncated).toBe(true)
    expect(result.total).toBe(603)
    expect(result.nodeDefs.length).toBeLessThan(603)
  })

  test('nodeDef_get caps the children', async () => {
    const big = await buildBigSurvey()
    const result: any = await runTool(nodeDefGetTool, { name: 'wide' }, createToolContext({ survey: big }))
    expect(result.json).toBeUndefined()
    expect(JSON.stringify(result).length).toBeLessThan(AiLimits.assistantToolResultMaxChars)
    expect(result.children).toHaveLength(50)
    expect(result.childrenTruncated).toBe(true)
    expect(result.childrenTotal).toBe(200)
  })
})
