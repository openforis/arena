import './records.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as R from 'ramda'

import { appModuleUri } from '../../../appModules'
import { dataModules } from '../../dataModules'

import { initRecordsList } from '../actions'
import { getRecordsCount, getRecordsLimit, getRecordsList, getRecordsOffset } from '../recordsState'
import { getRelativeDate } from '../../../../appUtils/dateUtils'

const RecordRow = ({idx, record, style}) => (
  <div className="table__row" style={style}>
    <div>{idx + 1}</div>
    <div>{getRelativeDate(record.date_created)}</div>
  </div>
)

const RecordsRows = ({records, style}) => (
  <div className="table__rows">
    {
      records.map((record, i) =>
        <RecordRow key={i} idx={i} record={record} style={style}/>
      )
    }
  </div>
)

const RecordsTable = ({records}) => {
  const style = {gridTemplateColumns: '.5fr .5fr'}

  return (
    <React.Fragment>
      <div className="table__row-header" style={style}>
        <div>Row #</div>
        <div>Date created</div>
      </div>

      <RecordsRows records={records} style={style}/>
    </React.Fragment>
  )
}

class Records extends React.Component {

  componentDidMount () {
    this.props.initRecordsList()
  }

  render () {

    const {records} = this.props

    return (
      <div className="records table">

        <div className="table__header">
          <h5>Records</h5>
          <Link to={appModuleUri(dataModules.record)} className="btn btn-s btn-of records__btn-add-record">
            <span className="icon icon-plus icon-12px icon-left"></span>
            new
          </Link>
        </div>

        {
          R.isEmpty(records)
            ? <div className="table__empty-rows">No records added</div>
            : <RecordsTable records={records}/>
        }

      </div>
    )
  }

}

const mapStateToProps = state => ({
  records: getRecordsList(state),
  offset: getRecordsOffset(state),
  limit: getRecordsLimit(state),
  count: getRecordsCount(state),
})

export default connect(mapStateToProps, {initRecordsList})(Records)
