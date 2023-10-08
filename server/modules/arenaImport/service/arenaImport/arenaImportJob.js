import Job from '@server/job/job'

import { SurveyCreatorJobHelper } from '@server/modules/survey/service/surveyCreatorJobHelper'
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
  const { backup = true, options = {} } = params
  const { includeData = true } = options

  return [
    new ArenaSurveyReaderJob(),

    new SurveyCreatorJob(),
    ...(backup ? [new UsersImportJob()] : []),
    new TaxonomiesImportJob(),
    new CategoriesImportJob(),
    new NodeDefsImportJob(),
    new ChainsImportJob(),
    // when not restoring a survey backup, skip activity log, records and files
    ...(backup ? [new ActivityLogImportJob()] : []),
    ...(backup && includeData ? [new RecordsImportJob()] : []),
    ...(backup && includeData ? [new FilesImportJob()] : []),
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
    const { backup = true, options = { includeData: true }, ...paramsRest } = params
    super(ArenaImportJob.type, { ...paramsRest, backup, options }, createInnerJobs(params))
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
  }

  async onEnd() {
    await super.onEnd()

    const { arenaSurveyFileZip, backup, filePath, surveyId } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (surveyId) {
      if (backup) {
        await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId })
      } else {
        // if not backup (cloning) survey temporary flag or delete will be managed by parent SurveyCloneJob
        this.logDebug(`skipping 'temporary' flag remove for survey ${surveyId}`)
      }
    }
    FileUtils.deleteFile(filePath)
  }
}

ArenaImportJob.type = 'ArenaImportJob'
