import './nodeDefMultipleEditDialog.scss'

import React from 'react'

import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../../../commonComponents/modal'
import { getNodeDefComponent } from '../nodeDefSystemProps'

const NodeDefMultipleEditDialog = props => {
  const { nodeDef, label, onClose } = props

  return (
    <Modal isOpen={true}
           className="survey-form__node-def-multiple-edit-dialog"
           closeOnEsc={true}
           onClose={onClose}>
      <ModalHeader>{label}</ModalHeader>

      <ModalBody>
        {
          React.createElement(getNodeDefComponent(nodeDef), { ...props })
        }
      </ModalBody>

      <ModalFooter>
        <div>
          <button className="btn modal-footer__item"
                  onClick={onClose}>
            Close
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefMultipleEditDialog