import './nodeDefMultipleEditDialog.scss'

import React from 'react'

import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

import * as NodeDefUiProps from '../nodeDefUIProps'

const NodeDefMultipleEditDialog = (props) => {
  const { nodeDef, label, onClose } = props

  return (
    <Modal className="survey-form__node-def-multiple-edit-dialog" onClose={onClose} showCloseButton title={label}>
      <ModalBody>{React.createElement(NodeDefUiProps.getComponent(nodeDef), props)}</ModalBody>

      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.close" />
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefMultipleEditDialog
