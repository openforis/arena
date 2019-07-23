import axios from 'axios'

import * as SurveyState from '../../../survey/surveyState'

const _limit = 15

export const userListInit = 'users/list/init'
export const userListUpdate = 'users/update'

const getUsers = (surveyId, offset = 0) => axios.get(
  `/api/survey/${surveyId}/users`,
  { params: { offset, limit: _limit } }
)

export const initUserList = () => async (dispatch, getState) => {
  const offset = 0

  const surveyId = SurveyState.getSurveyId(getState())
  const countResp = axios.get(`/api/survey/${surveyId}/users/count`)
  const usersResp = getUsers(surveyId, offset)

  dispatch({
    type: userListInit,
    offset,
    limit: _limit,
    count: (await countResp).data.count,
    list: (await usersResp).data,
  })
}

export const fetchUsers = (offset = 0, limit = _limit) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.get(`/api/survey/${surveyId}/users?offset=${offset}&limit=${limit}`)

  dispatch({
    type: userListUpdate,
    offset,
    list: data
  })
}
