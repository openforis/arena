import axios from 'axios'

export const cancelableRequest = ({ url, config }) => {
  const source = axios.CancelToken.source()
  const request = axios.get(url, { ...config, cancelToken: source.token })
  return { request, cancel: source.cancel }
}
