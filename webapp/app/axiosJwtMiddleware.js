import axios from 'axios'

import * as JwtConstants from '../../common/auth/jwtConstants'

import * as CognitoAuth from './cognitoAuth'

const requestHandler = async request => {
  const jwtToken = await CognitoAuth.getJwtToken()

  if (jwtToken) {
    request.headers['Authorization'] = `${JwtConstants.bearer}${jwtToken}`
  }

  return request
}

export const init = () => {
  axios.interceptors.request.use(requestHandler)
}