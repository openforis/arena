import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from "react-router";

import { getSurvey } from '../../survey/surveyState'
import { deleteSurvey } from '../../survey/actions'

import {
  getSurveyName,
  getSurveyStatus,
  isSurveyDraft,
} from '../../../common/survey/survey'

import DeleteSurveyConfirmDialog from './deleteSurveyConfirmDialog';

class SurveyInfoView extends React.Component {

  constructor(props) {
    super(props)
    this.state = {showDialog: false}

    this.toggleDeleteConfirmDialog = this.toggleDeleteConfirmDialog.bind(this)
  }

  render () {
    const {survey} = this.props

    return (
      !survey ? (
        null
        // <Redirect to="/app/home/"/>
      ) : (
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

            <button className="btn btn-of-light" onClick={() => this.toggleDeleteConfirmDialog(true)}>
              <span className="icon icon-bin icon-16px icon-left"/> Delete
            </button>

            {this.state.showDialog &&
              <DeleteSurveyConfirmDialog show={this.state.showDialog}
                                         onCancel={() => this.toggleDeleteConfirmDialog(false)}
                                         onDelete={() => this.deleteSurvey(survey)}
                                         surveyName={survey.props.name}/>
            }
          </div>

        </div>
      )
    )
  }

  async deleteSurvey(survey) {
    await this.props.deleteSurvey(survey.id)

    this.toggleDeleteConfirmDialog(false)
    this.props.history.push('/app/home/')
  }

  toggleDeleteConfirmDialog(show) {
    this.setState({showDialog: show})
  }
}

SurveyInfoView.defaultProps = {
  survey: {}
}

const mapStateToProps = state => ({
  survey: getSurvey(state)
})

export default connect(mapStateToProps, {deleteSurvey})(SurveyInfoView)
