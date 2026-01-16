import { ServiceRegistry, ServiceType } from '@openforis/arena-core'

import * as User from '@core/user/user'

import ZipFileCreatorBaseJob from '@server/job/zipFileCreatorBaseJob'

import ActivityLogExportJob from './jobs/activityLogExportJob'
import CategoriesExportJob from './jobs/categoriesExportJob'
import ChainExportJob from './jobs/chainExportJob'
import FilesExportJob from './jobs/filesExportJob'
import RecordsExportJob from './jobs/recordsExportJob'
import SurveyInfoExportJob from './jobs/surveyInfoExportJob'
import TaxonomiesExportJob from './jobs/taxonomiesExportJob'
import UsersExportJob from './jobs/usersExportJob'

const createInnerJobs = ({ backup, includeResultAttributes, includeActivityLog }) => {
  // records, files, activity log are included only if exporting survey as backup (not cloning)
  return [
    new SurveyInfoExportJob(),
    new CategoriesExportJob(),
    new TaxonomiesExportJob(),
    ...(backup ? [new RecordsExportJob({ includeResultAttributes }), new FilesExportJob()] : []),
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
   * @param {boolean} [params.includeResultAttributes = true] - If true, includes result attributes data in the export.
   * @param {boolean} [params.includeActivityLog = true] - If true, includes the activity log in the export.
   * @returns {SurveyExportJob} - The export job.
   */
  constructor(params) {
    const { backup = true, includeResultAttributes = true, includeActivityLog = true } = params
    super(
      SurveyExportJob.type,
      { ...params, backup, includeResultAttributes, includeActivityLog },
      createInnerJobs({ backup, includeResultAttributes, includeActivityLog })
    )
  }

  generateResult() {
    const result = super.generateResult()

    const { token: downloadToken } = this.generateDownloadToken()

    return { ...result, downloadToken }
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    // cleanup job context
    this.deleteContextProps('survey', 'surveyId')
  }

  generateDownloadToken() {
    const { user, outputFileName } = this.context

    const userUuid = User.getUuid(user)

    const serviceRegistry = ServiceRegistry.getInstance()
    const authTokenService = serviceRegistry.getService(ServiceType.userAuthToken)
    return authTokenService.createDownloadAuthToken({
      userUuid,
      fileName: outputFileName,
    })
  }
}

SurveyExportJob.type = 'SurveyExportJob'
