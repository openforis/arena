import React from 'react'
import { withRouter } from 'react-router-dom'
import connect from 'react-redux/es/connect/connect'

import axios from 'axios'

import { appModuleUri } from '../../appModules'
import { dashboardModules } from '../../dashboard/dashboardModules'
import { getUser } from '../../../app/appState'
import { getSurvey } from '../../../survey/surveyState'
import Survey from '../../../../common/survey/survey'
import { preview } from '../../../../common/record/record'

class FormEditActions extends React.Component {
  render () {
    return <div className="survey-form__nav-record-actions">
      <div className="btn btn-of" onClick={() => this.previewRecord()}>
        <span className="icon icon-eye icon-12px icon-left"/>
        Preview
      </div>
    </div>
  }

  async previewRecord () {
    const {history, user} = this.props
    const surveyId = this.props.surveyInfo.id

    await axios.post(`/api/survey/${surveyId}/record`, {uuid: preview, ownerId: user.id})

    history.push(`${appModuleUri(dashboardModules.formDesigner)}preview`)
  }
}

const mapStateToProps = state => ({
  user: getUser(state),
  surveyInfo: Survey.getSurveyInfo(getSurvey(state)),
})

export default withRouter(connect(mapStateToProps)(FormEditActions))
