const Job = require('../../job/job')

const NodeDefsValidationJob = require('./nodeDefsValidationJob')
const CategoriesValidationJob = require('./categoriesValidationJob')
const TaxonomiesValidationJob = require('./taxonomiesValidationJob')
const SurveyInfoValidationJob = require('./surveyInfoValidationJob')
const SurveyPropsPublishJob = require('./surveyPropsPublishJob')
const SurveyRdbGeneratorJob = require('./surveyRdbGeneratorJob')

class SurveyPublishJob extends Job {

  constructor (params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(params),
      new CategoriesValidationJob(params),
      new TaxonomiesValidationJob(params),
      new SurveyInfoValidationJob(params),
      new SurveyPropsPublishJob(params),
      new SurveyRdbGeneratorJob(params),
    ])
  }
}

SurveyPublishJob.type = 'SurveyPublishJob'

module.exports = SurveyPublishJob