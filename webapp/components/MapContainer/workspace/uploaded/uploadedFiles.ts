export type UploadedFileKind = 'kml' | 'kmz' | 'shapefileZip' | 'geojson'

export const UPLOAD_ACCEPT = '.kml,.kmz,.zip,.json,.geojson'

const KIND_BY_EXTENSION: Record<string, UploadedFileKind> = {
  geojson: 'geojson',
  json: 'geojson',
  kml: 'kml',
  kmz: 'kmz',
  zip: 'shapefileZip',
}

/**
 * Tells how an uploaded file is read from its extension.
 * @param {string} fileName - The file name.
 * @returns {UploadedFileKind|null} The kind, or null for unsupported files.
 */
export const getUploadedFileKind = (fileName: string): UploadedFileKind | null => {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex < 0) return null
  return KIND_BY_EXTENSION[fileName.slice(dotIndex + 1).toLowerCase()] ?? null
}
