import './RecordsCloneModal.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import { RecordCycle } from '@core/record/recordCycle'

import { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader } from '@webapp/components/modal'
import { Button, RadioButtonGroup } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

const sources = {
  allRecords: 'allRecords',
  selectedRecords: 'selectedRecords',
}

export const RecordsCloneModal = (props) => {
  const { onClose, selectedRecordsUuids } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const cycleFrom = useSurveyCycleKey()

  const [state, setState] = useState({
    source: sources.allRecords,
    cycleTo: null,
  })

  const { cycleTo, source } = state

  const cycleFromLabel = RecordCycle.getLabel(cycleFrom)
  const cycleToLabel = RecordCycle.getLabel(cycleTo)

  const onCycleToChange = useCallback((value) => setState((statePrev) => ({ ...statePrev, cycleTo: value })), [])
  const onSourceChange = useCallback(
    (selectedSource) => setState((statePrev) => ({ ...statePrev, source: selectedSource })),
    []
  )

  const checkCanClone = () => {
    let errorKey = null
    if (Objects.isEmpty(cycleTo)) {
      errorKey = 'dataView.recordsClone.error.cycleToMissing'
    } else if (cycleFrom === cycleTo) {
      errorKey = 'dataView.recordsClone.error.cycleToMustBeDifferentFromCycleFrom'
    }
    if (errorKey) {
      dispatch(NotificationActions.notifyWarning({ key: errorKey }))
      return false
    }
    return true
  }

  const showCloneCompleteNotification = useCallback(
    ({ recordsCloned }) => {
      dispatch(
        NotificationActions.showNotification({
          key: 'dataView.recordsClone.cloneComplete',
          params: { recordsCloned, cycleFrom: cycleFromLabel, cycleTo: cycleToLabel },
        })
      )
    },
    [cycleFromLabel, cycleToLabel, dispatch]
  )

  const onCloneComplete = useCallback(
    (jobComplete) => {
      const { processed: recordsCloned } = jobComplete
      showCloneCompleteNotification({ recordsCloned })
      onClose()
    },
    [onClose, showCloneCompleteNotification]
  )

  const startCloneJob = useCallback(async () => {
    const recordsUuids = source === sources.selectedRecords ? selectedRecordsUuids : null
    const job = await API.startRecordsCloneJob({ surveyId, cycleFrom, cycleTo, recordsUuids })
    dispatch(JobActions.showJobMonitor({ job, onComplete: onCloneComplete }))
  }, [cycleFrom, cycleTo, dispatch, onCloneComplete, selectedRecordsUuids, source, surveyId])

  const onStartCloneClick = async () => {
    if (!checkCanClone()) return

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'dataView.recordsClone.confirmClone',
        params: { cycleFrom: cycleFromLabel, cycleTo: cycleToLabel },
        onOk: startCloneJob,
      })
    )
  }

  return (
    <Modal className="records-clone" onClose={onClose}>
      <ModalHeader>
        <span>{i18n.t('dataView.recordsClone.title')}</span>
        <ModalClose onClose={onClose} />
      </ModalHeader>
      <ModalBody>
        <FormItem label={i18n.t('dataView.recordsClone.fromCycle')}>{cycleFromLabel}</FormItem>
        <FormItem label={i18n.t('dataView.recordsClone.toCycle')}>
          <CycleSelector
            selectedCycle={cycleTo}
            onChange={onCycleToChange}
            filterFunction={(cycle) => cycle > cycleFrom}
          />
        </FormItem>
        <FormItem className="source-form-item" label={i18n.t('dataView.recordsClone.source.label')}>
          <RadioButtonGroup
            onChange={onSourceChange}
            value={source}
            items={[
              {
                key: sources.allRecords,
                label: `dataView.recordsClone.source.allRecords`,
                labelParams: { cycleFrom: cycleFromLabel, cycleTo: cycleToLabel },
              },
              {
                key: sources.selectedRecords,
                label: `dataView.recordsClone.source.selectedRecords`,
                labelParams: { selectedRecordsCount: selectedRecordsUuids.length },
                disabled: selectedRecordsUuids.length === 0,
              },
            ]}
          />
        </FormItem>
      </ModalBody>
      <ModalFooter>
        <Button className="modal-footer__item" onClick={onStartCloneClick} label="dataView.recordsClone.startCloning" />
      </ModalFooter>
    </Modal>
  )
}
