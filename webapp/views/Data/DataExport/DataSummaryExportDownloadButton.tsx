import { useCallback } from 'react'

import * as JobSerialized from '@common/job/jobSerialized'
import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { JobActions } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

type DataSummaryExportDownloadButtonProps = {
  job: Record<string, any>
}

export const DataSummaryExportDownloadButton = (props: DataSummaryExportDownloadButtonProps) => {
  const { job } = props

  const dispatch = useAppDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const { exportUuid } = JobSerialized.getResult(job)

  const onClick = useCallback(() => dispatch(JobActions.hideJobMonitor()), [dispatch])

  return (
    <ButtonDownload
      testId={TestId.dataExport.downloadExportedFileBtn}
      href={API.downloadExportedDataSummaryUrl({ surveyId, cycle, exportUuid })}
      onClick={onClick}
      variant="contained"
    />
  )
}
