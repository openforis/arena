import Archiver from 'archiver'

import * as FileUtils from '@server/utils/file/fileUtils'
import SystemError from '@core/systemError'
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
    res.status(403).json(_getErr(err))
  } else if (err instanceof SystemError) {
    res.status(500).json(_getErr(err))
  } else {
    res.status(500).json(
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
  }

  if (contentType) {
    res.set('Content-Type', contentType)
  }
}

export const sendFile = (res, name, content, size) => {
  setContentTypeFile(res, name, size)
  res.write(content, 'binary')
  res.end(null, 'binary')
}

export const sendZipFile = (res, dir, name) => {
  if (FileUtils.existsDir(dir)) {
    setContentTypeFile(res, name, null, Response.contentTypes.zip)

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
