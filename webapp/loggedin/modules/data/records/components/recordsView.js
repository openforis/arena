import './recordsView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import * as R from 'ramda'
import camelize from 'camelize'

import TablePaginator from '../../../../../commonComponents/table/tablePaginator'
import ErrorBadge from '../../../../../commonComponents/errorBadge'
import useI18n from '../../../../../commonComponents/useI18n'

import Survey from '../../../../../../common/survey/survey'
import NodeDef from '../../../../../../common/survey/nodeDef'
import AuthManager from '../../../../../../common/auth/authManager'
import Validator from '../../../../../../common/validation/validator'

import { appModuleUri, dataModules } from '../../../../appModules'

import { getRelativeDate } from '../../../../../../common/dateUtils'

import { initRecordsList, fetchRecords } from '../actions'
import { createRecord } from '../../../../surveyViews/record/actions'

import * as UserState from '../../../../../app/appState'
import * as RecordsState from '../recordsState'
import * as SurveyState from '../../../../../survey/surveyState'

const RecordRow = ({ idx, offset, record, style, nodeDefKeys, canEdit }) => (
  <div className="table__row" style={style}>
    <div>
      <ErrorBadge validation={Validator.getValidation(record)} showLabel={false}/>
      {idx + offset + 1}
    </div>
    {
      nodeDefKeys.map((n, i) =>
        <div key={i}>{record[camelize(NodeDef.getName(n))]}</div>
      )
    }
    <div>{getRelativeDate(record.dateCreated)}</div>
    <div>{getRelativeDate(record.dateModified)}</div>
    <div>{record.ownerName}</div>
    <div>{record.step}</div>
    <div>
      <Link to={appModuleUri(dataModules.record) + record.uuid} className="btn-edit">
        <span className={`icon icon-12px ${canEdit ? 'icon-pencil2' : 'icon-eye'}`}/>
      </Link>
    </div>
  </div>
)

const RecordsTable = ({ user, surveyInfo, records, offset, nodeDefKeys }) => {
  const noCols = 3 + nodeDefKeys.length

  const style = { gridTemplateColumns: `70px repeat(${noCols}, ${1 / noCols}fr) 50px 50px` }

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  return (
    <React.Fragment>
      <div className="table__row-header" style={style}>
        <div>#</div>
        {
          nodeDefKeys.map((k, i) => <div key={i}>{NodeDef.getLabel(k, lang)}</div>)
        }
        <div>{i18n.t('common.dateCreated')}</div>
        <div>{i18n.t('common.dateLastModified')}</div>
        <div>{i18n.t('data.records.owner')}</div>
        <div>{i18n.t('data.records.step')}</div>
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
                       canEdit={Survey.isPublished(surveyInfo) && AuthManager.canEditRecord(user, record)}/>
          )
        }
      </div>

    </React.Fragment>
  )
}

const RecordsView = props => {

  const {
    surveyInfo, records,
    offset, limit, count,
    fetchRecords, createRecord, history,
  } = props

  useEffect(() => {
    const { initRecordsList } = props

    if (Survey.isPublished(surveyInfo) || Survey.isFromCollect(surveyInfo))
      initRecordsList()
  }, [Survey.getUuid(surveyInfo)])

  const hasRecords = !R.isEmpty(records)

  const i18n = useI18n()

  return (
    <div className="records table">

      <div className="table__header">
        {
          Survey.isPublished(surveyInfo)
            ? (
              <button onClick={() => createRecord(history)} className="btn btn-s">
                <span className="icon icon-plus icon-12px icon-left"/>
                {i18n.t('common.new')}
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
          ? <RecordsTable {...props}/>
          : <div className="table__empty-rows">{i18n.t('data.records.noRecordsAdded')}</div>
      }

    </div>
  )
}

const mapStateToProps = state => {
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    user: UserState.getUser(state),
    surveyInfo,
    records: RecordsState.getRecordsList(state),
    nodeDefKeys: RecordsState.getRecordsNodeDefKeys(state),
    offset: RecordsState.getRecordsOffset(state),
    limit: RecordsState.getRecordsLimit(state),
    count: RecordsState.getRecordsCount(state),
  }
}

export default connect(
  mapStateToProps,
  {
    initRecordsList,
    fetchRecords,
    createRecord,
  }
)(RecordsView)
