import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { expressionsProposeSetTool } from '@webapp/ai/tools/design/expressionsProposeSet'
import { labelsProposeSetTool } from '@webapp/ai/tools/design/labelsProposeSet'
import { nodeDefProposeCreateTool } from '@webapp/ai/tools/design/nodeDefProposeCreate'
import { nodeDefProposeUpdateTool } from '@webapp/ai/tools/design/nodeDefProposeUpdate'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'
import { AI_TOOL_NAME_PATTERN, getTools, runTool } from '@webapp/ai/tools/registry'
import { buildAssistantSurvey, createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildAssistantSurvey()
})

const ctxWithSurvey = (overrides = {}) => createToolContext({ survey, ...overrides })

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))

describe('nodeDef_proposeCreate', () => {
  test('a valid proposal is handed over, never persisted', async () => {
    const dispatch = jest.fn()
    const getState = jest.fn()
    const ctx = ctxWithSurvey({ dispatch, getState })
    const input = {
      summary: 'Add remarks',
      nodeDefs: [
        { parentName: 'cluster', type: 'text', name: 'cluster_remarks', labels: [{ lang: 'en', text: 'Remarks' }] },
      ],
    }
    const result: any = await runTool(nodeDefProposeCreateTool, input, ctx)
    expect(result).toMatchObject({ operations: 1, status: 'shownToUser' })
    expect(ctx.changeSets).toHaveLength(1)
    const [changeSet] = ctx.changeSets
    expect(result.changeSetId).toBe(changeSet.id)
    expect(changeSet).toMatchObject({ surveyId: 7, summary: 'Add remarks' })
    const [op]: any[] = changeSet.operations
    expect(op).toMatchObject({ type: 'nodeDef.create', parentUuid: uuidOf('cluster') })
    expect(NodeDef.getName(op.nodeDef)).toBe('cluster_remarks')
    expect(NodeDef.getLabels(op.nodeDef)).toEqual({ en: 'Remarks' })
    expect(dispatch).not.toHaveBeenCalled()
    expect(getState).not.toHaveBeenCalled()
    expect(Survey.getNodeDefsArray(survey).some((def: any) => NodeDef.getName(def) === 'cluster_remarks')).toBe(false)
  })

  test('parentName may name an entity created earlier in the same proposal', async () => {
    const ctx = ctxWithSurvey()
    const input = {
      summary: 'Add a stump entity',
      nodeDefs: [
        { parentName: 'plot', type: 'entity', name: 'stump', multiple: true },
        { parentName: 'stump', type: 'decimal', name: 'stump_height', labels: [{ lang: 'en', text: 'Height' }] },
      ],
    }
    const result: any = await runTool(nodeDefProposeCreateTool, input, ctx)
    expect(result.operations).toBe(2)
    const [entityOp, attributeOp]: any[] = ctx.changeSets[0].operations
    expect(attributeOp.parentUuid).toBe(NodeDef.getUuid(entityOp.nodeDef))
  })

  test('an unknown parent lists the closest names', async () => {
    const input = { summary: 'x', nodeDefs: [{ parentName: 'plott', type: 'text', name: 'plot_remarks' }] }
    const result: any = await runTool(nodeDefProposeCreateTool, input, ctxWithSurvey())
    expect(result.error.code).toBe('nodeDefNotFound')
    expect(result.error.closestNames[0]).toBe('plot')
  })

  test('invalid proposal is not handed over: duplicate name', async () => {
    const ctx = ctxWithSurvey()
    const input = { summary: 'x', nodeDefs: [{ parentName: 'cluster', type: 'integer', name: 'cluster_id' }] }
    const result: any = await runTool(nodeDefProposeCreateTool, input, ctx)
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.message).toMatch(/not shown to the user/)
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operation: 0, message: expect.stringContaining('nameDuplicate') }),
      ])
    )
    expect(ctx.changeSets).toHaveLength(0)
  })

  test('a type the assistant cannot create is an input error', async () => {
    const input = { summary: 'x', nodeDefs: [{ parentName: 'cluster', type: 'code', name: 'cluster_code' }] }
    const result: any = await runTool(nodeDefProposeCreateTool, input, ctxWithSurvey())
    expect(result.error.code).toBe('invalidInput')
  })
})

