import * as Authorizer from '@core/auth/authorizer'
import useSurveyInfo from './useSurveyInfo'
import useUser from './useUser'

export const useAuthCanEditSurvey = () => {
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  return Authorizer.canEditSurvey(user, surveyInfo)
}
