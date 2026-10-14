/**
 * The AI batches of the Form Designer's advanced menu, run in the browser: "AI: Translate labels" (then the review
 * modal) and the schema summary with AI descriptions (then the export job). Kept in the menu's parent: the menu
 * unmounts its items when it closes.
 */
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import { AiWorkflows, type NodeDefsTranslationResult } from '@webapp/ai/workflows'
import { createAbortError } from '@webapp/ai/workflows/batchRun'
import { useAiBatchRun } from '@webapp/components/ai/AiBatchProgressDialog'
import { SchemaSummaryExportCloseButton } from '@webapp/components/survey/SurveySchemaSummaryDownloadButton'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurvey, useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

/**
 * Returns the batch run state and the actions of the advanced menu.
 * @returns {object} batchRun, closeBatchRun, translationResult, closeTranslationResult, startTranslation,
 * startDataDictionaryExport.
 */
export const useFormHeaderAiJobs = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { run: batchRun, start, close: closeBatchRun } = useAiBatchRun()
  const [translationResult, setTranslationResult] = useState<NodeDefsTranslationResult | null>(null)

  /**
   * Translates every label of the survey, then opens the review modal.
   * @returns {Promise<void>} Resolves when the run ends.
   */
  const startTranslation = useCallback(
    () =>
      start({
        titleKey: 'aiBatch.translateTitle',
        run: ({ signal, onProgress }) => AiWorkflows.translateAllLabels({ survey, surveyId, signal, onProgress }),
        onDone: setTranslationResult,
      }),
    [start, survey, surveyId]
  )

  /**
   * Generates the AI descriptions, then starts the export job and shows its monitor.
   * @param {string} fileFormat - csv or xlsx.
   * @returns {Promise<void>} Resolves when the run ends.
   */
  const startDataDictionaryExport = useCallback(
    (fileFormat: string) =>
      start({
        titleKey: 'aiBatch.dataDictionaryTitle',
        run: async ({ signal, onProgress }) => {
          const { aiDescriptions, failedCount } = await AiWorkflows.generateDataDictionary({
            surveyId,
            cycle,
            signal,
            onProgress,
          })
          // cancelled after the last call: no export
          if (signal.aborted) throw createAbortError()
          const { job } = await API.startSchemaSummaryExportJob({
            surveyId,
            cycle,
            fileFormat,
            aiDescriptions,
            aiDescriptionsFailedCount: failedCount,
            signal,
          })
          // cancelled while the export was being requested: no job monitor
          if (signal.aborted) throw createAbortError()
          return job
        },
        onDone: (job) =>
          // JobActions is untyped JS: its thunk does not match the typed dispatch
          dispatch(
            JobActions.showJobMonitor({
              job,
              closeButton: SchemaSummaryExportCloseButton,
              closeButtonProps: { fileFormat },
            }) as any
          ),
      }),
    [cycle, dispatch, start, surveyId]
  )

  /**
   * Closes the review modal.
   * @returns {void}
   */
  const closeTranslationResult = useCallback(() => setTranslationResult(null), [])

  return {
    batchRun,
    closeBatchRun,
    translationResult,
    closeTranslationResult,
    startTranslation,
    startDataDictionaryExport,
  }
}
