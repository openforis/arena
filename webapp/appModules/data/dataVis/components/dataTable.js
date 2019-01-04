import './dataTable.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'
import NodeDefTableColumn from './nodeDefs/nodeDefTableColumn'
import ExpressionBuilder from '../../../../commonComponents/expression/expression'

import * as SurveyState from '../../../../survey/surveyState'
import * as DataVisState from '../dataVisState'

import { updateDataTable, resetDataTable, updateDataFilter } from '../actions'

import Survey from '../../../../../common/survey/survey'
import NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'
import { elementOffset } from '../../../../appUtils/domUtils'

const defaultColWidth = 80

const TableNodeDefCols = ({nodeDefCols, row, lang, colWidth}) => (
  nodeDefCols.map(nodeDef =>
    <NodeDefTableColumn key={nodeDef.id}
                        nodeDef={nodeDef} row={row}
                        lang={lang} colWidth={colWidth}/>
  )
)

const TableRows = ({nodeDefCols, colNames, data, offset, lang, colWidth}) => (
  <div className="table__rows">

    <div className="table__row-header">
      <div style={{width: defaultColWidth}}>Row #</div>
      <TableNodeDefCols nodeDefCols={nodeDefCols} lang={lang} colWidth={colWidth}/>
    </div>


    <div className="table__data-rows">
      {
        data.map((row, i) =>
          <div key={i} className="table__row">
            <div style={{width: defaultColWidth}}>{i + offset + 1}</div>
            <TableNodeDefCols nodeDefCols={nodeDefCols} row={row} colWidth={colWidth}/>
          </div>
        )
      }
    </div>
  </div>
)

class DataTable extends React.Component {

  constructor (props) {
    super(props)
    this.tableRef = React.createRef()
  }

  componentWillUnmount () {
    this.props.resetDataTable()
  }

  render () {
    const {
      nodeDefUuidTable, nodeDefCols, colNames, data,
      offset, limit, filter, count, lang,
      updateDataTable, updateDataFilter,
    } = this.props

    const {width = defaultColWidth} = elementOffset(this.tableRef.current)
    const widthMax = width - defaultColWidth
    const colWidthMin = 150

    const colWidth = widthMax > colNames.length * colWidthMin
      ? widthMax / colNames.length
      : colWidthMin

    return (
      <div className="data-vis__data-table table" ref={this.tableRef}>

        <div className="table__header">
          <div className="filter-container">
            {
              nodeDefUuidTable &&
              <React.Fragment>
                <span className="icon icon-filter icon-14px icon-left icon-reverse btn-of"
                      style={{opacity: R.isEmpty(filter) ? 0.5 : 1}}/>
                <ExpressionBuilder nodeDefUuid={nodeDefUuidTable}
                                   query={filter}
                                   onChange={query => updateDataFilter(query)}/>
              </React.Fragment>
            }
          </div>

          {
            !R.isEmpty(data) &&
            <TablePaginator offset={offset} limit={limit} count={count}
                            fetchFn={updateDataTable}/>
          }
        </div>


        {
          !R.isEmpty(data) &&
          <TableRows nodeDefCols={nodeDefCols} colNames={colNames}
                     data={data} offset={offset}
                     lang={lang}
                     colWidth={colWidth}/>
        }

      </div>
    )
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidTable = DataVisState.getTableNodeDefUuidTable(state)
  const nodeDefUuidCols = DataVisState.getTableNodeDefUuidCols(state)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)

  return {
    nodeDefUuidTable,
    nodeDefCols,
    colNames,
    data: DataVisState.getTableData(state),
    offset: DataVisState.getTableOffset(state),
    limit: DataVisState.getTableLimit(state),
    filter: DataVisState.getTableFilter(state),
    count: DataVisState.getTableCount(state),
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
  }
}

export default connect(mapStateToProps, {updateDataTable, resetDataTable, updateDataFilter})(DataTable)