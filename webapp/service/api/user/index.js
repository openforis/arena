import axios from 'axios'

// ==== CREATE
export const createAccessRequest = async ({ accessRequest }) => {
  const {
    data: { accessRequest: accessRequestInserted },
  } = await axios.post(`/api/user/request-access`, accessRequest)

  return accessRequestInserted
}
