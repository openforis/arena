import './modal.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import MuiModal from '@mui/material/Modal'
import Fade from '@mui/material/Fade'

import { TestId } from '@webapp/utils/testId'

export const ModalClose = ({ _children, onClose }) => (
  <div className="modal-close" onClick={() => onClose()}>
    <span className="icon icon-cross icon-20px" />
  </div>
)

export const ModalHeader = ({ children }) => <div className="modal-header">{children}</div>

export const ModalBody = ({ children }) => <div className="modal-body">{children}</div>

export const ModalFooter = ({ children }) => <div className="modal-footer">{children}</div>

export const Modal = (props) => {
  const { children, className, closeOnEsc, onClose: onCloseProp } = props

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
        <div className="modal-content">{children}</div>
      </Fade>
    </MuiModal>
  )
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  closeOnEsc: PropTypes.bool,
  onClose: PropTypes.func,
}

Modal.defaultProps = {
  className: '',
  closeOnEsc: true,
}
