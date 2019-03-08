import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TableHeader from './tableHeader'
import TableRows from './tableRows'

import * as SurveyState from '../../../../../survey/surveyState'

import Survey from '../../../../../../common/survey/survey'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

import * as DataQueryState from '../dataQueryState'

import { elementOffset } from '../../../../../appUtils/domUtils'

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
    } = this.props

    const { width = defaultColWidth } = elementOffset(this.tableRef.current)
    const widthMax = width - defaultColWidth
    const colWidthMin = 150

    const colWidth = widthMax > colNames.length * colWidthMin
      ? widthMax / colNames.length
      : colWidthMin

    const hasData = !R.isEmpty(data)

    return (
      <div className="data-query__table table" ref={this.tableRef}>
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
            />

            {
              hasData &&
              <TableRows nodeDefCols={nodeDefCols} colNames={colNames}
                         data={data} offset={offset}
                         lang={lang}
                         colWidth={colWidth}/>
            }
          </React.Fragment>
        }
      </div>
    )
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidContext = DataQueryState.getTableNodeDefUuidTable(state)
  const nodeDefUuidCols = DataQueryState.getTableNodeDefUuidCols(state)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)
  const tableName = NodeDefTable.getViewNameByUuid(nodeDefUuidContext)(survey)

  return {
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
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    showTable: DataQueryState.hasTableAndCols(state),
  }
}

export default connect(mapStateToProps)(Table)