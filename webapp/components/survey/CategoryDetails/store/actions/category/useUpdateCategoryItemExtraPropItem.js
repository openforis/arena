import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { useRefreshCategory } from './useRefreshCategory'

export const useUpdateCategoryItemExtraPropItem = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const refreshCategory = useRefreshCategory({ setState })

  return useCallback(async ({ categoryUuid, name, itemExtraDef = null, deleted = false }) => {
    const category = await API.updateCategoryItemExtraDefItem({ surveyId, categoryUuid, name, itemExtraDef, deleted })

    refreshCategory({ category })

    dispatch(SurveyActions.surveyCategoryUpdated(category))
    dispatch(SurveyActions.metaUpdated())
  }, [])
}
