const ActivityLog = require('@common/activityLog/activityLog')

const Job = require('@server/job/job')
const ActivityLogManager = require('@server/modules/activityLog/manager/activityLogManager')

const NodeDefsValidationJob = require('./jobs/nodeDefsValidationJob')
const CategoriesValidationJob = require('./jobs/categoriesValidationJob')
const TaxonomiesValidationJob = require('./jobs/taxonomiesValidationJob')
const SurveyInfoValidationJob = require('./jobs/surveyInfoValidationJob')
const RecordCheckJob = require('../recordCheckJob')
const SurveyPropsPublishJob = require('./jobs/surveyPropsPublishJob')
const CyclesDeletedCheckJob = require('./jobs/cyclesDeletedCheckJob')
const SurveyDependencyGraphsGenerationJob = require('../surveyDependencyGraphsGenerationJob')
const SurveyRdbGeneratorJob = require('../../../surveyRdb/service/surveyRdbGeneratorJob')
const RecordsUniquenessValidationJob = require('../../../record/service/recordsUniquenessValidationJob')

class SurveyPublishJob extends Job {

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

module.exports = SurveyPublishJob