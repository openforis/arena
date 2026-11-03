import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

type Props = {
  job: any
}

export const DataMatrixExportDownloadButton = (props: Props) => {
  const { job } = props

  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  const { downloadToken, fileFormat } = JobSerialized.getResult(job)

  const onClick = useCallback(() => {
    dispatch(JobActions.hideJobMonitor() as any)
  }, [dispatch])

  return (
    <ButtonDownload
      testId={TestId.dataExport.downloadExportedFileBtn}
      downloadInMemory={false}
      href={API.downloadFileUrl({ downloadToken, surveyId, cycle, fileType: 'DataMatrix', fileFormat })}
      onClick={onClick}
      variant="contained"
    />
  )
}
