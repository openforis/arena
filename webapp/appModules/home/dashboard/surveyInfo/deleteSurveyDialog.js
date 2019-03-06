import './deleteSurveyDialog.scss'

import React from 'react'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../../commonComponents/modal'

export default class DeleteSurveyDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = {confirmName: ''}
    this.confirmNameOnChange = this.confirmNameOnChange.bind(this)
    this.confirmNameRef = React.createRef()
  }

  componentDidMount () {
    this.setState({confirmName: ''})
    this.confirmNameRef.current.focus()
  }

  confirmNameOnChange (event) {
    this.setState({confirmName: event.target.value})
  }

  render () {
    const {surveyName, onDelete, onCancel} = this.props

    return (
      <Modal isOpen={true} onClose={() => onCancel()}>
        <ModalHeader>
          <h5 className="survey-delete-dialog__header">Are you sure you want to delete this survey?</h5>
        </ModalHeader>

        <ModalBody>
          <div className="survey-delete-dialog__body">
            <div className="highlight">
              <div>Deleting the <b>{surveyName}</b> survey will delete all of its data.</div>
              <div>This operation cannot be undone!</div>
            </div>

            <div className="text-center">
              Enter this survey’s name to confirm:
            </div>

            <input type="text"
                   className="confirm-name"
                   value={this.state.confirmName}
                   onChange={this.confirmNameOnChange}
                   ref={this.confirmNameRef}/>
          </div>
        </ModalBody>

        <ModalFooter>
          <div>
            <button className="btn btn-of modal-footer__item"
                    onClick={onCancel}
                    aria-disabled={false}>
              <span className="icon icon-cross icon-12px icon-left"/>
              Cancel
            </button>

            <button className="btn btn-of btn-danger modal-footer__item"
                    onClick={onDelete}
                    aria-disabled={!(surveyName === this.state.confirmName)}>
              <span className="icon icon-bin icon-12px icon-left"/>
              Delete
            </button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
}
