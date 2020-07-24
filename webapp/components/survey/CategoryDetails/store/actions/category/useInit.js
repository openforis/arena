import { useCallback } from 'react'

import * as API from '@webapp/service/api'

import { useSurveyId } from '@webapp/store/survey'

import { useFetchLevelItems } from '../item/useFetchLevelItems'
import { State } from '../../state'

export const useInit = ({ setState }) => {
  const surveyId = useSurveyId()
  const fetchLevelItems = useFetchLevelItems({ setState })

  return useCallback(async ({ categoryUuid }) => {
    const category = await API.fetchCategory({ surveyId, categoryUuid })

    const stateUpdated = State.create({ category })
    setState(stateUpdated)
    await fetchLevelItems({ state: stateUpdated })
  }, [])
}
