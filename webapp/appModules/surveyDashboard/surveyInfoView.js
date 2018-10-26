import React from 'react'
import { connect } from 'react-redux'

import { getSurvey } from '../../survey/surveyState'
import { deleteSurvey } from '../../survey/actions'

import {
  getSurveyName,
  getSurveyStatus,
  isSurveyDraft,
} from '../../../common/survey/survey'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../commonComponents/modal'

class DeleteConfirmDialog extends React.Component {
  constructor(props) {
    super(props)

    this.state = {confirmName: ''}
    this.confirmNameChanged = this.confirmNameChanged.bind(this)
  }

  componentDidUpdate(prevProps) {
    if (this.props.show && !prevProps.show) {
      this.setState({confirmName: ''})
      this.nameInput.focus()
    }
  }

  confirmNameChanged(event) {
    this.setState({confirmName: event.target.value})
  }

  render() {
    const {show, surveyName, onDelete, onCancel} = this.props

    return (
      <Modal isOpen={show}>
        <ModalHeader>
          <h1>WARNING</h1>
        </ModalHeader>

        <ModalBody>
          <p>
            If you delete this survey all of its records will also be deleted.
          </p>
          <p>
            If you really wish to proceed, please write the name of this survey (<i>{surveyName}</i>) below:
          </p>
          <label>
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

class SurveyInfoView extends React.Component {

  constructor(props) {
    super(props)
    this.state = {showDialog: false}

    this.showDeleteConfirmDialog = this.showDeleteConfirmDialog.bind(this)
    this.hideDeleteConfirmDialog = this.hideDeleteConfirmDialog.bind(this)
  }

  render () {
    const {survey, deleteSurvey} = this.props
    return (
      <div className="app-dashboard__survey-info">

        <div className="survey-status">
          {
            isSurveyDraft(survey) &&
            <span className="icon icon-warning icon-12px icon-left"/>
          }

          {getSurveyStatus(survey)}
        </div>

        <h4 className="survey-name">

          {getSurveyName(survey)}
        </h4>

        <div className="button-bar">
          <button className="btn btn-of-light" aria-disabled={!isSurveyDraft(survey)}>
            <span className="icon icon-checkmark2 icon-16px icon-left"/> Publish
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-download3 icon-16px icon-left"/> Export
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-upload3 icon-16px icon-left"/> Import
          </button>

          <button className="btn btn-of-light" onClick={() => this.showDeleteConfirmDialog(survey)}>
            <span className="icon icon-bin icon-16px icon-left"/> Delete
          </button>

          <DeleteConfirmDialog show={this.state.showDialog}
                               onCancel={this.hideDeleteConfirmDialog}
                               onDelete={() => alert('cazzo')}
                               surveyName={survey.props.name} />
        </div>

      </div>
    )
  }


    // const createSurvey = surveyProps => async (dispatch, getState) => {
  // TODO
  showDeleteConfirmDialog(survey) {
    this.setState({
      showDialog: true
    })

    this.props.deleteSurvey(survey.id).then(
        () => alert('testtset')
    )
  }

  hideDeleteConfirmDialog() {
    this.setState({
      showDialog: false
    })
  }
}

SurveyInfoView.defaultProps = {
  survey: {}
}

const mapStateToProps = state => ({
  survey: getSurvey(state)
})

export default connect(mapStateToProps)(SurveyInfoView)
