import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { appModuleUri, userModules } from '@webapp/app/appModules'

import { useUser, UserActions } from '@webapp/store/user'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

import { validateUserEdit } from './validate'

export const useOnSave = ({ userToUpdate }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const user = useUser()
  const surveyId = useSurveyId()
  const { profilePicture } = userToUpdate

  return () => {
    ;(async () => {
      const userUpdatedValidated = await validateUserEdit(userToUpdate)

      if (Validation.isObjValid(userUpdatedValidated)) {
        const editingSelf = User.isEqual(user)(userToUpdate)
        try {
          dispatch(LoaderActions.showLoader())

          const formData = new FormData()
          formData.append(User.keys.uuid, User.getUuid(userToUpdate))
          formData.append(User.keys.name, User.getName(userToUpdate))
          formData.append(User.keys.email, User.getEmail(userToUpdate))
          formData.append(User.keys.groupUuid, User.getGroupUuid(userToUpdate))

          formData.append(User.keys.props, JSON.stringify(User.getProps(userToUpdate)))

          if (profilePicture) {
            formData.append('file', profilePicture)
          }

          await axios.put(
            `/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${User.getUuid(userToUpdate)}`,
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

          if (!editingSelf) {
            history.push(appModuleUri(userModules.users))
          }
        } finally {
          dispatch(LoaderActions.hideLoader())
        }
      }
    })()
  }
}
