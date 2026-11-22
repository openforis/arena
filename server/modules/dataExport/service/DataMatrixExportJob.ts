import type { ArenaJobContext } from '@openforis/arena-core'
import { type FileFormat, FileFormats } from '@core/fileFormats'
import * as User from '@core/user/user'

import Job, { type JobParams } from '@server/job/job'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import { DownloadAuthTokenUtils } from '@server/utils/downloadAuthTokenUtils'
import type { DataMatrixExportOptions } from '@server/modules/surveyRdb/manager/dataExportOptions'

/**
 * Exports the data of a multiple entity (filtered as in Data Explorer) as a matrix, with one column per record.
 */
interface DataMatrixExportJobContext extends ArenaJobContext {
  cycle: string
  options: DataMatrixExportOptions
  fileFormat?: FileFormat
  tempFileName?: string
}

export default class DataMatrixExportJob extends Job<DataMatrixExportJobContext> {
  static readonly type = 'DataMatrixExportJob'

  constructor(params?: Partial<JobParams>) {
    super(DataMatrixExportJob.type, params)
  }

  async execute() {
    const { surveyId, cycle, options } = this.context
    const { fileFormat = FileFormats.xlsx } = options

    const survey = await SurveyService.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

    const tempFileName = await SurveyRdbService.exportDataMatrixToTempFile(
      { user: this.user, survey, cycle, options: { ...options, fileFormat } },
      this.tx
    )
    this.setContext({ fileFormat, tempFileName })
  }

  async generateResult() {
    const { fileFormat, tempFileName } = this.context
    const { token: downloadToken } = DownloadAuthTokenUtils.generateToken({
      userUuid: User.getUuid(this.user),
      fileName: tempFileName,
    })
    const result = await super.generateResult()
    return { ...result, downloadToken, fileFormat }
  }
}
