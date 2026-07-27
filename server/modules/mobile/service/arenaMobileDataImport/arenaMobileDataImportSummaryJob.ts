import { Surveys, SystemError } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as TempFileManager from '@server/modules/file/manager/tempFileManager'

import ArenaFileReadJob from './jobs/arenaFileReadJob'
import RecordsImportSummaryJob from './jobs/recordsImportSummaryJob'

/**
 * Reads an Arena format zip and generates a preview/summary of what would happen if it were imported
 * (which records are new, which already exist and whether they'd be overwritten/merged/skipped), without
 * writing anything to the database. The uploaded file is kept on disk afterwards (see onEnd) so that a
 * subsequent, real import request can reuse it instead of re-uploading it.
 */
export default class ArenaMobileDataImportSummaryJob extends Job {
  static type = 'ArenaMobileDataImportSummaryJob'

  constructor(params?: any) {
    super(ArenaMobileDataImportSummaryJob.type, params, [
      new PrepareImportFileJob(),
      new ArenaFileReadJob(),
      new RecordsImportSummaryJob(),
    ])
  }

  async onStart() {
    await super.onStart()

    const context: any = this.context
    const { surveyId } = context

    const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true }, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (!Surveys.isVisibleInMobile(surveyInfo) || !Surveys.isRecordsUploadFromMobileAllowed(surveyInfo)) {
      throw new SystemError('dataImport.importFromMobileNotAllawed')
    }
    this.setContext({ survey })
  }

  generateResult() {
    return this.combineInnerJobsResults()
  }

  async onEnd() {
    await super.onEnd()

    const context: any = this.context
    const { arenaSurveyFileZip, filePath, fileId } = context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (filePath) {
      await TempFileManager.keepFileForLaterUse({ fileId, filePath })
    }
  }
}
