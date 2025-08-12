import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import axios from 'axios'

import * as A from '@core/arena'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { useQuery } from '@webapp/components/hooks'
import { useUser, UserActions } from '@webapp/store/user'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'
import { appModuleUri, userModules } from '@webapp/app/appModules'

import { validateUserEdit } from './validate'

const prepareFormData = ({ userToUpdate }) => {
  const formData = new FormData()

  const profilePictureSet = User.isProfilePictureSet(userToUpdate)
  const profilePicture = User.getProfilePicture(userToUpdate)

  const userData = {
    [User.keys.uuid]: User.getUuid(userToUpdate),
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
  return formData
}

const updateUser = async ({ dispatch, formData, user, userToUpdate, setUserToUpdate, hideSurveyGroup, surveyId }) => {
  const userToUpdateUuid = User.getUuid(userToUpdate)
  const editingSelf = User.isEqual(user)(userToUpdate)
  const {
    data: { user: userUpdated, validation },
  } = await axios.put(
    editingSelf || hideSurveyGroup
      ? `/api/user/${userToUpdateUuid}`
      : `/api/survey/${surveyId}/user/${userToUpdateUuid}`,
    formData
  )
  if (userUpdated) {
    if (editingSelf) {
      dispatch(UserActions.setUser({ user: userToUpdate }))
    }
    return true
  } else {
    const userToUpdateValidated = Validation.assocValidation(validation)(userToUpdate)
    setUserToUpdate(userToUpdateValidated)
    dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave' }))
    return false
  }
}

const insertUser = async ({ dispatch, navigate, formData, userToUpdate, setUserToUpdate }) => {
  const {
    data: { user: userCreated, validation },
  } = await axios.post('/api/user', formData)
  if (userCreated) {
    const userCreatedUuid = User.getUuid(userCreated)
    navigate(`${appModuleUri(userModules.user)}${userCreatedUuid}?hideSurveyGroup=true`)
    return true
  } else {
    const userToUpdateValidated = Validation.assocValidation(validation)(userToUpdate)
    setUserToUpdate(userToUpdateValidated)
    dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave' }))
    return false
  }
}

export const useOnSave = ({
  userToUpdate,
  setUserToUpdate,
  userToUpdateOriginal = null,
  setUserToUpdateOriginal = null,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hideSurveyGroup } = useQuery()
  const user = useUser()
  const surveyId = useSurveyId()

  const saveUser = useCallback(async () => {
    try {
      dispatch(LoaderActions.showLoader())
      const userToUpdateUuid = User.getUuid(userToUpdate)

      const formData = prepareFormData({ userToUpdate })

      let updateSuccessfull = false

      if (userToUpdateUuid) {
        updateSuccessfull = await updateUser({
          dispatch,
          formData,
          user,
          userToUpdate,
          setUserToUpdate,
          hideSurveyGroup,
          surveyId,
        })
      } else {
        updateSuccessfull = await insertUser({ dispatch, formData, navigate, userToUpdate, setUserToUpdate })
      }
      if (updateSuccessfull) {
        dispatch(
          NotificationActions.notifyInfo({
            key: 'usersView.updateUserConfirmation',
            params: { name: User.getName(userToUpdate) },
          })
        )
        setUserToUpdateOriginal?.(userToUpdate)
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }, [dispatch, hideSurveyGroup, navigate, setUserToUpdate, setUserToUpdateOriginal, surveyId, user, userToUpdate])

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
