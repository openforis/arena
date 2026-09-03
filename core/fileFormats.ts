export const FileFormats = {
  csv: 'csv',
  gpkg: 'gpkg',
  xlsx: 'xlsx',
  zip: 'zip',
} as const

const extensionByFileFormat = {
  [FileFormats.csv]: 'csv',
  [FileFormats.gpkg]: 'gpkg',
  [FileFormats.xlsx]: 'xlsx',
  [FileFormats.zip]: 'zip',
}

export const getExtensionByFileFormat = (fileFormat: keyof typeof extensionByFileFormat): string =>
  extensionByFileFormat[fileFormat]
