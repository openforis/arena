import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router'
import * as R from 'ramda'

import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as UserViewState from './userViewState'
import { fetchUser, resetUserState } from './actions'

export const useUserViewState = () => {
  const { userUuid } = useParams()
  const user = useSelector(AppState.getUser)
  const surveyInfo = useSelector(SurveyState.getSurveyInfo)
  const userToUpdate = useSelector(UserViewState.getUser)

  const dispatch = useDispatch()

  const isInvitation = !userUuid
  const isUserAcceptPending = !(isInvitation || User.hasAccepted(userToUpdate))

  // USER ATTRIBUTES

  const ready = isInvitation || !R.isEmpty(userToUpdate)

  useEffect(() => {
    return () => dispatch(resetUserState())
  }, [])

  useEffect(() => {
    // Init user
    if (!ready && !isInvitation) {
      dispatch(fetchUser(userUuid))
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

    user,
    userToUpdate,

    canEdit: canEditName || canEditEmail || canEditGroup,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    pictureEditorEnabled: User.hasProfilePicture(userToUpdate),
  }
}
