import './ResizableModal.scss'

import { useI18n } from '@webapp/store/system'
import React from 'react'
import ReactModal from 'react-modal-resizable-draggable'
import { Button, ButtonIconClose } from '../buttons'

export const ResizableModal = (props) => {
  const { children, className, header: headerProp, initHeight, initWidth, isOpen, onClose, onDetach } = props

  const i18n = useI18n()

  return (
    <ReactModal
      initWidth={initWidth}
      initHeight={initHeight}
      className={className}
      onRequestClose={onClose}
      isOpen={isOpen}
    >
      <div className="resizable-modal__header">
        <h3>{i18n.t(headerProp)}</h3>
        {onDetach && (
          <Button
            className="btn-s detach-btn"
            iconClassName="icon-display icon-10px"
            onClick={onDetach}
            title="common.openInNewWindow"
          />
        )}
        {onClose && <ButtonIconClose onClick={onClose} />}
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
