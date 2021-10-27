import './SurveyInfo.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import Header from '@webapp/components/header'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import { Button, ButtonDownload } from '@webapp/components'

import DeleteSurveyDialog from './DeleteSurveyDialog'

const SurveyInfo = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const surveyInfo = useSurveyInfo()

  const canEditSurvey = useAuthCanEditSurvey()

  const surveyName = Survey.getName(surveyInfo)

  return (
    <>
      <div className="home-dashboard__survey-info">
        <Header>
          <Link
            data-testid={TestId.dashboard.surveyInfoBtnHeader}
            to={appModuleUri(homeModules.surveyInfo)}
            className="btn-s btn-transparent"
          >
            <h3 data-testid={TestId.dashboard.surveyName}>{surveyName}</h3>
          </Link>

          <div className="survey-status" data-testid={TestId.dashboard.surveyStatus}>
            ({Survey.getStatus(surveyInfo)})
          </div>
        </Header>

        <div>
          <Link
            data-testid={TestId.dashboard.surveyInfoBtn}
            to={appModuleUri(homeModules.surveyInfo)}
            className="btn-s btn-transparent"
          >
            <span className={`icon icon-${canEditSurvey ? 'pencil2' : 'eye'} icon-12px icon-left`} />
            {i18n.t(canEditSurvey ? 'homeView.surveyInfo.editInfo' : 'homeView.surveyInfo.viewInfo')}
          </Link>

          {canEditSurvey && <ButtonPublishSurvey className="btn-transparent" disabled={!Survey.isDraft(surveyInfo)} />}

          <ButtonDownload
            id={TestId.dashboard.surveyExportBtn}
            className="btn-transparent"
            onClick={() => dispatch(SurveyActions.exportSurvey())}
            label={i18n.t('common.export')}
          />

          <ButtonDownload
            id={TestId.dashboard.surveyExportWithDataBtn}
            className="btn-transparent"
            onClick={() => dispatch(SurveyActions.exportSurvey({ includeData: true }))}
            label={i18n.t('homeView.dashboard.exportWithData')}
          />

          {canEditSurvey && (
            <Button
              className="btn-s btn-transparent"
              testId={TestId.dashboard.surveyDeleteBtn}
              onClick={() => setShowDeleteDialog(true)}
              iconClassName="icon-bin icon-12px icon-left"
              label="common.delete"
            />
          )}

          {canEditSurvey && Survey.isFromCollect(surveyInfo) && Survey.hasCollectReportIssues(surveyInfo) && (
            <Link
              data-testid={TestId.dashboard.collectReportBtn}
              to={appModuleUri(homeModules.collectImportReport)}
              className="btn-s btn-transparent"
            >
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
