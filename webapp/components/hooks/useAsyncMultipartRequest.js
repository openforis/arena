import useAsyncPostRequest from './useAsyncPostRequest'
import useAsyncPutRequest from './useAsyncPutRequest'

const makeMultipart = fn => (url, data = {}, config = {}) =>
  fn(url, data, {
    ...config,
    transformRequest: data => {
      const formData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, value)
      }

      return formData
    },
  })

export const useAsyncMultipartPostRequest = makeMultipart(useAsyncPostRequest)

export const useAsyncMultipartPutRequest = makeMultipart(useAsyncPutRequest)
