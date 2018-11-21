import './records.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'

import { appModuleUri } from '../../../appModules'
import { dataModules } from '../../dataModules'

import { getRecordsCount, getRecordsLimit, getRecordsList, getRecordsOffset } from '../recordsState'
import { getRelativeDate } from '../../../../appUtils/dateUtils'

import { initRecordsList, fetchRecords } from '../actions'
import { getStateSurveyInfo } from '../../../../survey/surveyState'

const RecordsTablePaginator = ({offset, limit, count, fetchRecords}) => {
  const currentPage = (offset / limit) + 1
  const totalPage = Math.ceil(count / limit)

  return (
    <div className="table__paginator">

      <button className="btn btn-of-light"
              aria-disabled={count < limit || currentPage === 1}
              onClick={() => fetchRecords(0)}>
        <span className="icon icon-backward2 icon-16px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === 1}
              onClick={() => fetchRecords(offset - limit)}
              style={{transform: 'scaleX(-1)'}}>
        <span className="icon icon-play3 icon-16px"/>
      </button>

      <span className="page-count">
      Page {currentPage} of {totalPage}
      </span>

      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPage}
              onClick={() => fetchRecords(offset + limit)}>
        <span className="icon icon-play3 icon-16px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPage}
              onClick={() => fetchRecords((totalPage - 1) * limit)}>
        <span className="icon icon-forward3 icon-16px"/>
      </button>

    </div>
  )
}

const RecordRow = ({idx, offset, record, style}) => (
  <div className="table__row" style={style}>
    <div>{idx + offset + 1}</div>
    <div>{getRelativeDate(record.dateCreated)}</div>
    <div>{getRelativeDate(record.dateModified)}</div>
    <div>{record.ownerName}</div>
  </div>
)

const RecordsTable = ({records, offset, limit, count, fetchRecords}) => {
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
            <RecordRow key={i} idx={i} offset={offset} record={record} style={style}/>
          )
        }
      </div>

      <RecordsTablePaginator offset={offset} limit={limit} count={count} fetchRecords={fetchRecords}/>
    </React.Fragment>
  )
}

class Records extends React.Component {

  componentDidMount () {
    this.props.initRecordsList()
  }

  render () {

    const {surveyInfo, records} = this.props

    return (
      <div className="records table">

        <div className="table__header">
          <h5>Records</h5>

          {
            Survey.isPublished(surveyInfo) &&
            <Link to={appModuleUri(dataModules.record)} className="btn btn-s btn-of records__btn-add-record">
              <span className="icon icon-plus icon-12px icon-left"></span>
              new
            </Link>
          }
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
  surveyInfo: getStateSurveyInfo(state),
  records: getRecordsList(state),
  offset: getRecordsOffset(state),
  limit: getRecordsLimit(state),
  count: getRecordsCount(state),
})

export default connect(mapStateToProps, {initRecordsList, fetchRecords})(Records)
