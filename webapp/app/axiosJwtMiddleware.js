import axios from 'axios'

import * as CognitoAuth from './cognitoAuth'

const requestHandler = async request => {
  const jwtToken = await CognitoAuth.getJwtToken()

  if (jwtToken) {
    request.headers['Authorization'] = `Bearer ${jwtToken}`
  }
  
  return request
}

export const init = () => {
  axios.interceptors.request.use(requestHandler)
}