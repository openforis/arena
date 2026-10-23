import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'
import { FileFormats } from '@core/fileFormats'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'

type Props = {
  job: any
}

export const SelectedRecordsExportDownloadButton = (props: Props) => {
  const { job } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const { downloadToken } = JobSerialized.getResult(job)

  const onClick = useCallback(() => {
    dispatch(JobActions.hideJobMonitor() as any)
  }, [dispatch])

  // the zip can be big (it includes the record files): downloaded directly, not in memory
  return (
    <ButtonDownload
      downloadInMemory={false}
      href={API.downloadFileUrl({ downloadToken, surveyId, fileType: 'Records', fileFormat: FileFormats.zip })}
      onClick={onClick}
      variant="contained"
    />
  )
}
