import { Surveys, SystemError } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as FileUtils from '@server/utils/file/fileUtils'

import FilesImportJob from '../../../arenaImport/service/arenaImport/jobs/filesImportJob'
import ArenaFileReadJob from './jobs/arenaFileReadJob'
import RecordsImportJob from './jobs/recordsImportJob'

export default class ArenaMobileDataImportJob extends Job {
  /**
   * Creates a new data import job to import survey records and files in Arena format.
   * @param {!object} params - The import parameters.
   * @param {!object} [params.user] - The user performing the import.
   * @param {!number} [params.surveyId] - The id of the survey in which data will be imported.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!string} [params.conflictResolutionStrategy] - How to resolve conflicting records (duplicate keys).
   * @returns {ArenaMobileDataImportJob} - The import job.
   */
  constructor(params) {
    super(ArenaMobileDataImportJob.type, params, [
      new PrepareImportFileJob(),
      new ArenaFileReadJob(),
      new RecordsImportJob(),
      new FilesImportJob(),
    ])
  }

  async onStart() {
    await super.onStart()

    const { context, tx } = this
    const { surveyId } = context

    const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (!Surveys.isVisibleInMobile(surveyInfo) || !Surveys.isRecordsUploadFromMobileAllowed(surveyInfo)) {
      throw new SystemError('dataImport.importFromMobileNotAllawed')
    }
    this.setContext({ survey })
  }

  async beforeSuccess() {
    await super.beforeSuccess()

    const { context, user, updatedRecordsUuids } = this
    const { survey } = context

    const surveyId = Survey.getId(survey)

    const surveyInfo = Survey.getSurveyInfo(survey)
    const cycleKeys = Survey.getCycleKeys(surveyInfo)

    // reload udpated records in update threads
    cycleKeys.forEach((cycle) => {
      const thread = RecordsUpdateThreadService.getThread({ surveyId, cycle })
      if (thread) {
        updatedRecordsUuids.forEach((recordUuid) => {
          thread.postMessage({ type: RecordsUpdateThreadMessageTypes.recordReload, user, surveyId, recordUuid })
        })
      }
    })
  }

  generateResult() {
    return this.combineInnerJobsResults()
  }

  async onEnd() {
    await super.onEnd()

    const { arenaSurveyFileZip, filePath } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}

ArenaMobileDataImportJob.type = 'ArenaMobileDataImportJob'
