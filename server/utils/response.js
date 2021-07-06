import * as fs from 'fs'
import path from 'path'
import Archiver from 'archiver'

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
  } else if (err instanceof SystemError) {
    res.status(err.statusCode).json(_getErr(err))
  } else {
    res.status(err.statusCode).json(
      _getErr({
        key: 'appErrors.generic',
        params: { text: `Could not serve: ${err.toString()}` },
      })
    )
  }
}

export const setContentTypeFile = (res, fileName, fileSize = null, contentType = null) => {
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
  if (fileSize) {
    res.setHeader('Content-Length', fileSize)
    res.setHeader('Content-Type', contentType)
  }

  if (contentType) {
    res.set('Content-Type', contentType)
  }
}

export const sendFileContent = (res, name, content, size) => {
  setContentTypeFile(res, name, size)
  res.write(content, 'binary')
  res.end(null, 'binary')
}

export const sendFile = ({ res, path: filePath, name = null }) => {
  const stats = fs.statSync(filePath)
  const { size } = stats
  const fileName = name || path.basename(filePath)
  setContentTypeFile(res, fileName, size)
  fs.createReadStream(filePath).pipe(res)
}

export const sendZipFile = (res, dir, name) => {
  if (FileUtils.existsDir(dir)) {
    setContentTypeFile(res, name, null, contentTypes.zip)

    const zip = Archiver('zip')
    zip.pipe(res)
    zip.directory(dir, false)
    zip.finalize()
    res.on('finish', async () => {
      await FileUtils.rmdir(dir)
    })
  } else {
    sendErr(res, 'File not found')
  }
}

export const sendFilesAsZip = (res, zipName, files) => {
  setContentTypeFile(res, zipName, null, contentTypes.zip)
  const zip = Archiver('zip')
  zip.pipe(res)
  files.forEach(({ data, name }) => {
    zip.append(data, { name })
  })
  zip.finalize()
}
