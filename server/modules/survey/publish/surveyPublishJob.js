const Job = require('../../../job/job')

const NodeDefsValidationJob = require('./nodeDefsValidationJob')
const CategoriesValidationJob = require('./categoriesValidationJob')
const TaxonomiesValidationJob = require('./taxonomiesValidationJob')
const SurveyInfoValidationJob = require('./surveyInfoValidationJob')
const RecordCheckJob = require('./recordCheckJob')
const SurveyPropsPublishJob = require('./surveyPropsPublishJob')
const SurveyDependencyGraphsGenerationJob = require('./surveyDependencyGraphsGenerationJob')
const SurveyRdbGeneratorJob = require('./surveyRdbGeneratorJob')

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