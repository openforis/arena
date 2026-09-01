export const FileFormats = {
  csv: 'csv',
  xlsx: 'xlsx',
  zip: 'zip',
} as const

const extensionByFileFormat = {
  [FileFormats.csv]: 'csv',
  [FileFormats.xlsx]: 'xlsx',
  [FileFormats.zip]: 'zip',
}

export const getExtensionByFileFormat = (fileFormat: keyof typeof extensionByFileFormat): string =>
  extensionByFileFormat[fileFormat]
