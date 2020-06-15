import axios from 'axios'
import { useParams } from 'react-router'

import { useSurveyId, useSurveyInfo } from '@webapp/store/survey'

import { useUser } from '@webapp/store/user'
import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'

export const useGetUser = ({ setUserToUpdate }) => {
  const { userUuid } = useParams()
  const user = useUser()
  const surveyId = useSurveyId()
  const surveyInfo = useSurveyInfo()
  const editingSelf = User.getUuid(user) === userUuid

  return () => {
    ;(async () => {
      const { data: userLoaded } = await axios.get(`/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${userUuid}`)
      const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userLoaded)
      const userUpdated = User.assocGroupUuid(AuthGroup.getUuid(authGroup))(userLoaded)
      setUserToUpdate(userUpdated)
    })()
  }
}
