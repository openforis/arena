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

const createInnerJobs = (params) => {
  const { cloning } = params
  // records, files, activity log are not inlcuded if cloning survey
  return [
    new SurveyInfoExportJob(),
    new CategoriesExportJob(),
    new TaxonomiesExportJob(),
    ...(cloning ? [] : [new RecordsExportJob(), new FilesExportJob()]),
    new ChainExportJob(),
    new UsersExportJob(),
    ...(cloning ? [] : [new ActivityLogExportJob()]),
  ]
}

export default class SurveyExportJob extends Job {
  constructor(params) {
    super(SurveyExportJob.type, params, createInnerJobs(params))
  }

  async onStart() {
    super.onStart()
    const { surveyId, outputFileName: outputFileNameParam } = this.context

    const outputFileName = outputFileNameParam || `survey_export_${surveyId}_${Date.now()}.zip`

    const outputFilePath = FileUtils.join(ProcessUtils.ENV.tempFolder, outputFileName)
    const outputFileStream = fs.createWriteStream(outputFilePath)
    const archive = Archiver('zip')
    archive.pipe(outputFileStream)

    this.setContext({ archive, outputFileName, filePath: outputFilePath })
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
