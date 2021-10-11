import axios from 'axios'
import { useParams } from 'react-router'

import { useSurveyId } from '@webapp/store/survey'

import { useUser } from '@webapp/store/user'
import * as User from '@core/user/user'

import { validateUserEdit } from './validate'

export const useGetUser = ({ setUserToUpdate, setUserToUpdateOriginal }) => {
  const { userUuid } = useParams()
  const user = useUser()
  const surveyId = useSurveyId()
  const editingSelf = User.getUuid(user) === userUuid

  return () => {
    ;(async () => {
      const { data: userLoaded } = await axios.get(`/api${editingSelf ? '' : `/survey/${surveyId}`}/user/${userUuid}`)
      const userToUpdateValidated = await validateUserEdit(userLoaded)
      setUserToUpdate(userToUpdateValidated)
      setUserToUpdateOriginal(userToUpdateValidated)
    })()
  }
}
