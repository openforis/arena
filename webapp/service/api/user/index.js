import axios from 'axios'

// ==== CREATE
export const createAccessRequest = async ({ accessRequest: accessRequestParam }) => {
  const {
    data: { accessRequest, error, errorParams, validation },
  } = await axios.post(`/api/user/request-access`, accessRequestParam)

  return { accessRequest, error, errorParams, validation }
}
