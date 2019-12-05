import { useEffect, useState, useRef } from 'react'
import * as R from 'ramda'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as UserValidator from '@core/user/userValidator'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'

import {
  useI18n,
  useAsyncGetRequest,
  useAsyncPostRequest,
  useAsyncMultipartPutRequest,
  useAsyncDeleteRequest,
  useFormObject,
  useOnUpdate,
  usePrevious,
} from '@webapp/commonComponents/hooks'

import { appModuleUri, userModules } from '../../../appModules'

export const useUserViewState = props => {
  const {
    user,
    surveyInfo,
    surveyCycleKey,
    lang,
    userUuid,
    showAppLoader,
    hideAppLoader,
    showNotification,
    setUser,
    history,
  } = props

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const i18n = useI18n()
  const editingSelf = User.getUuid(user) === userUuid && !surveyId // This can happen for system administrator when they don't have an active survey

  const { data: userToUpdate = {}, dispatch: fetchUser, loaded } = useAsyncGetRequest(
    `/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${userUuid}`,
  )

  const isInvitation = !userUuid
  const isUserAcceptPending = !(isInvitation || User.hasAccepted(userToUpdate))

  // FormData object to be used for the multipart/form-data put request
  const [formData, setFormData] = useState(null)

  // Form fields edit permissions
  const [editPermissions, setEditPermissions] = useState({
    name: false,
    group: isInvitation ? Authorizer.canInviteUsers(user, surveyInfo) : false,
    email: isInvitation ? Authorizer.canInviteUsers(user, surveyInfo) : false,
    remove: false,
  })

  // Local form object
  const { object: formObject, objectValid, setObjectField, enableValidation, getFieldValidation } = useFormObject(
    { name: '', email: '', groupUuid: null },
    isInvitation || isUserAcceptPending ? UserValidator.validateInvitation : UserValidator.validateUser,
    !isInvitation,
  )

  // USER ATTRIBUTES

  // form object setters
  const setName = name => setObjectField('name', name)
  const setEmail = email => setObjectField('email', email)
  const setGroup = group => {
    const groupUuid = AuthGroup.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  const [surveyGroupsMenuItems, setSurveyGroupsMenuItems] = useState([])

  useEffect(() => {
    // Init form groups

    // All groups if published, SurveyAdmin group otherwise
    const surveyGroups = editingSelf
      ? []
      : Survey.isPublished(surveyInfo)
      ? Survey.getAuthGroups(surveyInfo)
      : [Survey.getAuthGroupAdmin(surveyInfo)]

    // Add SystemAdmin group if current user is a SystemAdmin himself
    const menuGroups = R.when(R.always(User.isSystemAdmin(user)), R.concat(User.getAuthGroups(user)))(surveyGroups)

    setSurveyGroupsMenuItems(
      menuGroups.map(g => ({
        uuid: AuthGroup.getUuid(g),
        label: i18n.t(`authGroups.${AuthGroup.getName(g)}.label_plural`),
      })),
    )

    // Init user
    if (!isInvitation) {
      fetchUser()
    }
  }, [])

  const ready = useRef(isInvitation)

  useEffect(() => {
    if (loaded) {
      // Set form object field from server side response
      setName(isUserAcceptPending ? '' : User.getName(userToUpdate)) // Name can be null if user has not accepted the invitation
      setEmail(User.getEmail(userToUpdate))
      setGroup(User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userToUpdate))

      // Set edit form permissions
      const canEdit = Authorizer.canEditUser(user, surveyInfo, userToUpdate)
      setEditPermissions({
        name: !isUserAcceptPending && canEdit,
        email: !isUserAcceptPending && Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate),
        group: !isUserAcceptPending && Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate),
        remove: !isUserAcceptPending && Authorizer.canRemoveUser(user, surveyInfo, userToUpdate),
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
  const userInviteParams = R.pipe(R.omit(['name']), R.assoc('surveyCycleKey', surveyCycleKey))(formObject)

  const { dispatch: saveUser, loaded: userSaved, data: userSaveResponse, error: userSaveError } = isInvitation
    ? useAsyncPostRequest(`/api/survey/${surveyId}/users/invite`, userInviteParams)
    : useAsyncMultipartPutRequest(
        `/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${User.getUuid(userToUpdate)}`,
        formData,
      )

  useOnUpdate(() => {
    hideAppLoader()
    if (userSaveError) {
      showNotification('appErrors.generic', { text: userSaveError }, NotificationState.severity.error)
    } else if (userSaved) {
      // Update user in redux state if self
      if (User.isEqual(user)(userSaveResponse)) {
        setUser(userSaveResponse)
      }

      if (isInvitation) {
        showNotification('usersView.inviteUserConfirmation', {
          email: formObject.email,
        })
      } else {
        showNotification('usersView.updateUserConfirmation', {
          name: formObject.name,
        })
      }

      if (!editingSelf) {
        history.push(appModuleUri(userModules.users))
      }
    }
  }, [userSaved, userSaveError])

  // REMOVE
  const { dispatch: removeUser, loaded: removeUserLoaded, error: removeUserError } = useAsyncDeleteRequest(
    `/api/survey/${surveyId}/user/${User.getUuid(userToUpdate)}`,
  )

  useOnUpdate(() => {
    hideAppLoader()
    if (removeUserLoaded) {
      showNotification('userView.removeUserConfirmation', {
        user: formObject.name,
        survey: Survey.getLabel(surveyInfo, lang),
      })
      history.push(appModuleUri(userModules.users))
    } else if (removeUserError) {
      showNotification('appErrors.generic', { text: removeUserError }, NotificationState.severity.error)
    }
  }, [removeUserLoaded, removeUserError])

  return {
    ready: ready.current,
    loaded: isInvitation || loaded,

    isUserAcceptPending,
    isInvitation,

    canEdit: editPermissions.name || editPermissions.group || editPermissions.email,
    canEditName: editPermissions.name,
    canEditGroup: editPermissions.group,
    canEditEmail: editPermissions.email,
    canRemove: editPermissions.remove,
    pictureEditorEnabled: User.hasProfilePicture(userToUpdate) || pictureChanged.current,

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

    saveUser: () => {
      showAppLoader()
      saveUser()
    },
    removeUser: () => {
      showAppLoader()
      removeUser()
    },
  }
}
