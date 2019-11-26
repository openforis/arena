import './validationReportView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import TableView from '@webapp/loggedin/tableViews/tableView'
import { useOnUpdate } from '@webapp/commonComponents/hooks'

import * as Record from '@core/record/record'

import { appModuleUri, dataModules } from '@webapp/loggedin/appModules'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as RecordsState from '@webapp/loggedin/modules/data/records/recordsState'

import { reloadListItems } from '@webapp/loggedin/tableViews/actions'

import ValidationReportRowHeader from './validationReportRowHeader'
import ValidationReportRow from './validationReportRow'

const validationReportModule = 'validationReport'

const ValidationReportView = ({ canInvite, user, survey, surveyCycleKey, reloadListItems, history }) => {
  useOnUpdate(() => {
    reloadListItems(validationReportModule, { cycle: surveyCycleKey })
  }, [surveyCycleKey])

  const onRowClick = record => {
    const parentEntityUuid = R.prop('nodeUuid', R.last(record.keysHierarchy))
    const recordUuid = Record.getUuid(record)
    const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?parentNodeUuid=${parentEntityUuid}`

    history.push(recordEditUrl)
  }

  const gridTemplateColumns = `70px 1fr 2fr 50px`

  const restParams = { cycle: surveyCycleKey }

  return <TableView
    className='validation_report__table'
    module={validationReportModule}
    restParams={restParams}

    gridTemplateColumns={gridTemplateColumns}
    rowHeaderComponent={ValidationReportRowHeader}
    rowComponent={ValidationReportRow}

    canInvite={canInvite}
    user={user}
    survey={survey}

    onRowClick={onRowClick}
  />
}

const mapStateToProps = state => {
  return {
    user: AppState.getUser(state),
    survey: SurveyState.getSurvey(state),
    nodeDefKeys: RecordsState.getNodeDefKeys(state),
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  }
}

export default connect(mapStateToProps, { reloadListItems })(ValidationReportView)
