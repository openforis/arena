import axios from 'axios'

// ==== CREATE
export const createAccessRequest = async ({ accessRequest: accessRequestParam }) => {
  const {
    data: { accessRequest, error, errorParams, validation },
  } = await axios.post(`/api/user/request-access`, accessRequestParam)

  return { accessRequest, error, errorParams, validation }
}

export const acceptAccessRequest = async ({ accessRequestAccept }) => {
  const {
    data: { errorKey, errorParams, validation, userInvited, survey },
  } = await axios.post(`/api/user/accept-request-access`, accessRequestAccept)

  return { errorKey, errorParams, validation, userInvited, survey }
}

// ==== READ
export const fetchUser = async ({ userUuid, surveyId = null }) => {
  const params = surveyId ? { surveyId } : undefined
  const { data: user } = await axios.get(`/api/user/${userUuid}`, { params })
  return user
}

export const fetchUserResetPasswordUrl = async ({ userUuid, surveyId }) => {
  const { data: url } = await axios.get(`/api/survey/${surveyId}/user/${userUuid}/resetpasswordurl`)
  return url
}

export const fetchUserName = async ({ userUuid, surveyId }) => {
  const { data: name } = await axios.get(`/api/survey/${surveyId}/user/${userUuid}/name`)
  return name
}

export const fetchUsersBySurvey = async ({ surveyId, onlyAccepted = false, includeSystemAdmins = false }) => {
  const params = { onlyAccepted, includeSystemAdmins }
  const {
    data: { list: users },
  } = await axios.get(`/api/survey/${surveyId}/users`, { params })
  return users
}

export const fetchUserSurveys = async ({ userUuid }) => {
  const {
    data: { surveys },
  } = await axios.get(`/api/user/${userUuid}/surveys`)

  return { surveys }
}

// ==== UPDATE
export const changeUserPassword = async ({ form }) => {
  const {
    data: { validation },
  } = await axios.post(`/api/user/change-password`, form)

  return { validation }
}
