import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { cancelDebouncedAction, debounceAction } from '@webapp/utils/reduxUtils'

import { State } from '../../state'
import { Objects } from '@openforis/arena-core'

const _putCategoryProp =
  ({ surveyId, categoryUuid, key, value, setState }) =>
  async (dispatch) => {
    const category = await API.updateCategoryProp({ surveyId, categoryUuid, key, value })

    setState((statePrev) => {
      const categoryPrev = State.getCategory(statePrev)
      // update UI state only when category comes from the last update performed server side
      const stateUpdated =
        !State.isDirty(statePrev) || isCategoryPropsEqual(category, categoryPrev)
          ? A.pipe(State.assocCategory({ category }), State.dissocDirty)(statePrev)
          : statePrev
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
      const debounceKey = `category_prop_update_${categoryUuid}_${key}`

      cancelDebouncedAction(debounceKey)
      dispatch(debounceAction(_putCategoryProp({ surveyId, categoryUuid, key, value, setState }), debounceKey))

      return A.pipe(State.assocDirty, State.assocCategoryProp({ key, value }))(statePrev)
    })
  }, [])
}

const isCategoryPropsEqual = (category1, category2) => {
  const prepareItemToCompare = A.omit(Category.keys.validation)
  return Objects.isEqual(prepareItemToCompare(category1), prepareItemToCompare(category2))
}
