import { useCallback } from 'react'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from '@webapp/components/buttons'
import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { useAppDispatch } from '@webapp/store'

/**
 * Close button of the job monitor of the schema summary export with AI descriptions: warning and Download.
 * @param {object} props - Props.
 * @param {object} props.job - The completed export job.
 * @param {string} props.fileFormat - csv or xlsx.
 * @returns {ReactElement} The warning (if any) and the download button.
 */
type SchemaSummaryExportCloseButtonProps = {
  job: Record<string, any>
  fileFormat: string
}

export const SchemaSummaryExportCloseButton = ({ job, fileFormat }: SchemaSummaryExportCloseButtonProps) => {
  const { tempFileName, aiDescriptionsFailedCount = 0, aiDescriptionsNotDoneCount = 0 } = job.result
  const i18n = useI18n()
  const dispatch = useAppDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  /**
   * Hides the job monitor when the download starts.
   * @returns {void}
   */
  const onDownload = useCallback(() => dispatch(JobActions.hideJobMonitor()), [dispatch])

  return (
    <>
      {aiDescriptionsFailedCount > 0 && (
        <output className="schema-summary-export__warning">
          {i18n.t('surveyForm:schemaSummaryAiDescriptionsFailed', { count: aiDescriptionsFailedCount })}
        </output>
      )}
      {aiDescriptionsNotDoneCount > 0 && (
        <output className="schema-summary-export__warning">
          {i18n.t('surveyForm:schemaSummaryAiDescriptionsNotDone', { count: aiDescriptionsNotDoneCount })}
        </output>
      )}
      <ButtonDownload
        href={`/api/survey/${surveyId}/schema-summary/export/download`}
        requestParams={{ tempFileName, cycle, fileFormat }}
        onClick={onDownload}
        testId={TestId.surveyForm.schemaSummaryAiDownloadBtn}
        variant="contained"
      />
    </>
  )
}

/**
 * Download button of the schema summary (without AI descriptions; those are generated in the advanced menu).
 * @param {object} props - Props.
 * @returns {ReactElement} The button.
 */
type SurveySchemaSummaryDownloadButtonProps = {
  className?: string
  fileFormat?: string
  testId?: string
}

const SurveySchemaSummaryDownloadButton = (props: SurveySchemaSummaryDownloadButtonProps) => {
  const { className, fileFormat = FileFormats.xlsx, testId } = props

  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  return (
    <ButtonDownload
      className={className}
      testId={testId}
      href={`/api/survey/${surveyId}/schema-summary`}
      requestParams={{ cycle, fileFormat }}
      label={`surveyForm:schemaSummary_${fileFormat}`}
      variant="text"
    />
  )
}

export default SurveySchemaSummaryDownloadButton
