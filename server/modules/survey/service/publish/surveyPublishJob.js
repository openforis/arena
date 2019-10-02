const Job = require('../../../../job/job')

const NodeDefsValidationJob = require('./jobs/nodeDefsValidationJob')
const CategoriesValidationJob = require('./jobs/categoriesValidationJob')
const TaxonomiesValidationJob = require('./jobs/taxonomiesValidationJob')
const SurveyInfoValidationJob = require('./jobs/surveyInfoValidationJob')
const NodeDefWithoutCyclesDeleteJob = require('./jobs/nodeDefWithoutCyclesDeleteJob')
const RecordCheckJob = require('../recordCheckJob')
const SurveyPropsPublishJob = require('./jobs/surveyPropsPublishJob')
const SurveyDependencyGraphsGenerationJob = require('../surveyDependencyGraphsGenerationJob')
const SurveyRdbGeneratorJob = require('../../../surveyRdb/service/surveyRdbGeneratorJob')

class SurveyPublishJob extends Job {

  constructor (params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(),
      new CategoriesValidationJob(),
      new TaxonomiesValidationJob(),
      new SurveyInfoValidationJob(),
      new NodeDefWithoutCyclesDeleteJob(),
      // record check must be executed before publishing survey props
      new RecordCheckJob(),
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbGeneratorJob(),
    ])
  }
}

SurveyPublishJob.type = 'SurveyPublishJob'

module.exports = SurveyPublishJob