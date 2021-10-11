import { useState, useEffect } from 'react'
import * as R from 'ramda'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import { useQuery } from '@webapp/components/hooks'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { useActions } from './actions'

const getEditCapabilities = ({ user, userToUpdate, surveyInfo, ready }) => {
  const isUserAcceptPending = !User.hasAccepted(userToUpdate)
  const canEditUser = ready && !isUserAcceptPending && Authorizer.canEditUser(user, surveyInfo, userToUpdate)
  const canEditName = canEditUser
  const canEditEmail = canEditUser && Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate)
  const canEditGroup = canEditUser && Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)
  const canRemove = Authorizer.canRemoveUser(user, surveyInfo, userToUpdate)
  const canEdit = canEditName || canEditEmail || canEditGroup
  const canEditSystemAdmin = User.isSystemAdmin(user)
  const canEditSurveyManager = User.isSurveyManager(user)

  const validation = User.getValidation(userToUpdate)
  const canSave = Validation.isValid(validation)
  const canViewEmail = User.isEqual(user)(userToUpdate) || Authorizer.canViewOtherUsersEmail({ user, surveyInfo })

  return {
    canEdit,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    canSave,
    canViewEmail,
    canEditSystemAdmin,
    canEditSurveyManager,
  }
}

export const useEditUser = ({ userUuid }) => {
  const user = useUser()

  const [userToUpdateOriginal, setUserToUpdateOriginal] = useState({})
  const [userToUpdate, setUserToUpdate] = useState({})

  const { hideSurveyGroup } = useQuery()
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)

  const ready = !R.isEmpty(userToUpdate)
  const editCapabilities = getEditCapabilities({ user, userToUpdate, surveyInfo, ready })

  const { onGetUser, onUpdate, onUpdateProfilePicture, onSave, onRemove, onInviteRepeat } = useActions({
    userToUpdate,
    setUserToUpdate,
    userToUpdateOriginal,
    setUserToUpdateOriginal,
  })

  useEffect(() => {
    onGetUser()
  }, [userUuid])

  const onSurveyAuthGroupChange = (surveyGroupNew) => {
    const surveyGroupOld = User.getAuthGroupBySurveyUuid(surveyUuid, false)(userToUpdate)
    const userUpdated = A.pipe(User.dissocAuthGroup(surveyGroupOld), User.assocAuthGroup(surveyGroupNew))(userToUpdate)
    onUpdate(userUpdated)
  }

  const onSurveyManagerChange = (checked) => {
    const surveyManagerGroup = User.getAuthGroupByName(AuthGroup.groupNames.surveyManager)(user)
    const userUpdated = checked
      ? User.assocAuthGroup(surveyManagerGroup)(userToUpdate)
      : User.dissocAuthGroup(surveyManagerGroup)(userToUpdate)
    onUpdate(userUpdated)
  }

  return {
    hideSurveyGroup,
    ready,
    user,
    userToUpdate,
    ...editCapabilities,
    onUpdate,
    onUpdateProfilePicture,
    onSave,
    onSurveyAuthGroupChange,
    onSurveyManagerChange,
    onRemove,
    onInviteRepeat,
  }
}
