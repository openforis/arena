export const contentTypes = {
  csv: 'text/csv',
  geojson: 'application/geo+json',
  kml: 'application/vnd.google-earth.kml+xml',
  kmz: 'application/vnd.google-earth.kmz',
  zip: 'application/zip',
}

export const objectToFormData = (object) => {
  const formData = new FormData()
  Object.entries(object).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}
