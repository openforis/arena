import * as A from '@core/arena'

const stateKey = 'dataExplorer'

const keys = {
  editMode: 'editMode',
  nodeDefsSelectorVisible: 'nodeDefsSelectorVisible',
  query: 'query',
  selectedQuerySummaryUuid: 'selectedQuerySummaryUuid',
}

// read
const getProp = (key) => A.pipe(getDataExplorerState, A.prop(key))
const getDataExplorerState = A.prop(stateKey)
const isEditMode = (state) => getProp(keys.editMode)(state) === true
const isNodeDefsSelectorVisible = (state) => getProp(keys.nodeDefsSelectorVisible)(state) === true
const getQuery = getProp(keys.query)
const getSelectedQuerySummaryUuid = getProp(keys.selectedQuerySummaryUuid)

// update
const assocEditMode = A.assoc(keys.editMode)
const assocNodeDefsSelectorVisible = A.assoc(keys.nodeDefsSelectorVisible)
const assocQuery = A.assoc(keys.query)
const assocSelectedQuerySummaryUuid = A.assoc(keys.selectedQuerySummaryUuid)

export const DataExplorerState = {
  stateKey,
  // read
  isEditMode,
  isNodeDefsSelectorVisible,
  getQuery,
  getSelectedQuerySummaryUuid,
  // update
  assocEditMode,
  assocNodeDefsSelectorVisible,
  assocQuery,
  assocSelectedQuerySummaryUuid,
}
