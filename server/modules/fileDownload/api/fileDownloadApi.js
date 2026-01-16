import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { getExtensionByFileFormat } from '@core/fileFormats'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyService from '@server/modules/survey/service/surveyService'

const sendTempFileToResponse = ({ res, tempFileUuid, tempFileName, fileFormat, outputFileName }) => {
  const extension = getExtensionByFileFormat(fileFormat)
  const fileName = tempFileName ?? `${tempFileUuid}.${extension}`
  const filePath = FileUtils.tempFilePath(fileName)
  Response.sendFile({
    res,
    path: filePath,
    name: outputFileName,
    fileFormat,
    onEnd: async () => FileUtils.deleteFile(filePath),
  })
}

export const init = (app) => {
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
