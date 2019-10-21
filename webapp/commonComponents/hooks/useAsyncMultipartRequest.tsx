import React from 'react'

import useAsyncPostRequest from './useAsyncPostRequest'
import useAsyncPutRequest from './useAsyncPutRequest'

const makeMultipart = fn => (url, data = {}, config = {}) =>
  fn(url, data, {
    ...config,
    transformRequest: data => {
      const formData = new FormData()
      for (let [key, value] of Object.entries(data)) {
        // @ts-ignore TODO
        formData.append(key, value)
      }

      return formData
    }
  })

export const useAsyncMultipartPostRequest = makeMultipart(useAsyncPostRequest)

export const useAsyncMultipartPutRequest = makeMultipart(useAsyncPutRequest)
