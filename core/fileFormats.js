export const FileFormats = {
  csv: 'csv',
  xlsx: 'xlsx',
  zip: 'zip',
}

const extensionByFileFormat = {
  [FileFormats.csv]: 'csv',
  [FileFormats.xlsx]: 'xlsx',
  [FileFormats.zip]: 'zip',
}

export const getExtensionByFileFormat = (fileFormat) => extensionByFileFormat[fileFormat]
