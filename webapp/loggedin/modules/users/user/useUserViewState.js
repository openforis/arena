import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router'
import * as R from 'ramda'

import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'

import { useUser, useSurveyInfo } from '@webapp/commonComponents/hooks'
import * as UserViewState from './userViewState'
import { fetchUser, resetUserState } from './actions'

export const useUserViewState = () => {
  const { userUuid } = useParams()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const userToUpdate = useSelector(UserViewState.getUser)
  const profilePictureUpdated = useSelector(UserViewState.isProfilePictureUpdated)

  const dispatch = useDispatch()

  const isUserAcceptPending = !User.hasAccepted(userToUpdate)

  const ready = !R.isEmpty(userToUpdate)

  useEffect(() => {
    // Init user
    dispatch(fetchUser(userUuid))

    // Reset state on unmount
    return () => dispatch(resetUserState())
  }, [userUuid])

  const canEditUser = ready && !isUserAcceptPending && Authorizer.canEditUser(user, surveyInfo, userToUpdate)
  const canEditName = canEditUser
  const canEditEmail = canEditUser && Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate)
  const canEditGroup = canEditUser && Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)
  const canRemove = Authorizer.canRemoveUser(user, surveyInfo, userToUpdate)

  return {
    ready,
    isUserAcceptPending,

    user,
    userToUpdate,

    canEdit: canEditName || canEditEmail || canEditGroup,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    pictureEditorEnabled: profilePictureUpdated,
  }
}
