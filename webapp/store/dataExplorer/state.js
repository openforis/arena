import * as A from '@core/arena'

const stateKey = 'dataExplorer'

const keys = {
  displayType: 'displayType',
  editMode: 'editMode',
  nodeDefsSelectorVisible: 'nodeDefsSelectorVisible',
  query: 'query',
  selectedQuerySummaryUuid: 'selectedQuerySummaryUuid',
}

const displayTypes = {
  table: 'table',
  chart: 'chart',
}

// read
const getDataExplorerState = A.prop(stateKey)
const getProp = (key) => A.pipe(getDataExplorerState, A.prop(key))

const getDisplayType = getProp(keys.displayType)
const isEditMode = (state) => getProp(keys.editMode)(state) === true
const isNodeDefsSelectorVisible = (state) => getProp(keys.nodeDefsSelectorVisible)(state) === true
const getQuery = getProp(keys.query)
const getSelectedQuerySummaryUuid = getProp(keys.selectedQuerySummaryUuid)

// update
const assocDisplayType = A.assoc(keys.displayType)
const assocEditMode = A.assoc(keys.editMode)
const assocNodeDefsSelectorVisible = A.assoc(keys.nodeDefsSelectorVisible)
const assocQuery = A.assoc(keys.query)
const assocSelectedQuerySummaryUuid = A.assoc(keys.selectedQuerySummaryUuid)

export const DataExplorerState = {
  stateKey,
  displayTypes,
  // read
  isEditMode,
  isNodeDefsSelectorVisible,
  getQuery,
  getDisplayType,
  getSelectedQuerySummaryUuid,
  // update
  assocDisplayType,
  assocEditMode,
  assocNodeDefsSelectorVisible,
  assocQuery,
  assocSelectedQuerySummaryUuid,
}
