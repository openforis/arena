// import './inviteUserDialog.scss'

import React from 'react'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../commonComponents/modal'

export default class InviteUserDialog extends React.Component {
  constructor(props) {
    super(props)

    this.state = { 
      email: '',
      group: '',
      enableInvite: false
    }
    this.emailChanged = this.emailChanged.bind(this)
    this.groupChanged = this.groupChanged.bind(this)
  }

  componentDidMount() {
    this.setState({
      email: '',
      group: '',
      enableInvite: false
    })
    this.nameInput.focus()
  }

  componentDidUpdate(_, prevState) {
    // TODO check if email is valid
    if (prevState.email !== this.state.email ||
        prevState.group !== this.state.group) {
      this.setState({enableInvite: this.state.email && this.state.group})
    }
  }

  emailChanged(event) {
    this.setState({email: event.target.value})
  }

  groupChanged(event) {
    this.setState({group: event.target.value})
  }

  render() {
    const { groups, onInvite, onCancel } = this.props

    return (
      <Modal isOpen={true}>
        <ModalHeader>
          <h5 className="survey-delete-dialog__header">Invite user</h5>
        </ModalHeader>

        <ModalBody>
          <div className="survey-delete-dialog__body">

            <div>
              email:

              <input type="text"
                value={this.state.email}
                onChange={this.emailChanged}
                ref={input => this.nameInput = input} />
            </div>
            <div>
              group:

              <select value={this.state.group} onChange={this.groupChanged}>
                <option value="">Please select a group</option>
                <option value="1">Dummy group 1</option>
                <option value="2">Dummy group 2</option>
                <option value="3">Dummy group 3</option>
              </select>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div>
            <button className="btn btn-of modal-footer__item"
              onClick={onCancel}>
              <span className="icon icon-cross icon-12px icon-left" />
              Cancel
            </button>

            <button className="btn btn-of modal-footer__item"
              onClick={onInvite}
              aria-disabled={!this.state.enableInvite}>
              <span className="icon icon-bin icon-12px icon-left" />
              Invite
            </button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
}
