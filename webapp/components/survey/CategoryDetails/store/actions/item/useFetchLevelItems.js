import { useCallback } from 'react'
import axios from 'axios'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State } from '../../state'

export const useFetchLevelItems = ({ setState }) => {
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  return useCallback(async ({ state }) => {
    const category = State.getCategory(state)
    const categoryUuid = Category.getUuid(category)
    const itemActiveLastLevelIndex = State.getItemActiveLastLevelIndex(state)
    const levelIndex = itemActiveLastLevelIndex >= 0 ? itemActiveLastLevelIndex + 1 : 0
    const itemActiveLastLevel = State.getItemActive({ levelIndex: levelIndex - 1 })(state)
    const parentUuid = CategoryItem.getUuid(itemActiveLastLevel)

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
