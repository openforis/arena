import './dataTable.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'
import NodeDefTableColumn from './nodeDefs/nodeDefTableColumn'

import * as SurveyState from '../../../../survey/surveyState'
import * as DataVisState from '../dataVisState'

import { updateDataTable, resetDataTable, updateDataFilter } from '../actions'

import Survey from '../../../../../common/survey/survey'
import NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'
import { elementOffset } from '../../../../appUtils/domUtils'
import { trim } from '../../../../../common/stringUtils'

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
    this.state = {filter: '', firstFilter: true}
    this.tableRef = React.createRef()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {filter} = this.props
    const {filter: filterPrev} = prevProps

    const {firstFilter} = this.state
    // on new search, reset local filter
    if (!firstFilter && R.isEmpty(filter) && !R.isEmpty(filterPrev))
      this.setState({filter: ''})
  }

  componentWillUnmount () {
    this.props.resetDataTable()
  }

  render () {
    const {
      nodeDefCols, colNames, data,
      offset, limit, filter, count, lang,
      updateDataTable, updateDataFilter,
    } = this.props
    const {filter: filterLocal} = this.state

    const {width = defaultColWidth} = elementOffset(this.tableRef.current)
    const widthMax = width - defaultColWidth
    const colWidthMin = 150

    const colWidth = widthMax > colNames.length * colWidthMin
      ? widthMax / colNames.length
      : colWidthMin

    return (
      <div className="data-vis__data-table table" ref={this.tableRef}>
        <div className="table__header">
          <div>
            <input type="text" className="form-input" style={{width: '300px'}}
                   value={filterLocal}
                   onChange={e => this.setState({filter: trim(e.target.value)})}/>
            <button className="btn btn-s btn-of-light"
                    onClick={() => {
                      updateDataFilter(filterLocal)
                      this.setState({firstFilter: false})
                    }}
                    aria-disabled={filter === filterLocal}>
              <span className="icon icon-filter icon-14px"/>
            </button>
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
  const nodeDefUuidCols = DataVisState.getTableNodeDefUuidCols(state)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  const colNames = NodeDefTable.getColNamesByUuids(nodeDefUuidCols)(survey)

  return {
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