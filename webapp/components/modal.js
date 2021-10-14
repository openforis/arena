import './modal.scss'
import React from 'react'
import * as R from 'ramda'

import { KeyboardMap } from '@webapp/utils/keyboardMap'
import { TestId } from '@webapp/utils/testId'

export const ModalClose = ({ _children, onClose }) => (
  <div className="modal-close" onClick={() => onClose()}>
    <span className="icon icon-cross icon-20px" />
  </div>
)

export const ModalHeader = ({ children }) => <div className="modal-header">{children}</div>

export const ModalBody = ({ children }) => <div className="modal-body">{children}</div>

export const ModalFooter = ({ children }) => <div className="modal-footer">{children}</div>

export class Modal extends React.Component {
  constructor(props) {
    super(props)

    this.state = { closed: false }
  }

  componentDidMount() {
    window.addEventListener('keydown', this)
    this.setState({ closed: false })
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this)
  }

  handleEvent(e) {
    const { onClose, closeOnEsc = true } = this.props

    if (e.type === 'keydown' && e.keyCode === KeyboardMap.Esc) {
      if (closeOnEsc && onClose) onClose()
    }
  }

  render() {
    const { children, isOpen = true, className = '' } = this.props

    return R.propEq('closed', true)(this.state) ? null : (
      <div
        className={`modal ${className}`}
        data-testid={TestId.modal.modal}
        tabIndex="-1"
        role="dialog"
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        <div className="modal-content">{children}</div>
      </div>
    )
  }
}
