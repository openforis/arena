import './ValidationReport.scss'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import Table from '@webapp/components/Table'
import { ButtonBack } from '@webapp/components/buttons'

import RowHeader from './RowHeader'
import Row from './Row'
import { HeaderLeft } from './HeaderLeft'

const ValidationReport = () => {
  const navigate = useNavigate()
  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const { recordUuid } = useParams()
  const [query, setQuery] = useState(null)
  const [selectedAttributeDefUuids, setSelectedAttributeDefUuids] = useState([])

  const allAttributeDefUuids = useMemo(() => {
    const rootNodeDef = Survey.getNodeDefRoot(survey)
    if (!rootNodeDef) return []

    return Survey.getNodeDefDescendants({ nodeDef: rootNodeDef, cycle: surveyCycleKey })(survey)
      .filter((nodeDef) => NodeDef.isAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef))
      .map(NodeDef.getUuid)
  }, [survey, surveyCycleKey])

  useEffect(() => {
    setSelectedAttributeDefUuids(allAttributeDefUuids)
  }, [allAttributeDefUuids])

  const allAttributesSelected = useMemo(() => {
    if (allAttributeDefUuids.length === 0) return true
    if (selectedAttributeDefUuids.length !== allAttributeDefUuids.length) return false
    const selectedSet = new Set(selectedAttributeDefUuids)
    return allAttributeDefUuids.every((attributeDefUuid) => selectedSet.has(attributeDefUuid))
  }, [allAttributeDefUuids, selectedAttributeDefUuids])

  const onRowClick = (row) => {
    const pageNodeUuid = RecordValidationReportItem.getNodeContextUuid(row)
    const pageNodeDefUuid = RecordValidationReportItem.getNodeDefContextUuid(row)
    const recordUuid = RecordValidationReportItem.getRecordUuid(row)
    const recordEditUrl = `${appModuleUri(
      dataModules.record
    )}${recordUuid}?pageNodeUuid=${pageNodeUuid}&pageNodeDefUuid=${pageNodeDefUuid}`

    navigate(recordEditUrl)
  }

  const restParams = useMemo(
    () => ({
      cycle: surveyCycleKey,
      ...(recordUuid ? { recordUuid } : {}),
      ...(query ? { query: JSON.stringify(query) } : {}),
      ...(!allAttributesSelected ? { attributeDefUuids: JSON.stringify(selectedAttributeDefUuids) } : {}),
      lang,
    }),
    [allAttributesSelected, lang, query, recordUuid, selectedAttributeDefUuids, surveyCycleKey]
  )

  return (
    <div className="validation-report">
      <Table
        className="validation-report__table"
        headerLeftComponent={HeaderLeft}
        headerProps={{
          allAttributeDefUuids,
          onQueryChange: setQuery,
          onSelectedAttributeDefUuidsChange: setSelectedAttributeDefUuids,
          query,
          restParams,
          selectedAttributeDefUuids,
        }}
        module="validationReport"
        restParams={restParams}
        gridTemplateColumns="50px 1fr 2fr 6rem 50px"
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
