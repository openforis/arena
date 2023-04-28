import Archiver from 'archiver'
import * as FileUtils from './fileUtils'

const zipDirIntoFile = async ({ dirPath, outputFilePath }) => {
  const output = FileUtils.createWriteStream(outputFilePath)
  const zip = Archiver('zip')
  zip.pipe(output)
  zip.directory(dirPath, false)
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
