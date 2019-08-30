import React from 'react'
import axios from 'axios'

import useAsyncPutRequest from './useAsyncPutRequest'
import { makeMultipart } from './utils'

export default makeMultipart(useAsyncPutRequest)
