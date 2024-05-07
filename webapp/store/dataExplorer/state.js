import { Query } from '@common/model/query'
import * as A from '@core/arena'

const stateKey = 'dataExplorer'

const keys = {
  chartType: 'chartType',
  displayType: 'displayType',
  editMode: 'editMode',
  nodeDefsSelectorVisible: 'nodeDefsSelectorVisible',
  query: 'query',
  selectedQuerySummaryUuid: 'selectedQuerySummaryUuid',
}

const chartTypes = {
  bar: 'bar',
  pie: 'pie',
}

const displayTypes = {
  table: 'table',
  chart: 'chart',
}

// read
const getDataExplorerState = A.prop(stateKey)
const getProp = (key) => A.pipe(getDataExplorerState, A.prop(key))

const getChartType = getProp(keys.chartType)
const getDisplayType = getProp(keys.displayType)
const isEditMode = (state) => getProp(keys.editMode)(state) === true
const isNodeDefsSelectorVisible = (state) => getProp(keys.nodeDefsSelectorVisible)(state) === true
const getQuery = getProp(keys.query)
const getSelectedQuerySummaryUuid = getProp(keys.selectedQuerySummaryUuid)

// update
const assocChartType = A.assoc(keys.chartType)
const assocDisplayType = A.assoc(keys.displayType)
const assocEditMode = A.assoc(keys.editMode)
const assocNodeDefsSelectorVisible = A.assoc(keys.nodeDefsSelectorVisible)
const assocQuery = (queryUpdated) => (state) => {
  let stateUpdated = A.assoc(keys.query, queryUpdated)(state)
  if (stateUpdated.displayType === DataExplorerState.displayTypes.chart && !Query.isModeAggregate(queryUpdated)) {
    stateUpdated = A.pipe(assocDisplayType(displayTypes.table), assocChartType(chartTypes.bar))(stateUpdated)
  }
  return stateUpdated
}
const assocSelectedQuerySummaryUuid = A.assoc(keys.selectedQuerySummaryUuid)

export const DataExplorerState = {
  stateKey,
  chartTypes,
  displayTypes,
  // read
  isEditMode,
  isNodeDefsSelectorVisible,
  getChartType,
  getDisplayType,
  getQuery,
  getSelectedQuerySummaryUuid,
  // update
  assocChartType,
  assocDisplayType,
  assocEditMode,
  assocNodeDefsSelectorVisible,
  assocQuery,
  assocSelectedQuerySummaryUuid,
}
