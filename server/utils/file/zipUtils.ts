import { ZipArchive } from 'archiver'

import * as FileUtils from './fileUtils'

const zipDirIntoFile = async ({
  dirPath,
  outputFilePath,
  onTotal = null,
  onProgress = null,
}: {
  dirPath: string
  outputFilePath: string
  onTotal?: ((total: number) => void) | null
  onProgress?: ((progress: { total: number | null; processed: number }) => void) | null
}): Promise<void> => {
  const output = FileUtils.createWriteStream(outputFilePath)
  const zip = new ZipArchive()
  let totalSize: number | null = null
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

const zipDirIntoTempFile = async ({ dirPath }: { dirPath: string }): Promise<string> => {
  const outputFilePath = FileUtils.newTempFilePath()
  await zipDirIntoFile({ dirPath, outputFilePath })
  return outputFilePath
}

export const ZipUtils = {
  zipDirIntoTempFile,
  zipDirIntoFile,
}
