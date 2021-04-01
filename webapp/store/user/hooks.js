import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'
import { useAsyncGetRequest } from '@webapp/components/hooks'

import { useSurveyInfo } from '@webapp/store/survey'

import * as UserState from './state'

export const useUser = () => useSelector(UserState.getUser)
export const useIsSystemAdminUser = () => {
  const user = useSelector(UserState.getUser)
  return !User.isSystemAdmin(user)
}

// ====== Auth
export const useAuthCanEditSurvey = () => Authorizer.canEditSurvey(useUser(), useSurveyInfo())
export const useAuthCanEditRecord = (record) => Authorizer.canEditRecord(useUser(), record)
export const useAuthCanCleanseRecords = () => Authorizer.canCleanseRecords(useUser(), useSurveyInfo())
export const useAuthCanEditUser = (user) => Authorizer.canEditUser(useUser(), useSurveyInfo(), user)
export const useAuthCanInviteUser = () => Authorizer.canInviteUsers(useUser(), useSurveyInfo())

// ====== Profile picture
export const useProfilePicture = (userUuid, forceUpdateKey) => {
  const [profilePicture, setProfilePicture] = useState(null)

  const { data = null, dispatch } = useAsyncGetRequest(`/api/user/${userUuid}/profilePicture`, {
    responseType: 'blob',
  })

  useEffect(dispatch, [userUuid, forceUpdateKey])

  useEffect(() => {
    if (data) {
      setProfilePicture(URL.createObjectURL(data))
    }
  }, [data])

  return profilePicture
}
