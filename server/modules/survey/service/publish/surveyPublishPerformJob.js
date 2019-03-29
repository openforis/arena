const Job = require('../../../../job/job')

const SurveyPropsPublishJob = require('./jobs/surveyPropsPublishJob')
const SurveyDependencyGraphsGenerationJob = require('./jobs/surveyDependencyGraphsGenerationJob')

class SurveyPublishPerformJob extends Job {

  constructor (params) {
    super(SurveyPublishPerformJob.type, params, [
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob()
    ])
  }
}

SurveyPublishPerformJob.type = 'SurveyPublishPerformJob'

module.exports = SurveyPublishPerformJob