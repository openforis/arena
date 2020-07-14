import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as A from '@core/arena'

import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useImportCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid, importSummary }) => {
    const {
      data: { job },
    } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/import`, importSummary)

    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: (jobCompleted) => {
          // Reload category
          setState(A.pipe(State.assocCategory({ category: jobCompleted.result.category }), State.dissocImportSummary))
          // TODO reset active items, load first level items
        },
      })
    )
  }, [])
}
