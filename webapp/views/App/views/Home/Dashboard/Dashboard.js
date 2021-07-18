import './Dashboard.scss'

import React, { useState, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { Trans } from 'react-i18next'

import * as Survey from '@core/survey/survey'
import * as ActivityLogObject from '@common/activityLog/activityLog'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'
import { appModuleUri, homeModules, designerModules } from '@webapp/app/appModules'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'
import RecordsSummary from './RecordsSummary'

import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'

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

const LinkWithIcon = ({ to, iconLeft, iconRight, children }) => {
  return (
    <Link to={to} className="btn-s btn-transparent">
      {iconLeft && iconLeft}
      {children}
      {iconRight && iconRight}
    </Link>
  )
}
const FirstTimeHelp = ({ showFirstTimeHelp }) => {
  const surveyInfo = useSurveyInfo()

  if (showFirstTimeHelp === ActivityLogObject.type.surveyPropUpdate) {
    return (
      <div className="home-dashboard__first_time_help">
        <div className="home-dashboard__first_time_help__container with-background">
          <Trans
            i18nKey="homeView.dashboard.surveyPropUpdate.main"
            values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
            components={{
              title: <h2 />,
              linkWithIcon: (
                <LinkWithIcon
                  to={appModuleUri(homeModules.surveyInfo)}
                  className="btn-s btn-transparent"
                  iconLeft={<span className="icon icon-pencil icon-14px" />}
                />
              ),
              basicLink: <Link to={appModuleUri(homeModules.surveyInfo)} className="btn-s btn-transparent" />,
            }}
          ></Trans>

          <div className="home-dashboard__first_time_help-survey-info">
            <SurveyInfo />
          </div>
        </div>

        <div className="home-dashboard__first_time_help__container">
          <Trans
            i18nKey="homeView.dashboard.surveyPropUpdate.secondary"
            values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
            components={{
              linkWithIcon: (
                <LinkWithIcon
                  to={appModuleUri(designerModules.formDesigner)}
                  className="btn-s btn-transparent"
                  iconLeft={<span className="icon icon-quill icon-14px" />}
                />
              ),
            }}
          ></Trans>
        </div>
      </div>
    )
  }

  if (showFirstTimeHelp === ActivityLogObject.type.nodeDefCreate) {
    return (
      <div className="home-dashboard__first_time_help">
        <div className="home-dashboard__first_time_help__container with-background">
          <Trans
            i18nKey="homeView.dashboard.nodeDefCreate.main"
            values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
            components={{
              title: <h2 />,
              linkWithIcon: (
                <LinkWithIcon
                  to={appModuleUri(homeModules.surveyInfo)}
                  className="btn-s btn-transparent"
                  iconLeft={<span className="icon icon-pencil icon-14px" />}
                />
              ),
            }}
          ></Trans>
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
