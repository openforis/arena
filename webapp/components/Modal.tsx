import './Modal.scss'

import { type ReactNode, useCallback, useId } from 'react'
import Fade from '@mui/material/Fade'
import MuiModal from '@mui/material/Modal'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { Button } from './buttons'

type ModalCloseProps = {
  onClose: (...args: any[]) => any
}

export const ModalClose = ({ onClose }: ModalCloseProps) => (
  <Button
    className="modal-close"
    iconName="close"
    iconSize={20}
    onClick={onClose}
    title="common.close"
    variant="text"
  />
)

type ModalHeaderProps = {
  children: ReactNode
}

export const ModalHeader = ({ children }: ModalHeaderProps) => <div className="modal-header">{children}</div>

type ModalBodyProps = {
  children: ReactNode
}

export const ModalBody = ({ children }: ModalBodyProps) => <div className="modal-body">{children}</div>

type ModalFooterProps = {
  children: ReactNode
}

export const ModalFooter = ({ children }: ModalFooterProps) => <div className="modal-footer">{children}</div>

type ModalProps = {
  children: ReactNode
  className?: string
  closeOnEsc?: boolean
  onClose?: (...args: any[]) => any
  // called with 'backdropClick' or 'escapeKeyDown' instead of onClose (to ask before closing)
  onDismiss?: (...args: any[]) => any
  title?: string
  titleParams?: Record<string, any>
  showCloseButton?: boolean
}

export const Modal = (props: ModalProps) => {
  const {
    children,
    className = '',
    closeOnEsc = true,
    onClose: onCloseProp,
    onDismiss,
    showCloseButton = false,
    title,
    titleParams,
  } = props

  const t = useI18nT()
  const titleId = useId()

  const onClose = useCallback(
    (event) => {
      onCloseProp?.(event)
    },
    [onCloseProp]
  )

  // a click on the backdrop or the Escape key: onDismiss(reason) when given, else onClose
  const onBackdropOrEscape = useCallback(
    (event, reason) => {
      // MUI 9 removed disableEscapeKeyDown: Escape is ignored here when closeOnEsc is false
      if (reason === 'escapeKeyDown' && !closeOnEsc) return
      if (onDismiss) onDismiss(reason)
      else onClose(event)
    },
    [closeOnEsc, onClose, onDismiss]
  )

  return (
    <MuiModal className={`modal ${className}`} data-testid={TestId.modal.modal} onClose={onBackdropOrEscape} open>
      <Fade in timeout={500}>
        {/* a native dialog shown open: MUI Modal handles the focus trap, the backdrop and Escape */}
        <dialog className="modal-content" open aria-modal="true" aria-labelledby={title ? titleId : undefined}>
          {(title || showCloseButton) && (
            <ModalHeader>
              {title && <span id={titleId}>{t(title, titleParams)}</span>}
              {showCloseButton && <ModalClose onClose={onClose} />}
            </ModalHeader>
          )}
          {children}
        </dialog>
      </Fade>
    </MuiModal>
  )
}
