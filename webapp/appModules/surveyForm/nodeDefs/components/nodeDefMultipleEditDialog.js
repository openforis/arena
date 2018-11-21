import React from 'react'

import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../../commonComponents/modal'

const NodeDefMultipleEditDialog = props => {
  const {label, onClose, multipleNodeDefComponent} = props

  const MultipleNodeDefComponent = multipleNodeDefComponent

  return (
    <Modal isOpen={true}
           className="node-def__multiple-nodes-edit-modal"
           closeOnEsc={true}
           onClose={onClose}>
      <ModalHeader>{label}</ModalHeader>

      <ModalBody>
        <MultipleNodeDefComponent {...props}/>
      </ModalBody>

      <ModalFooter>
        <div>
          <button className="btn btn-of modal-footer__item"
                  onClick={onClose}>
            Close
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefMultipleEditDialog