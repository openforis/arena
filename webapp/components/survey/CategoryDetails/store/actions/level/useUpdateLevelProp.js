import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { State } from '../../state'

const _putProp = ({ surveyId, categoryUuid, levelUuid, key, value, dispatch }) => {
  const action = async () => {
    await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/levels/${levelUuid}`, { key, value })

    dispatch(SurveyActions.metaUpdated())
  }

  dispatch(debounceAction(action, `category_level_prop_update_${levelUuid}`))
}

export const useUpdateLevelProp = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ category, level, key, value }) => {
    const categoryUuid = Category.getUuid(category)
    const levelUuid = CategoryLevel.getUuid(level)
    const levelIndex = CategoryLevel.getIndex(level)

    setState(State.assocLevelProp({ levelIndex, key, value }))

    _putProp({ surveyId, categoryUuid, levelUuid, key, value, dispatch })
  }, [])
}
