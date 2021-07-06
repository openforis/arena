import { SRSs } from '@openforis/arena-core'

import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import ActivityLogImportJob from './jobs/activityLogImportJob'
import ArenaSurveyReaderJob from './jobs/arenaSurveyReaderJob'
import SurveyCreatorJob from './jobs/surveyCreatorJob'
import CategoriesImportJob from './jobs/categoriesImportJob'
import TaxonomiesImportJob from './jobs/taxonomiesImportJob'
import NodeDefsImportJob from './jobs/nodeDefsImportJob'
import RecordsImportJob from './jobs/recordsImportJob'
import FilesImportJob from './jobs/filesImportJob'
import UsersImportJob from './jobs/usersImportJob'
import ChainsImportJob from './jobs/chainsImportJob'
import CreateRdbJob from './jobs/createRdb'

const createInnerJobs = (params) => {
  const { backup = true } = params
  return [
    new ArenaSurveyReaderJob(),
    new SurveyCreatorJob(),
    new UsersImportJob(),
    new TaxonomiesImportJob(),
    new CategoriesImportJob(),
    new NodeDefsImportJob(),
    new ChainsImportJob(),
    // when not restoring a survey backup, skip activity log, records and files
    ...(backup ? [new ActivityLogImportJob(), new RecordsImportJob(), new FilesImportJob()] : []),
    // Needed when the survey is published
    new CreateRdbJob(),
  ]
}

export default class ArenaImportJob extends Job {
  /**
   * Creates a new import job to import a survey in Arena format.
   * Records, files and activity log will be importin only when restoring a backup.
   * If not restoring a backup, node definition, categories and taxonomies will be restored as draft.
   *
   * @param {!object} params - The import parameters.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!object} [params.user] - The user performing the import.
   * @param {boolean} [params.backup = true] - If true, props and propsDraft will be imported separately and records, files, activity logs will be imported.
   * @param {object} [params.surveyInfoTarget = null] - Target survey info (optional).
   * @returns {ArenaImportJob} - The import job.
   */
  constructor(params) {
    const { backup = true, ...paramsRest } = params
    super(ArenaImportJob.type, { ...paramsRest, backup }, createInnerJobs(params))
  }

  async onStart() {
    await super.onStart()
    await SRSs.init()
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
  }

  async onEnd() {
    await super.onEnd()

    const { arenaSurveyFileZip, surveyId, filePath } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (surveyId) {
      if (this.isSucceeded()) {
        this.logDebug(`removing 'temporary' flag from survey ${surveyId}...`)
        await SurveyManager.removeSurveyTemporaryFlag({ surveyId })
        this.logDebug(`'temporary' flag removed from survey ${surveyId}`)
      } else {
        this.logDebug(`deleting temporary survey ${surveyId}...`)
        await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
        this.logDebug(`survey ${surveyId} deleted!`)
      }
    }

    await FileUtils.rmdir(filePath)
  }
}

ArenaImportJob.type = 'ArenaImportJob'
