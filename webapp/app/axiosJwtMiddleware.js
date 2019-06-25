import axios from 'axios'

import { Auth } from 'aws-amplify'

const requestHandler = async request => {
  try {
    const session = await Auth.currentSession()
    const jwtToken = session.getAccessToken().jwtToken
 
    request.headers['Authorization'] = `Bearer ${jwtToken}`
    return request
  } catch (err) {
    // TODO throws 'no currentUser' when not logged in
    alert(err)
  }

  return request
}

export const init = () => {
  axios.interceptors.request.use(requestHandler)
}