import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'

import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'
import { useFetchLevelItems } from '../item/useFetchLevelItems'

const _onImportComplete = ({ state, setState, fetchLevelItems, job }) => async (dispatch) => {
  dispatch(SurveyActions.metaUpdated())

  const stateUpdated = A.pipe(
    State.assocCategory({ category: job.result.category }),
    State.dissocImportSummary,
    State.dissocItemsActive
  )(state)

  await setState(stateUpdated)

  // Fetch first level items
  await fetchLevelItems({ state: stateUpdated })
}

export const useImportCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(async ({ state }) => {
    const category = State.getCategory(state)
    const categoryUuid = Category.getUuid(category)
    const importSummary = State.getImportSummary(state)

    const {
      data: { job },
    } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/import`, importSummary)

    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: (jobCompleted) =>
          dispatch(_onImportComplete({ state, setState, fetchLevelItems, job: jobCompleted })),
      })
    )
  }, [])
}
