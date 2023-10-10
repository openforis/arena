import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
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

export const UpdateRecordsStepDropdown = ({ onRecordsUpdate, records }) => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const moveRecords = (key) => {
    const stepFrom = fromStepByKey[key]
    const stepTo = toStepByKey[key]
    const recordsToMove = records.filter((record) => Record.getStep(record) === RecordStep.getStepIdByName(stepFrom))
    const recordsToMoveUuids = recordsToMove.map(Record.getUuid)
    const count = recordsToMoveUuids.length

    const stepFromLabel = i18n.t(`surveyForm.step.${stepFrom}`)
    const stepToLabel = i18n.t(`surveyForm.step.${stepTo}`)

    if (count === 0) {
      dispatch(
        NotificationActions.showNotification({
          key: 'dataView.records.noSelectedRecordsInStep',
          params: { step: stepFromLabel },
        })
      )
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataView.records.confirmUpdateRecordsStep',
          params: {
            count,
            stepFrom: stepFromLabel,
            stepTo: stepToLabel,
          },
          onOk: async () => {
            dispatch(LoaderActions.showLoader())

            const { count } = await API.updateRecordsStep({
              surveyId,
              cycle,
              stepFrom: RecordStep.getStepIdByName(stepFrom),
              stepTo: RecordStep.getStepIdByName(stepTo),
              recordUuids: recordsToMoveUuids,
            })
            dispatch(LoaderActions.hideLoader())

            dispatch(NotificationActions.notifyInfo({ key: 'dataView.recordsUpdated', params: { count } }))

            onRecordsUpdate()
          },
        })
      )
    }
  }

  return (
    <Dropdown
      items={Object.values(updateTypes).map((key) => ({
        value: key,
        label: i18n.t(`dataView.records.${key}`),
      }))}
      onChange={(item) => moveRecords(item.value)}
      placeholder={i18n.t('dataView.records.updateRecordsStep')}
      searchable={false}
      selection={null}
    />
  )
}

UpdateRecordsStepDropdown.propTypes = {
  onRecordsUpdate: PropTypes.func.isRequired,
  records: PropTypes.array.isRequired,
}
