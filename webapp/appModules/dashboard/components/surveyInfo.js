import './surveyInfo.scss'

import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'

import DeleteSurveyDialog from './deleteSurveyDialog'

import Survey from '../../../../common/survey/survey'
import AuthManager from '../../../../common/auth/authManager'
import Validator from '../../../../common/validation/validator'

import { getStateSurveyInfo } from '../../../survey/surveyState'
import { getUser } from '../../../app/appState'
import { deleteSurvey, publishSurvey } from '../../../survey/actions'
import { appModules } from '../../appModules'
import { appModuleUri } from '../../appModules'
import ErrorBadge from '../../../commonComponents/errorBadge'

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
    const {surveyInfo, deleteSurvey, publishSurvey, canEditDef} = this.props
    const {showDialog} = this.state

    return (
      <div className="app-dashboard__survey-info">

        <ErrorBadge validation={Validator.getValidation(surveyInfo)}/>

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
          {canEditDef &&
          <button className="btn btn-of-light" aria-disabled={!Survey.isDraft(surveyInfo)}
                  onClick={() => window.confirm('Do you want to publish this survey? Some operation won\'t be allowed afterwards.')
                    ? publishSurvey()
                    : null}>
            <span className="icon icon-checkmark2 icon-16px icon-left"/> Publish
          </button>
          }

          <button className="btn btn-of-light" aria-disabled={true}>
            <span className="icon icon-download3 icon-16px icon-left"/> Export
          </button>

          <button className="btn btn-of-light" aria-disabled={true}>
            <span className="icon icon-upload3 icon-16px icon-left"/> Import
          </button>

          {canEditDef &&
          <button className="btn btn-of-light" onClick={() => this.toggleDeleteConfirmDialog(true)}>
            <span className="icon icon-bin icon-16px icon-left"/> Delete
          </button>
          }

          {showDialog &&
          <DeleteSurveyDialog onCancel={() => this.toggleDeleteConfirmDialog(false)}
                              onDelete={() => deleteSurvey()}
                              surveyName={Survey.getName(surveyInfo)}/>
          }
        </div>

      </div>
    )
  }
}

const mapStateToProps = state => {
  const user = getUser(state)
  const surveyInfo = getStateSurveyInfo(state)

  return {
    surveyInfo,
    canEditDef: AuthManager.canEditSurvey(user, surveyInfo),
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, {publishSurvey, deleteSurvey})
)

export default enhance(SurveyInfo)
