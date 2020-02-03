import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'
import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbGeneratorJob from '@server/modules/surveyRdb/service/surveyRdbGeneratorJob'
import RecordsUniquenessValidationJob from '@server/modules/record/service/recordsUniquenessValidationJob'

import CategoriesValidationJob from './jobs/categoriesValidationJob'
import CyclesDeletedCheckJob from './jobs/cyclesDeletedCheckJob'
import NodeDefsValidationJob from './jobs/nodeDefsValidationJob'
import ProcessingChainsCyclesCheckJob from './jobs/processingChainsCyclesCheckJob'
import SurveyInfoValidationJob from './jobs/surveyInfoValidationJob'
import SurveyPropsPublishJob from './jobs/surveyPropsPublishJob'
import TaxonomiesValidationJob from './jobs/taxonomiesValidationJob'
import UserAnalysisCreationJob from './jobs/userAnalysisCreationJob'

export default class SurveyPublishJob extends Job {
  constructor(params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(),
      new CategoriesValidationJob(),
      new TaxonomiesValidationJob(),
      new SurveyInfoValidationJob(),
      new CyclesDeletedCheckJob(),
      new ProcessingChainsCyclesCheckJob(),
      // Record check must be executed before publishing survey props
      new RecordCheckJob(),
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbGeneratorJob(),
      new RecordsUniquenessValidationJob(),
      new UserAnalysisCreationJob(),
    ])
  }

  async onStart() {
    await super.onStart()

    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.surveyPublish, null, false, this.tx)
  }
}

SurveyPublishJob.type = 'SurveyPublishJob'
