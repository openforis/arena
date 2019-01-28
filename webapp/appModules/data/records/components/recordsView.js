import './recordsView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as R from 'ramda'
import camelize from 'camelize'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import AuthManager from '../../../../../common/auth/authManager'

import { appModuleUri } from '../../../appModules'
import { dataModules } from '../../dataModules'

import { getRelativeDate } from '../../../../../common/dateUtils'

import { initRecordsList, fetchRecords } from '../actions'
import { createRecord } from '../../../surveyForm/record/actions'

import * as UserState from '../../../../app/appState'
import * as RecordsState from '../recordsState'
import * as SurveyState from '../../../../survey/surveyState'

const RecordRow = ({ idx, offset, record, style, nodeDefKeys, canEdit }) => (
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
    <div>{record.step}</div>
    <div>
      <Link to={appModuleUri(dataModules.record) + record.uuid} className="btn btn-s btn-of-light-xs">
        <span className={`icon icon-12px ${canEdit ? 'icon-pencil2' : 'icon-eye'}`}></span>
      </Link>
    </div>
  </div>
)

const RecordsTable = ({ user, records, offset, nodeDefKeys, lang }) => {
  const noCols = 3 + nodeDefKeys.length

  const style = { gridTemplateColumns: `70px repeat(${noCols}, ${1 / noCols}fr) 50px 50px` }

  return (
    <React.Fragment>
      <div className="table__row-header" style={style}>
        <div>Row #</div>
        {
          nodeDefKeys.map((k, i) => <div key={i}>{NodeDef.getNodeDefLabel(k, lang)}</div>)
        }
        <div>Date created</div>
        <div>Date Modified</div>
        <div>Owner</div>
        <div>Step</div>
      </div>

      <div className="table__rows">
        {
          records.map((record, i) =>
            <RecordRow key={i}
                       idx={i}
                       offset={offset}
                       record={record}
                       style={style}
                       nodeDefKeys={nodeDefKeys}
                       canEdit={AuthManager.canEditRecord(user, record)}/>
          )
        }
      </div>

    </React.Fragment>
  )
}

class RecordsView extends React.Component {

  componentDidMount () {
    const { surveyInfo, initRecordsList } = this.props

    if (Survey.isPublished(surveyInfo))
      initRecordsList()
  }

  render () {

    const {
      surveyInfo, records,
      offset, limit, count,
      fetchRecords, createRecord, history
    } = this.props

    const hasRecords = !R.isEmpty(records)

    return (
      <div className="records table">

        <div className="table__header">
          {
            Survey.isPublished(surveyInfo)
              ? (
                <button onClick={() => createRecord(history)} className="btn btn-s btn-of">
                  <span className="icon icon-plus icon-12px icon-left"></span>
                  new
                </button>
              )
              : <div/>
          }

          {
            hasRecords &&
            <TablePaginator offset={offset} limit={limit} count={count}
                            fetchFn={fetchRecords}/>
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
  const surveyInfo = SurveyState.getStateSurveyInfo(state)

  return {
    user: UserState.getUser(state),
    surveyInfo,
    records: RecordsState.getRecordsList(state),
    nodeDefKeys: RecordsState.getRecordsNodeDefKeys(state),
    offset: RecordsState.getRecordsOffset(state),
    limit: RecordsState.getRecordsLimit(state),
    count: RecordsState.getRecordsCount(state),
    lang: Survey.getDefaultLanguage(surveyInfo)
  }
}

export default connect(
  mapStateToProps,
  {
    initRecordsList,
    fetchRecords,
    createRecord
  }
)(RecordsView)
