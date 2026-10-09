import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import { getQueryChartType, toExplorerQuery } from '@webapp/store/dataExplorer/explorerQuery'
import { showQuery } from '@webapp/store/dataExplorer/showQuery'

import * as DataTest from '../../utils/dataTest'
import * as SurveyUtils from '../../utils/surveyUtils'
import { getContextUser } from '../../integration/config/context'

let survey: any = null
const getUuid = (path: string) => NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path }))
const filterExpr = () => Expression.fromString('dbh > 10 AND tree_status = "L"', Expression.modes.sql)

const newTreeQuery = () => Query.create({ entityDefUuid: getUuid('cluster/plot/tree') })
const newAggregateQuery = () =>
  Query.assocFilter(filterExpr())(
    Query.assocMeasures({ [getUuid('cluster/plot/tree/dbh')]: ['avg'] })(
      Query.assocDimensions([getUuid('cluster/plot/tree/tree_type')])(
        Query.assocMode(Query.modes.aggregate)(newTreeQuery())
      )
    )
  )

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('toExplorerQuery', () => {
  test('normalises the filter like the Ask AI button did', () => {
    const query = toExplorerQuery(newAggregateQuery())
    expect(Expression.toString(Query.getFilter(query))).toBe('dbh > 10 && tree_status == "L"')
    expect(() => Expression.toSql(Query.getFilter(query))).not.toThrow()
  })

  test('leaves a query without filter unchanged', () => {
    const query = newTreeQuery()
    expect(toExplorerQuery(query)).toBe(query)
  })
})

describe('getQueryChartType', () => {
  test('bar for an aggregate query with a dimension and a measure', () => {
    expect(getQueryChartType({ query: newAggregateQuery(), survey })).toBe('bar')
  })

  test('null for an aggregate query without measure functions', () => {
    const query = Query.assocMeasures({})(newAggregateQuery())
    expect(getQueryChartType({ query, survey })).toBeNull()
  })

  test('scatter for a raw query with two numeric attributes, null with one', () => {
    const two = Query.assocAttributeDefUuids([
      getUuid('cluster/plot/tree/dbh'),
      getUuid('cluster/plot/tree/tree_height'),
    ])(newTreeQuery())
    const one = Query.assocAttributeDefUuids([
      getUuid('cluster/plot/tree/dbh'),
      getUuid('cluster/plot/tree/tree_status'),
    ])(newTreeQuery())
    expect(getQueryChartType({ query: two, survey })).toBe('scatter')
    expect(getQueryChartType({ query: one, survey })).toBeNull()
  })
})

describe('showQuery', () => {
  test('dispatches the Explorer actions in order, then navigates', () => {
    const actions: any[] = []
    const paths: string[] = []
    showQuery({
      query: newAggregateQuery(),
      displayType: 'chart',
      chartType: 'bar',
      navigate: (path) => paths.push(path),
    })((action) => actions.push(action))
    expect(actions.map((action) => action.type)).toEqual([
      'dataQuery/setSelectedQuerySummaryUuid',
      'dataQuery/setNodeDefsSelectorVisible',
      'dataQuery/setQuery',
      'dataQuery/setDisplayType',
      'dataQuery/setChartType',
    ])
    expect(actions[0].payload).toBeNull()
    expect(actions[1].payload).toBe(true)
    expect(Expression.toString(Query.getFilter(actions[2].payload))).toBe('dbh > 10 && tree_status == "L"')
    expect(actions[3].payload).toBe('chart')
    expect(actions[4].payload).toBe('bar')
    expect(paths).toEqual(['/app/data/explorer/'])
  })

  test('without display type, chart type and navigate it only sets the query', () => {
    const actions: any[] = []
    showQuery({ query: newTreeQuery() })((action) => actions.push(action))
    expect(actions.map((action) => action.type)).toEqual([
      'dataQuery/setSelectedQuerySummaryUuid',
      'dataQuery/setNodeDefsSelectorVisible',
      'dataQuery/setQuery',
    ])
  })
})

test('survey fixture has the node defs used above', () => {
  expect(Survey.getNodeDefByUuid(getUuid('cluster/plot/tree/tree_height'))(survey)).toBeTruthy()
})
