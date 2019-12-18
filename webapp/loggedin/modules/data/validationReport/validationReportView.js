import './validationReportView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'

import TableView from '@webapp/loggedin/tableViews/tableView'
import { appModuleUri, dataModules } from '@webapp/loggedin/appModules'

import { useOnUpdate } from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'

import { reloadListItems } from '@webapp/loggedin/tableViews/actions'

import ValidationReportRowHeader from './validationReportRowHeader'
import ValidationReportRow from './validationReportRow'

const validationReportModule = 'validationReport'

const ValidationReportView = props => {
  const { surveyCycleKey, reloadListItems, history } = props

  useOnUpdate(() => {
    reloadListItems(validationReportModule, { cycle: surveyCycleKey })
  }, [surveyCycleKey])

  const onRowClick = row => {
    const pageNodeUuid = RecordValidationReportItem.getNodeContextUuid(row)
    const pageNodeDefUuid = RecordValidationReportItem.getNodeDefContextUuid(row)
    const recordUuid = RecordValidationReportItem.getRecordUuid(row)
    const recordEditUrl = `${appModuleUri(
      dataModules.record,
    )}${recordUuid}?pageNodeUuid=${pageNodeUuid}&pageNodeDefUuid=${pageNodeDefUuid}`

    history.push(recordEditUrl)
  }

  const gridTemplateColumns = `70px 1fr 2fr 50px`

  const restParams = { cycle: surveyCycleKey }

  return (
    <TableView
      className="validation-report__table"
      module={validationReportModule}
      restParams={restParams}
      gridTemplateColumns={gridTemplateColumns}
      rowHeaderComponent={ValidationReportRowHeader}
      rowComponent={ValidationReportRow}
      onRowClick={onRowClick}
    />
  )
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps, { reloadListItems })(ValidationReportView)
