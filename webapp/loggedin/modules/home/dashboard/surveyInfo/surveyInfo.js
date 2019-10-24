import './surveyInfo.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/commonComponents/hooks'
import Header from '@webapp/commonComponents/header'
import DeleteSurveyDialog from './components/deleteSurveyDialog'

import Survey from '@core/survey/survey'
import Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

import { deleteSurvey, publishSurvey } from '@webapp/survey/actions'

import { appModuleUri, homeModules } from '../../../../appModules'

const SurveyInfo = props => {

  const {
    surveyInfo, canEditDef,
    publishSurvey, deleteSurvey
  } = props

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  return Survey.isValid(surveyInfo)
    ? (
      <>
        <div className="home-dashboard__survey-info">

          <Header>
            <h3>
              {Survey.getLabel(surveyInfo, lang)}
            </h3>

            <div className="survey-status">
              ({Survey.getStatus(surveyInfo)})
            </div>
          </Header>

          <div>

            <Link to={appModuleUri(homeModules.surveyInfo)} className="btn-s btn-transparent">
              <div className="triangle-left"/>
              <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`}/>
              {i18n.t(canEditDef ? 'homeView.surveyInfo.editInfo' : 'homeView.surveyInfo.viewInfo')}
            </Link>

            {
              canEditDef &&
              <a className="btn-s btn-transparent"
                 aria-disabled={!Survey.isDraft(surveyInfo)}
                 onClick={() => window.confirm(i18n.t('homeView.surveyInfo.confirmPublish'))
                   ? publishSurvey()
                   : null}>
                <div className="triangle-left"/>
                <span className="icon icon-checkmark2 icon-12px icon-left"/>
                {i18n.t('homeView.surveyInfo.publish')}
              </a>
            }


            {
              canEditDef &&
              <a className="btn-s btn-transparent" onClick={() => setShowDeleteDialog(true)}>
                <div className="triangle-left"/>
                <span className="icon icon-bin icon-12px icon-left"/>
                {i18n.t('common.delete')}
              </a>
            }

            {
              Survey.isFromCollect(surveyInfo) && Survey.hasCollectReportIssues(surveyInfo) &&
              <Link to={appModuleUri(homeModules.collectImportReport)}
                    className="btn-s btn-transparent">
                <div className="triangle-left"/>
                <span className="icon icon-clipboard icon-12px icon-left"/>
                {i18n.t('appModules.collectImportReport')}
              </Link>
            }
          </div>

        </div>


        {
          showDeleteDialog &&
          <DeleteSurveyDialog
            onCancel={() => setShowDeleteDialog(false)}
            onDelete={() => deleteSurvey()}
            surveyName={Survey.getName(surveyInfo)}/>
        }
      </>
    )
    : null
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    surveyInfo,
    canEditDef: Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { publishSurvey, deleteSurvey }
)(SurveyInfo)