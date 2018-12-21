import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'
import NodeDefTableColumn from './nodeDefs/nodeDefTableColumn'

import * as SurveyState from '../../../../survey/surveyState'
import * as DataVisState from '../dataVisState'

import { updateDataTable, resetDataTable } from '../actions'

import Survey from '../../../../../common/survey/survey'
import NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'

const TableNodeDefCols = ({nodeDefCols, row, lang}) => (
  nodeDefCols.map(nodeDef =>
    <NodeDefTableColumn key={nodeDef.id} nodeDef={nodeDef} row={row} lang={lang}/>
  )
)

const TableRows = ({nodeDefCols, data, offset, style}) => (
  <div className="table__rows">
    {
      data.map((row, i) =>
        <div key={i} className="table__row" style={style}>
          <div>{i + offset + 1}</div>
          <TableNodeDefCols nodeDefCols={nodeDefCols} row={row}/>
        </div>
      )
    }
  </div>
)

const TableBody = ({nodeDefCols, colNames, data, offset, lang}) => {
  const noDefCols = colNames.length
  const style = {gridTemplateColumns: `100px repeat(${noDefCols}, ${1 / noDefCols}fr)`}

  return (
    <React.Fragment>

      <div className="table__row-header" style={style}>
        <div>Row #</div>
        <TableNodeDefCols nodeDefCols={nodeDefCols} lang={lang}/>
      </div>

      <TableRows nodeDefCols={nodeDefCols} data={data}
                 style={style} offset={offset}/>


    </React.Fragment>
  )
}

class DataTable extends React.Component {

  componentWillUnmount () {
    this.props.resetDataTable()
  }

  render () {
    const {nodeDefCols, colNames, data, offset, limit, count, lang, updateDataTable} = this.props

    return R.isEmpty(data)
      ? null
      : (
        <div className="data-vis__data-table table">

          <div className="table__header">
            <div/>
            <TablePaginator offset={offset} limit={limit} count={count}
                            fetchFn={updateDataTable}/>
          </div>

          <TableBody nodeDefCols={nodeDefCols} colNames={colNames}
                     data={data} offset={offset}
                     lang={lang}/>

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
    count: DataVisState.getTableCount(state),
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
  }
}

export default connect(mapStateToProps, {updateDataTable, resetDataTable})(DataTable)