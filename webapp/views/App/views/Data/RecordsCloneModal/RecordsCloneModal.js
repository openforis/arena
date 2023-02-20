import './RecordsCloneModal.scss'

import React, { useState } from 'react'

import { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader } from '@webapp/components/modal'
import { Button } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { useSurveyCycleKey, useSurveyCycleKeys } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

export const RecordsCloneModal = (props) => {
  const { onClose } = props

  const i18n = useI18n()

  const currentCycle = useSurveyCycleKey()
  const surveyCycleKeys = useSurveyCycleKeys()
  const lastCycle = surveyCycleKeys[surveyCycleKeys.length - 1]

  const [state, setState] = useState({
    cycleFrom: currentCycle,
    cycleTo: lastCycle,
  })

  const { cycleFrom, cycleTo } = state

  const onCycleFromChange = (value) => setState((statePrev) => ({ ...statePrev, cycleFrom: value }))
  const onCycleToChange = (value) => setState((statePrev) => ({ ...statePrev, cycleTo: value }))
  const onStartCloneClick = () => {}

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
