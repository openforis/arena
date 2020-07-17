import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

const _delete = async ({ surveyId, category, level, item, setState, dispatch }) => {
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
        onOk: async () => {
          await _delete({ surveyId, category, level, item, setState, dispatch })
        },
      })
    )
  }, [])
}
