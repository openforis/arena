import './surveyInfo.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import { useAuthCanEditSurvey, useI18n, useSurveyInfo } from '@webapp/commonComponents/hooks'
import Header from '@webapp/commonComponents/header'

import * as Survey from '@core/survey/survey'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { deleteSurvey, publishSurvey } from '@webapp/survey/actions'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import DeleteSurveyDialog from './components/deleteSurveyDialog'

const SurveyInfo = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const surveyInfo = useSurveyInfo()
  const canEditDef = useAuthCanEditSurvey()

  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  return (
    <>
      <div className="home-dashboard__survey-info">
        <Header>
          <h3>{surveyLabel}</h3>

          <div className="survey-status">({Survey.getStatus(surveyInfo)})</div>
        </Header>

        <div>
          <Link to={appModuleUri(homeModules.surveyInfo)} className="btn-s btn-transparent">
            <div className="triangle-left" />
            <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`} />
            {i18n.t(canEditDef ? 'homeView.surveyInfo.editInfo' : 'homeView.surveyInfo.viewInfo')}
          </Link>

          {canEditDef && (
            <button
              className="btn-s btn-transparent"
              aria-disabled={!Survey.isDraft(surveyInfo)}
              type="button"
              onClick={() =>
                dispatch(
                  showDialogConfirm('homeView.surveyInfo.confirmPublish', { survey: surveyLabel }, () =>
                    dispatch(publishSurvey())
                  )
                )
              }
            >
              <div className="triangle-left" />
              <span className="icon icon-checkmark2 icon-12px icon-left" />
              {i18n.t('homeView.surveyInfo.publish')}
            </button>
          )}

          {canEditDef && (
            <button className="btn-s btn-transparent" type="button" onClick={() => setShowDeleteDialog(true)}>
              <div className="triangle-left" />
              <span className="icon icon-bin icon-12px icon-left" />
              {i18n.t('common.delete')}
            </button>
          )}

          {Survey.isFromCollect(surveyInfo) && Survey.hasCollectReportIssues(surveyInfo) && (
            <Link to={appModuleUri(homeModules.collectImportReport)} className="btn-s btn-transparent">
              <div className="triangle-left" />
              <span className="icon icon-clipboard icon-12px icon-left" />
              {i18n.t('appModules.collectImportReport')}
            </Link>
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <DeleteSurveyDialog
          onCancel={() => setShowDeleteDialog(false)}
          onDelete={() => dispatch(deleteSurvey(history))}
          surveyName={Survey.getName(surveyInfo)}
        />
      )}
    </>
  )
}

export default SurveyInfo
