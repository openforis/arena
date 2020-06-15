import './validationReportView.scss'
import React from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { SurveyState, useSurveyCycleKey } from '@webapp/store/survey'

import Table from '@webapp/components/Table'

import ValidationReportRowHeader from './validationReportRowHeader'
import ValidationReportRow from './validationReportRow'

const validationReportModule = 'validationReport'

const ValidationReportView = () => {
  const history = useHistory()
  const surveyCycleKey = useSurveyCycleKey()

  const onRowClick = (row) => {
    const pageNodeUuid = RecordValidationReportItem.getNodeContextUuid(row)
    const pageNodeDefUuid = RecordValidationReportItem.getNodeDefContextUuid(row)
    const recordUuid = RecordValidationReportItem.getRecordUuid(row)
    const recordEditUrl = `${appModuleUri(
      dataModules.record
    )}${recordUuid}?pageNodeUuid=${pageNodeUuid}&pageNodeDefUuid=${pageNodeDefUuid}`

    history.push(recordEditUrl)
  }

  const gridTemplateColumns = `70px 1fr 2fr 50px`

  const restParams = { cycle: surveyCycleKey }

  return (
    <Table
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

const mapStateToProps = (state) => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps)(ValidationReportView)
