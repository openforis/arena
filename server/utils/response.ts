import { ZipArchive } from 'archiver'
import type { Response as ExpressResponse } from 'express'
import path from 'node:path'

import { SystemError as CoreSystemError } from '@openforis/arena-core'

import { FileFormats } from '@core/fileFormats'
import SystemError, { StatusCodes } from '@core/systemError'
import * as Log from '@server/log/log'
import * as FileUtils from '@server/utils/file/fileUtils'

import UnauthorizedError from './unauthorizedError'

const logger = Log.getLogger('Response')

const status = {
  ok: 'ok',
  error: 'error',
}

export const contentTypes = {
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gpkg: 'application/geopackage+sqlite3',
  json: 'application/json',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
}

const contentTypeByFileFormat = {
  [FileFormats.csv]: contentTypes.csv,
  [FileFormats.gpkg]: contentTypes.gpkg,
  [FileFormats.xlsx]: contentTypes.xlsx,
  [FileFormats.zip]: contentTypes.zip,
}

export const getContentTypeByFormat = (fileFormat: string | null | undefined): string | undefined =>
  contentTypeByFileFormat[fileFormat]

export const sendOk = (res: ExpressResponse) => res.json({ status: status.ok })

const _getErr = ({ key, params }: { key: string; params?: unknown }) => ({
  status: status.error,
  key,
  params,
})

export const sendErr = (res: ExpressResponse, err: any): void => {
  if (err instanceof UnauthorizedError) {
    res.status(StatusCodes.FORBIDDEN).json(_getErr(err))
  } else if (err instanceof SystemError) {
    res.status(err.statusCode).json(_getErr(err))
  } else if (err instanceof CoreSystemError) {
    // arena-core errors have no status code (res.status(undefined) throws)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(_getErr(err))
  } else {
    // details are sent to the client too, to find the related log entry quickly when a user reports an error
    logger.error(err?.stack ?? String(err))
    res.status(err?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).json(
      _getErr({
        key: 'appErrors:generic',
        params: { text: `Could not serve: ${String(err)}` },
      })
    )
  }
}

// Unquoted file names with commas make Chromium reject the response (multiple Content-Disposition headers)
const getContentDispositionAttachment = (fileName: string): string => {
  const name = String(fileName)
  const fallbackName = name.replaceAll(/[^\x20-\x7e]|["\\%]/g, '_')
  const encodedName = encodeURIComponent(name).replaceAll(
    /['()*]/g,
    (char) => `%${char.codePointAt(0).toString(16).toUpperCase()}`
  )
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`
}

export const setContentTypeFile = ({
  res,
  fileName,
  fileSize = null,
  contentType = null,
  fileFormat = null,
}: {
  res: ExpressResponse
  fileName: string
  fileSize?: number | null
  contentType?: string | null
  fileFormat?: string | null
}): void => {
  res.setHeader('Content-Disposition', getContentDispositionAttachment(fileName))
  if (fileSize) {
    res.setHeader('Content-Length', fileSize)
  }

  const finalContentType = contentType ?? getContentTypeByFormat(fileFormat)
  if (finalContentType) {
    res.setHeader('Content-Type', finalContentType)
    res.set('Content-Type', finalContentType)
  }
}

export const sendFileContent = ({
  res,
  fileName,
  content,
  contentSize,
  contentType = null,
}: {
  res: ExpressResponse
  fileName: string
  content: string | Buffer
  contentSize?: number | null
  contentType?: string | null
}): void => {
  setContentTypeFile({ res, fileName, fileSize: contentSize, contentType })
  res.write(content, 'binary')
  res.end(null, 'binary')
}

export const sendFile = ({
  res,
  path: filePath,
  name = null,
  contentType = null,
  fileFormat = null,
  onEnd = null,
}: {
  res: ExpressResponse
  path: string
  name?: string | null
  contentType?: string | null
  fileFormat?: string | null
  onEnd?: (() => unknown) | null
}): void => {
  const fileSize = FileUtils.getFileSize(filePath)
  const fileName = name || path.basename(filePath)
  const finalContentType = contentType ?? getContentTypeByFormat(fileFormat)
  setContentTypeFile({ res, fileName, fileSize, contentType: finalContentType })
  FileUtils.createReadStream(filePath)
    .on('end', async () => {
      if (onEnd) await onEnd()
    })
    .pipe(res, { end: true })
}

export const sendDirAsZip = ({
  res,
  dir,
  name,
  deleteDirOnFinish = false,
}: {
  res: ExpressResponse
  dir: string
  name: string
  deleteDirOnFinish?: boolean
}): void => {
  if (!FileUtils.exists(dir)) {
    sendErr(res, 'Directory not found')
    return
  }
  // zip dir into a new temporary file to get the final size
  const tempFilePath = FileUtils.newTempFilePath()
  const output = FileUtils.createWriteStream(tempFilePath)
  const zip = new ZipArchive()
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

export const sendFilesAsZip = (
  res: ExpressResponse,
  fileName: string,
  files: { data: string | Buffer | NodeJS.ReadableStream; name: string }[]
): void => {
  setContentTypeFile({ res, fileName, contentType: contentTypes.zip })
  const zip = new ZipArchive()
  zip.pipe(res)
  files.forEach(({ data, name }) => {
    zip.append(data, { name })
  })
  zip.finalize()
}
