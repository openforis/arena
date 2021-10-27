import './HeaderLeft.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'

import { useSurveyInfo } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'

import { TestId } from '@webapp/utils/testId'

import { Button } from '@webapp/components'
import { useAuthCanUpdateRecordsStep } from '@webapp/store/user/hooks'
import { UpdateRecordsStepDropdown, updateTypes } from './UpdateRecordsStepDropdown'

const HeaderLeft = ({ handleSearch, search, totalCount, onRecordsUpdate }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyInfo = useSurveyInfo()
  const published = Survey.isPublished(surveyInfo)

  const canUpdateRecordsStep = useAuthCanUpdateRecordsStep()

  return (
    <div className="records__header-left">
      {published && (
        <Button
          testId={TestId.records.addBtn}
          onClick={() => dispatch(RecordActions.createRecord(history))}
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
    </div>
  )
}

export default HeaderLeft
