import './Helper.scss'

import React from 'react'
import { Link } from 'react-router-dom'

import { Trans } from '@core/i18n/i18nFactory'
import * as Survey from '@core/survey/survey'
import * as ActivityLogObject from '@common/activityLog/activityLog'

import { useSurveyInfo } from '@webapp/store/survey'
import { appModuleUri, homeModules, designerModules } from '@webapp/app/appModules'

import SurveyInfo from '../SurveyInfo'

const HelperFirstTimeSurvey = () => {
  const surveyInfo = useSurveyInfo()
  return (
    <div className="helper__first_time_help">
      <div className="helper__first_time_help__container with-background">
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

        <div className="helper__first_time_help-survey-info">
          <SurveyInfo />
        </div>
      </div>

      <div className="helper__first_time_help__container">
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

const HelperWithoutAttributes = () => {
  const surveyInfo = useSurveyInfo()

  return (
    <>
      <div className="helper__survey_info">
        <SurveyInfo />
      </div>
      <div className="helper__first_time_help">
        <div className="helper__first_time_help__container with-background">
          <Trans
            i18nKey="homeView.dashboard.nodeDefCreate.main"
            values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
            components={{
              title: <h2 />,
              linkWithIcon: (
                <LinkWithIcon
                  to={appModuleUri(designerModules.formDesigner)}
                  className="btn-s btn-transparent"
                  iconLeft={<span className="icon icon-pencil icon-14px" />}
                />
              ),
            }}
          ></Trans>
        </div>
      </div>
    </>
  )
}

const HelpersByType = {
  [ActivityLogObject.type.surveyPropUpdate]: HelperFirstTimeSurvey,
  [ActivityLogObject.type.nodeDefCreate]: HelperWithoutAttributes,
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
const FirstTimeHelp = ({ firstTimeHelp }) => {
  const HelperComponent = HelpersByType[firstTimeHelp]
  return <HelperComponent />
}

export default FirstTimeHelp
