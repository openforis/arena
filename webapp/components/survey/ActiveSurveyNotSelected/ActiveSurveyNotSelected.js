import './ActiveSurveyNotSelected.scss'

import React from 'react'
import { Link } from 'react-router-dom'

import { Trans } from '@core/i18n/i18nFactory'

import { appModuleUri, homeModules } from '@webapp/app/appModules'

export const ActiveSurveyNotSelected = () => (
  <div className="active-survey-not-selected">
    <Trans
      i18nKey="homeView.dashboard.activeSurveyNotSelected"
      components={{
        title: <h2 />,
        label: <span />,
        linkToSurveys: <Link to={appModuleUri(homeModules.surveyList)} className="btn-s btn-transparent" />,
        linkToNewSurvey: <Link to={appModuleUri(homeModules.surveyNew)} className="btn-s btn-transparent" />,
      }}
    ></Trans>
  </div>
)
