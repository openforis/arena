import React, { useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import * as R from 'ramda'

import { elementOffset } from '../../../../../../utils/domUtils'

import Survey from '../../../../../../../common/survey/survey'
import NodeDefTable from '../../../../../../../common/surveyRdb/nodeDefTable'
import Authorizer from '../../../../../../../common/auth/authorizer'
import WebSocketEvents from '../../../../../../../common/webSocket/webSocketEvents'

import * as AppWebSocket from '../../../../../../app/appWebSocket'
import * as NodeDefUIProps from '../../../../../surveyViews/surveyForm/nodeDefs/nodeDefUIProps'

import { useOnUpdate } from '../../../../../../commonComponents/hooks'
import TableHeader from './tableHeader'
import TableRows from './tableRows'

import * as AppState from '../../../../../../app/appState'
import * as DataQueryState from '../dataQueryState'
import * as SurveyState from '../../../../../../survey/surveyState'

import { nodesUpdateCompleted } from '../../../../../surveyViews/record/actions'

const defaultColWidth = 80

const Table = props => {

  const {
    appSaving, lang, surveyId, surveyCycleKey, data, showTable,
    nodeDefUuidContext, nodeDefCols, nodeDefUuidCols, colNames, colsNumber,
    tableName, offset, limit, filter, sort, count,
    nodeDefSelectorsVisible,
    editMode, canEdit,
    history,
    nodesUpdateCompleted
  } = props

  const tableRef = useRef(null)
  const { width = defaultColWidth } = elementOffset(tableRef.current)
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
            tableName={tableName}
            colNames={colNames}
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
              colNames={colNames}
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
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
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
    tableName: NodeDefTable.getViewName(nodeDefContext, Survey.getNodeDefParent(nodeDefContext)(survey)),
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    colNames,
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
    canEdit: Authorizer.canEditRecordsInDataQuery(user, surveyInfo),
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, { nodesUpdateCompleted })
)
export default enhance(Table)