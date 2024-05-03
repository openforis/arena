import Archiver from 'archiver'
import * as FileUtils from './fileUtils'

const zipDirIntoFile = async ({ dirPath, outputFilePath, onTotal = null, onProgress = null }) => {
  const output = FileUtils.createWriteStream(outputFilePath)
  const zip = Archiver('zip')
  let totalSize = null
  if (onTotal) {
    totalSize = FileUtils.getDirSize(dirPath)
    onTotal(totalSize)
  }
  zip.pipe(output)
  zip.directory(dirPath, false)
  if (onProgress) {
    zip.on('progress', (data) => {
      onProgress({ total: totalSize, processed: data.fs.processedBytes })
    })
  }
  await zip.finalize()
}

const zipDirIntoTempFile = async ({ dirPath }) => {
  const outputFilePath = FileUtils.newTempFilePath()
  await zipDirIntoFile({ dirPath, outputFilePath })
  return outputFilePath
}

export const ZipUtils = {
  zipDirIntoTempFile,
  zipDirIntoFile,
}
