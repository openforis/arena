import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useConfirm } from '@webapp/components/hooks'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'
import { useLang } from '@webapp/store/system'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

export const useOnRemove = ({ userToUpdate }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const confirm = useConfirm()
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
      navigate(appModuleUri(userModules.usersSurvey))
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }

  return () => {
    confirm({
      key: 'userView.confirmRemove',
      params: {
        user: User.getName(userToUpdate),
        survey: Survey.getLabel(surveyInfo, lang),
      },
      onOk: remove,
    })
  }
}
