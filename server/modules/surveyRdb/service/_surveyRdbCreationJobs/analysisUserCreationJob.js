import Job from '@server/job/job'

import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'
import * as UserAnalysisManager from '@server/modules/analysis/manager/userAnalysisManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

export default class AnalysisUserCreationJob extends Job {
  constructor() {
    super(AnalysisUserCreationJob.type)
  }

  async execute() {
    const { surveyId, tx } = this

    this.total = 4

    // Create user (if not existing)
    await UserAnalysisManager.insertUserAnalysis(surveyId, tx)
    this.incrementProcessedItems()

    await SurveyRdbManager.grantPermissionsToUserAnalysis(surveyId, tx)
    this.incrementProcessedItems()

    // Grant UPDATE on processing_chain.status_exec
    await ProcessingChainManager.grantUpdateToUserAnalysis(surveyId, tx)
    this.incrementProcessedItems()

    // Grant SELECT on category_item
    await CategoryManager.grantSelectOnCategoryItemToUserAnalysis(surveyId, tx)
    this.incrementProcessedItems()
  }
}
AnalysisUserCreationJob.type = 'AnalysisUserCreationJob'
