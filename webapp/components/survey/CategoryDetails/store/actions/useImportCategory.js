import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as A from '@core/arena'

import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'
import { useFetchLevelItems } from './useFetchLevelItems'

export const useImportCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(async ({ categoryUuid, importSummary }) => {
    const {
      data: { job },
    } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/import`, importSummary)

    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: async (jobCompleted) => {
          dispatch(SurveyActions.metaUpdated())

          // Update category details state
          setState(
            A.pipe(
              State.assocCategory({ category: jobCompleted.result.category }),
              State.dissocImportSummary,
              State.dissocLevelActiveItems
            )
          )
          // Fetch first level items
          await fetchLevelItems({ categoryUuid })
        },
      })
    )
  }, [])
}
