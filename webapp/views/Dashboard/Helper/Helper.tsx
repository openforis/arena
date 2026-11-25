import './Helper.scss'

import type { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Link } from 'react-router'

import * as Survey from '@core/survey/survey'
import { appModuleUri, designerModules, homeModules } from '@webapp/app/appModules'
import { TransTitle } from '@webapp/components/TransTitle'
import { useSurveyInfo } from '@webapp/store/survey'
import SurveyInfo from '../SurveyInfo'

const HelperFirstTimeSurvey = () => {
  const surveyInfo = useSurveyInfo()
  return (
    <div className="helper__first_time_help">
      <div className="helper__first_time_help__container with-background">
        <Trans
          i18nKey="homeView:dashboard.surveyPropUpdate.main"
          values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
          components={{
            title: <TransTitle />,
            linkWithIcon: <LinkWithIcon to={appModuleUri(homeModules.surveyInfo)} iconLeft="icon-pencil" />,
            basicLink: <Link to={appModuleUri(homeModules.surveyInfo)} className="btn-s btn-transparent" />,
          }}
        />

        <div className="helper__first_time_help-survey-info">
          <SurveyInfo firstTime />
        </div>
      </div>

      <div className="helper__first_time_help__container">
        <Trans
          i18nKey="homeView:dashboard.surveyPropUpdate.secondary"
          values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
          components={{
            linkWithIcon: <LinkWithIcon to={appModuleUri(designerModules.formDesigner)} iconLeft="icon-quill" />,
          }}
        />
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
            i18nKey="homeView:dashboard.nodeDefCreate.main"
            values={{ surveyName: Survey.getName(surveyInfo).toUpperCase() }}
            components={{
              title: <TransTitle />,
              linkWithIcon: <LinkWithIcon to={appModuleUri(designerModules.formDesigner)} iconLeft="icon-pencil" />,
            }}
          />
        </div>
      </div>
    </>
  )
}

export const helperTypes = {
  firstTimeSurvey: 'firstTimeSurvey',
  surveyWithoutNodeDefs: 'surveyWithoutNodeDefs',
}

const HelpersByType = {
  [helperTypes.firstTimeSurvey]: HelperFirstTimeSurvey,
  [helperTypes.surveyWithoutNodeDefs]: HelperWithoutAttributes,
}

type LinkWithIconProps = {
  to: string
  iconLeft?: string
  iconRight?: string
  children?: ReactNode
}

const LinkWithIcon = ({ to, iconLeft, iconRight, children }: LinkWithIconProps) => (
  <Link to={to} className="btn-s btn-transparent">
    {iconLeft && <span className={`icon ${iconLeft} icon-14px`} />}
    {children}
    {iconRight && <span className={`icon ${iconRight} icon-14px`} />}
  </Link>
)

type FirstTimeHelpProps = {
  firstTimeHelp: string
}

const FirstTimeHelp = ({ firstTimeHelp }: FirstTimeHelpProps) => {
  const HelperComponent = HelpersByType[firstTimeHelp]
  return <HelperComponent />
}

export default FirstTimeHelp
