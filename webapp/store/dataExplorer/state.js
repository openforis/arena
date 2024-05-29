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
  recordEditModalProps: 'recordEditModalProps',
}

const chartTypes = {
  bar: 'bar',
  line: 'line',
  area: 'area',
  pie: 'pie',
  scatter: 'scatter',
}

const displayTypes = {
  table: 'table',
  chart: 'chart',
}

const availableChartTypeByMode = {
  [Query.modes.aggregate]: [chartTypes.bar, chartTypes.line, chartTypes.area, chartTypes.pie],
  [Query.modes.raw]: [chartTypes.scatter],
}

// read (context global state)
const getDataExplorerState = A.prop(stateKey)
const getProp = (key) => A.pipe(getDataExplorerState, A.prop(key))

const getChartType = getProp(keys.chartType)
const getDisplayType = getProp(keys.displayType)
const isEditMode = (state) => getProp(keys.editMode)(state) === true
const isNodeDefsSelectorVisible = (state) => getProp(keys.nodeDefsSelectorVisible)(state) === true
const getQuery = getProp(keys.query)
const getSelectedQuerySummaryUuid = getProp(keys.selectedQuerySummaryUuid)
const getRecordEditModalProps = getProp(keys.recordEditModalProps)

// update (context data explorer state)
const assocChartType = A.assoc(keys.chartType)
const assocFirstAvailableChartType = (state) => {
  const query = A.prop(keys.query)(state)
  const queryMode = Query.getMode(query)
  const availableChartTypes = availableChartTypeByMode[queryMode]
  const defaultChartType = availableChartTypes[0]
  return assocChartType(defaultChartType)(state)
}
const assocDisplayType = (displayType) => (state) => {
  let stateUpdated = A.assoc(keys.displayType, displayType)(state)
  if (displayType === displayTypes.chart) {
    stateUpdated = assocFirstAvailableChartType(stateUpdated)
  } else {
    stateUpdated = A.dissoc(keys.chartType)(stateUpdated)
  }
  return stateUpdated
}
const assocEditMode = A.assoc(keys.editMode)
const assocNodeDefsSelectorVisible = A.assoc(keys.nodeDefsSelectorVisible)
const assocQuery = (queryParam) => (state) => {
  let queryUpdated = queryParam

  const entityNotSelected = !Query.getEntityDefUuid(queryUpdated)

  if (entityNotSelected) {
    const queryPrev = A.prop(keys.query)(state)
    if (Query.getEntityDefUuid(queryPrev)) {
      // entity has been reset: set mode to "raw"
      queryUpdated = Query.assocMode(Query.modes.raw)(queryUpdated)
    }
  }
  let stateUpdated = A.assoc(keys.query, queryUpdated)(state)

  if (entityNotSelected) {
    // allow only table display type when entity is not selected
    stateUpdated = assocDisplayType(displayTypes.table)(stateUpdated)
  }
  const displayType = A.prop(keys.displayType)(stateUpdated)
  if (displayType === displayTypes.chart) {
    // query mode could have changed;
    // check that the selected chart type is still available,
    // otherwise reset it to the default
    const chartType = A.prop(keys.chart)(stateUpdated)
    const queryMode = Query.getMode(queryUpdated)
    const availableChartTypes = availableChartTypeByMode[queryMode]
    if (!availableChartTypes.includes(chartType)) {
      stateUpdated = assocFirstAvailableChartType(stateUpdated)
    }
  } else {
    stateUpdated = A.dissoc(keys.chartType)(stateUpdated)
  }
  return stateUpdated
}
const assocSelectedQuerySummaryUuid = A.assoc(keys.selectedQuerySummaryUuid)

const assocRecordEditModalProps = A.assoc(keys.recordEditModalProps)

const dissocRecordEditModalProps = A.dissoc(keys.recordEditModalProps)

// utils
const isChartTypeAvailable =
  ({ queryMode }) =>
  (chartType) =>
    availableChartTypeByMode[queryMode]?.includes(chartType)

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
  getRecordEditModalProps,
  // update
  assocChartType,
  assocDisplayType,
  assocEditMode,
  assocNodeDefsSelectorVisible,
  assocQuery,
  assocSelectedQuerySummaryUuid,
  assocRecordEditModalProps,
  dissocRecordEditModalProps,

  // utils
  isChartTypeAvailable,
}
