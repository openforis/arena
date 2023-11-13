import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'

import RecordsImportJob from './jobs/recordsImportJob'
import FilesImportJob from '../../../arenaImport/service/arenaImport/jobs/filesImportJob'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'
import * as SurveyService from '@server/modules/survey/service/surveyService'

export default class ArenaMobileDataImportJob extends Job {
  /**
   * Creates a new data import job to import survey records and files in Arena format.
   *
   * @param {!object} params - The import parameters.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!object} [params.user] - The user performing the import.
   * @returns {ArenaMobileDataImportJob} - The import job.
   */
  constructor(params) {
    super(ArenaMobileDataImportJob.type, params, [new RecordsImportJob(), new FilesImportJob()])
  }

  async onStart() {
    await super.onStart()

    const { context, tx } = this
    const { filePath, surveyId } = context

    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    this.setContext({ arenaSurveyFileZip })

    const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true }, tx)
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
    // get result from records import job
    const recordsImportJob = this.innerJobs[0]
    return recordsImportJob?.result || {}
  }
}

ArenaMobileDataImportJob.type = 'ArenaMobileDataImportJob'
