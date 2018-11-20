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

const RecordsTablePaginator = ({offset, limit, count}) => {
  const currentPage = (offset / limit) + 1
  const totalPage = Math.ceil(count / limit)

  return (
    <div className="table__paginator">

      <button className="btn btn-of-light"
              aria-disabled={count < limit || currentPage === 1}
              onClick={() => null}>
        <span className="icon icon-backward2 icon-16px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === 1}
              onClick={() => null}
              style={{transform: 'scaleX(-1)'}}>
        <span className="icon icon-play3 icon-16px"/>
      </button>

      <span className="page-count">
      Page {currentPage} of {totalPage}
      </span>

      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPage}
              onClick={() => null}>
        <span className="icon icon-play3 icon-16px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPage}
              onClick={() => null}>
        <span className="icon icon-forward3 icon-16px"/>
      </button>

    </div>
  )
}

const RecordRow = ({idx, record, style}) => (
  <div className="table__row" style={style}>
    <div>{idx + 1}</div>
    <div>{getRelativeDate(record.dateCreated)}</div>
    <div>{getRelativeDate(record.dateModified)}</div>
    <div>{record.ownerName}</div>
  </div>
)

const RecordsTable = ({records, offset, limit, count}) => {
  const style = {gridTemplateColumns: 'repeat(4, .25fr)'}

  return (
    <React.Fragment>
      <div className="table__row-header" style={style}>
        <div>Record #</div>
        <div>Date created</div>
        <div>Date Modified</div>
        <div>Owner</div>
      </div>

      <div className="table__rows">
        {
          records.map((record, i) =>
            <RecordRow key={i} idx={i} record={record} style={style}/>
          )
        }
      </div>

      <RecordsTablePaginator offset={offset} limit={limit} count={count}/>
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
            : <RecordsTable {...this.props}/>
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
