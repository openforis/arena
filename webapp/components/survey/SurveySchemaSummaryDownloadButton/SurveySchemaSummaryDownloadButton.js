import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from '@webapp/components/buttons'
import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

/**
 * Close button of the job monitor of the schema summary export with AI descriptions: warning and Download.
 * @param {object} props - Props.
 * @param {object} props.job - The completed export job.
 * @param {string} props.fileFormat - csv or xlsx.
 * @returns {React.ReactElement} The warning (if any) and the download button.
 */
export const SchemaSummaryExportCloseButton = ({ job, fileFormat }) => {
  const { tempFileName, aiDescriptionsFailedCount = 0 } = job.result
  const i18n = useI18n()
  const dispatch = useDispatch()
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
        <div className="schema-summary-export__warning" role="status">
          {i18n.t('surveyForm:schemaSummaryAiDescriptionsFailed', { count: aiDescriptionsFailedCount })}
        </div>
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

SchemaSummaryExportCloseButton.propTypes = {
  job: PropTypes.object.isRequired,
  fileFormat: PropTypes.string.isRequired,
}

/**
 * Download button of the schema summary (without AI descriptions; those are generated in the advanced menu).
 * @param {object} props - Props.
 * @returns {React.ReactElement} The button.
 */
const SurveySchemaSummaryDownloadButton = (props) => {
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

SurveySchemaSummaryDownloadButton.propTypes = {
  className: PropTypes.string,
  fileFormat: PropTypes.string,
  testId: PropTypes.string,
}

export default SurveySchemaSummaryDownloadButton
