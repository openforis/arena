import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import * as Authorizer from '@core/auth/authorizer'
import useAsyncGetRequest from '@webapp/components/hooks/useAsyncGetRequest'

import { useSurveyInfo } from '@webapp/store/survey'

import * as UserState from './state'

export const useUser = () => useSelector(UserState.getUser)

export const useAuthCanEditSurvey = () => {
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  return Authorizer.canEditSurvey(user, surveyInfo)
}

export const useAuthCanEditRecord = (record) => {
  const user = useUser()
  return Authorizer.canEditRecord(user, record)
}

export const useAuthCanCleanseRecords = () => {
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  return Authorizer.canCleanseRecords(user, surveyInfo)
}

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
