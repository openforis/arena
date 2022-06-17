import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'
import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'

import CategoriesValidationJob from './jobs/categoriesValidationJob'
import CyclesDeletedCheckJob from './jobs/cyclesDeletedCheckJob'
import NodeDefsValidationJob from './jobs/nodeDefsValidationJob'
import ChainsCyclesCheckJob from './jobs/chainsCyclesCheckJob'
import ChainsSamplingNodeDefsCheckJob from './jobs/chainsSamplingNodeDefsCheckJob'
import ChainsValidationJob from './jobs/chainsValidationJob'
import SurveyInfoValidationJob from './jobs/surveyInfoValidationJob'
import SurveyPropsPublishJob from './jobs/surveyPropsPublishJob'
import TaxonomiesValidationJob from './jobs/taxonomiesValidationJob'

export default class SurveyPublishJob extends Job {
  constructor(params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(),
      new CategoriesValidationJob(),
      new TaxonomiesValidationJob(),
      new SurveyInfoValidationJob(),
      new CyclesDeletedCheckJob(),
      new ChainsCyclesCheckJob(),
      new ChainsSamplingNodeDefsCheckJob(),
      new ChainsValidationJob(),
      // Record check must be executed before publishing survey props
      new RecordCheckJob(),
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbCreationJob(),
    ])
  }

  async onStart() {
    await super.onStart()

    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.surveyPublish, null, false, this.tx)
  }
}

SurveyPublishJob.type = 'SurveyPublishJob'
