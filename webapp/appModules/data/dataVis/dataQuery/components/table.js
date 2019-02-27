import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TableRows from './tableRows'
import TablePaginator from '../../../../../commonComponents/table/tablePaginator'
import ExpressionComponent from '../../../../../commonComponents/expression/expression'
import SortEditor from './sort/sortEditor'

import * as SurveyState from '../../../../../survey/surveyState'

import { updateTableFilter, updateTableOffset, updateTableSort } from '../actions'

import Survey from '../../../../../../common/survey/survey'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'
import Expression from '../../../../../../common/exprParser/expression'

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
      nodeDefUuidContext, nodeDefCols, nodeDefUuidCols, colNames, data,
      offset, limit, filter, count, lang,
      updateTableOffset, updateTableFilter,
      updateTableSort,
      showTable,
    } = this.props

    const { width = defaultColWidth } = elementOffset(this.tableRef.current)
    const widthMax = width - defaultColWidth
    const colWidthMin = 150

    const colWidth = widthMax > colNames.length * colWidthMin
      ? widthMax / colNames.length
      : colWidthMin

    return (
      <div className="data-query__table table" ref={this.tableRef}>
        {
          showTable &&
          <React.Fragment>
            <div className="table__header">
              <div className="data-operations">
                <div className="filter-container">
                  {
                    nodeDefUuidContext &&
                    <React.Fragment>
                      <span className="icon icon-filter icon-14px icon-left icon-reverse btn-of"
                            style={{ opacity: R.isEmpty(filter) ? 0.5 : 1 }}/>
                      <ExpressionComponent nodeDefUuidContext={nodeDefUuidContext}
                                           query={filter}
                                           onChange={query => updateTableFilter(query)}
                                           mode={Expression.modes.sql}/>
                    </React.Fragment>
                  }
                </div>
                <div className="sort-container">
                  {
                    nodeDefUuidContext &&
                    <React.Fragment>
                      <span className="icon icon-filter icon-14px icon-left icon-reverse btn-of"
                            style={{ opacity: R.isEmpty(filter) ? 0.5 : 1 }} />
                      <SortEditor nodeDefUuidCols={nodeDefUuidCols}
                                  nodeDefUuidContext={nodeDefUuidContext}
                                  onChange={sort => updateTableSort(sort)}
                                  mode={Expression.modes.sql} />
                    </React.Fragment>
                  }
                </div>
              </div>

              {
                !R.isEmpty(data) &&
                <TablePaginator offset={offset} limit={limit} count={count}
                                fetchFn={updateTableOffset}/>
              }
            </div>


            {
              !R.isEmpty(data) &&
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

  return {
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    colNames,
    data: DataQueryState.getTableData(state),
    offset: DataQueryState.getTableOffset(state),
    limit: DataQueryState.getTableLimit(state),
    filter: DataQueryState.getTableFilter(state),
    count: DataQueryState.getTableCount(state),
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
    showTable: DataQueryState.hasTableAndCols(state),
  }
}

export default connect(mapStateToProps, { updateTableOffset, updateTableFilter, updateTableSort })(Table)