import fs from 'fs'
import Archiver from 'archiver'

import * as ProcessUtils from '@core/processUtils'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import ActivityLogExportJob from './jobs/activityLogExportJob'
import CategoriesExportJob from './jobs/categoriesExportJob'
import ChainExportJob from './jobs/chainExportJob'
import FilesExportJob from './jobs/filesExportJob'
import RecordsExportJob from './jobs/recordsExportJob'
import SurveyInfoExportJob from './jobs/surveyInfoExportJob'
import TaxonomiesExportJob from './jobs/taxonomiesExportJob'
import UsersExportJob from './jobs/usersExportJob'

export default class SurveyExportJob extends Job {
  constructor(params) {
    super(SurveyExportJob.type, params, [
      new SurveyInfoExportJob(),
      new CategoriesExportJob(),
      new TaxonomiesExportJob(),
      new RecordsExportJob(),
      new FilesExportJob(),
      new ChainExportJob(),
      new UsersExportJob(),
      new ActivityLogExportJob(),
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

SurveyExportJob.type = 'SurveyExportJob'
