import React from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import { Modal, ModalBody } from '@webapp/components/modal'

export const CallEditorDialog = (props) => {
  const { children, functionName, nodeDef, onClose } = props

  return (
    <Modal
      onClose={onClose}
      title="nodeDefEdit.editingFunctionForNodeDefinition"
      titleParams={{ functionName, nodeDef: NodeDef.getName(nodeDef) }}
    >
      <ModalBody>{children}</ModalBody>
    </Modal>
  )
}
