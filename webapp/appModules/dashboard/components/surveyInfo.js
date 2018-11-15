import React from 'react'
import { connect } from 'react-redux'

import DeleteSurveyDialog from './deleteSurveyDialog'

import Survey from '../../../../common/survey/survey'

import { getStateSurveyInfo } from '../../../survey/surveyState'
import { deleteSurvey, publishSurvey } from '../../../survey/actions'
import { appModules } from '../../appModules'
import { appModuleUri } from '../../appModules'

class SurveyInfo extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showDialog: false
    }
  }

  toggleDeleteConfirmDialog (show) {
    this.setState({
      showDialog: show
    })
  }

  componentDidUpdate (prevProps) {
    const {surveyInfo, history} = this.props
    const {surveyInfo: prevSurveyInfo} = prevProps

    // redirecting when survey has been deleted
    if (Survey.isValid(prevSurveyInfo) && !Survey.isValid(surveyInfo)) {
      history.push(appModuleUri(appModules.home))
    }
  }

  render () {
    const {surveyInfo, deleteSurvey, publishSurvey} = this.props
    const {showDialog} = this.state

    return (
      <div className="app-dashboard__survey-info">

        <div className="survey-status">
          {
            Survey.isDraft(surveyInfo) &&
            <span className="icon icon-warning icon-12px icon-left"/>
          }

          {Survey.getStatus(surveyInfo)}
        </div>

        <h4 className="survey-name">
          {Survey.getName(surveyInfo)}
        </h4>

        <div className="button-bar">
          <button className="btn btn-of-light" aria-disabled={!Survey.isDraft(surveyInfo)}
                  onClick={() => window.confirm('Do you want to publish this survey? Some operation won\'t be allowed afterwards.')
                    ? publishSurvey()
                    : null}>
            <span className="icon icon-checkmark2 icon-16px icon-left"/> Publish
          </button>

          <button className="btn btn-of-light" aria-disabled={true}>
            <span className="icon icon-download3 icon-16px icon-left"/> Export
          </button>

          <button className="btn btn-of-light" aria-disabled={true}>
            <span className="icon icon-upload3 icon-16px icon-left"/> Import
          </button>

          <button className="btn btn-of-light" onClick={() => this.toggleDeleteConfirmDialog(true)}>
            <span className="icon icon-bin icon-16px icon-left"/> Delete
          </button>

          {showDialog &&
          <DeleteSurveyDialog show={showDialog}
                              onCancel={() => this.toggleDeleteConfirmDialog(false)}
                              onDelete={() => deleteSurvey()}
                              surveyName={Survey.getName(surveyInfo)}/>
          }
        </div>

      </div>
    )
  }
}

const mapStateToProps = state => ({
  surveyInfo: getStateSurveyInfo(state),
})

export default connect(mapStateToProps, {publishSurvey, deleteSurvey})(SurveyInfo)
