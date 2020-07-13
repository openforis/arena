import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

export const useUpdateLevelProp = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ category, level, key, value }) => {
    const levelUuid = CategoryLevel.getUuid(level)

    const action = async () => {
      const { data } = await axios.put(
        `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/levels/${levelUuid}`,
        { key, value }
      )
    }

    dispatch(debounceAction(action, `category_level_prop_update_${levelUuid}`))
  }, [])
}
