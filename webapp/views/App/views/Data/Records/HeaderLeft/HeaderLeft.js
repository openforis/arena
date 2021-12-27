import './HeaderLeft.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'

import { useSurveyInfo } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'

import { TestId } from '@webapp/utils/testId'

import { Button, ButtonDelete } from '@webapp/components'
import { useAuthCanDeleteRecords, useAuthCanUpdateRecordsStep } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'

import { UpdateRecordsStepDropdown, updateTypes } from './UpdateRecordsStepDropdown'

const HeaderLeft = ({ handleSearch, search, totalCount, onRecordsUpdate, selectedItems }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  const published = Survey.isPublished(surveyInfo)

  const canUpdateRecordsStep = useAuthCanUpdateRecordsStep()
  const canDeleteSelectedRecords = useAuthCanDeleteRecords(selectedItems)

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
        <>
          <UpdateRecordsStepDropdown
            keys={[updateTypes.promoteAllRecordsToCleansing, updateTypes.promoteAllRecordsToAnalysis]}
            placeholder="dataView.promoteAllRecords"
            onRecordsUpdate={onRecordsUpdate}
          />

          <UpdateRecordsStepDropdown
            keys={[updateTypes.demoteAllRecordsFromAnalysis, updateTypes.demoteAllRecordsFromCleansing]}
            placeholder="dataView.demoteAllRecords"
            onRecordsUpdate={onRecordsUpdate}
          />
        </>
      )}

      {canDeleteSelectedRecords && (
        <ButtonDelete
          showLabel={false}
          onClick={() =>
            dispatch(
              DialogConfirmActions.showDialogConfirm({
                key: 'dataView.confirmDeleteSelectedRecords',
                params: { count: selectedItems.length },
                onOk: () => dispatch(RecordActions.deleteRecords({ records: selectedItems, onRecordsUpdate })),
              })
            )
          }
        />
      )}

      {}
    </div>
  )
}

export default HeaderLeft
