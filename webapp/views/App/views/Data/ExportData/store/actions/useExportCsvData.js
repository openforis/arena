import axios from 'axios'
import { useDispatch } from 'react-redux'

import { useSurveyId } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import * as JobSerialized from '@common/job/jobSerialized'

export const useExportCsvData = ({ setExportDataUrl }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return () => {
    ;(async () => {
      const { data } = await axios.post(`/api/survey/${surveyId}/export-csv-data`)

      dispatch(
        JobActions.showJobMonitor({
          job: data.job,
          onComplete: async (job) => {
            const { exportDataFolderName } = JobSerialized.getResult(job)
            setExportDataUrl(exportDataFolderName)
          },
        })
      )
    })()
  }
}
