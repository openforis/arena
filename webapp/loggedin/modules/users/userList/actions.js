import axios from 'axios'

import * as SurveyState from '../../../../survey/surveyState'

export const usersUpdate = 'users/update'

export const fetchUsers = (offset = 0, limit = 15) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: users } = await axios.get(`/api/survey/${surveyId}/users?offset=${offset}&limit=${limit}`)

  dispatch({ type: usersUpdate, users })
}
