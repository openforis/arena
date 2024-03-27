import { useParams } from 'react-router'

import * as User from '@core/user/user'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { validateUserEdit } from './validate'

export const useGetUser = ({ setUserToUpdate, setUserToUpdateOriginal }) => {
  const { userUuid } = useParams()
  const user = useUser()
  const surveyId = useSurveyId()
  const editingSelf = User.getUuid(user) === userUuid

  return () => {
    ;(async () => {
      const userLoaded = await API.fetchUser({ userUuid, surveyId: !editingSelf && surveyId ? surveyId : undefined })
      const userToUpdateValidated = await validateUserEdit(userLoaded)
      setUserToUpdate(userToUpdateValidated)
      setUserToUpdateOriginal(userToUpdateValidated)
    })()
  }
}
