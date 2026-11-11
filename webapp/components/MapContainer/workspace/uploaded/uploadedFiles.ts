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

export const MAX_UPLOAD_SIZE_MB = 50

/**
 * Tells whether a file is too large to be read in the browser.
 * @param {number} sizeBytes - The file size in bytes.
 * @returns {boolean} True when it is over the limit.
 */
export const isUploadTooLarge = (sizeBytes: number): boolean => sizeBytes > MAX_UPLOAD_SIZE_MB * 1024 * 1024
