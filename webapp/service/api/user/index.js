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
