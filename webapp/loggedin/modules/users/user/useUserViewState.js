import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router'
import * as R from 'ramda'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as UserViewState from './userViewState'
import { fetchUser, updateUserProp, resetUserState } from './actions'

export const useUserViewState = () => {
  const { userUuid } = useParams()
  const user = useSelector(AppState.getUser)
  const surveyInfo = useSelector(SurveyState.getSurveyInfo)
  const userToUpdate = useSelector(UserViewState.getUser)

  const i18n = useI18n()
  const dispatch = useDispatch()

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)

  const editingSelf = User.getUuid(user) === userUuid && !surveyId // This can happen for system administrator when they don't have an active survey

  const isInvitation = !userUuid
  const isUserAcceptPending = !(isInvitation || User.hasAccepted(userToUpdate))

  // USER ATTRIBUTES

  const [surveyGroupsMenuItems, setSurveyGroupsMenuItems] = useState([])

  const ready = (isInvitation || !R.isEmpty(userToUpdate)) && !R.isEmpty(surveyGroupsMenuItems)

  useEffect(() => {
    return () => dispatch(resetUserState())
  }, [])

  useEffect(() => {
    // Init user
    if (!ready && !isInvitation) {
      dispatch(fetchUser(userUuid))
    }

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

    if (!isInvitation && ready) {
      const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userToUpdate)
      dispatch(updateUserProp(User.keys.groupUuid, AuthGroup.getUuid(authGroup)))
    }
  }, [ready])

  const canEditUser = ready && !isUserAcceptPending && Authorizer.canEditUser(user, surveyInfo, userToUpdate)
  const canEditName = !isInvitation && canEditUser
  const canEditEmail = isInvitation || (canEditUser && Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate))
  const canEditGroup = isInvitation || (canEditUser && Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate))
  const canRemove = !isInvitation && Authorizer.canRemoveUser(user, surveyInfo, userToUpdate)

  return {
    ready,
    isUserAcceptPending,
    isInvitation,

    userToUpdate,

    canEdit: canEditName || canEditEmail || canEditGroup,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    pictureEditorEnabled: User.hasProfilePicture(userToUpdate),

    surveyGroupsMenuItems,
  }
}
