import axios from 'axios'

import useAsync from './useAsync'

export default (url, config = {}) => useAsync(axios.get, [url, config])
