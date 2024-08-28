import './HeaderLeft.scss'
import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'
import { RecordActions, useRecord } from '@webapp/store/ui/record'

import { TestId } from '@webapp/utils/testId'

import { Button, ButtonDelete, ButtonDownload, ButtonIconEdit, ButtonIconView } from '@webapp/components'
import { useConfirmAsync } from '@webapp/components/hooks'
import {
  useAuthCanDeleteRecords,
  useAuthCanEditRecord,
  useAuthCanExportRecords,
  useAuthCanExportRecordsList,
  useAuthCanUpdateRecordsStep,
  useAuthCanUseAnalysis,
} from '@webapp/store/user/hooks'
import { useI18n } from '@webapp/store/system'

import { RecordsCloneModal } from '../../RecordsCloneModal'
import { RecordsDataExportModal } from './RecordsDataExportModal'
import { UpdateRecordsStepDropdown } from './UpdateRecordsStepDropdown'
import { RecordMergePreviewModal } from './RecordMergePreviewModal'
import { RecordKeyValuesExtractor } from '../recordKeyValuesExtractor'

const extractMergeSourceAndTargetRecordsFromSelectedRecords = ({ selectedItems }) => {
  // sort selected records by date modified; source record will be the newest one
  const sortedRecords = [...selectedItems].sort((summaryA, summaryB) => {
    const dateModifiedAString = Record.getDateModified(summaryA)
    const dateModifiedA = DateUtils.parseDateISO(dateModifiedAString)
    const dateModifiedBString = Record.getDateModified(summaryB)
    const dateModifiedB = DateUtils.parseDateISO(dateModifiedBString)
    return dateModifiedB.getTime() - dateModifiedA.getTime()
  })
  const [sourceRecord, targetRecord] = sortedRecords
  return { sourceRecord, targetRecord }
}

