import React from 'react'
import { useDispatch } from 'react-redux'

import * as RecordStep from '@core/record/recordStep'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as API from '@webapp/service/api'

import Dropdown from '@webapp/components/form/Dropdown'

export const updateTypes = {
  promoteAllRecordsToCleansing: 'promoteAllRecordsToCleansing',
  promoteAllRecordsToAnalysis: 'promoteAllRecordsToAnalysis',
  demoteAllRecordsFromAnalysis: 'demoteAllRecordsFromAnalysis',
  demoteAllRecordsFromCleansing: 'demoteAllRecordsFromCleansing',
}

const fromStepByKey = {
  [updateTypes.promoteAllRecordsToCleansing]: RecordStep.stepNames.entry,
  [updateTypes.promoteAllRecordsToAnalysis]: RecordStep.stepNames.cleansing,
  [updateTypes.demoteAllRecordsFromAnalysis]: RecordStep.stepNames.analysis,
  [updateTypes.demoteAllRecordsFromCleansing]: RecordStep.stepNames.cleansing,
}

const toStepByKey = {
  [updateTypes.promoteAllRecordsToCleansing]: RecordStep.stepNames.cleansing,
  [updateTypes.promoteAllRecordsToAnalysis]: RecordStep.stepNames.analysis,
  [updateTypes.demoteAllRecordsFromAnalysis]: RecordStep.stepNames.cleansing,
  [updateTypes.demoteAllRecordsFromCleansing]: RecordStep.stepNames.entry,
}

export const UpdateRecordsStepDropdown = ({ keys, placeholder, onRecordsUpdate }) => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const onMoveAllRecords = (key) => {
    const stepFrom = fromStepByKey[key]
    const stepTo = toStepByKey[key]

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'dataView.records.confirmUpdateRecordsStep',
        params: { stepFrom: i18n.t(`surveyForm.step.${stepFrom}`), stepTo: i18n.t(`surveyForm.step.${stepTo}`) },
        onOk: async () => {
          dispatch(LoaderActions.showLoader())

          const { count } = await API.updateRecordsStep({
            surveyId,
            cycle,
            stepFrom: RecordStep.getStepIdByName(stepFrom),
            stepTo: RecordStep.getStepIdByName(stepTo),
          })
          dispatch(LoaderActions.hideLoader())

          dispatch(NotificationActions.notifyInfo({ key: 'dataView.recordsUpdated', params: { count } }))

          onRecordsUpdate()
        },
      })
    )
  }

  return (
    <Dropdown
      items={keys.map((key) => ({
        value: key,
        label: i18n.t(`dataView.records.${key}`),
      }))}
      onChange={(item) => onMoveAllRecords(item.value)}
      placeholder={i18n.t(placeholder)}
      searchable={false}
    />
  )
}
