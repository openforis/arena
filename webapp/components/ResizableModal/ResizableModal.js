import './ResizableModal.scss'

import React, { useEffect, useRef } from 'react'
import ReactModal from 'react-modal-resizable-draggable'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { Button, ButtonIconClose } from '../buttons'

export const ResizableModal = (props) => {
  const {
    children,
    className,
    header: headerProp,
    initHeight,
    initWidth,
    isOpen,
    left,
    onClose,
    onDetach,
    onRequestClose,
    top,
  } = props

  const modalRef = useRef(null)
  const i18n = useI18n()
  const header = typeof headerProp === 'string' ? i18n.t(headerProp) : headerProp

  useEffect(() => {
    if (!onClose) return

    const modal = modalRef.current

    return () => {
      onClose({ modalState: modal?.state })
    }
  }, [modalRef, onClose])

  return (
    <div className={classNames('resizable-modal', className)}>
      <ReactModal initHeight={initHeight} initWidth={initWidth} isOpen={isOpen} left={left} ref={modalRef} top={top}>
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
          {onRequestClose && <ButtonIconClose onClick={onRequestClose} />}
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
