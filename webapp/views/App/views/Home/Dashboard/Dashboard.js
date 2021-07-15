import './Dashboard.scss'

import React, { useState, useEffect } from 'react'

import * as Survey from '@core/survey/survey'
import * as ActivityLogObject from '@common/activityLog/activityLog'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'
import RecordsSummary from './RecordsSummary'

import { Link, useHistory } from 'react-router-dom'

import { appModuleUri, homeModules, designerModules } from '@webapp/app/appModules'

import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { DataTestId } from '@webapp/utils/dataTestId'

const useShouldShowFirstTimeHelp = () => {
  const [messages, setMessages] = useState([])
  const [help, setHelp] = useState(false)

  const fetchMessages = useFetchMessages({ messages, setMessages })

  useEffect(() => {
    fetchMessages({ newest: true })
  }, [])

  useEffect(() => {
    if (messages.length > 0 && messages.length < 10) {
      let _help = false
      if (messages.some((message) => [ActivityLogObject.type.nodeDefCreate].includes(message.type))) {
        return
      }
      _help = ActivityLogObject.type.nodeDefCreate

      if (messages.some((message) => [ActivityLogObject.type.surveyPropUpdate].includes(message.type))) {
        setHelp(_help)
        return
      }
      _help = ActivityLogObject.type.surveyPropUpdate
      setHelp(_help)
    }
  }, [messages])

  return help
}

const FirstTimeHelp = ({ showFirstTimeHelp }) => {
  const surveyInfo = useSurveyInfo()

  if (showFirstTimeHelp === ActivityLogObject.type.surveyPropUpdate) {
    return (
      <div className="home-dashboard__first_time_help">
        <div className="home-dashboard__first_time_help__container with-background">
          <h2>Welcome to Arena. </h2>
          <p>
            First you need to set the <b>name</b> and <b>Label</b> of the survey.
          </p>
          <br></br>

          <p>
            Click below on{' '}
            <Link
              data-testid={DataTestId.dashboard.surveyInfoBtnHeader}
              to={appModuleUri(homeModules.surveyInfo)}
              className="btn-s btn-transparent "
            >
              {' '}
              <span className="icon icon-pencil icon-14px" /> Edit info
            </Link>
            or into the survey name:
            <Link
              data-testid={DataTestId.dashboard.surveyInfoBtnHeader}
              to={appModuleUri(homeModules.surveyInfo)}
              className="btn-s btn-transparent "
            >
              {Survey.getName(surveyInfo).toUpperCase()}
            </Link>
          </p>
          <div className="home-dashboard__first_time_help-survey-info">
            <SurveyInfo />
          </div>
        </div>

        <div className="home-dashboard__first_time_help__container">
          <p>
            If the name and label are right then create the first attribute
            <Link
              data-testid={DataTestId.dashboard.surveyInfoBtnHeader}
              to={appModuleUri(designerModules.formDesigner)}
              className="btn-s btn-transparent "
            >
              {' '}
              <span className="icon icon-quill icon-14px" /> Survey > Form Designer{' '}
            </Link>
          </p>
        </div>
      </div>
    )
  }
  if (showFirstTimeHelp === ActivityLogObject.type.nodeDefCreate) {
    return (
      <div className="home-dashboard__first_time_help">
        <div className="home-dashboard__first_time_help__container with-background">
          <h2>Let's create the first attribute of {Survey.getName(surveyInfo).toUpperCase()} </h2>

          <p>
            Go to{' '}
            <Link
              data-testid={DataTestId.dashboard.surveyInfoBtnHeader}
              to={appModuleUri(designerModules.formDesigner)}
              className="btn-s btn-transparent "
            >
              {' '}
              <span className="icon icon-quill icon-14px" /> Survey > Form Designer{' '}
            </Link>
          </p>
          <br></br>
        </div>
      </div>
    )
  }
}

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp()

  const canEditDef = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      {showFirstTimeHelp && canEditDef ? (
        <FirstTimeHelp showFirstTimeHelp={showFirstTimeHelp} />
      ) : (
        <>
          <div className="home-dashboard">
            <SurveyInfo />

            {!Survey.isTemplate(surveyInfo) && <RecordsSummary />}
          </div>
          <ActivityLog />
        </>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
