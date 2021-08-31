import './HeaderLeft.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as RecordStep from '@core/record/recordStep'

import { useI18n } from '@webapp/store/system'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'
import { DialogConfirmActions } from '@webapp/store/ui'

import * as API from '@webapp/service/api'

import { DataTestId } from '@webapp/utils/dataTestId'

import { Button } from '@webapp/components'
import Dropdown from '@webapp/components/form/Dropdown'

const keys = {
  promoteAllRecordsToCleansing: 'promoteAllRecordsToCleansing',
  promoteAllRecordsToAnalysis: 'promoteAllRecordsToAnalysis',
  demoteAllRecordsFromAnalysis: 'demoteAllRecordsFromAnalysis',
  demoteAllRecordsFromCleansing: 'demoteAllRecordsFromCleansing',
}

const fromStepByKey = {
  [keys.promoteAllRecordsToCleansing]: RecordStep.stepNames.entry,
  [keys.promoteAllRecordsToAnalysis]: RecordStep.stepNames.cleansing,
  [keys.demoteAllRecordsFromAnalysis]: RecordStep.stepNames.analysis,
  [keys.demoteAllRecordsFromCleansing]: RecordStep.stepNames.cleansing,
}

const toStepByKey = {
  [keys.promoteAllRecordsToCleansing]: RecordStep.stepNames.cleansing,
  [keys.promoteAllRecordsToAnalysis]: RecordStep.stepNames.analysis,
  [keys.demoteAllRecordsFromAnalysis]: RecordStep.stepNames.cleansing,
  [keys.demoteAllRecordsFromCleansing]: RecordStep.stepNames.entry,
}

const UpdateRecordsStepDropdown = ({ keys, placeholder }) => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const onMoveAllRecords = (key) => {
    const stepFrom = fromStepByKey[key]
    const stepTo = toStepByKey[key]

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'dataView.confirmUpdateRecordsStep',
        params: { stepFrom: i18n.t(`surveyForm.step.${stepFrom}`), stepTo: i18n.t(`surveyForm.step.${stepTo}`) },
        onOk: async () =>
          API.updateRecordsStep({
            surveyId,
            stepFrom: RecordStep.getStepIdByName(stepFrom),
            stepTo: RecordStep.getStepIdByName(stepTo),
          }),
      })
    )
  }

  return (
    <Dropdown
      items={keys.map((key) => ({
        key,
        value: i18n.t(`dataView.${key}`),
      }))}
      placeholder={i18n.t(placeholder)}
      onChange={(item) => onMoveAllRecords(item.key)}
    />
  )
}

const HeaderLeft = ({ handleSearch, search, totalCount }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyInfo = useSurveyInfo()

  if (!Survey.isPublished(surveyInfo)) return <div />

  return (
    <div className="records__header-left">
      <Button
        testId={DataTestId.records.addBtn}
        onClick={() => dispatch(RecordActions.createRecord(history))}
        className="btn-s"
        iconClassName="icon-plus icon-12px icon-left"
        label="common.new"
      />

      {totalCount > 0 && (
        <input
          className="records__header-left__input-search"
          placeholder="search..."
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      )}

      <UpdateRecordsStepDropdown
        keys={[keys.promoteAllRecordsToCleansing, keys.promoteAllRecordsToAnalysis]}
        placeholder="dataView.promoteAllRecords"
      />

      <UpdateRecordsStepDropdown
        keys={[keys.demoteAllRecordsFromAnalysis, keys.demoteAllRecordsFromCleansing]}
        placeholder="dataView.demoteAllRecords"
      />
    </div>
  )
}

export default HeaderLeft
