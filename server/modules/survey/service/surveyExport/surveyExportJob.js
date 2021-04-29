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

    await this.initArchive()
  }

  async initArchive() {
    const { outputFileName } = this.context

    const outputDir = ProcessUtils.ENV.tempFolder
    if (!FileUtils.existsDir(outputDir)) {
      await FileUtils.mkdir(outputDir)
    }
    const outputFilePath = FileUtils.join(outputDir, outputFileName)
    const outputFileStream = FileUtils.createWriteStream(outputFilePath)
    const archive = Archiver('zip')
    archive.pipe(outputFileStream)

    this.setContext({ archive })
  }

  async onEnd() {
    await super.onEnd()

    // finalize archive
    const { archive } = this.context
    archive.finalize()
    this.setContext({ archive: null })
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
