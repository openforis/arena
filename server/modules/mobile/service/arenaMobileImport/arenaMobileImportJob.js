import { SRSs } from '@openforis/arena-core'

import Job from '@server/job/job'

import * as FileUtils from '@server/utils/file/fileUtils'

import ArenaSurveyReaderJob from './jobs/arenaSurveyReaderJob'
import RecordsImportJob from './jobs/recordsImportJob'
import CreateRdbJob from './jobs/createRdb'

const createInnerJobs = () => {
  return [
    new ArenaSurveyReaderJob(),
    new RecordsImportJob(),
    // Needed when the survey is published
    new CreateRdbJob(),
  ]
}

export default class ArenaMobileImportJob extends Job {
  /**
   * Creates a new import job to import a survey in Arena format.
   * Records, files and activity log will be importin only when restoring a backup.
   * If not restoring a backup, node definition, categories and taxonomies will be restored as draft.
   *
   * @param {!object} params - The import parameters.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!object} [params.user] - The user performing the import.
   * @param {!object} [params.survey] - The survey of the records.
   * @param {!object} [params.surveyId] - The id of the survey.
   * @returns {ArenaMobileImportJob} - The import job.
   */
  constructor(params) {
    super(ArenaMobileImportJob.type, params, createInnerJobs())
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

    const { arenaSurveyFileZip, filePath } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }
    await FileUtils.rmdir(filePath)
  }
}

ArenaMobileImportJob.type = 'ArenaMobileImportJob'
