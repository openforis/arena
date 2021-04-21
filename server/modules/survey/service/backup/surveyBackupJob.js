import fs from 'fs'
import Archiver from 'archiver'

import * as ProcessUtils from '@core/processUtils'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import ActivityLogBackupJob from './jobs/activityLogBackupJob'
import CategoriesBackupJob from './jobs/categoriesBackupJob'
import ChainBackupJob from './jobs/chainBackupJob'
import FilesBackupJob from './jobs/filesBackupJob'
import RecordsBackupJob from './jobs/recordsBackupJob'
import SurveyInfoBackupJob from './jobs/surveyInfoBackupJob'
import TaxonomiesBackupJob from './jobs/taxonomiesBackupJob'
import UsersBackupJob from './jobs/usersBackupJob'

export default class SurveyBackupJob extends Job {
  constructor(params) {
    super(SurveyBackupJob.type, params, [
      new SurveyInfoBackupJob(),
      new CategoriesBackupJob(),
      new TaxonomiesBackupJob(),
      new RecordsBackupJob(),
      new FilesBackupJob(),
      new ChainBackupJob(),
      new UsersBackupJob(),
      new ActivityLogBackupJob(),
    ])
  }

  async onStart() {
    super.onStart()
    const { outputFileName } = this.context

    const outputFilePath = FileUtils.join(ProcessUtils.ENV.tempFolder, outputFileName)
    const outputFileStream = fs.createWriteStream(outputFilePath)
    const archive = Archiver('zip')
    archive.pipe(outputFileStream)

    this.setContext({ archive })
  }

  async onEnd() {
    await super.onEnd()
    const { archive } = this.context
    archive.finalize()
  }

  async beforeSuccess() {
    const { survey, outputFileName } = this.context

    this.setResult({
      survey,
      outputFileName,
    })
  }
}

SurveyBackupJob.type = 'SurveyBackupJob'
