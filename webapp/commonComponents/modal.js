import './modal.scss'

import React from 'react'

export const ModalClose = ({children, onClose}) =>
  <div className="modal-close" onClick={() => onClose()}>
    <span className="icon icon-cross icon-20px"/>
  </div>

export const ModalHeader = ({children}) =>
  <div className="modal-header">
    {children}
  </div>

export const ModalBody = ({children}) =>
  <div className="modal-body">
    {children}
  </div>

export const ModalFooter = ({children}) =>
  <div className="modal-footer">
    {children}
  </div>

export const Modal = ({children, isOpen}) =>
  <div className="modal"
       tabIndex="-1"
       role="dialog"
       style={{display: isOpen ? 'block' : 'none'}}>
    <div className="modal-content">
      {children}
    </div>
  </div>

