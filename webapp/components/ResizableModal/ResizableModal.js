import './ResizableModal.scss'

import React from 'react'
import ReactModal from 'react-modal-resizable-draggable'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button, ButtonIconClose } from '../buttons'

export const ResizableModal = (props) => {
  const { children, className, header: headerProp, initHeight, initWidth, isOpen, onClose, onDetach } = props

  const i18n = useI18n()
  const header = typeof headerProp === 'string' ? i18n.t(headerProp) : headerProp

  return (
    <div className={classNames('resizable-modal', className)}>
      <ReactModal initWidth={initWidth} initHeight={initHeight} onRequestClose={onClose} isOpen={isOpen}>
        <div className="resizable-modal__header">
          <h3>{header}</h3>
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
    </div>
  )
}

ResizableModal.defaultProps = {
  initHeight: 400,
  initWidth: 600,
  isOpen: true,
}
