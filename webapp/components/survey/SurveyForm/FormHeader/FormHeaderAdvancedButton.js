import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import { FileFormats } from '@core/fileFormats'

import { JobActions } from '@webapp/store/app'
import {
  NodeDefsActions,
  SurveyActions,
  useIsSurveyDirty,
  useSurveyCycleKey,
  useSurveyId,
  useSurveyInfo,
  useSurveyPreferredLang,
} from '@webapp/store/survey'
import { FileUploadDialogActions } from '@webapp/store/ui'
import { useNodeDefPage } from '@webapp/store/ui/surveyForm'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { TestId } from '@webapp/utils/testId'

import * as API from '@webapp/service/api'

import { Button, ButtonDownload, ButtonMenu } from '@webapp/components/buttons'
import { OpenFileUploadDialogButton } from '@webapp/components/form'

import SurveySchemaSummaryDownloadButton from '../../SurveySchemaSummaryDownloadButton'
import { NodeDefCloneFromSurveyDialog } from '../nodeDefs/components/nodeDefCloneFromSurveyDialog'

const labelsExportAllowedFileFormats = [FileFormats.csv, FileFormats.xlsx]

const FormHeaderAdvancedButton = ({ canEditDef }) => {
  const dispatch = useDispatch()

  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const surveyIsDraft = Survey.isDraft(surveyInfo)
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const surveyIsDirty = useIsSurveyDirty()
  const nodeDefPage = useNodeDefPage()
  const dataDictionaryAiEnabled = useAiFeatureEnabled('dataDictionary')

  const [cloneFromSurveyDialogOpen, setCloneFromSurveyDialogOpen] = useState(false)

  const onLabelsImportFileSelected = useCallback(
    async (file) => {
      const job = await API.startImportLabelsJob({ surveyId, file })
      dispatch(
        JobActions.showJobMonitor({
          job,
          onComplete: () => {
            dispatch(FileUploadDialogActions.close())
            dispatch(SurveyActions.resetSurveyDefs())
          },
        })
      )
    },
    [dispatch, surveyId]
  )

  const openCloneFromSurveyDialog = useCallback(() => {
    setCloneFromSurveyDialogOpen(true)
  }, [])

  const closeCloneFromSurveyDialog = useCallback(() => {
    setCloneFromSurveyDialogOpen(false)
  }, [])

  const onCloneFromSurveyConfirm = useCallback(
    ({ sourceSurveyId, sourceNodeDefUuid, targetParentNodeDefUuid }) => {
      closeCloneFromSurveyDialog()
      dispatch(NodeDefsActions.cloneNodeDefFromSurvey({ sourceSurveyId, sourceNodeDefUuid, targetParentNodeDefUuid }))
    },
    [closeCloneFromSurveyDialog, dispatch]
  )

  const items = useMemo(
    () => [
      {
        key: 'schema-summary-csv',
        content: (
          <SurveySchemaSummaryDownloadButton fileFormat={FileFormats.csv} testId={TestId.surveyForm.schemaSummary} />
        ),
      },
      {
        key: 'schema-summary-excel',
        content: <SurveySchemaSummaryDownloadButton fileFormat={FileFormats.xlsx} />,
      },
      ...(dataDictionaryAiEnabled
        ? [
            {
              key: 'schema-summary-csv-ai',
              content: <SurveySchemaSummaryDownloadButton fileFormat={FileFormats.csv} includeAiDescriptions />,
            },
            {
              key: 'schema-summary-excel-ai',
              content: <SurveySchemaSummaryDownloadButton fileFormat={FileFormats.xlsx} includeAiDescriptions />,
            },
          ]
        : []),
      ...(experimentalFeatures
        ? [
            ...(canEditDef
              ? [
                  {
                    key: 'node-clone-from-other-survey',
                    content: (
                      <Button
                        iconClassName="icon-copy"
                        label="surveyForm:cloneFromAnotherSurvey.title"
                        onClick={openCloneFromSurveyDialog}
                        variant="text"
                      />
                    ),
                  },
                ]
              : []),
            {
              key: 'survey-docx-export',
              content: (
                <ButtonDownload
                  href={API.getSurveyDocxExportUrl({ surveyId, cycle, lang, draft: surveyIsDraft })}
                  label="surveyForm:downloadPrintableDocument"
                  variant="text"
                />
              ),
            },
          ]
        : []),
      ...labelsExportAllowedFileFormats.map((fileFormat) => ({
        key: `labels-export-${fileFormat}`,
        content: (
          <ButtonDownload
            href={`/api/survey/${surveyId}/labels`}
            label={`surveyForm:exportLabels_${fileFormat}`}
            requestParams={{ fileFormat }}
            variant="text"
          />
        ),
      })),
      {
        key: 'labels-import',
        content: (
          <OpenFileUploadDialogButton
            label="surveyForm:importLabels"
            accept=".csv,.xlsx"
            onOk={({ files }) => onLabelsImportFileSelected(files[0])}
            variant="text"
          />
        ),
      },
    ],
    [
      canEditDef,
      cycle,
      dataDictionaryAiEnabled,
      experimentalFeatures,
      lang,
      onLabelsImportFileSelected,
      openCloneFromSurveyDialog,
      surveyId,
      surveyIsDraft,
    ]
  )

  return (
    <>
      <ButtonMenu
        className="btn-menu-advanced"
        disabled={surveyIsDirty}
        iconClassName="icon-cog icon-14px"
        label="common.advancedFunctions"
        items={items}
        size="small"
        testId={TestId.surveyForm.advancedFunctionBtn}
      />
      {cloneFromSurveyDialogOpen && (
        <NodeDefCloneFromSurveyDialog
          currentNodeDef={nodeDefPage}
          onClose={closeCloneFromSurveyDialog}
          onConfirm={onCloneFromSurveyConfirm}
        />
      )}
    </>
  )
}

FormHeaderAdvancedButton.propTypes = {
  canEditDef: PropTypes.bool.isRequired,
}

export default FormHeaderAdvancedButton
