let _authToken = null

const getAuthToken = () => _authToken

const setAuthToken = (authToken) => {
  _authToken = authToken
}

export const ApiConstants = {
  getAuthToken,
  setAuthToken,
}
