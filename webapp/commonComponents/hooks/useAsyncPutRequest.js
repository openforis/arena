import axios from 'axios'

import useAsync from './useAsync'

export default (url, data = {}, config = {}) =>
  useAsync(axios.put, [url, data, config])
