import './nodeDefMultipleEditDialog.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@webapp/components/modal'

import * as NodeDefUiProps from '../nodeDefUIProps'

const NodeDefMultipleEditDialog = (props) => {
  const { nodeDef, label, onClose } = props

  const i18n = useI18n()

  return (
    <Modal isOpen={true} className="survey-form__node-def-multiple-edit-dialog" closeOnEsc={true} onClose={onClose}>
      <ModalHeader>{label}</ModalHeader>

      <ModalBody>{React.createElement(NodeDefUiProps.getComponent(nodeDef), props)}</ModalBody>

      <ModalFooter>
        <div>
          <button className="btn modal-footer__item" onClick={onClose}>
            {i18n.t('common.close')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefMultipleEditDialog
