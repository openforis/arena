const {Job} = require('../../job/job')

const NodeDefsValidationJob = require('./nodeDefsValidationJob')
const CodeListsValidationJob = require('./codeListsValidationJob')
const TaxonomiesValidationJob = require('./taxonomiesValidationJob')
const SurveyPropsPublishJob = require('./surveyPropsPublishJob')

class SurveyPublishJob extends Job {

  constructor (params) {
    const {userId, surveyId} = params

    super(userId, surveyId, 'survey-publish', [
      new NodeDefsValidationJob(userId, surveyId),
      new CodeListsValidationJob(userId, surveyId),
      new TaxonomiesValidationJob(userId, surveyId),
      new SurveyPropsPublishJob(userId, surveyId),
    ])
  }
}

module.exports = SurveyPublishJob