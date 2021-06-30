import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'

import * as User from '@core/user/user'
import * as Authorizer from '@core/auth/authorizer'
import { useAsyncGetRequest } from '@webapp/components/hooks'

import { useSurveyInfo } from '@webapp/store/survey'

import * as UserState from './state'

export const useUser = () => useSelector(UserState.getUser)
export const useUserIsSystemAdmin = () => User.isSystemAdmin(useUser())

// ====== Auth
// ====== Auth / Surveys
export const useAuthCanEditSurvey = () => Authorizer.canEditSurvey(useUser(), useSurveyInfo())

// ====== Auth / Records
export const useAuthCanEditRecord = (record) => {
  const canEdit = Authorizer.canEditRecord(useUser(), record)
  const surveyInfo = useSurveyInfo()
  return Survey.isPublished(surveyInfo) && canEdit
}
export const useAuthCanDeleteRecord = (record) => useAuthCanEditRecord(record) && !Record.isInAnalysisStep(record)
export const useAuthCanCleanseRecords = () => Authorizer.canCleanseRecords(useUser(), useSurveyInfo())
export const useAuthCanPromoteRecord = (record) =>
  useAuthCanEditRecord(record) && RecordStep.getNextStep(Record.getStep(record))
export const useAuthCanDemoteRecord = (record) =>
  useAuthCanEditRecord(record) && RecordStep.getPreviousStep(Record.getStep(record))

// ====== Auth / Users
export const useAuthCanEditUser = (user) => Authorizer.canEditUser(useUser(), useSurveyInfo(), user)
export const useAuthCanInviteUser = () => Authorizer.canInviteUsers(useUser(), useSurveyInfo())
export const useAuthCanViewOtherUsersEmail = () =>
  Authorizer.canViewOtherUsersEmail({ user: useUser(), surveyInfo: useSurveyInfo() })

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
