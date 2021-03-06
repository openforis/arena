import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Category from '@core/survey/category'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { State } from '../../state'

const _putCategoryProp = ({ surveyId, categoryUuid, key, value, setState }) => async (dispatch) => {
  const {
    data: { category },
  } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}`, { key, value })

  setState(State.assocCategory({ category }))

  dispatch(SurveyActions.metaUpdated())
}

export const useUpdateCategoryProp = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ key, value }) => {
    setState((statePrev) => {
      const category = State.getCategory(statePrev)
      const categoryUuid = Category.getUuid(category)

      dispatch(
        debounceAction(
          _putCategoryProp({ surveyId, categoryUuid, key, value, setState }),
          `category_prop_update_${categoryUuid}`
        )
      )

      return State.assocCategoryProp({ key, value })(statePrev)
    })
  }, [])
}
