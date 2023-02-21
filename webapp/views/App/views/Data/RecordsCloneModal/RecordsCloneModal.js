import './RecordsCloneModal.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader } from '@webapp/components/modal'
import { Button } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { Objects } from '@openforis/arena-core'

export const RecordsCloneModal = (props) => {
  const { onClose } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const surveyId = useSurveyId()

  const [state, setState] = useState({
    cycleFrom: null,
    cycleTo: null,
  })

  const { cycleFrom, cycleTo } = state

  const onCycleFromChange = (value) => setState((statePrev) => ({ ...statePrev, cycleFrom: value }))
  const onCycleToChange = (value) => setState((statePrev) => ({ ...statePrev, cycleTo: value }))

  const checkCanClone = () => {
    if (Objects.isEmpty(cycleFrom) || Objects.isEmpty(cycleTo)) {
      return false
    }
    if (cycleFrom === cycleTo) {
      return false
    }
    return true 
  }

  const onStartCloneClick = async () => {
    if (!checkCanClone()) return

    const job = await API.startRecordsCloneJob({ surveyId, cycleFrom, cycleTo })
    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: (jobComplete) => {
          console.log('complete')
        },
      })
    )
  }

  return (
    <Modal className="records-clone">
      <ModalHeader>
        <span>{i18n.t('dataView.recordsClone.title')}</span>
        <ModalClose onClose={onClose} />
      </ModalHeader>
      <ModalBody>
        <FormItem label={i18n.t('dataView.recordsClone.fromCycle')}>
          <CycleSelector surveyCycleKey={cycleFrom} onChange={onCycleFromChange} />
        </FormItem>
        <FormItem label={i18n.t('dataView.recordsClone.toCycle')}>
          <CycleSelector surveyCycleKey={cycleTo} onChange={onCycleToChange} />
        </FormItem>
      </ModalBody>
      <ModalFooter>
        <Button className="modal-footer__item" onClick={onStartCloneClick} label="dataView.recordsClone.startCloning" />
      </ModalFooter>
    </Modal>
  )
}
