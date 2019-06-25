import axios from 'axios'

import { getUserPool } from '../utils/jwtUtils'

const requestHandler = request => {

  const userPool = getUserPool()
  const cognitoUser = userPool.getCurrentUser()

  if (cognitoUser !== null) {
    cognitoUser.getSession((err, session) => {
      if (err) {
        alert(err) // TODO (jwt) re-authenticate
      } else {
        const accessToken = session.getAccessToken().jwtToken
        request.headers['Authorization'] = `Bearer ${accessToken}`
      }
    })
  }

  return request
}

export const init = () => {
  axios.interceptors.request.use(requestHandler)
}