import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { useAsyncGetRequest } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'

import * as UserState from './state'

export const useUser = () => useSelector(UserState.getUser)
export const useUserIsSystemAdmin = () => User.isSystemAdmin(useUser())

// ====== Auth
// ====== Auth / Surveys
export const useAuthCanCreateSurvey = () => Authorizer.canCreateSurvey(useUser(), useSurveyInfo())
export const useAuthCanEditSurvey = () => Authorizer.canEditSurvey(useUser(), useSurveyInfo())
export const useAuthCanExportSurvey = () => Authorizer.canExportSurvey(useUser(), useSurveyInfo())
export const useAuthCanViewTemplates = () => Authorizer.canViewTemplates(useUser())
export const useAuthCanCreateTemplate = () => Authorizer.canCreateTemplate(useUser())
export const useAuthCanEditTemplates = () => Authorizer.canEditTemplates(useUser())

// ====== Auth / Analysis
export const useAuthCanUseAnalysis = () => Authorizer.canAnalyzeRecords(useUser(), useSurveyInfo())

// ====== Auth / Records
export const useAuthCanCreateRecord = () => Authorizer.canCreateRecord(useUser(), useSurveyInfo())
const _canEditRecord = ({ user, surveyInfo, record }) => {
  const canEdit = Authorizer.canEditRecord(user, record)
  return canEdit && !Record.isInAnalysisStep(record) && (Survey.isPublished(surveyInfo) || Record.isPreview(record))
}
export const useAuthCanEditRecords = (records) => {
  const surveyInfo = useSurveyInfo()
  const user = useUser()
  return records.length > 0 && records.every((record) => _canEditRecord({ user, surveyInfo, record }))
}
export const useAuthCanEditRecord = (record) => useAuthCanEditRecords([record])
export const useAuthCanDeleteRecords = (records) => useAuthCanEditRecords(records)
export const useAuthCanDeleteRecord = (record) => useAuthCanDeleteRecords([record])
export const useAuthCanCleanseRecords = () => Authorizer.canCleanseRecords(useUser(), useSurveyInfo())
export const useAuthCanPromoteRecord = (record) =>
  useAuthCanEditRecord(record) && RecordStep.getNextStep(Record.getStep(record))
export const useAuthCanDemoteRecord = (record) => {
  // always use the same number of hooks in every call
  const surveyInfo = useSurveyInfo()
  const user = useUser()

  // when record doesn't have a previous step, it cannot be demoted
  if (!RecordStep.getPreviousStep(Record.getStep(record))) return false

  const canEdit = Authorizer.canEditRecord(user, record)
  return canEdit && Survey.isPublished(surveyInfo)
}
export const useAuthCanDeleteAllRecords = () => useAuthCanEditSurvey()
export const useAuthCanUpdateRecordsStep = () => Authorizer.canUpdateRecordsStep(useUser(), useSurveyInfo())
export const useAuthCanExportRecordsList = () => Authorizer.canExportRecordsList(useUser(), useSurveyInfo())
export const useAuthCanExportRecords = () => Authorizer.canExportRecords(useUser(), useSurveyInfo())

// ====== Auth / Map
export const useAuthCanUseMap = () => Authorizer.canUseMap(useUser(), useSurveyInfo())

// ====== Auth / Users
export const useAuthCanEditUser = (user) => Authorizer.canEditUser(useUser(), useSurveyInfo(), user)
export const useAuthCanInviteUser = () => Authorizer.canInviteUsers(useUser(), useSurveyInfo())
export const useAuthCanViewOtherUsersName = () =>
  Authorizer.canViewOtherUsersNameInSameSurvey(useUser(), useSurveyInfo())
export const useAuthCanViewOtherUsersEmail = () =>
  Authorizer.canViewOtherUsersEmail({ user: useUser(), surveyInfo: useSurveyInfo() })
export const useAuthCanViewUsersAccessRequests = () => Authorizer.canViewUsersAccessRequests(useUser())
export const useAuthCanViewAllUsers = () => Authorizer.canViewAllUsers(useUser())

// ====== Profile picture
export const useProfilePicture = (userUuid, forceUpdateKey) => {
  const [profilePicture, setProfilePicture] = useState(null)

  const { data = null, dispatch: fetchUserProfilePicture } = useAsyncGetRequest(
    `/api/user/${userUuid}/profilePicture`,
    {
      responseType: 'blob',
    }
  )

  useEffect(() => {
    fetchUserProfilePicture()
  }, [userUuid, forceUpdateKey])

  useEffect(() => {
    if (data && data.size > 0) {
      setProfilePicture(URL.createObjectURL(data))
    }
  }, [data])

  return profilePicture
}

export const useUserName = ({ userUuid, active = true }) => {
  const [userName, setUserName] = useState(null)

  const canViewUsersName = useAuthCanViewOtherUsersName()
  const surveyId = useSurveyId()

  useEffect(() => {
    if (canViewUsersName && userUuid && active) {
      API.fetchUserName({ userUuid, surveyId }).then((name) => {
        setUserName(name)
      })
    }
  }, [active, canViewUsersName, surveyId, userUuid])

  return userName
}
