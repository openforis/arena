import { Surveys, SystemError } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as TempFileManager from '@server/modules/file/manager/tempFileManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import FilesImportJob from '../../../arenaImport/service/arenaImport/jobs/filesImportJob'
import ArenaFileReadJob from './jobs/arenaFileReadJob'
import RecordsImportJob from './jobs/recordsImportJob'
import * as RecordsUploadNotificationService from '../recordsUploadNotificationService'

export default class ArenaMobileDataImportJob extends Job {
  /**
   * Creates a new data import job to import survey records and files in Arena format.
   * @param {!object} params - The import parameters.
   * @param {!object} [params.user] - The user performing the import.
   * @param {!number} [params.surveyId] - The id of the survey in which data will be imported.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!string} [params.conflictResolutionStrategy] - How to resolve conflicting records (duplicate keys).
   * @param {boolean} [params.skipMissingFiles] - When true, missing file content is logged as a warning instead of aborting.
   * @param {string} [params.serverUrl] - Public URL of the server, used in the notification emails.
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
    const { surveyId, reuseUploadedFile, fileId } = context

    if (reuseUploadedFile) {
      const filePath = await TempFileManager.getKeptFilePath({ fileId })
      this.setContext({ filePath })
    }

    const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (!Surveys.isVisibleInMobile(surveyInfo) || !Surveys.isRecordsUploadFromMobileAllowed(surveyInfo)) {
      throw new SystemError('dataImport.importFromMobileNotAllawed')
    }
    // published survey info, like the other Arena Mobile options
    const notifyAdmins = Survey.isNotifyAdminsOnRecordsUploadFromMobile(surveyInfo)
    this.setContext({ survey, notifyAdmins })
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

    this.errors = this.combineInnerJobsErrors()

    const { arenaSurveyFileZip, filePath } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (filePath) {
      // the file could have been deleted already, when discarding the pending import on cancel
      await FileUtils.deleteFileAsync(filePath).catch(() => null)
    }

    await this.notifySurveyAdmins()
  }

  // runs after the transaction has been committed: records are notified only when actually stored
  async notifySurveyAdmins() {
    const { context, user } = this
    const { notifyAdmins, serverUrl, survey, uploadedRecordsInfo } = context
    if (!this.isSucceeded() || !notifyAdmins || !uploadedRecordsInfo?.length) return
    try {
      const notifiedCount = await RecordsUploadNotificationService.notifySurveyAdmins({
        surveyInfo: Survey.getSurveyInfo(survey),
        user,
        records: uploadedRecordsInfo,
        serverUrl,
      })
      this.logDebug(`${notifiedCount} survey admin(s) notified about ${uploadedRecordsInfo.length} uploaded record(s)`)
    } catch (error) {
      // the upload succeeded: a notification failure must not affect it
      this.logError(`error notifying survey admins: ${error.message}`)
    }
  }
}

ArenaMobileDataImportJob.type = 'ArenaMobileDataImportJob'
