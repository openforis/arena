import './HeaderLeft.scss'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'

import { useSurveyInfo } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'

import { TestId } from '@webapp/utils/testId'

import { Button, ButtonDelete, ButtonIconEdit } from '@webapp/components'
import { useAuthCanDeleteRecords, useAuthCanUpdateRecordsStep } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'

import { UpdateRecordsStepDropdown, updateTypes } from './UpdateRecordsStepDropdown'

const HeaderLeft = ({ handleSearch, search, totalCount, onRecordsUpdate, selectedItems, navigateToRecord }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  const published = Survey.isPublished(surveyInfo)

  const canUpdateRecordsStep = useAuthCanUpdateRecordsStep()
  const canDeleteSelectedRecords = useAuthCanDeleteRecords(selectedItems)

  const onSelectedRecordClick = useCallback(() => navigateToRecord(selectedItems[0]), [navigateToRecord, selectedItems])
  const onDeleteButtonClick = useCallback(
    () =>
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataView.records.confirmDeleteSelectedRecords',
          params: { count: selectedItems.length },
          onOk: () => dispatch(RecordActions.deleteRecords({ records: selectedItems, onRecordsUpdate })),
        })
      ),
    [dispatch, selectedItems, onRecordsUpdate]
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
          placeholder="search..."
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      )}

      {published && canUpdateRecordsStep && (
        <UpdateRecordsStepDropdown
          keys={[
            updateTypes.promoteAllRecordsToCleansing,
            updateTypes.promoteAllRecordsToAnalysis,
            updateTypes.demoteAllRecordsFromAnalysis,
            updateTypes.demoteAllRecordsFromCleansing,
          ]}
          placeholder="dataView.records.updateRecordsStep"
          onRecordsUpdate={onRecordsUpdate}
        />
      )}
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
    </div>
  )
}

export default HeaderLeft
