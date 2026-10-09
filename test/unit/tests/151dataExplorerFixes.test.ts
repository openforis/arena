import { Query } from '@common/model/query'

import { getQueryLimitForDisplayType, tablePageSize } from '@webapp/components/DataQuery/store/queryLimit'
import { getEntityViewDataCountRequest } from '@webapp/service/api/surveyRdb'
import { DataExplorerState } from '@webapp/store/dataExplorer/state'

const { chartTypes, displayTypes } = DataExplorerState

const newAggregateQuery = (dimensionUuid: string) =>
  Query.assocMeasures({ m1: ['avg'] })(
    Query.assocDimensions([dimensionUuid])(
      Query.assocMode(Query.modes.aggregate)(Query.create({ entityDefUuid: 'e1' }))
    )
  )
const newRawQuery = () => Query.assocAttributeDefUuids(['a1'])(Query.create({ entityDefUuid: 'e1' }))

describe('Explorer: chart type', () => {
  const chartState = (chartType: string) => {
    let state: any = DataExplorerState.assocQuery(newAggregateQuery('d1'))({})
    state = DataExplorerState.assocDisplayType(displayTypes.chart)(state)
    return DataExplorerState.assocChartType(chartType)(state)
  }

  test('is kept when the query changes and the type is still available', () => {
    const state = DataExplorerState.assocQuery(newAggregateQuery('d2'))(chartState(chartTypes.line))
    expect(state[DataExplorerState.keys.chartType]).toBe(chartTypes.line)
  })

  test('is reset to the first available type when the mode changes', () => {
    const state = DataExplorerState.assocQuery(newRawQuery())(chartState(chartTypes.line))
    expect(state[DataExplorerState.keys.chartType]).toBe(chartTypes.scatter)
  })
})

describe('Explorer: row limit', () => {
  test('follows the display type', () => {
    expect(DataExplorerState.chartMaxItems).toBe(5000)
    expect(getQueryLimitForDisplayType(displayTypes.chart)).toBe(5000)
    expect(getQueryLimitForDisplayType(displayTypes.table)).toBe(tablePageSize)
    expect(getQueryLimitForDisplayType(null)).toBe(15)
  })
})

describe('Explorer: count request', () => {
  test('sends the query as an object', () => {
    const query = newAggregateQuery('d1')
    const { url, body } = getEntityViewDataCountRequest({ surveyId: 3, query, cycle: '0' })
    expect(url).toBe('/api/surveyRdb/3/e1/query/count')
    expect(body).toEqual({ cycle: '0', query })
    expect(typeof body.query).toBe('object')
  })
})
