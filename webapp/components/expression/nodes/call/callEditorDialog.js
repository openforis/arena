import React from 'react'
import PropTypes from 'prop-types'

import { Modal, ModalBody } from '@webapp/components/modal'

export const CallEditorDialog = (props) => {
  const { children, functionName, onClose } = props

  return (
    <Modal onClose={onClose} showCloseButton title="nodeDefEdit.editingFunction" titleParams={{ functionName }}>
      <ModalBody>{children}</ModalBody>
    </Modal>
  )
}

CallEditorDialog.propTypes = {
  children: PropTypes.node,
  functionName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}
