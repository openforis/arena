export const makeMultipart = fn => (url, data = {}, config = {}) =>
  fn(url, data, {
    ...config,
    transformRequest: data => {
      const formData = new FormData()
      for (let [key, value] of Object.entries(data)) {
        formData.append(key, value)
      }

      return formData
    }
  })
