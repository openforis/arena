import './SurveyInfo.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useAuthCanExportSurvey } from '@webapp/store/user/hooks'
import { TestId } from '@webapp/utils/testId'

import { useConfirm, useConfirmDelete } from '@webapp/components/hooks'
import Header from '@webapp/components/header'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import { Button, ButtonMenu } from '@webapp/components'

const SurveyInfo = (props) => {
  const { firstTime } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const surveyInfo = useSurveyInfo()

  const canEditSurvey = useAuthCanEditSurvey()
  const canExportSurvey = useAuthCanExportSurvey()

  const surveyName = Survey.getName(surveyInfo)

  const confirm = useConfirm()
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

  const onUnpublishClick = useCallback(() => {
    confirm({
      key: 'homeView.surveyInfo.unpublishSurveyDialog.unpublishWarning',
      params: { surveyName },
      onOk: () => dispatch(SurveyActions.unpublishSurvey()),
      headerText: 'homeView.surveyInfo.unpublishSurveyDialog.confirmUnpublish',
      strongConfirm: true,
      strongConfirmInputLabel: 'homeView.surveyInfo.unpublishSurveyDialog.confirmName',
      strongConfirmRequiredText: surveyName,
    })
  }, [confirm, dispatch, surveyName])

  return (
    <>
      <div className="home-dashboard__survey-info">
        <Header>
          <Button
            onClick={() => navigate(appModuleUri(homeModules.surveyInfo))}
            testId={TestId.dashboard.surveyInfoBtnHeader}
            variant="text"
          >
            <h3 data-testid={TestId.dashboard.surveyName}>{surveyName}</h3>
          </Button>

          <div className="survey-status" data-testid={TestId.dashboard.surveyStatus}>
            ({Survey.getStatus(surveyInfo)})
          </div>
        </Header>

        <div>
          <Button
            iconClassName={`icon icon-${canEditSurvey ? 'pencil2' : 'eye'} icon-12px icon-left`}
            label={canEditSurvey ? 'homeView.surveyInfo.editInfo' : 'homeView.surveyInfo.viewInfo'}
            onClick={() => navigate(appModuleUri(homeModules.surveyInfo))}
            size="small"
            testId={TestId.dashboard.surveyInfoBtn}
            variant="text"
          />

          {!firstTime && canEditSurvey && <ButtonPublishSurvey disabled={!Survey.isDraft(surveyInfo)} variant="text" />}

          {!firstTime && canExportSurvey && (
            <ButtonMenu
              className="btn-menu-export"
              items={[
                {
                  key: 'survey-export',
                  label: 'common.export',
                  onClick: () => dispatch(SurveyActions.exportSurvey()),
                  testId: TestId.dashboard.surveyExportOnlySurveyBtn,
                },
                ...(!Survey.isTemplate(surveyInfo)
                  ? [
                      {
                        key: 'survey-export-with-data',
                        label: 'homeView.dashboard.exportWithData',
                        onClick: () => dispatch(SurveyActions.exportSurvey({ includeData: true })),
                        testId: TestId.dashboard.surveyExportWithDataBtn,
                      },
                      {
                        key: 'survey-export-without-data',
                        label: 'homeView.dashboard.exportWithDataNoActivityLog',
                        onClick: () =>
                          dispatch(SurveyActions.exportSurvey({ includeData: true, includeActivityLog: false })),
                        testId: TestId.dashboard.surveyExportWithDataNoActivityLogBtn,
                      },
                    ]
                  : []),
              ]}
              iconClassName="icon-download2 icon-14px"
              label="common.export"
              size="small"
              testId={TestId.dashboard.surveyExportBtn}
            />
          )}
          {canEditSurvey && (
            <ButtonMenu
              className="btn-menu-advanced"
              iconClassName="icon-cog icon-14px"
              items={[
                ...(Survey.isPublished(surveyInfo)
                  ? [
                      {
                        key: 'survey-info-unpublish',
                        content: (
                          <Button
                            iconClassName="icon-eye-blocked icon-12px icon-left"
                            label="homeView.surveyInfo.unpublish"
                            onClick={onUnpublishClick}
                            variant="text"
                            testId={TestId.dashboard.surveyUnpublishBtn}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'survey-info-delete',
                  content: (
                    <Button
                      iconClassName="icon-bin icon-12px icon-left"
                      label="common.delete"
                      onClick={onDeleteClick}
                      testId={TestId.dashboard.surveyDeleteBtn}
                      variant="text"
                    />
                  ),
                },
              ]}
              label="common.advancedFunctions"
              size="small"
              testId={TestId.dashboard.advancedFunctionsBtn}
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

SurveyInfo.propTypes = {
  firstTime: PropTypes.bool,
}

SurveyInfo.defaultProps = {
  firstTime: false,
}

export default SurveyInfo
