import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

export const useDelete = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const survey = useSurvey()

  return useCallback(
    ({ category, initData }) => {
      const unused = A.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))

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
    },
    [survey]
  )
}
