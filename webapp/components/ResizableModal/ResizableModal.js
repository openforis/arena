import './ResizableModal.scss'

import { useI18n } from '@webapp/store/system'
import React from 'react'
import ReactModal from 'react-modal-resizable-draggable'

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
      <h3>{header}</h3>
      <div className="body">{children}</div>
    </ReactModal>
  )
}

ResizableModal.defaultProps = {
  initHeight: 400,
  initWidth: 600,
  isOpen: true,
}
