import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Category from '@core/survey/category'

import { useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { State } from '../state'

const _updateCategoryProp = async ({ dispatch, surveyId, categoryUuid, key, value, setState }) => {
  dispatch(
    debounceAction(async () => {
      const {
        data: { category },
      } = await axios.put(`/api/survey/${surveyId}/categories/${categoryUuid}`, { key, value })

      setState(State.assocCategory({ category }))
    }, `category_prop_update_${categoryUuid}`)
  )
}

export const useUpdateCategoryProp = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ key, value }) => {
    setState((statePrev) => {
      const category = State.getCategory(statePrev)
      const categoryUuid = Category.getUuid(category)

      _updateCategoryProp({ dispatch, surveyId, categoryUuid, key, value, setState })

      return State.assocCategoryProp({ key, value })(statePrev)
    })
  }, [])
}
