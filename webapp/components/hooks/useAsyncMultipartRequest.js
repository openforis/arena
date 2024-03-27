import { objectToFormData } from '@webapp/service/api'

import useAsyncPostRequest from './useAsyncPostRequest'
import useAsyncPutRequest from './useAsyncPutRequest'

const makeMultipart =
  (fn) =>
  (url, data = {}, config = {}) =>
    fn(url, data, {
      ...config,
      transformRequest: objectToFormData,
    })

export const useAsyncMultipartPostRequest = makeMultipart(useAsyncPostRequest)

export const useAsyncMultipartPutRequest = makeMultipart(useAsyncPutRequest)
