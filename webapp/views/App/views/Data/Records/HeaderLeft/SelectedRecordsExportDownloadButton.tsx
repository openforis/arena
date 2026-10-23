import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyId, useSurveyName } from '@webapp/store/survey'

type Props = {
  job: any
}

export const SelectedRecordsExportDownloadButton = (props: Props) => {
  const { job } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const surveyName = useSurveyName()

  const { outputFileName: fileName } = JobSerialized.getResult(job)

  const onClick = useCallback(() => {
    dispatch(JobActions.hideJobMonitor() as any)
  }, [dispatch])

  return (
    <ButtonDownload
      href={API.getSelectedRecordsExportDownloadUrl({ surveyId, surveyName, fileName })}
      onClick={onClick}
      variant="contained"
    />
  )
}
