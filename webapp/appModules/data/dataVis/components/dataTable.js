import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'

import * as SurveyState from '../../../../survey/surveyState'
import * as DataVisState from '../dataVisState'

import { updateDataTable, resetDataTable } from '../actions'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

const TableRow = ({idx, offset, style, nodeDefCols, row}) => (
  <div className="table__row" style={style}>
    <div>{idx + offset + 1}</div>
    {
      nodeDefCols.map(nodeDef =>
        <div key={nodeDef.id}>
          {row[NodeDef.getNodeDefName(nodeDef)]}
        </div>
      )
    }
  </div>
)

const TableBody = ({nodeDefCols, data, offset, lang}) => {
  const noDefCols = nodeDefCols.length
  const style = {gridTemplateColumns: `100px repeat(${noDefCols}, ${1 / noDefCols}fr)`}

  return (
    <React.Fragment>
      <div className="table__row-header" style={style}>
        <div>Row #</div>
        {
          nodeDefCols.map(nodeDef =>
            <div key={nodeDef.id}>{NodeDef.getNodeDefLabel(nodeDef, lang)}</div>
          )
        }
      </div>

      <div className="table__rows">
        {
          data.map((row, i) =>
            <TableRow key={i} idx={i} style={style}
                      offset={offset} nodeDefCols={nodeDefCols}
                      row={row}/>
          )
        }
      </div>

    </React.Fragment>
  )
}

const TableHeader = ({offset, limit, count, fetchFn}) => (
  <div className="table__header">
    <div/>
    <TablePaginator offset={offset} limit={limit} count={count}
                    fetchFn={fetchFn}/>
  </div>
)

class DataTable extends React.Component {

  componentWillUnmount () {
    this.props.resetDataTable()
  }

  render () {
    const {nodeDefCols, data, offset, limit, count, lang, updateDataTable} = this.props

    return R.isEmpty(data)
      ? null
      : (
        <div className="data-vis__data-table table">

          <TableHeader offset={offset} limit={limit} count={count}
                       fetchFn={updateDataTable}/>

          <TableBody nodeDefCols={nodeDefCols} data={data} offset={offset} lang={lang}/>

        </div>
      )
  }

}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  return {
    nodeDefCols: Survey.getNodeDefsByUuids(DataVisState.getTableNodeDefUuidCols(state))(survey),
    data: DataVisState.getTableData(state),
    offset: DataVisState.getTableOffset(state),
    limit: DataVisState.getTableLimit(state),
    count: DataVisState.getTableCount(state),
    lang: Survey.getDefaultLanguage(Survey.getSurveyInfo(survey)),
  }
}

export default connect(mapStateToProps, {updateDataTable, resetDataTable})(DataTable)