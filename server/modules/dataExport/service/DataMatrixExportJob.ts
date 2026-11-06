import { FileFormats } from '@core/fileFormats'
import * as User from '@core/user/user'

import Job from '@server/job/job'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import { DownloadAuthTokenUtils } from '@server/utils/downloadAuthTokenUtils'

/**
 * Exports the data of a multiple entity (filtered as in Data Explorer) as a matrix, with one column per record.
 */
export default class DataMatrixExportJob extends Job {
  static readonly type = 'DataMatrixExportJob'

  constructor(params?: any) {
    super(DataMatrixExportJob.type, params)
  }

  async execute() {
    const { surveyId, cycle, options } = this.context as any
    const { fileFormat = FileFormats.xlsx } = options

    const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

    const tempFileName = await SurveyRdbService.exportDataMatrixToTempFile(
      { user: this.user, survey, cycle, options: { ...options, fileFormat } },
      this.tx
    )
    this.setContext({ fileFormat, tempFileName })
  }

  async generateResult() {
    const { fileFormat, tempFileName } = this.context as any
    const { token: downloadToken } = DownloadAuthTokenUtils.generateToken({
      userUuid: User.getUuid(this.user),
      fileName: tempFileName,
    })
    const result = await super.generateResult()
    return { ...result, downloadToken, fileFormat }
  }
}
