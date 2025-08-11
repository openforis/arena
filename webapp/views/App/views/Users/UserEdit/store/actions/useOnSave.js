import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as A from '@core/arena'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { useQuery } from '@webapp/components/hooks'
import { useUser, UserActions } from '@webapp/store/user'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

import { validateUserEdit } from './validate'

export const useOnSave = ({ userToUpdate, userToUpdateOriginal = null, setUserToUpdateOriginal = null }) => {
  const dispatch = useDispatch()
  const { hideSurveyGroup } = useQuery()
  const user = useUser()
  const surveyId = useSurveyId()

  const saveUser = useCallback(async () => {
    const editingSelf = User.isEqual(user)(userToUpdate)
    const userToUpdateUuid = User.getUuid(userToUpdate)
    const profilePictureSet = User.isProfilePictureSet(userToUpdate)
    const profilePicture = User.getProfilePicture(userToUpdate)

    try {
      dispatch(LoaderActions.showLoader())

      const formData = new FormData()
      const userData = {
        [User.keys.uuid]: userToUpdateUuid,
        [User.keys.name]: User.getName(userToUpdate),
        [User.keys.email]: User.getEmail(userToUpdate),
        [User.keys.props]: User.getProps(userToUpdate),
        [User.keys.authGroupsUuids]: User.getAuthGroupsUuids(userToUpdate),
        [User.keys.authGroupExtraProps]: User.getAuthGroupExtraProps(userToUpdate),
        [User.keys.profilePictureSet]: profilePictureSet,
      }

      formData.append('user', A.stringify(userData))

      if (profilePictureSet) {
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
      setUserToUpdateOriginal?.(userToUpdate)
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }, [dispatch, hideSurveyGroup, setUserToUpdateOriginal, surveyId, user, userToUpdate])

  return useCallback(async () => {
    const userUpdatedValidated = await validateUserEdit(userToUpdate)

    if (Validation.isObjValid(userUpdatedValidated)) {
      if (userToUpdateOriginal && User.isSystemAdmin(userToUpdate) && !User.isSystemAdmin(userToUpdateOriginal)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'usersView.confirmUserWillBeSystemAdmin',
            onOk: saveUser,
          })
        )
      } else {
        await saveUser()
      }
    }
  }, [dispatch, saveUser, userToUpdate, userToUpdateOriginal])
}
