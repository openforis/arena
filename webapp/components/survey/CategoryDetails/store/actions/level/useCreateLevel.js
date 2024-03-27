import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

export const useCreateLevel = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ category }) => {
    const level = Category.newLevel(category)

    const {
      data: { category: categoryUpdated },
    } = await axios.post(`/api/survey/${surveyId}/categories/${Category.getUuid(category)}/levels`, level)

    setState(State.assocCategory({ category: categoryUpdated }))

    dispatch(SurveyActions.surveyCategoryUpdated(categoryUpdated))
    dispatch(SurveyActions.metaUpdated())
  }, [])
}
