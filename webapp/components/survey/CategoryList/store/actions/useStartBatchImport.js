import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'

export const useStartBatchImport = () => {
  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  return useCallback(
    async ({ file }) => {
      const { job } = await API.startCategoriesBatchImportJob({ surveyId, file })

      dispatch(
        JobActions.showJobMonitor({
          job,
          closeButton: ({ job: jobCompleted }) => {},
        })
      )
    },
    [dispatch, surveyId]
  )
}
