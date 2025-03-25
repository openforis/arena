import ZipFileCreatorBaseJob from '@server/job/zipFileCreatorBaseJob'
import ActivityLogExportJob from './jobs/activityLogExportJob'
import CategoriesExportJob from './jobs/categoriesExportJob'
import ChainExportJob from './jobs/chainExportJob'
import FilesExportJob from './jobs/filesExportJob'
import RecordsExportJob from './jobs/recordsExportJob'
import SurveyInfoExportJob from './jobs/surveyInfoExportJob'
import TaxonomiesExportJob from './jobs/taxonomiesExportJob'
import UsersExportJob from './jobs/usersExportJob'

const createInnerJobs = ({ backup, includeActivityLog }) => {
  // records, files, activity log are included only if exporting survey as backup (not cloning)
  return [
    new SurveyInfoExportJob(),
    new CategoriesExportJob(),
    new TaxonomiesExportJob(),
    ...(backup ? [new RecordsExportJob(), new FilesExportJob()] : []),
    new ChainExportJob(),
    ...(backup && includeActivityLog ? [new UsersExportJob(), new ActivityLogExportJob()] : []),
  ]
}

export default class SurveyExportJob extends ZipFileCreatorBaseJob {
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
    const { backup = true, includeActivityLog = true } = params
    super(
      SurveyExportJob.type,
      { ...params, backup, includeActivityLog },
      createInnerJobs({ backup, includeActivityLog })
    )
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    // cleanup job context
    this.deleteContextProps('survey', 'surveyId')
  }
}

SurveyExportJob.type = 'SurveyExportJob'