const HeaderLeft = ({ handleSearch, navigateToRecord, onRecordsUpdate, search, selectedItems, totalCount }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const confirm = useConfirmAsync()
  const record = useRecord()
  const lang = useSurveyPreferredLang()

  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const cycles = Survey.getCycleKeys(survey)
  const published = Survey.isPublished(surveyInfo)

  const canUpdateRecordsStep = useAuthCanUpdateRecordsStep()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const canDeleteSelectedRecords = useAuthCanDeleteRecords(selectedItems)
  const canExportRecordsSummary = useAuthCanExportRecordsList()
  const canExportRecordsData = useAuthCanExportRecords()
  const lastCycle = cycles[cycles.length - 1]
  const canCloneRecords = canAnalyzeRecords && cycles.length > 1 && cycle !== lastCycle

  const selectedItemsCount = selectedItems.length
  const selectedRecordsUuids = selectedItems.map((selectedItem) => selectedItem.uuid)
  const canEditSelectedItem = useAuthCanEditRecord(selectedItems[0])

  const [state, setState] = useState({
    recordsCloneModalOpen: false,
    recordsDataExportModalOpen: false,
    recordsMergePreviewModalOpen: false,
  })
  const { recordsCloneModalOpen, recordsDataExportModalOpen, recordsMergePreviewModalOpen } = state

  const onSelectedRecordClick = useCallback(() => navigateToRecord(selectedItems[0]), [navigateToRecord, selectedItems])

  const toggleRecordsCloneModalOpen = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, recordsCloneModalOpen: !recordsCloneModalOpen }))
  }, [recordsCloneModalOpen])

  const toggleRecordsDataExportModalOpen = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, recordsDataExportModalOpen: !recordsDataExportModalOpen }))
  }, [recordsDataExportModalOpen])

  const onDeleteConfirm = useCallback(
    () => dispatch(RecordActions.deleteRecords({ records: selectedItems, onRecordsUpdate })),
    [dispatch, onRecordsUpdate, selectedItems]
  )

  const onDeleteButtonClick = useCallback(async () => {
    if (await confirm({ key: 'dataView.records.confirmDeleteSelectedRecord', params: { count: selectedItemsCount } })) {
      onDeleteConfirm()
    }
  }, [confirm, selectedItemsCount, onDeleteConfirm])

  const onMergePreviewConfirm = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, recordsMergePreviewModalOpen: true }))
    const { sourceRecord, targetRecord } = extractMergeSourceAndTargetRecordsFromSelectedRecords({
      selectedItems,
    })
    dispatch(
      RecordActions.previewRecordsMerge({
        sourceRecordUuid: Record.getUuid(sourceRecord),
        targetRecordUuid: Record.getUuid(targetRecord),
      })
    )
  }, [dispatch, selectedItems])

  const mergeSelectedRecords = useCallback(async () => {
    const { sourceRecord, targetRecord } = extractMergeSourceAndTargetRecordsFromSelectedRecords({
      selectedItems,
    })
    const sourceRecordKeys = RecordKeyValuesExtractor.extractKeyValuesAndLabels({
      survey,
      record: sourceRecord,
      lang,
    })
    const sourceRecordModifiedDate = DateUtils.formatDateTimeDisplay(Record.getDateModified(sourceRecord))

    const targetRecordKeys = RecordKeyValuesExtractor.extractKeyValuesAndLabels({
      survey,
      record: targetRecord,
      lang,
    })
    const targetRecordModifiedDate = DateUtils.formatDateTimeDisplay(Record.getDateModified(targetRecord))

    if (
      await confirm({
        key: 'dataView.records.confirmMergeSelectedRecords',
        params: {
          sourceRecordKeys,
          sourceRecordModifiedDate,
          targetRecordKeys,
          targetRecordModifiedDate,
          count: selectedItemsCount,
        },
      })
    ) {
      onMergePreviewConfirm()
    }
  }, [confirm, lang, onMergePreviewConfirm, selectedItems, selectedItemsCount, survey])

  const closeMergePreviewModal = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, recordsMergePreviewModalOpen: false }))
  }, [])

  const onMergeConfirm = useCallback(() => {
    closeMergePreviewModal()
    const { sourceRecord, targetRecord } = extractMergeSourceAndTargetRecordsFromSelectedRecords({
      selectedItems,
    })
    dispatch(
      RecordActions.mergeRecords({
        sourceRecordUuid: Record.getUuid(sourceRecord),
        targetRecordUuid: Record.getUuid(targetRecord),
        onRecordsUpdate,
      })
    )
  }, [closeMergePreviewModal, dispatch, onRecordsUpdate, selectedItems])

  return (
    <div className="records__header-left">
      {published && (
        <Button
          testId={TestId.records.addBtn}
          onClick={() => dispatch(RecordActions.createRecord({ navigate }))}
          iconClassName="icon-plus icon-12px icon-left"
          label="common.new"
        />
      )}
      {(totalCount > 0 || StringUtils.isNotBlank(search)) && (
        <input
          className="records__header-left__input-search"
          placeholder={i18n.t('dataView.records.filterPlaceholder')}
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      )}
      {totalCount > 0 && (
        <>
          {canExportRecordsSummary && (
            <ButtonDownload
              testId={TestId.records.exportBtn}
              href={`/api/survey/${surveyId}/records/summary/export`}
              requestParams={{ cycle }}
              label="dataView.records.exportList"
            />
          )}
          {canExportRecordsData && (
            <ButtonDownload label="dataView.records.exportData" onClick={toggleRecordsDataExportModalOpen} />
          )}
          {published && canUpdateRecordsStep && selectedItemsCount > 0 && (
            <UpdateRecordsStepDropdown onRecordsUpdate={onRecordsUpdate} records={selectedItems} />
          )}
          {selectedItemsCount === 2 && canDeleteSelectedRecords && (
            <Button label="dataView.records.merge.label" onClick={mergeSelectedRecords} variant="outlined" />
          )}
          {
            // View/Edit selected record
            selectedItemsCount === 1 &&
              (canEditSelectedItem ? (
                <ButtonIconEdit
                  onClick={onSelectedRecordClick}
                  title="dataView.editSelectedRecord"
                  variant="contained"
                />
              ) : (
                <ButtonIconView
                  onClick={onSelectedRecordClick}
                  title="dataView.viewSelectedRecord"
                  variant="contained"
                />
              ))
          }
          {
            // Delete selected records
            canDeleteSelectedRecords && <ButtonDelete showLabel={false} onClick={onDeleteButtonClick} />
          }
          {canCloneRecords && (
            <Button iconClassName="icon-copy" label="dataView.records.clone" onClick={toggleRecordsCloneModalOpen} />
          )}
        </>
      )}

      {recordsCloneModalOpen && (
        <RecordsCloneModal onClose={toggleRecordsCloneModalOpen} selectedRecordsUuids={selectedRecordsUuids} />
      )}
      {recordsDataExportModalOpen && (
        <RecordsDataExportModal
          onClose={toggleRecordsDataExportModalOpen}
          recordUuids={selectedRecordsUuids}
          search={search}
        />
      )}
      {recordsMergePreviewModalOpen && record && (
        <RecordMergePreviewModal onConfirmClick={onMergeConfirm} onRequestClose={closeMergePreviewModal} />
      )}
    </div>
  )
}

HeaderLeft.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  navigateToRecord: PropTypes.func.isRequired,
  onRecordsUpdate: PropTypes.func.isRequired,
  search: PropTypes.string,
  selectedItems: PropTypes.array.isRequired,
  totalCount: PropTypes.number.isRequired,
}

export default HeaderLeft
