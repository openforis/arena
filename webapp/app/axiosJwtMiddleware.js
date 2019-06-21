import axios from 'axios'

const isHandlerEnabled = ({ addJwtHeader = true }) => addJwtHeader

const requestHandler = request => {
  if (isHandlerEnabled(request)) {
    const jwtToken = window.localStorage.getItem('jwt')

    if (jwtToken) {
      request.headers['Authorization'] = `Bearer ${jwtToken}` // TODO implement refresh token
    }
  }

  return request
}

axios.interceptors.request.use(requestHandler)