import React, { useEffect, useState, useRef } from 'react'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import User from '../../../../../common/user/user'
import Survey from '../../../../../common/survey/survey'
import UserValidator from '../../../../../common/user/userValidator'
import AuthGroups from '../../../../../common/auth/authGroups'
import Authorizer from '../../../../../common/auth/authorizer'

import {
  useAsyncGetRequest,
  useAsyncPostRequest,
  useAsyncMultipartPutRequest,
  useFormObject,
  useOnUpdate,
  usePrevious,
} from '../../../../commonComponents/hooks'

import { appModuleUri, userModules } from '../../../appModules'

export const useUserViewState = props => {
  const {
    user, surveyInfo, userUuid,
    showAppLoader, hideAppLoader, showNotificationMessage, setUser,
    history,
  } = props

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const i18n = useI18n()

  const { data: userToUpdate = {}, dispatch: fetchUser, loaded } = useAsyncGetRequest(
    `/api/survey/${surveyId}/user/${userUuid}`
  )

  const isInvitation = !userUuid
  const isUserAcceptPending = !(isInvitation || User.hasAccepted(userToUpdate))

  // FormData object to be used for the multipart/form-data put request
  const [formData, setFormData] = useState(null)

  // form fields edit permissions
  const [editPermissions, setEditPermissions] = useState({
    name: false,
    group: isInvitation ? Authorizer.canInviteUsers(user, surveyInfo) : false,
    email: isInvitation ? Authorizer.canInviteUsers(user, surveyInfo) : false,
  })

  // local form object
  const {
    object: formObject, objectValid,
    setObjectField, enableValidation, getFieldValidation,
  } = useFormObject(
    { name: '', email: '', groupUuid: null },
    isInvitation || isUserAcceptPending ? UserValidator.validateInvitation : UserValidator.validateUser,
    !isInvitation
  )


  // USER ATTRIBUTES

  // form object setters
  const setName = name => setObjectField('name', name)
  const setEmail = email => setObjectField('email', email)
  const setGroup = group => {
    const groupUuid = AuthGroups.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  const [surveyGroupsMenuItems, setSurveyGroupsMenuItems] = useState([])

  useEffect(() => {
    // init form groups

    // All groups if published, SurveyAdmin group otherwise
    const surveyGroups = Survey.isPublished(surveyInfo)
      ? Survey.getAuthGroups(surveyInfo)
      : [Survey.getAuthGroupAdmin(surveyInfo)]

    // Add SystemAdmin group if current user is a SystemAdmin himself
    const menuGroups = R.when(
      R.always(User.isSystemAdmin(user)),
      R.concat(User.getAuthGroups(user))
    )(surveyGroups)

    setSurveyGroupsMenuItems(menuGroups.map(g => ({
      uuid: AuthGroups.getUuid(g),
      label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label_plural`)
    })))

    // init user
    if (!isInvitation) {
      fetchUser()
    }
  }, [])

  const ready = useRef(isInvitation)

  useEffect(() => {
    if (loaded) {
      // set form object field from server side response
      setName(isUserAcceptPending ? '' : User.getName(userToUpdate)) // Name can be null if user has not accepted the invitation
      setEmail(User.getEmail(userToUpdate))
      setGroup(Authorizer.getSurveyUserGroup(userToUpdate, surveyInfo))

      // set edit form permissions
      const canEdit = Authorizer.canEditUser(user, surveyInfo, userToUpdate)
      setEditPermissions({
        name: !isUserAcceptPending && canEdit,
        email: !isUserAcceptPending && Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate),
        group: !isUserAcceptPending && Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate),
      })

      ready.current = true
      enableValidation()
    }
  }, [loaded])


  // PROFILE PICTURE

  const [profilePicture, setProfilePicture] = useState(null)
  const prevProfilePicture = usePrevious(profilePicture)
  const pictureChanged = useRef(false)

  useEffect(() => {
    setFormData(formDataPrev => ({ ...formDataPrev, ...formObject }))
  }, [formObject])

  useEffect(() => {
    if (prevProfilePicture) {
      pictureChanged.current = true
      // Only send the picture file if it has been edited by the user
      setFormData(formDataPrev => ({ ...formDataPrev, file: profilePicture }))
    }
  }, [profilePicture])

  // SAVE

  // persist user/invitation actions
  const {
    dispatch: saveUser,
    loaded: userSaved,
    data: userSaveResponse,
    error: userSaveError,
  } = isInvitation
    ? useAsyncPostRequest(`/api/survey/${surveyId}/users/invite`, R.omit(['name'], formObject))
    : useAsyncMultipartPutRequest(`/api/survey/${surveyId}/user/${User.getUuid(userToUpdate)}`, formData)

  useOnUpdate(() => {
    hideAppLoader()
    if (userSaveError) {
      showNotificationMessage('userView.errorSavingUser', { error: userSaveError })
    } else if (userSaved) {
      // update user in redux state if self
      if (User.isEqual(user)(userSaveResponse)) {
        setUser(userSaveResponse)
      }

      if (isInvitation) {
        showNotificationMessage('usersView.inviteUserConfirmation', { email: formObject.email })
      } else {
        showNotificationMessage('usersView.updateUserConfirmation', { name: formObject.name })
      }

      history.push(appModuleUri(userModules.users))
    }
  }, [userSaved, userSaveError])

  const sendRequest = () => {
    showAppLoader()
    saveUser()
  }

  return {
    ready: ready.current,
    loaded: isInvitation || loaded,

    isUserAcceptPending,
    isInvitation,

    canEdit: editPermissions.name || editPermissions.group || editPermissions.email,
    canEditName: editPermissions.name,
    canEditGroup: editPermissions.group,
    canEditEmail: editPermissions.email,
    pictureEditorEnabled: userToUpdate.hasProfilePicture || pictureChanged.current,

    name: formObject.name,
    email: formObject.email,
    group: surveyGroupsMenuItems.find(R.propEq('uuid', formObject.groupUuid)),
    surveyGroupsMenuItems,
    objectValid,

    getFieldValidation,
    setName,
    setEmail,
    setGroup,
    setProfilePicture,

    sendRequest,
  }
}
