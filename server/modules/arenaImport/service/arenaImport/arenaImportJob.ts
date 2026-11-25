import Job, { type JobParams } from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import { SurveyCreatorJobHelper } from '@server/modules/survey/service/surveyCreatorJobHelper'
import * as FileUtils from '@server/utils/file/fileUtils'

import ActivityLogImportJob from './jobs/activityLogImportJob'
import ArenaSurveyReaderJob from './jobs/arenaSurveyReaderJob'
import CategoriesImportJob from './jobs/categoriesImportJob'
import ChainsImportJob from './jobs/chainsImportJob'
import CreateRdbJob from './jobs/createRdb'
import FilesImportJob from './jobs/filesImportJob'
import NodeDefsImportJob from './jobs/nodeDefsImportJob'
import RecordsImportJob from './jobs/recordsImportJob'
import SurveyCreatorJob from './jobs/surveyCreatorJob'
import SurveyFilesImportJob from './jobs/surveyFilesImportJob'
import TaxonomiesImportJob from './jobs/taxonomiesImportJob'
import UsersImportJob from './jobs/usersImportJob'

const createInnerJobs = (params: Partial<JobParams>) => {
  const { backup = true, options = {} } = params
  const { includeData = true } = options

  return [
    new PrepareImportFileJob(),
    new ArenaSurveyReaderJob(),

    new SurveyCreatorJob(),
    ...(backup ? [new UsersImportJob()] : []),
    new TaxonomiesImportJob(),
    new CategoriesImportJob(),
    new NodeDefsImportJob(),
    new ChainsImportJob(),
    new SurveyFilesImportJob(),
    // when not restoring a survey backup, skip activity log, records and files
    ...(backup ? [new ActivityLogImportJob()] : []),
    ...(backup && includeData ? [new RecordsImportJob()] : []),
    ...(backup && includeData ? [new FilesImportJob()] : []),
    // Needed when the survey is published
    new CreateRdbJob(),
  ]
}

const transformParams = (params: Partial<JobParams>) => {
  const { backup: backupParam = true, options = { includeData: true }, ...paramsRest } = params
  const { includeData } = options
  const backup = backupParam && includeData
  return { backup, options, ...paramsRest }
}

export default class ArenaImportJob extends Job {
  static readonly type = 'ArenaImportJob'

  /**
   * Creates a new import job to import a survey in Arena format.
   * Records, files and activity log will be importin only when restoring a backup.
   * If not restoring a backup, node definition, categories and taxonomies will be restored as draft.
   * @param {!object} params - The import parameters.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!object} [params.user] - The user performing the import.
   * @param {boolean} [params.backup] - If true, props and propsDraft will be imported separately and records, files, activity logs will be imported.
   * @param {object} [params.surveyInfoTarget] - Target survey info (optional).
   * @returns {ArenaImportJob} - The import job.
   */
  constructor(params?: Partial<JobParams>) {
    const paramsTransformed = transformParams(params)
    super(ArenaImportJob.type, paramsTransformed, createInnerJobs(paramsTransformed))
  }

  beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
    return Promise.resolve()
  }

  async onEnd() {
    await super.onEnd()

    const { arenaSurveyFileZip, cloning, filePath, surveyId } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (surveyId) {
      if (cloning) {
        // when cloning, survey temporary flag or delete will be managed by parent SurveyCloneJob
        this.logDebug(`skipping 'temporary' flag remove for survey ${surveyId}`)
      } else {
        await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId })
      }
    }
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}
