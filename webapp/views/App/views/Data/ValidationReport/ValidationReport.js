import './ValidationReport.scss'

import React from 'react'
import { useNavigate, useParams } from 'react-router'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'

import Table from '@webapp/components/Table'

import RowHeader from './RowHeader'
import Row from './Row'
import { ButtonBack, ButtonDownload } from '@webapp/components/buttons'

const ValidationReport = () => {
  const navigate = useNavigate()
  const surveyId = useSurveyId()
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
        module="validationReport"
        restParams={restParams}
        gridTemplateColumns="70px 1fr 2fr 50px"
        rowHeaderComponent={RowHeader}
        rowComponent={Row}
        onRowClick={onRowClick}
      />
      <div className="footer">
        <div>{recordUuid && <ButtonBack />}</div>
        <ButtonDownload
          className="btn-csv-export"
          href={`/api/survey/${surveyId}/validationReport/csv`}
          requestParams={restParams}
          label="common.csvExport"
        />
        <div />
      </div>
    </div>
  )
}

export default ValidationReport
