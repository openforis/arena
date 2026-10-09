import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import { proposeQueryInputSchema, proposeQueryTool, toDataQueryAiResult } from '@webapp/ai/tools/analysis/proposeQuery'

import { newAnalysisToolContext, runTool } from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import * as SurveyUtils from '../../utils/surveyUtils'
import { getContextUser } from '../../integration/config/context'

let survey: any = null
const getUuid = (path: string) => NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path }))

const aggregateInput = {
  entity: 'tree',
  mode: 'aggregate',
  attributes: null,
  dimensions: ['tree_type'],
  measures: [{ attribute: 'dbh', functions: ['avg'] }],
  filter: 'dbh > 10',
  sort: [{ attribute: 'tree_type', order: 'asc' }],
  explanation: 'Average DBH by tree type.',
}

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('query_propose', () => {
  test('a valid aggregate query is stored and gets an id', async () => {
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(proposeQueryTool, aggregateInput, ctx)
    expect(result).toEqual({
      queryId: 'q1',
      entity: 'tree',
      mode: 'aggregate',
      chartAvailable: true,
      shownToUser: true,
    })

    const entry = ctx.analysisQueries.get('q1')
    expect(entry).toMatchObject({
      id: 'q1',
      entityName: 'tree',
      mode: 'aggregate',
      explanation: 'Average DBH by tree type.',
    })
    expect(Query.getEntityDefUuid(entry.query)).toBe(getUuid('cluster/plot/tree'))
    expect(Query.getDimensions(entry.query)).toEqual([getUuid('cluster/plot/tree/tree_type')])
    expect(Query.getMeasures(entry.query)).toEqual({ [getUuid('cluster/plot/tree/dbh')]: ['avg'] })
    expect(Expression.toString(Query.getFilter(entry.query), Expression.modes.sql)).toBe('dbh > 10')
  })

  test('a raw query with two numeric attributes can be a chart; ids keep counting', async () => {
    const ctx = newAnalysisToolContext({ survey })
    await runTool(proposeQueryTool, aggregateInput, ctx)
    const result = await runTool(
      proposeQueryTool,
      { entity: 'tree', mode: 'raw', attributes: ['dbh', 'tree_height'], explanation: 'Trees' },
      ctx
    )
    expect(result).toMatchObject({ queryId: 'q2', mode: 'raw', chartAvailable: true })
  })

  test('an invalid proposal returns the reasons and stores nothing', async () => {
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(
      proposeQueryTool,
      { ...aggregateInput, dimensions: ['nope'], filter: 'height_of_tree > 3' },
      ctx
    )
    expect(result.error.code).toBe('invalidProposal')
    const messages = result.error.issues.map((issue) => issue.message)
    expect(messages).toContain('attribute "nope" not found')
    expect(messages.some((message) => message.includes('unknown column "height_of_tree"'))).toBe(true)
    expect(ctx.analysisQueries.list()).toEqual([])
  })

  test('the input schema rejects other modes and converts to JSON schema', () => {
    expect(proposeQueryInputSchema.safeParse({ ...aggregateInput, mode: 'pivot' }).success).toBe(false)
    expect(proposeQueryInputSchema.safeParse({ ...aggregateInput, explanation: undefined }).success).toBe(false)
    const jsonSchema: any = z.toJSONSchema(proposeQueryInputSchema, { io: 'input' })
    expect(Object.keys(jsonSchema.properties)).toEqual([
      'entity',
      'mode',
      'attributes',
      'dimensions',
      'measures',
      'filter',
      'sort',
      'explanation',
    ])
  })

  test('is a schema propose tool of the analysis area', () => {
    expect(proposeQueryTool).toMatchObject({
      name: 'query_propose',
      dataClass: 'schema',
      effect: 'propose',
      area: ['analysis'],
    })
  })

  test('an unknown entity is rejected with the valid entities', async () => {
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(proposeQueryTool, { ...aggregateInput, entity: 'nope' }, ctx)
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.issues[0].message).toContain('entity "nope" not found')
    expect(ctx.analysisQueries.list()).toEqual([])
  })

  test('an attribute of another entity is rejected', async () => {
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(
      proposeQueryTool,
      { entity: 'plot', mode: 'raw', attributes: ['dbh'], explanation: 'x' },
      ctx
    )
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.issues.length).toBeGreaterThan(0)
    expect(ctx.analysisQueries.list()).toEqual([])
  })

  test('an unparsable filter expression is rejected', async () => {
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(proposeQueryTool, { ...aggregateInput, filter: 'dbh > > (' }, ctx)
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.issues.length).toBeGreaterThan(0)
    expect(ctx.analysisQueries.list()).toEqual([])
  })

  test('toDataQueryAiResult turns nulls into empty lists', () => {
    const input = proposeQueryInputSchema.parse({ entity: 'tree', mode: 'raw', explanation: 'x', filter: null })
    expect(toDataQueryAiResult(input)).toMatchObject({
      attributes: [],
      dimensions: [],
      measures: [],
      sort: [],
      filter: null,
    })
  })

  test('fails when the conversation has no query store', async () => {
    const ctx = newAnalysisToolContext({ survey, analysisQueries: undefined })
    await expect(runTool(proposeQueryTool, aggregateInput, ctx)).rejects.toThrow('query store')
  })
})
