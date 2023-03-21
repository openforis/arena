export const contentTypes = {
  csv: 'text/csv',
  zip: 'application/zip',
}

export const objectToFormData = (object) => {
  const formData = new FormData()
  Object.entries(object).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}
