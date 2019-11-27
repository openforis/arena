import './surveyInfo.scss'

import React, {useState} from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import {useI18n} from '@webapp/commonComponents/hooks'
import Header from '@webapp/commonComponents/header'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'

import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

import {deleteSurvey, publishSurvey} from '@webapp/survey/actions'

import {appModuleUri, homeModules} from '../../../../appModules'
import DeleteSurveyDialog from './components/deleteSurveyDialog'

const SurveyInfo = props => {
  const {
    surveyInfo, canEditDef,
    publishSurvey, deleteSurvey
  } = props

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  const i18n = useI18n()
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  return (
    <>
      <div className="home-dashboard__survey-info">

        <Header>
          <h3>
            {surveyLabel}
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
              onClick={() => setShowPublishConfirm(true)}>
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

      {
        showPublishConfirm &&
        <ConfirmDialog
          message={i18n.t('homeView.surveyInfo.confirmPublish', {survey: surveyLabel})}
          onOk={() => {
            setShowPublishConfirm(false)
            publishSurvey()
          }}
          onCancel={() => setShowPublishConfirm(false)}
        />
      }
    </>
  )
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
  {publishSurvey, deleteSurvey}
)(SurveyInfo)
