import { useSelector, useDispatch } from 'react-redux'
import * as R from 'ramda'

import { ColumnNodeDef } from '@common/model/db'
import * as Survey from '@core/survey/survey'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import { useOnUpdate, useSurvey, useAuthCanCleanseRecords } from '@webapp/components/hooks'

import * as AppState from '@webapp/app/appState'
import * as NodeDefUIProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'
import { nodesUpdateCompleted, nodeValidationsUpdate } from '../actions'

import * as DataQueryState from '../state'
import { useLang } from '@webapp/store/system'

export const useTableState = () => {
  const dispatch = useDispatch()

  const survey = useSurvey()
  const canEdit = useAuthCanCleanseRecords()
  const lang = useLang()
  const appSaving = useSelector(AppState.isSaving)
  const nodeDefUuidContext = useSelector(DataQueryState.getTableNodeDefUuidTable)
  const nodeDefUuidCols = useSelector(DataQueryState.getTableNodeDefUuidCols)
  const editMode = useSelector(DataQueryState.isTableModeEdit)
  const aggregateMode = useSelector(DataQueryState.isTableModeAggregate)

  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = nodeDefCols.flatMap((nodeDefCol) => ColumnNodeDef.getColNames(nodeDefCol))
  const colsNumber = editMode
    ? nodeDefCols.reduce((tot, nodeDefCol) => tot + NodeDefUIProps.getFormFields(nodeDefCol).length, 0)
    : colNames.length

  const data = useSelector(DataQueryState.getTableData)

  useOnUpdate(() => {
    if (editMode) {
      AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, () => dispatch(nodesUpdateCompleted()))
      AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, ({ recordUuid, validations }) =>
        dispatch(nodeValidationsUpdate({ recordUuid, validations }))
      )
    }

    return () => {
      AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
      AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    }
  }, [editMode])

  return {
    canEdit,
    lang,
    appSaving,
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    editMode,
    aggregateMode,
    colsNumber,
    data,
    hasData: !R.isEmpty(data),
    offset: useSelector(DataQueryState.getTableOffset),
    limit: useSelector(DataQueryState.getTableLimit),
    filter: useSelector(DataQueryState.getTableFilter),
    sort: useSelector(DataQueryState.getTableSort),
    count: useSelector(DataQueryState.getTableCount),
    hasTableAndCols: useSelector(DataQueryState.hasTableAndCols),
    nodeDefSelectorsVisible: useSelector(DataQueryState.isNodeDefSelectorsVisible),
  }
}
