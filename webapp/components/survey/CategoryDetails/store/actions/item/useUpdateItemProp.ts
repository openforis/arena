import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'
import { State } from '../../state'

const _putPropAction =
  ({ surveyId, categoryUuid, itemUuid, key, value, setState }) =>
  async (dispatch) => {
    dispatch(AppSavingActions.showAppSaving())
    const category = await API.updateCategoryItemProp({ surveyId, categoryUuid, itemUuid, key, value })

    dispatch(SurveyActions.metaUpdated())

    // Update category with validation in state
    setState(State.assocCategory({ category }))

    dispatch(AppSavingActions.hideAppSaving())
  }

export const useUpdateItemProp = ({ setState }) => {
  const dispatch = useAppDispatch()
  const surveyId = useSurveyId()

  return useCallback(({ categoryUuid, levelIndex, itemUuid, key, value }) => {
    setState(State.assocItemProp({ levelIndex, itemUuid, key, value }))

    dispatch(
      debounceAction(
        _putPropAction({ surveyId, categoryUuid, itemUuid, key, value, setState }),
        // one debounce per item prop: otherwise editing another prop of the same item (e.g. code and then label)
        // before the previous change has been saved would discard it
        `category_item_update_${itemUuid}_${key}`
      )
    )
  }, [])
}
