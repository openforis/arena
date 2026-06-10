import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as User from '@core/user/user'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

export const useOnSaveExtraProps = ({ userToUpdate }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async () => {
    try {
      dispatch(LoaderActions.showLoader())
      const userUuid = User.getUuid(userToUpdate)
      const extraProps = User.getAuthGroupExtraProps(userToUpdate)
      await axios.put(`/api/survey/${surveyId}/user/${userUuid}/extraProps`, { extraProps })
      dispatch(
        NotificationActions.notifyInfo({
          key: 'usersView:updateUserConfirmation',
          params: { name: User.getName(userToUpdate) },
        })
      )
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }, [dispatch, surveyId, userToUpdate])
}
