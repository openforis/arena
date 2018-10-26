import './deleteSurveyConfirmDialog.scss'

import React from 'react'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../commonComponents/modal'

export default class DeleteSurveyConfirmDialog extends React.Component {
  constructor(props) {
    super(props)

    this.state = {confirmName: ''}
    this.confirmNameChanged = this.confirmNameChanged.bind(this)
  }

  componentDidMount() {
    this.setState({confirmName: ''})
    this.nameInput.focus()
  }

  confirmNameChanged(event) {
    this.setState({confirmName: event.target.value})
  }

  render() {
    const { surveyName, onDelete, onCancel } = this.props

    return (
      <Modal isOpen={true}>
        <ModalHeader>
          <h2>Are you sure you want to delete this?</h2>
        </ModalHeader>

        <ModalBody>
          <p className="highlight">
            Deleting the <b>{surveyName}</b> survey will delete all of its data.
          </p>
          <p>
            Enter this survey’s name to confirm
          </p>
          <label class="confirm-name">
            Name:
            <input type="text"
                   value={this.state.confirmName}
                   onChange={this.confirmNameChanged}
                   ref={input => this.nameInput = input} />
          </label>
        </ModalBody>

        <ModalFooter>
          <button className="btn btn-of modal-footer__item"
                  onClick={onCancel}
                  aria-disabled={false}>
            Cancel
          </button>

          <button className="btn btn-of modal-footer__item"
                  onClick={onDelete}
                  aria-disabled={!(surveyName === this.state.confirmName)}>
            Delete!
          </button>
        </ModalFooter>
      </Modal>
    )
  }
}
