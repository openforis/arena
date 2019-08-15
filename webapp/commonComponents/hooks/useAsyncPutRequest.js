import React from 'react'
import axios from 'axios'

import useAsync from './useAsync'

export default (url, config = {}) => useAsync(axios.put, [url, config])