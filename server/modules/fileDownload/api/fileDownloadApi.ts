import type { Response as ExpressResponse, Router } from 'express'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { getExtensionByFileFormat } from '@core/fileFormats'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyService from '@server/modules/survey/service/surveyService'

export const sendTempFileToResponse = ({
  res,
  tempFileUuid = null,
  tempFileName = null,
  fileFormat,
  outputFileName,
}: {
  res: ExpressResponse
  tempFileUuid?: string | null
  // used instead of the uuid when specified
  tempFileName?: string | null
  fileFormat: Parameters<typeof getExtensionByFileFormat>[0]
  outputFileName: string
}): void => {
  const extension = getExtensionByFileFormat(fileFormat)
  const fileName = tempFileName ?? `${tempFileUuid}.${extension}`
  const filePath = FileUtils.tempFilePath(fileName)
  Response.sendFile({
    res,
    path: filePath,
    name: outputFileName,
    fileFormat,
    onEnd: () => FileUtils.deleteFile(filePath),
  })
}

export const init = (app: Router): void => {
  app.get('/download', AuthMiddleware.requireDownloadToken, async (req, res, next) => {
    try {
      const downloadFileName = Request.getDownloadFileName(req)
      const { surveyId, cycle, fileType, fileFormat } = Request.getParams(req)

      const survey = surveyId ? await SurveyService.fetchSurveyById({ surveyId, draft: true }) : null

      const outputFileName = ExportFileNameGenerator.generate({
        survey,
        cycle,
        fileType,
        fileFormat,
        includeTimestamp: true,
      })
      sendTempFileToResponse({ res, tempFileName: downloadFileName, fileFormat, outputFileName })
    } catch (error) {
      next(error)
    }
  })
}