describe('nodeDef_proposeUpdate', () => {
  test('records from and to of each change', async () => {
    const ctx = ctxWithSurvey()
    const input = {
      summary: 'Rename and make a key',
      changes: [
        { nodeDefName: 'cluster_notes', prop: 'name', value: 'cluster_remarks' },
        { nodeDefName: 'cluster_notes', prop: 'key', value: true },
      ],
    }
    await runTool(nodeDefProposeUpdateTool, input, ctx)
    expect(ctx.changeSets[0].operations).toEqual([
      expect.objectContaining({ type: 'nodeDef.update', prop: 'name', from: 'cluster_notes', to: 'cluster_remarks' }),
      expect.objectContaining({ type: 'nodeDef.update', prop: 'key', from: false, to: true }),
    ])
  })

  test('a value of the wrong type, or no change at all, is refused', async () => {
    const ctx = ctxWithSurvey()
    const wrongType: any = await runTool(
      nodeDefProposeUpdateTool,
      { summary: 'x', changes: [{ nodeDefName: 'cluster_notes', prop: 'readOnly', value: 'yes' }] },
      ctx
    )
    expect(wrongType.error.code).toBe('invalidInput')
    const noChange: any = await runTool(
      nodeDefProposeUpdateTool,
      { summary: 'x', changes: [{ nodeDefName: 'cluster_id', prop: 'key', value: true }] },
      ctx
    )
    expect(noChange.error.code).toBe('noChange')
    expect(ctx.changeSets).toHaveLength(0)
  })
})

describe('labels_proposeSet', () => {
  test('several node definitions at once', async () => {
    const ctx = ctxWithSurvey()
    const input = {
      summary: 'Better labels',
      items: [
        { nodeDefName: 'cluster_id', kind: 'labels', lang: 'en', text: 'Cluster identifier' },
        { nodeDefName: 'plot_id', kind: 'descriptions', lang: 'en', text: 'Number of the plot' },
      ],
    }
    const result: any = await runTool(labelsProposeSetTool, input, ctx)
    expect(result.operations).toBe(2)
    expect(ctx.changeSets[0].operations).toEqual([
      expect.objectContaining({
        type: 'label.set',
        kind: 'labels',
        lang: 'en',
        from: 'Cluster id',
        to: 'Cluster identifier',
      }),
      expect.objectContaining({ type: 'label.set', kind: 'descriptions', lang: 'en', from: null }),
    ])
  })

  test('a language the survey does not have is an issue', async () => {
    const input = {
      summary: 'x',
      items: [{ nodeDefName: 'cluster_id', kind: 'labels', lang: 'fr', text: 'Identifiant' }],
    }
    const result: any = await runTool(labelsProposeSetTool, input, ctxWithSurvey())
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.issues).toEqual([
      { operation: 0, field: 'labels.fr', message: 'aiAssistant.issues.languageNotInSurvey {"lang":"fr"}' },
    ])
  })
})

describe('expressions_proposeSet', () => {
  test('a validation with severity and message', async () => {
    const ctx = ctxWithSurvey()
    const input = {
      summary: 'Plot id must be positive',
      nodeDefName: 'plot_id',
      prop: 'validations.expressions',
      expressions: [
        { expression: 'plot_id > 0', severity: 'warning', messages: [{ lang: 'en', text: 'Must be positive' }] },
      ],
    }
    const result: any = await runTool(expressionsProposeSetTool, input, ctx)
    expect(result.status).toBe('shownToUser')
    const [op]: any[] = ctx.changeSets[0].operations
    expect(op).toMatchObject({ type: 'expression.set', prop: 'validations.expressions', from: [] })
    expect(op.to[0]).toMatchObject({
      expression: 'plot_id > 0',
      severity: 'warning',
      messages: { en: 'Must be positive' },
    })
  })

  test('a bad expression is refused', async () => {
    const ctx = ctxWithSurvey()
    const input = {
      summary: 'x',
      nodeDefName: 'plot_id',
      prop: 'validations.expressions',
      expressions: [{ expression: 'unknown_attribute > 0' }],
    }
    const result: any = await runTool(expressionsProposeSetTool, input, ctx)
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.issues.length).toBeGreaterThan(0)
    expect(ctx.changeSets).toHaveLength(0)
  })
})

