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
  useSurveyLangs,
  useSurveyPreferredLang,
} from '@webapp/store/survey'
import { FileUploadDialogActions } from '@webapp/store/ui'
import { useNodeDefPage } from '@webapp/store/ui/surveyForm'
import { AiBatchProgressDialog } from '@webapp/components/ai/AiBatchProgressDialog'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { TestId } from '@webapp/utils/testId'

import * as API from '@webapp/service/api'

import { Button, ButtonDownload, ButtonMenu } from '@webapp/components/buttons'
import { OpenFileUploadDialogButton } from '@webapp/components/form'

import SurveySchemaSummaryDownloadButton from '../../SurveySchemaSummaryDownloadButton'
import { NodeDefCloneFromSurveyDialog } from '../nodeDefs/components/nodeDefCloneFromSurveyDialog'
import { NodeDefsTranslationModal } from './NodeDefsTranslationModal'
import { useFormHeaderAiJobs } from './useFormHeaderAiJobs'

const labelsExportAllowedFileFormats = [FileFormats.csv, FileFormats.xlsx]
const schemaSummaryAiFileFormats = [FileFormats.csv, FileFormats.xlsx]

/**
 * Advanced functions menu of the Form Designer (exports, imports, clone and the browser AI batches).
 * @param {object} props - Props.
 * @param {boolean} props.canEditDef - Whether the user can edit the survey definition.
 * @returns {React.ReactElement} The menu and its dialogs.
 */
const FormHeaderAdvancedButton = ({ canEditDef }) => {
  const dispatch = useDispatch()

  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const surveyIsDraft = Survey.isDraft(surveyInfo)
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const surveyIsDirty = useIsSurveyDirty()
  const nodeDefPage = useNodeDefPage()
  const dataDictionaryAiEnabled = useAiFeatureEnabled('dataDictionary')
  const aiTranslationEnabled = useAiFeatureEnabled('translation')
  const surveyLangs = useSurveyLangs()
  const {
    batchRun,
    closeBatchRun,
    translationResult,
    closeTranslationResult,
    startTranslation,
    startDataDictionaryExport,
  } = useFormHeaderAiJobs()

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
      // the AI descriptions are generated in the browser before the export job (useFormHeaderAiJobs)
      ...(dataDictionaryAiEnabled
        ? schemaSummaryAiFileFormats.map((fileFormat) => ({
            key: `schema-summary-${fileFormat}-ai`,
            iconClassName: 'icon-download2 icon-14px',
            label: `surveyForm:schemaSummaryAiDescriptions_${fileFormat}`,
            onClick: () => startDataDictionaryExport(fileFormat),
            testId: TestId.surveyForm.schemaSummaryAi(fileFormat),
          }))
        : []),
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
            iconClassName="icon-file-word"
            label="surveyForm:downloadPrintableDocument"
            variant="text"
          />
        ),
      },
      {
        key: 'survey-pdf-export',
        content: (
          <ButtonDownload
            href={API.getSurveyPdfExportUrl({ surveyId, cycle, lang, draft: surveyIsDraft })}
            iconClassName="icon-file-pdf"
            label="surveyForm:downloadPrintableDocumentPdf"
            variant="text"
          />
        ),
      },
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
      ...(aiTranslationEnabled && surveyLangs.length > 1 && canEditDef
        ? [
            {
              key: 'translate-labels-ai',
              iconClassName: 'icon-earth icon-14px',
              label: 'surveyForm:aiTranslateLabels',
              onClick: startTranslation,
              testId: TestId.surveyForm.aiTranslateLabelsBtn,
            },
          ]
        : []),
    ],
    [
      aiTranslationEnabled,
      canEditDef,
      cycle,
      dataDictionaryAiEnabled,
      lang,
      onLabelsImportFileSelected,
      openCloneFromSurveyDialog,
      startDataDictionaryExport,
      startTranslation,
      surveyId,
      surveyIsDraft,
      surveyLangs,
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
      {batchRun && <AiBatchProgressDialog run={batchRun} onClose={closeBatchRun} />}
      {translationResult && <NodeDefsTranslationModal result={translationResult} onClose={closeTranslationResult} />}
    </>
  )
}

FormHeaderAdvancedButton.propTypes = {
  canEditDef: PropTypes.bool.isRequired,
}

export default FormHeaderAdvancedButton
