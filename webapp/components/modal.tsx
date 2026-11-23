import './modal.scss'

import { useCallback, useId } from 'react'
import PropTypes from 'prop-types'
import MuiModal from '@mui/material/Modal'
import Fade from '@mui/material/Fade'

import { TestId } from '@webapp/utils/testId'
import { useI18nT } from '@webapp/store/system'
import { Button } from './buttons'

export const ModalClose = ({ onClose }) => (
  <Button
    className="modal-close"
    iconClassName="icon-cross icon-20px"
    onClick={onClose}
    title="common.close"
    variant="text"
  />
)

ModalClose.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export const ModalHeader = ({ children }) => <div className="modal-header">{children}</div>

ModalHeader.propTypes = {
  children: PropTypes.node.isRequired,
}

export const ModalBody = ({ children }) => <div className="modal-body">{children}</div>

ModalBody.propTypes = {
  children: PropTypes.node.isRequired,
}

export const ModalFooter = ({ children }) => <div className="modal-footer">{children}</div>

ModalFooter.propTypes = {
  children: PropTypes.node.isRequired,
}

export const Modal = (props) => {
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

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  closeOnEsc: PropTypes.bool,
  onClose: PropTypes.func,
  // called with 'backdropClick' or 'escapeKeyDown' instead of onClose (to ask before closing)
  onDismiss: PropTypes.func,
  title: PropTypes.string,
  titleParams: PropTypes.object,
  showCloseButton: PropTypes.bool,
}
