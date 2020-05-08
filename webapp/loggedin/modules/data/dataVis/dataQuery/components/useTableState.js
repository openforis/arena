import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import { ColumnNodeDef } from '@common/model/db'
import * as Survey from '@core/survey/survey'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import { useOnUpdate, useSurvey, useSurveyCycleKey, useAuthCanCleanseRecords } from '@webapp/commonComponents/hooks'

import * as AppState from '@webapp/app/appState'
import * as NodeDefUIProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'
import { nodesUpdateCompleted, nodeValidationsUpdate } from '../actions'

import * as DataQueryState from '../dataQueryState'

export const useTableState = () => {
  const history = useHistory()
  const dispatch = useDispatch()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const canEdit = useAuthCanCleanseRecords()
  const lang = useSelector(AppState.getLang)
  const appSaving = useSelector(AppState.isSaving)
  const nodeDefUuidContext = useSelector(DataQueryState.getTableNodeDefUuidTable)
  const nodeDefUuidCols = useSelector(DataQueryState.getTableNodeDefUuidCols)
  const editMode = useSelector(DataQueryState.getTableEditMode)

  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = nodeDefCols.map((nodeDefCol) => ColumnNodeDef.getColNames(nodeDefCol)).flat()
  const colsNumber = editMode
    ? nodeDefCols.reduce((tot, nodeDefCol) => tot + NodeDefUIProps.getFormFields(nodeDefCol).length, 0)
    : colNames.length

  const data = useSelector(DataQueryState.getTableData)

  useOnUpdate(() => {
    if (editMode) {
      AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, () => dispatch(nodesUpdateCompleted()))
      AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, ({ recordUuid, recordValid, validations }) =>
        dispatch(nodeValidationsUpdate({ recordUuid, recordValid, validations }))
      )
    }

    return () => {
      AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
      AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    }
  }, [editMode])

  return {
    history,
    surveyId: Survey.getId(survey),
    surveyCycleKey,
    canEdit,
    lang,
    appSaving,
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    editMode,
    colsNumber,
    data,
    hasData: !R.isEmpty(data),
    offset: useSelector(DataQueryState.getTableOffset),
    limit: useSelector(DataQueryState.getTableLimit),
    filter: useSelector(DataQueryState.getTableFilter),
    sort: useSelector(DataQueryState.getTableSort),
    count: useSelector(DataQueryState.getTableCount),
    showTable: useSelector(DataQueryState.hasTableAndCols),
    nodeDefSelectorsVisible: useSelector(DataQueryState.isNodeDefSelectorsVisible),
  }
}
