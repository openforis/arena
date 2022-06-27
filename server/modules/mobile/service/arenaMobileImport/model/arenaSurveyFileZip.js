const _getJson = async (zipFile, entryName, defaultValue = null) => {
  const content = await zipFile.getEntryData(entryName)
  return content ? JSON.parse(content) : defaultValue
}

// Records
export const getRecords = async (zipFile) => _getJson(zipFile, 'records.json', [])
export const hasRecords = async (zipFile) => (await getRecords(zipFile)).length > 0
export const getRecord = async (zipFile, recordUuid) => _getJson(zipFile, `${recordUuid}.json`)

// Files
/*export const getFilesSummaries = async (zipFile) => _getJson(zipFile, ExportFile.filesSummaries)
export const getFile = async (zipFile, fileUuid) => zipFile.getEntryData(ExportFile.file({ fileUuid })) */
