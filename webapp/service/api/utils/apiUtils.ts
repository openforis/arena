export const contentTypes = {
  csv: 'text/csv',
  geojson: 'application/geo+json',
  kml: 'application/vnd.google-earth.kml+xml',
  kmz: 'application/vnd.google-earth.kmz',
  xml: 'text/xml',
  zip: 'application/zip',
}

export const objectToFormData = (object: Record<string, unknown>): FormData => {
  const formData = new FormData()
  for (const [key, value] of Object.entries(object)) {
    // FormData converts any value but a Blob (or File) to a string
    formData.append(key, value instanceof Blob ? value : String(value))
  }
  return formData
}
