import * as UserAnalysis from '@core/user/userAnalysis'

import Job from '@server/job/job'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'
import * as SchemaRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as UserAnalysisManager from '@server/modules/user/manager/userAnalysisManager'

export default class UserAnalysisCreationJob extends Job {
  constructor() {
    super(UserAnalysisCreationJob.type)
  }

  async execute() {
    const { surveyId, tx } = this

    this.total = 4

    // Create user (if not existing)
    const userAnalysis = await UserAnalysisManager.insertUserAnalysis(this.surveyId, this.tx)
    this.incrementProcessedItems()

    const userAnalysisName = UserAnalysis.getName(userAnalysis)

    // Grant SELECT on RDB schema tables and views
    await SchemaRdbManager.grantSchemaSelectToUser(surveyId, userAnalysisName, tx)
    this.incrementProcessedItems()

    // Grant INSERT/UPDATE/DELETE on node_analysis table
    await SchemaRdbManager.grantWriteOnNodeAnalysisToUser(surveyId, userAnalysisName, tx)
    this.incrementProcessedItems()

    // Grant UPDATE on processing_chain.status_exec
    await ProcessingChainManager.grantUpdateOnProcessingChainStatusToUser(surveyId, userAnalysisName, tx)
    this.incrementProcessedItems()
  }
}
UserAnalysisCreationJob.type = 'UserAnalysisCreationJob'
