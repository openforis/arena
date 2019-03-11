const Job = require('../../../../job/job')

const NodeDefsValidationJob = require('./jobs/nodeDefsValidationJob')
const CategoriesValidationJob = require('./jobs/categoriesValidationJob')
const TaxonomiesValidationJob = require('./jobs/taxonomiesValidationJob')
const SurveyInfoValidationJob = require('./jobs/surveyInfoValidationJob')
const RecordCheckJob = require('./jobs/recordCheckJob')
const SurveyPropsPublishJob = require('./jobs/surveyPropsPublishJob')
const SurveyDependencyGraphsGenerationJob = require('./jobs/surveyDependencyGraphsGenerationJob')
const SurveyRdbGeneratorJob = require('./jobs/surveyRdbGeneratorJob')

class SurveyPublishJob extends Job {

  constructor (params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(params),
      new CategoriesValidationJob(params),
      new TaxonomiesValidationJob(params),
      new SurveyInfoValidationJob(params),
      // record check must be executed before publishing survey props
      new RecordCheckJob(params),
      new SurveyPropsPublishJob(params),
      new SurveyDependencyGraphsGenerationJob(params),
      new SurveyRdbGeneratorJob(params),
    ])
  }
}

SurveyPublishJob.type = 'SurveyPublishJob'

module.exports = SurveyPublishJob