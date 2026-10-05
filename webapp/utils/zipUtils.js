import JSZip from 'jszip'

// true if the entry name, resolved like a relative path, goes above the extraction directory (ZipSlip)
const isPathTraversal = (entryName) => {
  let depth = 0
  for (const segment of entryName.split('/')) {
    if (segment === '..') {
      depth--
      if (depth < 0) return true
    } else if (segment && segment !== '.') {
      depth++
    }
  }
  return false
}

const forEachFileInZip = async (file, callback) => {
  const jszip = new JSZip()
  const MAX_FILES = 10000
  const MAX_SIZE = 1000000000 // 1 GB
  let fileCount = 0
  let totalSize = 0
  const zip = await jszip.loadAsync(file)
  const fileNames = zip.files
  for (const fileName in fileNames) {
    const fileEntry = zip.file(fileName)
    fileCount++
    if (fileCount > MAX_FILES) {
      throw new Error('Reached max. number of files')
    }
    // Prevent ZipSlip path traversal (S6096)
    if (isPathTraversal(fileEntry.name)) {
      throw new Error('Path traversal detected')
    }
    zip
      .file(fileEntry.name)
      .async('nodebuffer')
      .then(function (content) {
        totalSize += content.length
        if (totalSize > MAX_SIZE) {
          throw new Error('Reached max. size')
        }
      })
    await callback(fileName, fileEntry) // NOSONAR
  }
}

export const ZipUtils = {
  forEachFileInZip,
}
