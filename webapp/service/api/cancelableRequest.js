import axios from 'axios'

const cancelableRequest = ({ method, url, config = {} }) => {
  const abortController = new AbortController()
  const request = axios({
    ...config,
    method,
    url,
    signal: abortController.signal,
  })

  return { request, cancel: () => abortController.abort() }
}

export const cancelableGetRequest = ({ url, data = {} }) =>
  cancelableRequest({ method: 'get', url, config: { params: data } })
