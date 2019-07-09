import './dashboardView.scss'

import React from 'react'
import { Link } from 'react-router-dom'

import SurveyInfo from './surveyInfo/surveyInfo'

import useI18n from '../../../../commonComponents/useI18n'

import { appModuleUri, homeModules } from '../../../appModules'

const DashboardView = () => {
  const i18n = useI18n()

  return (
    <div className="home-dashboard">

      <div className="home-dashboard__survey-btns">
        <Link to={appModuleUri(homeModules.surveyList)} className="btn">
          <span className="icon icon-paragraph-justify icon-12px icon-left"/>
          {i18n.t('appModules.surveyList')}
        </Link>

        <Link to={appModuleUri(homeModules.surveyNew)} className="btn">
          <span className="icon icon-plus icon-12px icon-left"/>
          {i18n.t('homeView.createSurvey')}
        </Link>
      </div>

      <SurveyInfo/>
    </div>
  )
}

export default DashboardView