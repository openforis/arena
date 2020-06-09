import * as Authorizer from '@core/auth/authorizer'

import { useSurveyInfo } from '@webapp/store/survey'

import useUser from './useUser'

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
