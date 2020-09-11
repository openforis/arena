import axios from 'axios'

export const cancelableRequest = ({ method = 'get', url, config = {} }) => {
  const source = axios.CancelToken.source()
  const request = axios({
    ...config,
    method,
    url,
    cancelToken: source.token,
  })

  return { request, cancel: source.cancel }
}
