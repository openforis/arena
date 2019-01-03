import React from 'react'
import { withRouter } from 'react-router-dom'
import connect from 'react-redux/es/connect/connect'

import axios from 'axios'

import { appModuleUri } from '../../appModules'
import { dashboardModules } from '../../dashboard/dashboardModules'
import { getUser } from '../../../app/appState'
import { getSurvey } from '../../../survey/surveyState'
import { newRecord } from '../../../../common/record/record'
import Survey from '../../../../common/survey/survey'

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
    // TODO: posting new record for testing purposes. The record will be created server side
    const {history, user, surveyInfo} = this.props
    const record = newRecord(user, Survey.getDefaultStep(surveyInfo))

    await axios.post(`/api/survey/${surveyInfo.id}/record`, record)

    history.push(`${appModuleUri(dashboardModules.formDesigner)}preview/${record.uuid}`)
  }
}

const mapStateToProps = state => ({
  user: getUser(state),
  surveyInfo: Survey.getSurveyInfo(getSurvey(state)),
})

export default withRouter(connect(mapStateToProps)(FormEditActions))
