import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

export const useCreateItem = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ category, level, parentItemUuid = null }) => {
    const categoryUuid = Category.getUuid(category)
    const levelIndex = CategoryLevel.getIndex(level)
    const item = CategoryItem.newItem(CategoryLevel.getUuid(level), parentItemUuid)

    setState(
      A.pipe(
        State.assocItem({ levelIndex, item }),
        State.assocItemActive({ levelIndex, itemUuid: CategoryItem.getUuid(item) })
      )
    )

    const {
      data: { category: categoryUpdated, item: itemInserted },
    } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, item)

    dispatch(SurveyActions.metaUpdated())

    setState(
      A.pipe(State.assocCategory({ category: categoryUpdated }), State.assocItem({ levelIndex, item: itemInserted }))
    )
  }, [])
}
