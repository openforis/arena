import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

import { State } from '../state'

export const useDelete = ({ setState }) => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  return useCallback(() => {
    setState((state) => {
      const category = State.getCategory(state)
      const initData = State.getInitData(state)
      const unused = State.isUnused(state)

      if (unused) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'categoryEdit.confirmDelete',
            params: { categoryName: Category.getName(category) || i18n.t('common.undefinedName') },
            onOk: () => dispatch(CategoryActions.deleteCategory({ category, callback: initData })),
          })
        )
      } else {
        dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' }))
      }
      return state
    })
  }, [])
}
