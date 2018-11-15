import React from 'react'

import './inviteUserDialog.scss'

import Dropdown from '../../../commonComponents/form/dropdown'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../commonComponents/modal'

export default class DeleteSurveyDialog extends React.Component {
  constructor(props) {
    super(props)

    this.state = { 
      email: '',
      group: '',
      enableInvite: false
    }
    this.emailChanged = this.emailChanged.bind(this)
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
    // TODO email autocomplete
    if (prevState.email !== this.state.email ||
        prevState.group !== this.state.group) {
      this.setState({enableInvite: this.state.email && this.state.group})
    }
  }

  emailChanged(event) {
    this.setState({email: event.target.value})
  }

  groupChanged(group) {
    this.setState({group: group.name})
  }

  render() {
    const { groups, onInvite, onCancel } = this.props

    return (
      <Modal isOpen={true}>
        <ModalHeader>
          <h5 className="user-invite-dialog__header">Invite user</h5>
        </ModalHeader>

        <ModalBody>
          <div className="user-invite-dialog__body">

            <div className="text-center">
              email:
            </div>
            <input className="email-input"
                   type="text"
                   value={this.state.email}
                   onChange={this.emailChanged}
                   ref={input => this.nameInput = input} />
            <div className="text-center">
              group:
            </div>
            <Dropdown disabled={false}
                      items={[{ id: 1, name: 'Dummy Group 1' }, { id: 2, name: 'Dummy Group 2' }, { id: 2, name: 'Dummy Group 3'}]}
                      itemKeyProp={i => i.id}
                      itemLabelFunction={i => i.name}
                      // validation={}
                      selection={null}
                      onChange={group => this.groupChanged(group)} />
          </div>
        </ModalBody>

        <ModalFooter>
          <div>
            <button className="btn btn-of modal-footer__item"
              onClick={onCancel}>
              <span className="icon icon-cross icon-14px icon-left" />
              Cancel
            </button>

            <button className="btn btn-of modal-footer__item"
              onClick={onInvite}
              aria-disabled={!this.state.enableInvite}>
              <span className="icon icon-user-plus icon-14px icon-left" />
              Invite
            </button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
}
