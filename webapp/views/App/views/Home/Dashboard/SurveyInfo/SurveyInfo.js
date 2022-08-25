import './SurveyInfo.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import Header from '@webapp/components/header'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import { Button, ButtonDownload } from '@webapp/components'

import { useAuthCanExportSurvey } from '@webapp/store/user/hooks'
import { ButtonMenu } from '@webapp/components/buttons'
import { useConfirmDelete } from '@webapp/components/hooks'

const SurveyInfo = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const surveyInfo = useSurveyInfo()

  const canEditSurvey = useAuthCanEditSurvey()
  const canExportSurvey = useAuthCanExportSurvey()

  const surveyName = Survey.getName(surveyInfo)

  const confirmDelete = useConfirmDelete()

  const onDeleteClick = useCallback(() => {
    confirmDelete({
      key: 'homeView.deleteSurveyDialog.deleteWarning',
      params: { surveyName },
      onOk: () => dispatch(SurveyActions.deleteSurvey(navigate)),
      headerText: 'homeView.deleteSurveyDialog.confirmDelete',
      strongConfirm: true,
      strongConfirmInputLabel: 'homeView.deleteSurveyDialog.confirmName',
      strongConfirmRequiredText: surveyName,
    })
  }, [dispatch, navigate, confirmDelete, surveyName])

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

          {canExportSurvey && (
            <ButtonMenu
              testId={TestId.dashboard.surveyExportBtn}
              className="btn-menu-export"
              buttonClassName="btn-transparent"
              iconClassName="icon-download2 icon-14px"
              title="common.export"
              popupComponent={
                <>
                  <ButtonDownload
                    testId={TestId.dashboard.surveyExportOnlySurveyBtn}
                    className="btn-transparent"
                    onClick={() => dispatch(SurveyActions.exportSurvey())}
                    label="common.export"
                  />
                  {!Survey.isTemplate(surveyInfo) && (
                    <>
                      <ButtonDownload
                        testId={TestId.dashboard.surveyExportWithDataBtn}
                        className="btn-transparent"
                        onClick={() => dispatch(SurveyActions.exportSurvey({ includeData: true }))}
                        label="homeView.dashboard.exportWithData"
                      />
                      <ButtonDownload
                        testId={TestId.dashboard.surveyExportWithDataNoActivityLogBtn}
                        className="btn-transparent"
                        onClick={() =>
                          dispatch(SurveyActions.exportSurvey({ includeData: true, includeActivityLog: false }))
                        }
                        label="homeView.dashboard.exportWithDataNoActivityLog"
                      />
                    </>
                  )}
                </>
              }
            />
          )}

          {canEditSurvey && (
            <Button
              className="btn-s btn-transparent"
              testId={TestId.dashboard.surveyDeleteBtn}
              onClick={onDeleteClick}
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
    </>
  )
}

export default SurveyInfo
