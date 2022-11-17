import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { State } from '../../state'

const _putCategoryProp =
  ({ surveyId, categoryUuid, key, value, setState }) =>
  async (dispatch) => {
    const category = await API.updateCategoryProp({ surveyId, categoryUuid, key, value })

    setState((statePrev) => {
      const stateUpdated = State.assocCategory({ category })(statePrev)
      const onCategoryUpdate = State.getOnCategoryUpdate(stateUpdated)
      onCategoryUpdate?.({ category })
      return stateUpdated
    })

    dispatch(SurveyActions.surveyCategoryUpdated(category))
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
