import type React from 'react'

import { Modal, ModalBody } from '@webapp/components/modal'

type CallEditorDialogProps = {
  children?: React.ReactNode
  functionName: string
  onClose: (...args: any[]) => any
}

export const CallEditorDialog = (props: CallEditorDialogProps) => {
  const { children, functionName, onClose } = props

  return (
    <Modal onClose={onClose} showCloseButton title="nodeDefEdit:editingFunction" titleParams={{ functionName }}>
      <ModalBody>{children}</ModalBody>
    </Modal>
  )
}
