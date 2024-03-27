import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'
import { useFetchLevelItems } from '../item/useFetchLevelItems'

export const useInit = ({ setState }) => {
  const surveyId = useSurveyId()
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(async ({ categoryUuid, onCategoryUpdate }) => {
    const category = await API.fetchCategory({ surveyId, categoryUuid })

    const stateUpdated = State.create({ category, onCategoryUpdate })
    setState(stateUpdated)
    await fetchLevelItems({ state: stateUpdated })
  }, [])
}
