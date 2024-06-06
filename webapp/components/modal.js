import './modal.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import MuiModal from '@mui/material/Modal'
import Fade from '@mui/material/Fade'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import { Button } from './buttons'

export const ModalClose = ({ onClose }) => (
  <Button className="modal-close" iconClassName="icon-cross icon-20px" onClick={onClose} variant="text" />
)

export const ModalHeader = ({ children }) => <div className="modal-header">{children}</div>

export const ModalBody = ({ children }) => <div className="modal-body">{children}</div>

export const ModalFooter = ({ children }) => <div className="modal-footer">{children}</div>

export const Modal = (props) => {
  const { children, className, closeOnEsc, onClose: onCloseProp, showCloseButton, title, titleParams } = props

  const i18n = useI18n()

  const onClose = useCallback(
    (event) => {
      onCloseProp?.(event)
    },
    [onCloseProp]
  )

  return (
    <MuiModal
      className={`modal ${className}`}
      data-testid={TestId.modal.modal}
      disableEscapeKeyDown={!closeOnEsc}
      onClose={onClose}
      open
    >
      <Fade in timeout={500}>
        <div className="modal-content">
          {(title || showCloseButton) && (
            <ModalHeader>
              {title && <span>{i18n.t(title, titleParams)}</span>}
              {showCloseButton && <ModalClose onClose={onClose} />}
            </ModalHeader>
          )}
          {children}
        </div>
      </Fade>
    </MuiModal>
  )
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  closeOnEsc: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  titleParams: PropTypes.object,
  showCloseButton: PropTypes.bool,
}

Modal.defaultProps = {
  className: '',
  closeOnEsc: true,
  showCloseButton: false,
}
