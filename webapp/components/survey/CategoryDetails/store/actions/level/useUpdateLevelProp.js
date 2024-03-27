import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { State } from '../../state'

const _putProp =
  ({ surveyId, categoryUuid, levelUuid, key, value, setState }) =>
  async (dispatch) => {
    const {
      data: { category },
    } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}/levels/${levelUuid}`, { key, value })

    setState(State.assocCategory({ category }))

    dispatch(SurveyActions.surveyCategoryUpdated(category))
    dispatch(SurveyActions.metaUpdated())
  }

export const useUpdateLevelProp = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ category, level, key, value }) => {
    const categoryUuid = Category.getUuid(category)
    const levelUuid = CategoryLevel.getUuid(level)
    const levelIndex = CategoryLevel.getIndex(level)

    setState(State.assocLevelProp({ levelIndex, key, value }))

    dispatch(
      debounceAction(
        _putProp({ surveyId, categoryUuid, levelUuid, key, value, setState }),
        `category_level_prop_update_${levelUuid}`
      )
    )
  }, [])
}
