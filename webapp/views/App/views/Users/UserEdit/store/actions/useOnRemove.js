import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useLang } from '@webapp/store/system'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'

export const useOnRemove = ({ userToUpdate }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const lang = useLang()
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()

  const remove = async () => {
    try {
      dispatch(LoaderActions.showLoader())

      await axios.delete(`/api/survey/${surveyId}/user/${User.getUuid(userToUpdate)}`)

      dispatch(
        NotificationActions.notifyInfo({
          key: 'userView.removeUserConfirmation',
          params: {
            user: User.getName(userToUpdate),
            survey: Survey.getLabel(surveyInfo, lang),
          },
        })
      )
      history.push(appModuleUri(userModules.usersSurvey))
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }

  return () => {
    ;(async () => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'userView.confirmRemove',
          params: {
            user: User.getName(userToUpdate),
            survey: Survey.getLabel(surveyInfo, lang),
          },
          onOk: remove,
        })
      )
    })()
  }
}
