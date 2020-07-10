import { useCallback } from 'react'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import axios from 'axios'

import * as A from '@core/arena'

import * as Category from '@core/survey/category'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

const _createCategory = async ({ surveyId, onCategoryCreated, dispatch }) => {
  const {
    data: { category },
  } = await axios.post(`/api/survey/${surveyId}/categories`, Category.newCategory())

  if (onCategoryCreated) {
    onCategoryCreated(category)
  }
  dispatch(SurveyActions.metaUpdated())

  return category
}

const _fetchCategory = async ({ surveyId, categoryUuid }) => {
  const {
    data: { category },
  } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}?draft=true&validate=true`)

  return category
}

export const useInit = ({ setState }) => {
  const { categoryUuid: categoryUuidParam } = useParams()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ onCategoryCreated, category }) => {
    let categoryToSet = category

    if (A.isEmpty(categoryToSet)) {
      if (A.isEmpty(categoryUuidParam)) {
        categoryToSet = await _createCategory({ surveyId, onCategoryCreated, categoryToSet, dispatch })
      } else {
        categoryToSet = await _fetchCategory({ surveyId, categoryUuid: categoryUuidParam })
      }
    }

    setState(State.create({ category: categoryToSet }))
  }, [])
}
