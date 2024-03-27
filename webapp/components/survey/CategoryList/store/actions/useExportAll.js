import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { ButtonDownload } from '@webapp/components/buttons'
import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'

export const useExportAll = () => {
  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  // always export draft properties
  const draft = true

  return useCallback(async () => {
    const { job } = await API.startExportAllCategoriesJob({ surveyId, draft })

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
            />
          )
        },
      })
    )
  }, [])
}
