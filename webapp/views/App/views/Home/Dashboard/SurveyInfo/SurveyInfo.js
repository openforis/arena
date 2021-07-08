import './SurveyInfo.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { DataTestId } from '@webapp/utils/dataTestId'

import Header from '@webapp/components/header'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import DownloadButton from '@webapp/components/form/downloadButton'

import DeleteSurveyDialog from './DeleteSurveyDialog'

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
          <Link
            data-testid={DataTestId.dashboard.surveyInfoBtnHeader}
            to={appModuleUri(homeModules.surveyInfo)}
            className="btn-s btn-transparent"
          >
            <h3 data-testid={DataTestId.dashboard.surveyLabel}>{surveyLabel}</h3>
          </Link>

          <div className="survey-status" data-testid={DataTestId.dashboard.surveyStatus}>
            ({Survey.getStatus(surveyInfo)})
          </div>
        </Header>

        <div>
          <Link
            data-testid={DataTestId.dashboard.surveyInfoBtn}
            to={appModuleUri(homeModules.surveyInfo)}
            className="btn-s btn-transparent"
          >
            <div className="triangle-left" />
            <span className={`icon icon-${canEditDef ? 'pencil2' : 'eye'} icon-12px icon-left`} />
            {i18n.t(canEditDef ? 'homeView.surveyInfo.editInfo' : 'homeView.surveyInfo.viewInfo')}
          </Link>

          {canEditDef && <ButtonPublishSurvey className="btn-transparent" disabled={!Survey.isDraft(surveyInfo)} />}

          <DownloadButton
            id={DataTestId.dashboard.surveyExportBtn}
            className="btn-transparent"
            onClick={() => dispatch(SurveyActions.exportSurvey())}
            label={i18n.t('common.export')}
          />

          {canEditDef && (
            <button
              className="btn-s btn-transparent"
              data-testid={DataTestId.dashboard.surveyDeleteBtn}
              type="button"
              onClick={() => setShowDeleteDialog(true)}
            >
              <div className="triangle-left" />
              <span className="icon icon-bin icon-12px icon-left" />
              {i18n.t('common.delete')}
            </button>
          )}

          {Survey.isFromCollect(surveyInfo) && Survey.hasCollectReportIssues(surveyInfo) && (
            <Link
              data-testid={DataTestId.dashboard.collectReportBtn}
              to={appModuleUri(homeModules.collectImportReport)}
              className="btn-s btn-transparent"
            >
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
          onDelete={() => dispatch(SurveyActions.deleteSurvey(history))}
          surveyName={Survey.getName(surveyInfo)}
        />
      )}
    </>
  )
}

export default SurveyInfo
