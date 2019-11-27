import React, {useRef} from 'react'
import {compose} from 'redux'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'
import * as R from 'ramda'

import {elementOffset} from '@webapp/utils/domUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as Authorizer from '@core/auth/authorizer'
import {WebSocketEvents} from '@common/webSocket/webSocketEvents'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import {useOnUpdate} from '@webapp/commonComponents/hooks'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as DataQueryState from '../dataQueryState'
import * as NodeDefUIProps from '../../../../../surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import {nodesUpdateCompleted} from '../../../../../surveyViews/record/actions'
import TableRows from './tableRows'
import TableHeader from './tableHeader'

const defaultColWidth = 80

const Table = props => {
  const {
    appSaving, lang, surveyId, surveyCycleKey, data, showTable,
    nodeDefUuidContext, nodeDefCols, nodeDefUuidCols, colsNumber,
    offset, limit, filter, sort, count,
    nodeDefSelectorsVisible,
    editMode, canEdit,
    history,
    nodesUpdateCompleted
  } = props

  const tableRef = useRef(null)
  const {width = defaultColWidth} = elementOffset(tableRef.current)
  const widthMax = width - defaultColWidth - 35
  const colWidthMin = 150

  const colWidth = widthMax > colsNumber * colWidthMin
    ? Math.floor(widthMax / colsNumber)
    : colWidthMin

  const hasData = !R.isEmpty(data)

  useOnUpdate(() => {
    if (editMode) {
      AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, nodesUpdateCompleted)
    }

    return () => {
      AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
    }
  }, [editMode])

  return (
    <div className={`data-query__table table${editMode ? ' edit' : ''}`} ref={tableRef}>
      {
        showTable &&
        <React.Fragment>

          <TableHeader
            appSaving={appSaving}
            surveyId={surveyId}
            surveyCycleKey={surveyCycleKey}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCols={nodeDefUuidCols}
            filter={filter}
            sort={sort}
            limit={limit}
            offset={offset}
            count={count}
            showPaginator={hasData}
            editMode={editMode}
            canEdit={canEdit}
            nodeDefSelectorsVisible={nodeDefSelectorsVisible}
          />

          {
            hasData &&
            <TableRows
              lang={lang}
              nodeDefCols={nodeDefCols}
              data={data}
              offset={offset}
              colWidth={colWidth}
              defaultColWidth={defaultColWidth}
              editMode={editMode}
              history={history}/>
          }
        </React.Fragment>
      }
    </div>
  )
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDefUuidContext = DataQueryState.getTableNodeDefUuidTable(state)
  const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  const editMode = DataQueryState.getTableEditMode(state)

  const colsNumber = editMode
    ? nodeDefCols.reduce((tot, nodeDefCol) => tot + NodeDefUIProps.getFormFields(nodeDefCol).length, 0)
    : colNames.length

  return {
    lang: AppState.getLang(state),
    appSaving: AppState.isSaving(state),
    surveyId: Survey.getId(survey),
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    colsNumber,
    data: DataQueryState.getTableData(state),
    offset: DataQueryState.getTableOffset(state),
    limit: DataQueryState.getTableLimit(state),
    filter: DataQueryState.getTableFilter(state),
    sort: DataQueryState.getTableSort(state),
    count: DataQueryState.getTableCount(state),
    showTable: DataQueryState.hasTableAndCols(state),
    nodeDefSelectorsVisible: DataQueryState.isNodeDefSelectorsVisible(state),
    editMode,
    canEdit: Authorizer.canCleanseRecords(user, surveyInfo),
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, {nodesUpdateCompleted})
)
export default enhance(Table)
