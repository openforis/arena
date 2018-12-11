import './recordsView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as R from 'ramda'
import camelize from 'camelize'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

import { appModuleUri } from '../../../appModules'
import { dataModules } from '../../dataModules'

import {
  getRecordsCount,
  getRecordsLimit,
  getRecordsList,
  getRecordsNodeDefKeys,
  getRecordsOffset
} from '../recordsState'
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
        <span className="icon icon-backward2 icon-14px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === 1}
              onClick={() => fetchRecords(offset - limit)}
              style={{transform: 'scaleX(-1)'}}>
        <span className="icon icon-play3 icon-14px"/>
      </button>

      <span className="counts">
      {offset + 1}-{Math.min(offset + limit, count)} of {count}
      </span>

      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPage}
              onClick={() => fetchRecords(offset + limit)}>
        <span className="icon icon-play3 icon-14px"/>
      </button>
      <button className="btn btn-of-light"
              aria-disabled={currentPage === totalPage}
              onClick={() => fetchRecords((totalPage - 1) * limit)}>
        <span className="icon icon-forward3 icon-14px"/>
      </button>

    </div>
  )
}

const RecordRow = ({idx, offset, record, style, nodeDefKeys}) => (
  <div className="table__row" style={style}>
    <div>{idx + offset + 1}</div>
    {
      nodeDefKeys.map((n, i) =>
        <div key={i}>{record[camelize(NodeDef.getNodeDefName(n))]}</div>
      )
    }
    <div>{getRelativeDate(record.dateCreated)}</div>
    <div>{getRelativeDate(record.dateModified)}</div>
    <div>{record.ownerName}</div>
    <div>
      <Link to={appModuleUri(dataModules.record) + record.uuid} className="btn btn-s btn-of-light-xs">
        <span className="icon icon-pencil2 icon-12px"></span>
      </Link>
    </div>
  </div>
)

const RecordsTable = ({records, offset, nodeDefKeys, lang}) => {
  const noCols = 3 + nodeDefKeys.length

  const style = {gridTemplateColumns: `100px repeat(${noCols}, ${1 / noCols}fr) 50px`}

  return (
    <React.Fragment>
      <div className="table__row-header" style={style}>
        <div>Record #</div>
        {
          nodeDefKeys.map((k, i) => <div key={i}>{NodeDef.getNodeDefLabel(k, lang)}</div>)
        }
        <div>Date created</div>
        <div>Date Modified</div>
        <div>Owner</div>
      </div>

      <div className="table__rows">
        {
          records.map((record, i) =>
            <RecordRow key={i} idx={i} offset={offset} record={record} style={style} nodeDefKeys={nodeDefKeys}/>
          )
        }
      </div>

    </React.Fragment>
  )
}

class RecordsView extends React.Component {

  componentDidMount () {
    this.props.initRecordsList()
  }

  render () {

    const {
      surveyInfo, records,
      offset, limit, count,
      fetchRecords,
    } = this.props

    const hasRecords = !R.isEmpty(records)

    return (
      <div className="records table">

        <div className="table__header">
          {
            Survey.isPublished(surveyInfo)
              ? (
                <Link to={appModuleUri(dataModules.record)} className="btn btn-s btn-of">
                  <span className="icon icon-plus icon-12px icon-left"></span>
                  new
                </Link>
              )
              : <div/>
          }

          {
            hasRecords &&
            <RecordsTablePaginator offset={offset} limit={limit} count={count} fetchRecords={fetchRecords}/>
          }
        </div>

        {
          hasRecords
            ? <RecordsTable {...this.props}/>
            : <div className="table__empty-rows">No records added</div>
        }

      </div>
    )
  }

}

const mapStateToProps = state => {
  const surveyInfo = getStateSurveyInfo(state)
  return {
    surveyInfo,
    records: getRecordsList(state),
    nodeDefKeys: getRecordsNodeDefKeys(state),
    offset: getRecordsOffset(state),
    limit: getRecordsLimit(state),
    count: getRecordsCount(state),
    lang: Survey.getDefaultLanguage(surveyInfo)
  }
}

export default connect(mapStateToProps, {initRecordsList, fetchRecords})(RecordsView)
