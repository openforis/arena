import axios from 'axios'

import * as CognitoAuth from '../utils/cognitoAuth'

const requestHandler = async request => {
  try {
    const jwtToken = await CognitoAuth.getJwtToken()

    request.headers['Authorization'] = `Bearer ${jwtToken}`
    return request
  } catch (err) {
    // TODO throws 'no currentUser' when not logged in
    // alert(err)
  }

  return request
}

export const init = () => {
  axios.interceptors.request.use(requestHandler)
}