describe('propose tools in the registry', () => {
  test('are offered only to users who can edit the survey', () => {
    const effective = { schema: 'cloud', data: 'off' } as const
    const proposeNames = (ctx: any) =>
      getTools({ area: 'design', ctx, effective, hostingClass: 'cloud' })
        .filter((tool) => tool.effect === 'propose')
        .map((tool) => tool.name)
    expect(proposeNames(ctxWithSurvey())).toEqual([
      'nodeDef_proposeCreate',
      'nodeDef_proposeUpdate',
      'labels_proposeSet',
      'expressions_proposeSet',
    ])
    expect(proposeNames(ctxWithSurvey({ canEditSurvey: false }))).toEqual([])
    expect(
      getTools({ area: 'help', ctx: ctxWithSurvey(), effective, hostingClass: 'cloud' }).map((t) => t.name)
    ).not.toContain('labels_proposeSet')
  })
})

describe('tool list gateway limits', () => {
  test('names, descriptions and count fit the gateway limits', () => {
    const names = ALL_TOOLS.map((tool) => tool.name)
    for (const tool of ALL_TOOLS) {
      expect(tool.name).toMatch(AI_TOOL_NAME_PATTERN)
      expect(tool.description.length).toBeLessThanOrEqual(4000)
    }
    expect(new Set(names).size).toBe(names.length)
    expect(names.length).toBeLessThanOrEqual(32)
  })
})

describe('result size and issue indexes', () => {
  test('many issues are capped within the result budget', async () => {
    const items = Array.from({ length: 200 }, () => ({
      nodeDefName: 'cluster_id',
      kind: 'labels',
      lang: 'fr',
      text: 'x',
    }))
    const result: any = await runTool(labelsProposeSetTool, { summary: 'x', items }, ctxWithSurvey())
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.issuesTotal).toBeGreaterThanOrEqual(200)
    expect(result.error.issues.length).toBeLessThan(result.error.issuesTotal)
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(8000)
  })

  test('an error with huge details stays within the budget', async () => {
    const tool: any = {
      ...labelsProposeSetTool,
      execute: async () => {
        throw new AiToolFailure('big', 'too big', { blob: 'x'.repeat(20000) })
      },
    }
    const result: any = await runTool(
      tool,
      { summary: 'x', items: [{ nodeDefName: 'a', kind: 'labels', lang: 'en', text: 'x' }] },
      ctxWithSurvey()
    )
    expect(result.error).toMatchObject({ code: 'big', detailsDropped: true })
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(8000)
  })

  test('issue operation indexes refer to the model input, not the filtered list', async () => {
    const items = [
      { nodeDefName: 'cluster_id', kind: 'labels', lang: 'en', text: 'Cluster id' },
      { nodeDefName: 'cluster_id', kind: 'labels', lang: 'fr', text: 'Identifiant' },
    ]
    const result: any = await runTool(labelsProposeSetTool, { summary: 'x', items }, ctxWithSurvey())
    expect(result.error.issues[0].operation).toBe(1)
  })

  test('readOnly true without default values is refused', async () => {
    const input = { summary: 'x', changes: [{ nodeDefName: 'cluster_notes', prop: 'readOnly', value: true }] }
    const result: any = await runTool(nodeDefProposeUpdateTool, input, ctxWithSurvey())
    expect(result.error.code).toBe('invalidProposal')
  })
})
