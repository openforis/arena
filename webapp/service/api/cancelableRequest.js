import axios from 'axios'

const cancelableRequest = ({ method, url, config = {} }) => {
  const source = axios.CancelToken.source()
  const request = axios({
    ...config,
    method,
    url,
    cancelToken: source.token,
  })

  return { request, cancel: source.cancel }
}

export const cancelableGetRequest = ({ url, data = {} }) =>
  cancelableRequest({ method: 'get', url, config: { params: data } })
