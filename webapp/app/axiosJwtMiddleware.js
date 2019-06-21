import axios from 'axios'

const isHandlerEnabled = ({ addJwtHeader = true }) => addJwtHeader

const requestHandler = request => {
  if (isHandlerEnabled(request)) {
    const jwtToken = window.localStorage.getItem('jwt')

    if (jwtToken) {
      // TODO implement refresh token
      request.headers['Authorization'] = `Bearer ${jwtToken}`
    }
  }

  return request
}

axios.interceptors.request.use(requestHandler)