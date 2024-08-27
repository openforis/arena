import { useCallback } from 'react'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import * as API from '@webapp/service/api'

import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State } from '../../state'

export const useFetchLevelItems = ({ setState }) => {
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()

  return useCallback(
    async ({ state }) => {
      const category = State.getCategory(state)
      const categoryUuid = Category.getUuid(category)
      const itemActiveLastLevelIndex = State.getItemActiveLastLevelIndex(state)
      const levelIndex = itemActiveLastLevelIndex >= 0 ? itemActiveLastLevelIndex + 1 : 0
      const itemActiveLastLevel = State.getItemActive({ levelIndex: levelIndex - 1 })(state)
      const parentUuid = CategoryItem.getUuid(itemActiveLastLevel)

      // Reset level items
      setState(State.assocItemsLoading({ levelIndex })), A.pipe(State.dissocItems({ levelIndex }))

      const { request } = API.fetchCategoryItems({
        surveyId,
        categoryUuid,
        draft: canEdit,
        parentUuid,
      })

      const {
        data: { items },
      } = await request

      setState(A.pipe(State.dissocItemsLoading({ levelIndex }), State.assocItems({ levelIndex, items })))
    },
    [canEdit, setState, surveyId]
  )
}
