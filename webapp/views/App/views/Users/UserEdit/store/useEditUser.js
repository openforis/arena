import { useState, useEffect } from 'react'
import { useUser } from '@webapp/store/user'

import * as User from '@core/user/user'
import * as R from 'ramda'
import * as Authorizer from '@core/auth/authorizer'
import { useSurveyInfo } from '@webapp/store/survey'

import { useActions } from './actions'

const getEditCapabilities = ({ user, userToUpdate, surveyInfo, ready }) => {
  const isUserAcceptPending = !User.hasAccepted(userToUpdate)
  const canEditUser = ready && !isUserAcceptPending && Authorizer.canEditUser(user, surveyInfo, userToUpdate)
  const canEditName = canEditUser
  const canEditEmail = canEditUser && Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate)
  const canEditGroup = canEditUser && Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)
  const canRemove = Authorizer.canRemoveUser(user, surveyInfo, userToUpdate)
  const canEdit = canEditName || canEditEmail || canEditGroup
  return {
    canEdit,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
  }
}

export const useEditUser = () => {
  const user = useUser()

  const [userToUpdate, setUserToUpdate] = useState({})

  const surveyInfo = useSurveyInfo()
  const ready = !R.isEmpty(userToUpdate)
  const editCapabilities = getEditCapabilities({ user, userToUpdate, surveyInfo, ready })

  const { onGetUser, onUpdate, onUpdateProfilePicture, onSave, onRemove, onInviteRepeat } = useActions({
    userToUpdate,
    setUserToUpdate,
  })

  useEffect(() => {
    onGetUser()
  }, [])

  return {
    ready,
    user,
    userToUpdate,
    ...editCapabilities,
    onUpdate,
    onUpdateProfilePicture,
    onSave,
    onRemove,
    onInviteRepeat,
  }
}
