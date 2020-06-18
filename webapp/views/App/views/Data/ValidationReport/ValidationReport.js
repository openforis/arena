import './ValidationReport.scss'

import React from 'react'
import { useHistory } from 'react-router'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurveyCycleKey } from '@webapp/store/survey'

import Table from '@webapp/components/Table'

import RowHeader from './RowHeader'
import Row from './Row'

const ValidationReport = () => {
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

  const restParams = { cycle: surveyCycleKey }

  return (
    <Table
      className="validation-report__table"
      module="validationReport"
      restParams={restParams}
      gridTemplateColumns="70px 1fr 2fr 50px"
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      onRowClick={onRowClick}
    />
  )
}

export default ValidationReport
