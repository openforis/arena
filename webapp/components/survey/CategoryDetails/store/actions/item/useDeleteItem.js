import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'

import { State } from '../../state'

const _delete =
  ({ surveyId, category, level, item, setState }) =>
  async (dispatch) => {
    dispatch(LoaderActions.showLoader())

    const {
      data: { category: categoryUpdated },
    } = await axios.delete(
      `/api/survey/${surveyId}/categories/${Category.getUuid(category)}/items/${CategoryItem.getUuid(item)}`
    )
    setState(
      A.pipe(
        State.dissocItem({ levelIndex: CategoryLevel.getIndex(level), itemUuid: CategoryItem.getUuid(item) }),
        State.assocCategory({ category: categoryUpdated })
      )
    )

    dispatch(SurveyActions.metaUpdated())
    dispatch(LoaderActions.hideLoader())
  }

export const useDeleteItem = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(({ category, level, item, leaf }) => {
    const messageKeyConfirm = leaf ? 'categoryEdit.confirmDeleteItem' : 'categoryEdit.confirmDeleteItemWithChildren'

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: messageKeyConfirm,
        onOk: () => dispatch(_delete({ surveyId, category, level, item, setState })),
      })
    )
  }, [])
}
