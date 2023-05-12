import './ResizableModal.scss'

import { useI18n } from '@webapp/store/system'
import React from 'react'
import ReactModal from 'react-modal-resizable-draggable'
import { ButtonIconClose } from '../buttons'

export const ResizableModal = (props) => {
  const { children, className, initHeight, initWidth, isOpen, onClose, header: headerProp } = props
  const i18n = useI18n()
  const header = i18n.t(headerProp)

  return (
    <ReactModal
      initWidth={initWidth}
      initHeight={initHeight}
      className={className}
      onRequestClose={onClose}
      isOpen={isOpen}
    >
      <div className="resizable-modal__header">
        <h3>{header}</h3>
        <ButtonIconClose onClick={onClose} />
      </div>
      <div className="resizable-modal__body">{children}</div>
    </ReactModal>
  )
}

ResizableModal.defaultProps = {
  initHeight: 400,
  initWidth: 600,
  isOpen: true,
}
