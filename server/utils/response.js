import path from 'path'
import Archiver from 'archiver'

import { SystemError as CoreSystemError } from '@openforis/arena-core'

import * as FileUtils from '@server/utils/file/fileUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import UnauthorizedError from './unauthorizedError'

const status = {
  ok: 'ok',
  error: 'error',
}

export const contentTypes = {
  csv: 'text/csv',
  zip: 'application/zip',
}

export const sendOk = (res) => res.json({ status: status.ok })

const _getErr = ({ key, params }) => ({
  status: status.error,
  key,
  params,
})

export const sendErr = (res, err) => {
  if (err instanceof UnauthorizedError) {
    res.status(StatusCodes.FORBIDDEN).json(_getErr(err))
  } else if (err instanceof SystemError || err instanceof CoreSystemError) {
    res.status(err.statusCode).json(_getErr(err))
  } else {
    res.status(err.statusCode).json(
      _getErr({
        key: 'appErrors:generic',
        params: { text: `Could not serve: ${err.toString()}` },
      })
    )
  }
}

export const setContentTypeFile = ({ res, fileName, fileSize = null, contentType = null }) => {
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  if (fileSize) {
    res.setHeader('Content-Length', fileSize)
  }

  if (contentType) {
    res.setHeader('Content-Type', contentType)
    res.set('Content-Type', contentType)
  }
}

export const sendFileContent = (res, fileName, content, fileSize) => {
  setContentTypeFile({ res, fileName, fileSize })
  res.write(content, 'binary')
  res.end(null, 'binary')
}

export const sendFile = ({ res, path: filePath, name = null, contentType = null, onEnd = null }) => {
  const fileSize = FileUtils.getFileSize(filePath)
  const fileName = name || path.basename(filePath)
  setContentTypeFile({ res, fileName, fileSize, contentType })
  FileUtils.createReadStream(filePath)
    .on('end', async () => {
      if (onEnd) await onEnd()
    })
    .pipe(res, { end: true })
}

export const sendDirAsZip = ({ res, dir, name, deleteDirOnFinish = false }) => {
  if (!FileUtils.exists(dir)) {
    sendErr(res, 'Directory not found')
  }
  // zip dir into a new temporary file to get the final size
  const tempFilePath = FileUtils.newTempFilePath()
  const output = FileUtils.createWriteStream(tempFilePath)
  const zip = Archiver('zip')
  zip.pipe(output)
  zip.directory(dir, false)
  zip.finalize()

  // send the zip file to the reponse
  output.on('finish', async () => {
    sendFile({
      res,
      path: tempFilePath,
      name,
      contentType: contentTypes.zip,
      onEnd: () => {
        FileUtils.deleteFile(tempFilePath)
      },
    })
    if (deleteDirOnFinish) {
      await FileUtils.rmdir(dir)
    }
  })
}

export const sendFilesAsZip = (res, fileName, files) => {
  setContentTypeFile({ res, fileName, contentType: contentTypes.zip })
  const zip = Archiver('zip')
  zip.pipe(res)
  files.forEach(({ data, name }) => {
    zip.append(data, { name })
  })
  zip.finalize()
}
