import React, { useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import * as R from 'ramda'

import { elementOffset } from '../../../../../../utils/domUtils'

import Survey from '../../../../../../../common/survey/survey'
import NodeDefTable from '../../../../../../../common/surveyRdb/nodeDefTable'
import Authorizer from '../../../../../../../common/auth/authorizer'

import TableHeader from './tableHeader'
import TableRows from './tableRows'

import * as AppState from '../../../../../../app/appState'
import * as DataQueryState from '../dataQueryState'
import * as SurveyState from '../../../../../../survey/surveyState'

const defaultColWidth = 80

const Table = props => {

  const {
    lang, surveyId, data, showTable,
    nodeDefUuidContext, nodeDefCols, nodeDefUuidCols, colNames,
    tableName, offset, limit, filter, sort, count,
    nodeDefSelectorsVisible,
    editMode, canEdit,
    history
  } = props

  const tableRef = useRef(null)
  const { width = defaultColWidth } = elementOffset(tableRef.current)
  const widthMax = width - defaultColWidth - 5
  const colWidthMin = 150

  const colsTot = editMode ? nodeDefUuidCols.length : colNames.length

  const colWidth = widthMax > colsTot * colWidthMin
    ? Math.floor(widthMax / colsTot)
    : colWidthMin

  const hasData = !R.isEmpty(data)

  return (
    <div className={`data-query__table table${editMode ? ' edit' : ''}`} ref={tableRef}>
      {
        showTable &&
        <React.Fragment>

          <TableHeader
            surveyId={surveyId}
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
  const lang = AppState.getLang(state)
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDefUuidContext = DataQueryState.getTableNodeDefUuidTable(state)
  const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  const tableName = NodeDefTable.getViewNameByUuid(nodeDefUuidContext)(survey)
  const editMode = DataQueryState.getTableEditMode(state)

  return {
    lang,
    surveyId: Survey.getId(survey),
    tableName,
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    colNames,
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
  connect(mapStateToProps)
)
export default enhance(Table)