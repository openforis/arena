import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import NodeDefsValidationJob from './jobs/nodeDefsValidationJob'
import CategoriesValidationJob from './jobs/categoriesValidationJob'
import TaxonomiesValidationJob from './jobs/taxonomiesValidationJob'
import SurveyInfoValidationJob from './jobs/surveyInfoValidationJob'
import RecordCheckJob from '../recordCheckJob'
import SurveyPropsPublishJob from './jobs/surveyPropsPublishJob'
import CyclesDeletedCheckJob from './jobs/cyclesDeletedCheckJob'
import SurveyDependencyGraphsGenerationJob from '../surveyDependencyGraphsGenerationJob'
import SurveyRdbGeneratorJob from '../../../surveyRdb/service/surveyRdbGeneratorJob'
import RecordsUniquenessValidationJob from '../../../record/service/recordsUniquenessValidationJob'

export default class SurveyPublishJob extends Job {

  constructor (params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(),
      new CategoriesValidationJob(),
      new TaxonomiesValidationJob(),
      new SurveyInfoValidationJob(),
      new CyclesDeletedCheckJob(),
      // record check must be executed before publishing survey props
      new RecordCheckJob(),
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbGeneratorJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }

  async onStart () {
    await super.onStart()

    await ActivityLogManager.insert(this.user, this.surveyId, ActivityLog.type.surveyPublish, null, false, this.tx)
  }
}

SurveyPublishJob.type = 'SurveyPublishJob'
