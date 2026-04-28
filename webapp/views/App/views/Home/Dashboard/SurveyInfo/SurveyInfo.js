import './SurveyInfo.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as ProcessUtils from '@core/processUtils'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { SurveyActions, useChains, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useAuthCanExportSurvey } from '@webapp/store/user/hooks'
import { TestId } from '@webapp/utils/testId'

import { useConfirm, useConfirmDelete } from '@webapp/components/hooks'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import { Button, ButtonDelete, ButtonMenu } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

const SurveyInfo = (props) => {
  const { firstTime = false } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const surveyInfo = useSurveyInfo()
  const lang = useSurveyPreferredLang()

  const canEditSurvey = useAuthCanEditSurvey()
  const canExportSurvey = useAuthCanExportSurvey()
  const chains = useChains()
  const hasChains = chains?.length > 0

  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = Survey.getLabel(surveyInfo, lang, false)
  const hasLabel = Objects.isNotEmpty(surveyLabel)

  const confirm = useConfirm()
  const confirmDelete = useConfirmDelete()

  const onDeleteClick = useCallback(() => {
    confirmDelete({
      key: 'homeView:deleteSurveyDialog.deleteWarning',
      params: { surveyName },
      onOk: () => dispatch(SurveyActions.deleteSurvey(navigate)),
      headerText: 'homeView:deleteSurveyDialog.confirmDelete',
      strongConfirm: true,
      strongConfirmInputLabel: 'homeView:deleteSurveyDialog.confirmName',
      strongConfirmRequiredText: surveyName,
    })
  }, [dispatch, navigate, confirmDelete, surveyName])

  const onUnpublishClick = useCallback(() => {
    confirm({
      key: 'homeView:surveyInfo.unpublishSurveyDialog.unpublishWarning',
      params: { surveyName },
      onOk: () => dispatch(SurveyActions.unpublishSurvey()),
      headerText: 'homeView:surveyInfo.unpublishSurveyDialog.confirmUnpublish',
      strongConfirm: true,
      strongConfirmInputLabel: 'homeView:surveyInfo.unpublishSurveyDialog.confirmName',
      strongConfirmRequiredText: surveyName,
    })
  }, [confirm, dispatch, surveyName])

  const onDeleteActivityLogDataClick = useCallback(() => {
    confirm({
      key: 'homeView:surveyInfo.deleteActivityLogConfirm.message',
      params: { surveyName },
      onOk: () => dispatch(SurveyActions.deleteActivityLog()),
      headerText: 'homeView:surveyInfo.deleteActivityLogConfirm.headerText',
      strongConfirm: true,
      strongConfirmInputLabel: 'homeView:surveyInfo.deleteActivityLogConfirm.confirmName',
      strongConfirmRequiredText: surveyName,
    })
  }, [confirm, dispatch, surveyName])

  const advancedFunctionsItems = useMemo(() => {
    const items = []
    if (Survey.isPublished(surveyInfo)) {
      items.push({
        key: 'survey-info-unpublish',
        content: (
          <Button
            className="btn-danger"
            iconClassName="icon-eye-blocked icon-12px icon-left"
            label="homeView:surveyInfo.unpublish"
            onClick={onUnpublishClick}
            variant="text"
            testId={TestId.dashboard.surveyUnpublishBtn}
          />
        ),
      })
    }
    if (!ProcessUtils.ENV.activityLogDisabled) {
      items.push({
        key: 'survey-delete-activity-log',
        content: (
          <Button
            className="btn-danger"
            iconClassName="icon-bin icon-12px icon-left"
            label="homeView:surveyInfo.deleteActivityLog"
            onClick={onDeleteActivityLogDataClick}
            variant="text"
            testId={TestId.dashboard.surveyDeleteActivityLogBtn}
          />
        ),
      })
    }
    items.push({
      key: 'survey-info-delete',
      content: <ButtonDelete onClick={onDeleteClick} testId={TestId.dashboard.surveyDeleteBtn} variant="text" />,
    })
    return items
  }, [onDeleteActivityLogDataClick, onDeleteClick, onUnpublishClick, surveyInfo])

  const exportMenuItems = useMemo(() => {
    const items = [
      {
        key: 'survey-export',
        label: 'common.export',
        onClick: () => dispatch(SurveyActions.exportSurvey()),
        testId: TestId.dashboard.surveyExportOnlySurveyBtn,
      },
    ]
    if (!Survey.isTemplate(surveyInfo)) {
      items.push({
        key: 'survey-export-with-data',
        label: 'homeView:dashboard.exportWithData',
        onClick: () => dispatch(SurveyActions.exportSurvey({ includeData: true })),
        testId: TestId.dashboard.surveyExportWithDataBtn,
      })
      if (!ProcessUtils.ENV.activityLogDisabled) {
        items.push({
          key: 'survey-export-with-data-no-activity-log',
          label: 'homeView:dashboard.exportWithDataNoActivityLog',
          onClick: () => dispatch(SurveyActions.exportSurvey({ includeData: true, includeActivityLog: false })),
          testId: TestId.dashboard.surveyExportWithDataNoActivityLogBtn,
        })
      }
      if (hasChains) {
        items.push({
          key: 'survey-export-with-data-no-result-attributes',
          label: 'homeView:dashboard.exportWithDataNoResultAttributes',
          onClick: () =>
            dispatch(
              SurveyActions.exportSurvey({
                includeData: true,
                includeResultAttributes: false,
                includeActivityLog: false,
              })
            ),
          testId: TestId.dashboard.surveyExportWithDataNoResultAttributesBtn,
        })
      }
    }
    return items
  }, [dispatch, hasChains, surveyInfo])

  return (
    <>
      <div className="home-dashboard__survey-info">
        <header>
          <div className="row">
            <Button
              onClick={() => navigate(appModuleUri(homeModules.surveyInfo))}
              testId={TestId.dashboard.surveyInfoBtnHeader}
              variant="text"
            >
              <h2 data-testid={TestId.dashboard.surveyName}>
                <LabelWithTooltip label={hasLabel ? surveyLabel : surveyName} />
              </h2>
            </Button>

            <div className="survey-status" data-testid={TestId.dashboard.surveyStatus}>
              ({i18n.t(`surveysView.status.${Survey.getStatus(surveyInfo)}`)})
            </div>
          </div>
          <div className="row">{hasLabel && <h3>{surveyName}</h3>}</div>
        </header>

        <div>
          <Button
            iconClassName={`icon icon-${canEditSurvey ? 'pencil2' : 'eye'} icon-12px icon-left`}
            label={canEditSurvey ? 'homeView:surveyInfo.editInfo' : 'homeView:surveyInfo.viewInfo'}
            onClick={() => navigate(appModuleUri(homeModules.surveyInfo))}
            size="small"
            testId={TestId.dashboard.surveyInfoBtn}
            variant="text"
          />

          {!firstTime && canEditSurvey && <ButtonPublishSurvey disabled={!Survey.isDraft(surveyInfo)} variant="text" />}

          {!firstTime && canExportSurvey && (
            <ButtonMenu
              className="btn-menu-export"
              items={exportMenuItems}
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
              items={advancedFunctionsItems}
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

export default SurveyInfo
