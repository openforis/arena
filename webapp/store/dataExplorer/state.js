import * as A from '@core/arena'

const stateKey = 'dataExplorer'

const keys = {
  editMode: 'editMode',
  query: 'query',
  selectedQuerySummaryUuid: 'selectedQuerySummaryUuid',
}

// read
const getDataExplorerState = A.prop(stateKey)
const isEditMode = (state) => A.pipe(getDataExplorerState, A.prop(keys.editMode))(state) === true
const getQuery = A.pipe(getDataExplorerState, A.prop(keys.query))
const getSelectedQuerySummaryUuid = A.pipe(getDataExplorerState, A.prop(keys.selectedQuerySummaryUuid))

// update
const assocEditMode = A.assoc(keys.editMode)
const assocQuery = A.assoc(keys.query)
const assocSelectedQuerySummaryUuid = A.assoc(keys.selectedQuerySummaryUuid)

export const DataExplorerState = {
  stateKey,
  // read
  isEditMode,
  getQuery,
  getSelectedQuerySummaryUuid,
  // update
  assocEditMode,
  assocQuery,
  assocSelectedQuerySummaryUuid,
}
