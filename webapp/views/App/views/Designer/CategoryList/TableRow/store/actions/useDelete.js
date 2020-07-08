import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

import { State } from '../state'

export const useDelete = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  return useCallback(({ state }) => {
    const category = State.getCategory(state)
    const categoryName = Category.getName(category)
    const unused = State.isUnused(state)

    if (unused) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'categoryEdit.confirmDelete',
          params: { categoryName: categoryName || i18n.t('common.undefinedName') },
          onOk: () => dispatch(CategoryActions.deleteCategory({ category, callback: State.getInitData(state) })),
        })
      )
    } else {
      dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' }))
    }
  }, [])
}
