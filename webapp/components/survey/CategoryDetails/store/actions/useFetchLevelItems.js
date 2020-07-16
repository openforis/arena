import { useCallback } from 'react'
import axios from 'axios'

import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State } from '../state'

export const useFetchLevelItems = ({ setState }) => {
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  return useCallback(async ({ categoryUuid, levelIndex = 0, parentUuid = null }) => {
    // Reset level items
    setState(State.dissocItems({ levelIndex }))

    const {
      data: { items },
    } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
      params: { draft: canEdit, parentUuid },
    })

    setState(State.assocItems({ levelIndex, items }))
  }, [])
}
