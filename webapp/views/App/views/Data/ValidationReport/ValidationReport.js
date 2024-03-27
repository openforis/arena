import './ValidationReport.scss'

import React from 'react'
import { useNavigate, useParams } from 'react-router'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { ButtonBack } from '@webapp/components/buttons'
import Table from '@webapp/components/Table'
import { useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import { HeaderLeft } from './HeaderLeft'
import Row from './Row'
import RowHeader from './RowHeader'

const ValidationReport = () => {
  const navigate = useNavigate()
  const surveyCycleKey = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const { recordUuid } = useParams()

  const onRowClick = (row) => {
    const pageNodeUuid = RecordValidationReportItem.getNodeContextUuid(row)
    const pageNodeDefUuid = RecordValidationReportItem.getNodeDefContextUuid(row)
    const recordUuid = RecordValidationReportItem.getRecordUuid(row)
    const recordEditUrl = `${appModuleUri(
      dataModules.record
    )}${recordUuid}?pageNodeUuid=${pageNodeUuid}&pageNodeDefUuid=${pageNodeDefUuid}`

    navigate(recordEditUrl)
  }

  const restParams = { cycle: surveyCycleKey, ...(recordUuid ? { recordUuid } : {}), lang }

  return (
    <div className="validation-report">
      <Table
        className="validation-report__table"
        headerLeftComponent={HeaderLeft}
        headerProps={{ restParams }}
        module="validationReport"
        restParams={restParams}
        gridTemplateColumns="70px 1fr 2fr 50px"
        rowHeaderComponent={RowHeader}
        rowComponent={Row}
        onRowClick={onRowClick}
      />
      {recordUuid && (
        <div className="footer">
          <ButtonBack />
        </div>
      )}
    </div>
  )
}

export default ValidationReport
