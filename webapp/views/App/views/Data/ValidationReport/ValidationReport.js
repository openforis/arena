import './ValidationReport.scss'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import {
  MessageTypeFilterCategoryIds,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import { RECORD_EDITS_APPLIED_EVENT } from '@webapp/ai/changeSets/recordEdits/types'
import { notifyValidationReportOpened } from '@webapp/ai/suggestions/notifyValidationReportOpened'
import { useCleaningAreaStatus } from '@webapp/components/ai/Assistant/cleaning/useCleaningArea'
import Table from '@webapp/components/Table'
import { ButtonBack } from '@webapp/components/buttons'

import RowHeader from './RowHeader'
import Row from './Row'
import { HeaderLeft } from './HeaderLeft'
import { useOnValueChange } from '@webapp/components/hooks'

const ValidationReport = () => {
  const navigate = useNavigate()
  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const { recordUuid } = useParams()
  // computed once for the report: the row action is shown on every row only when the Cleaning area is available
  const askAssistantAvailable = useCleaningAreaStatus().status === 'available'
  const rowProps = useMemo(() => ({ askAssistantAvailable }), [askAssistantAvailable])
  const [query, setQuery] = useState(null)
  const [selectedMessageTypeCategoryIds, setSelectedMessageTypeCategoryIds] = useState(MessageTypeFilterCategoryIds)

  const allAttributeDefUuids = useMemo(() => {
    const rootNodeDef = Survey.getNodeDefRoot(survey)
    if (!rootNodeDef) return []

    return Survey.getNodeDefDescendants({ nodeDef: rootNodeDef, cycle: surveyCycleKey })(survey)
      .filter((nodeDef) => NodeDef.isAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef))
      .map(NodeDef.getUuid)
  }, [survey, surveyCycleKey])

  const [selectedAttributeDefUuids, setSelectedAttributeDefUuids] = useState(allAttributeDefUuids)

  useOnValueChange(allAttributeDefUuids, setSelectedAttributeDefUuids)

  // the assistant counts the messages of the whole cycle itself (suggestion 7): only the cycle is passed, and only when
  // the Cleaning area is available (with AI off the report does not even tell the suggestions it opened)
  useEffect(() => {
    notifyValidationReportOpened({ cycle: surveyCycleKey, askAssistantAvailable })
  }, [surveyCycleKey, askAssistantAvailable])

  // an assistant Apply changed records: remount the table so it fetches the rows again
  const [reloadCount, setReloadCount] = useState(0)
  useEffect(() => {
    const onApplied = () => setReloadCount((count) => count + 1)
    window.addEventListener(RECORD_EDITS_APPLIED_EVENT, onApplied)
    return () => window.removeEventListener(RECORD_EDITS_APPLIED_EVENT, onApplied)
  }, [])

  const allAttributesSelected = useMemo(() => {
    if (allAttributeDefUuids.length === 0) return true
    if (selectedAttributeDefUuids.length !== allAttributeDefUuids.length) return false
    const selectedSet = new Set(selectedAttributeDefUuids)
    return allAttributeDefUuids.every((attributeDefUuid) => selectedSet.has(attributeDefUuid))
  }, [allAttributeDefUuids, selectedAttributeDefUuids])

  const allMessageTypesSelected = useMemo(() => {
    if (selectedMessageTypeCategoryIds.length !== MessageTypeFilterCategoryIds.length) return false
    const selectedSet = new Set(selectedMessageTypeCategoryIds)
    return MessageTypeFilterCategoryIds.every((categoryId) => selectedSet.has(categoryId))
  }, [selectedMessageTypeCategoryIds])

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
      ...(!allMessageTypesSelected
        ? {
            messageTypeKeys: JSON.stringify(expandMessageTypeFilterCategoriesToKeys(selectedMessageTypeCategoryIds)),
          }
        : {}),
      lang,
    }),
    [
      allAttributesSelected,
      allMessageTypesSelected,
      lang,
      query,
      recordUuid,
      selectedAttributeDefUuids,
      selectedMessageTypeCategoryIds,
      surveyCycleKey,
    ]
  )

  return (
    <div className="validation-report">
      <Table
        key={reloadCount}
        className="validation-report__table"
        headerLeftComponent={HeaderLeft}
        headerProps={{
          allAttributeDefUuids,
          onQueryChange: setQuery,
          onSelectedAttributeDefUuidsChange: setSelectedAttributeDefUuids,
          onSelectedMessageTypeCategoryIdsChange: setSelectedMessageTypeCategoryIds,
          query,
          restParams,
          selectedAttributeDefUuids,
          selectedMessageTypeCategoryIds,
        }}
        module="validationReport"
        restParams={restParams}
        gridTemplateColumns={askAssistantAvailable ? '50px 1fr 2fr 6rem 50px 50px' : '50px 1fr 2fr 6rem 50px'}
        rowHeaderComponent={RowHeader}
        rowComponent={Row}
        rowProps={rowProps}
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
