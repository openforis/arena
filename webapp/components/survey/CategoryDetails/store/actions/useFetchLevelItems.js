import { useCallback } from 'react'
import axios from 'axios'

import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useFetchLevelItems = ({ setState }) => {
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid, levelIndex = 0, parentUuid = null }) => {
    // Reset level items
    setState(State.dissocLevelItems({ levelIndex }))

    const {
      data: { items },
    } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
      params: { draft: true, parentUuid },
    })

    setState(State.assocLevelItems({ levelIndex, items }))
  }, [])
}
