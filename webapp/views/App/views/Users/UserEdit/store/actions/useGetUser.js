import { useParams } from 'react-router'

import { useSurveyId } from '@webapp/store/survey'

import { useUser } from '@webapp/store/user'
import * as User from '@core/user/user'
import * as API from '@webapp/service/api'

import { validateUserEdit } from './validate'
import { useSurveyUuid } from '@webapp/store/survey/hooks'
import { useCallback } from 'react'

export const useGetUser = ({ setUserToUpdate, setUserToUpdateOriginal }) => {
  const { userUuid } = useParams()
  const user = useUser()
  const surveyId = useSurveyId()
  const surveyUuid = useSurveyUuid()
  const editingSelf = User.getUuid(user) === userUuid

  return useCallback(async () => {
    let userLoaded = await API.fetchUser({ userUuid, surveyId: !editingSelf && surveyId ? surveyId : undefined })
    const groupInCurrentSurvey = User.getAuthGroupBySurveyUuid({ surveyUuid })(userLoaded)
    const groupExtraProps = groupInCurrentSurvey?.props?.extra
    userLoaded = User.assocAuthGroupExtraProps(groupExtraProps)(userLoaded)
    const userToUpdateValidated = await validateUserEdit(userLoaded)
    setUserToUpdate(userToUpdateValidated)
    setUserToUpdateOriginal(userToUpdateValidated)
  }, [editingSelf, setUserToUpdate, setUserToUpdateOriginal, surveyId, surveyUuid, userUuid])
}
