import './HeaderLeft.scss'
import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'

import { useSurveyCycleKey, useSurveyCycleKeys, useSurveyInfo } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'

import { TestId } from '@webapp/utils/testId'

import { Button, ButtonDelete, ButtonDownload, ButtonIconEdit } from '@webapp/components'
import {
  useAuthCanDeleteRecords,
  useAuthCanExportRecordsList,
  useAuthCanUpdateRecordsStep,
} from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'

import { RecordsCloneModal as RecordsCloneModal } from '../../RecordsCloneModal'
import { UpdateRecordsStepDropdown } from './UpdateRecordsStepDropdown'

const HeaderLeft = ({ handleSearch, search, totalCount, onRecordsUpdate, selectedItems, navigateToRecord }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const cycle = useSurveyCycleKey()
  const cycles = useSurveyCycleKeys()

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const published = Survey.isPublished(surveyInfo)

  const canUpdateRecordsStep = useAuthCanUpdateRecordsStep()
  const canDeleteSelectedRecords = useAuthCanDeleteRecords(selectedItems)
  const canExportRecordsSummary = useAuthCanExportRecordsList()
  const canCloneRecords = cycles.length > 1 && cycle !== cycles[cycles.length - 1]

  const [state, setState] = useState({ recordsCloneModalOpen: false })
  const { recordsCloneModalOpen } = state

  const onSelectedRecordClick = useCallback(() => navigateToRecord(selectedItems[0]), [navigateToRecord, selectedItems])

  const toggleRecordsCloneModalOpen = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, recordsCloneModalOpen: !recordsCloneModalOpen }))
  }, [recordsCloneModalOpen])

  const onDeleteConfirm = useCallback(
    () => dispatch(RecordActions.deleteRecords({ records: selectedItems, onRecordsUpdate })),
    [dispatch, onRecordsUpdate, selectedItems]
  )

  const onDeleteButtonClick = useCallback(
    () =>
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataView.records.confirmDeleteSelectedRecord',
          params: { count: selectedItems.length },
          onOk: onDeleteConfirm,
        })
      ),
    [dispatch, selectedItems.length, onDeleteConfirm]
  )

  return (
    <div className="records__header-left">
      {published && (
        <Button
          testId={TestId.records.addBtn}
          onClick={() => dispatch(RecordActions.createRecord(navigate))}
          className="btn-s"
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
      {published && canUpdateRecordsStep && <UpdateRecordsStepDropdown onRecordsUpdate={onRecordsUpdate} />}
      {
        // Edit selected record
        selectedItems.length === 1 && (
          <ButtonIconEdit onClick={onSelectedRecordClick} title="dataView.editSelectedRecord" />
        )
      }
      {
        // Delete selected records
        canDeleteSelectedRecords && <ButtonDelete showLabel={false} onClick={onDeleteButtonClick} />
      }
      {canCloneRecords && (
        <Button iconClassName="icon-copy" label="dataView.records.clone" onClick={toggleRecordsCloneModalOpen} />
      )}
      {recordsCloneModalOpen && <RecordsCloneModal onClose={toggleRecordsCloneModalOpen} />}
      {canExportRecordsSummary && (
        <ButtonDownload
          testId={TestId.records.exportBtn}
          href={`/api/survey/${surveyId}/records/summary/export`}
          requestParams={{ cycle }}
          label="common.export"
        />
      )}
    </div>
  )
}

export default HeaderLeft
