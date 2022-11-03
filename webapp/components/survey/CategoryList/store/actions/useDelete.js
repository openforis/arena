import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'

const _delete =
  ({ survey, category, callback }) =>
  async (dispatch) => {
    const surveyId = Survey.getId(survey)
    const categoryUuid = Category.getUuid(category)
    await API.deleteCategory({ surveyId, categoryUuid })

    dispatch(SurveyActions.surveyCategoryDeleted(category))

    if (callback) {
      callback()
    }
  }

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
            onOk: async () => dispatch(_delete({ survey, category, callback: initData })),
          })
        )
      } else {
        dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeleted' }))
      }
    },
    [survey]
  )
}
