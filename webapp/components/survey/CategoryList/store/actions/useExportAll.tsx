import { useCallback } from 'react'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'

export const useExportAll = () => {
  const surveyId = useSurveyId()
  const dispatch = useAppDispatch()

  // always export draft properties
  const draft = true

  return useCallback(
    async ({ fileFormat }) => {
      const { job } = await API.startExportAllCategoriesJob({ surveyId, draft, fileFormat })

      dispatch(
        JobActions.showJobMonitor({
          job,
          closeButton: ({ job: jobCompleted }) => {
            const { tempFileName } = jobCompleted.result
            return (
              <ButtonDownload
                href={`/api/survey/${surveyId}/categories/export/download`}
                requestParams={{ tempFileName, draft }}
                onClick={() => dispatch(JobActions.hideJobMonitor())}
                variant="contained"
              />
            )
          },
        })
      )
    },
    [dispatch, draft, surveyId]
  )
}
