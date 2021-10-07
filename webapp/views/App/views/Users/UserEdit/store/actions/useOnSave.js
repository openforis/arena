import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import axios from 'axios'

import * as A from '@core/arena'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { useQuery } from '@webapp/components/hooks'
import { useUser, UserActions } from '@webapp/store/user'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

import { validateUserEdit } from './validate'

export const useOnSave = ({ userToUpdate, userToUpdateOriginal }) => {
  const dispatch = useDispatch()
  const { hideSurveyGroup } = useQuery()
  const history = useHistory()
  const user = useUser()
  const surveyId = useSurveyId()
  const { profilePicture } = userToUpdate

  return useCallback(async () => {
    const userUpdatedValidated = await validateUserEdit(userToUpdate)

    if (Validation.isObjValid(userUpdatedValidated)) {
      const editingSelf = User.isEqual(user)(userToUpdate)
      const userToUpdateUuid = User.getUuid(userToUpdate)
      try {
        dispatch(LoaderActions.showLoader())

        const formData = new FormData()
        const userData = {
          [User.keys.uuid]: userToUpdateUuid,
          [User.keys.name]: User.getName(userToUpdate),
          [User.keys.email]: User.getEmail(userToUpdate),
          [User.keys.authGroupsUuids]: User.getAuthGroupsUuids(userToUpdate),
          [User.keys.props]: User.getProps(userToUpdate),
        }

        formData.append('user', A.stringify(userData))

        if (profilePicture) {
          formData.append('file', profilePicture)
        }

        await axios.put(
          editingSelf || hideSurveyGroup
            ? `/api/user/${userToUpdateUuid}`
            : `/api/survey/${surveyId}/user/${userToUpdateUuid}`,
          formData
        )

        if (editingSelf) {
          dispatch(UserActions.setUser({ user: userToUpdate }))
        }

        dispatch(
          NotificationActions.notifyInfo({
            key: 'usersView.updateUserConfirmation',
            params: { name: User.getName(userToUpdate) },
          })
        )
      } finally {
        dispatch(LoaderActions.hideLoader())
      }
    }
  }, [userToUpdate, userToUpdateOriginal])
}
