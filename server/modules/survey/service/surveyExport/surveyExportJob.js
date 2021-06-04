import Archiver from 'archiver'

import * as ProcessUtils from '@core/processUtils'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import ActivityLogExportJob from './jobs/activityLogExportJob'
import CategoriesExportJob from './jobs/categoriesExportJob'
import ChainExportJob from './jobs/chainExportJob'
import ChainNodeDefExportJob from './jobs/chainNodeDefExportJob'
import ChainNodeDefAggregateExportJob from './jobs/chainNodeDefAggregateExportJob'
import FilesExportJob from './jobs/filesExportJob'
import RecordsExportJob from './jobs/recordsExportJob'
import SurveyInfoExportJob from './jobs/surveyInfoExportJob'
import TaxonomiesExportJob from './jobs/taxonomiesExportJob'
import UsersExportJob from './jobs/usersExportJob'

const createInnerJobs = ({ backup }) => {
  // records, files, activity log are included only if exporting survey as backup (not cloning)
  return [
    new SurveyInfoExportJob(),
    new CategoriesExportJob(),
    new TaxonomiesExportJob(),
    ...(backup ? [new RecordsExportJob(), new FilesExportJob()] : []),
    new ChainExportJob(),
    new ChainNodeDefExportJob(),
    new ChainNodeDefAggregateExportJob(),
    new UsersExportJob(),
    ...(backup ? [new ActivityLogExportJob()] : []),
  ]
}

export default class SurveyExportJob extends Job {
  /**
   * It creates a survey export job that exports a survey including node definitions, categories, taxonomies, chains and users.
   * If the export is for a backup, it includes also records, files and activity log.
   *
   * @param {!object} params - The export parameters.
   * @param {!number} [params.surveyId] - The id of the survey to export.
   * @param {!object} [params.user] - The user performing the export.
   * @param {string} [params.outputFileName = null] - If specified, it will be used to generate the name of the export file, otherwise the file name will be automatically generated.
   * @param {boolean} [params.backup = true] - If true, includes also published and draft props, records, files and activity log.
   * @returns {SurveyExportJob} - The export job.
   */
  constructor(params) {
    const { backup = true } = params
    super(SurveyExportJob.type, { ...params, backup }, createInnerJobs({ backup }))
  }

  async onStart() {
    super.onStart()
    const { outputFileName: outputFileNameParam = null, surveyId } = this.context

    // generate output file name if not specified in params
    const outputFileName = outputFileNameParam || `survey_export_${surveyId}_${Date.now()}.zip`

    const outputFilePath = FileUtils.join(ProcessUtils.ENV.tempFolder, outputFileName)
    const outputFileStream = FileUtils.createWriteSteam(outputFilePath)

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

    // cleanup job context
    this.deleteContextProps('survey', 'surveyId')
  }
}

SurveyExportJob.type = 'SurveyExportJob'
