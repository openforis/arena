import './nodeDefMultipleEditDialog.scss'

import React from 'react'

import { useI18n } from '../../../../../commonComponents/hooks'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../../../commonComponents/modal'

import {NodeDefUIProps} from '../internal'

export const NodeDefMultipleEditDialog = props => {
  const { nodeDef, label, onClose } = props

  const i18n = useI18n()

  return (
    <Modal isOpen={true}
           className="survey-form__node-def-multiple-edit-dialog"
           closeOnEsc={true}
           onClose={onClose}>
      <ModalHeader>{label}</ModalHeader>

      <ModalBody>
        {
          React.createElement(NodeDefUIProps.getComponent(nodeDef), { ...props })
        }
      </ModalBody>

      <ModalFooter>
        <div>
          <button className="btn modal-footer__item"
                  onClick={onClose}>
            {i18n.t('common.close')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefMultipleEditDialog
