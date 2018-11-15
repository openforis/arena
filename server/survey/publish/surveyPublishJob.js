const Job = require('../../job/job')
const {jobTypes} = require('../../job/jobUtils')

const NodeDefsValidationJob = require('./nodeDefsValidationJob')
const CodeListsValidationJob = require('./codeListsValidationJob')
const TaxonomiesValidationJob = require('./taxonomiesValidationJob')
const SurveyInfoValidationJob = require('./surveyInfoValidationJob')
const SurveyPropsPublishJob = require('./surveyPropsPublishJob')

class SurveyPublishJob extends Job {

  constructor (params) {
    const {userId, surveyId} = params

    super(jobTypes.surveyPublish, userId, surveyId, [
      new NodeDefsValidationJob(userId, surveyId),
      new CodeListsValidationJob(userId, surveyId),
      new TaxonomiesValidationJob(userId, surveyId),
      new SurveyInfoValidationJob(userId, surveyId),
      new SurveyPropsPublishJob(userId, surveyId),
    ])
  }
}

module.exports = SurveyPublishJob