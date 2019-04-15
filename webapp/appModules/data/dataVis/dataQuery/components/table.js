import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import * as R from 'ramda'

import TableHeader from './tableHeader'
import TableRows from './tableRows'

import * as SurveyState from '../../../../../survey/surveyState'

import Survey from '../../../../../../common/survey/survey'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

import * as DataQueryState from '../dataQueryState'

import { elementOffset } from '../../../../../appUtils/domUtils'
import AuthManager from '../../../../../../common/auth/authManager'
import * as AppState from '../../../../../app/appState'

const defaultColWidth = 80

class Table extends React.Component {

  constructor (props) {
    super(props)
    this.tableRef = React.createRef()
  }

  render () {
    const {
      surveyId, lang, data, showTable,
      nodeDefUuidContext, nodeDefCols, nodeDefUuidCols, colNames,
      tableName, offset, limit, filter, sort, count,
      editMode, canEdit,
      history
    } = this.props

    const { width = defaultColWidth } = elementOffset(this.tableRef.current)
    const widthMax = width - defaultColWidth
    const colWidthMin = 150

    const colsTot = editMode ? nodeDefUuidCols.length : colNames.length

    const colWidth = widthMax > colsTot * colWidthMin
      ? widthMax / colsTot
      : colWidthMin

    const hasData = !R.isEmpty(data)

    return (
      <div className={`data-query__table table${editMode ? ' edit' : ''}`} ref={this.tableRef}>
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
            />

            {
              hasData &&
              <TableRows nodeDefCols={nodeDefCols} colNames={colNames}
                         data={data} offset={offset}
                         lang={lang}
                         colWidth={colWidth}
                         editMode={editMode}
                         history={history}/>
            }
          </React.Fragment>
        }
      </div>
    )
  }

}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDefUuidContext = DataQueryState.getTableNodeDefUuidTable(state)
  const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  const tableName = NodeDefTable.getViewNameByUuid(nodeDefUuidContext)(survey)
  const editMode = DataQueryState.getTableEditMode(state)

  return {
    surveyId: Survey.getId(survey),
    lang: Survey.getDefaultLanguage(surveyInfo),
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
    editMode,
    canEdit: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps)
)
export default enhance(Table)