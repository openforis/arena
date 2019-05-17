const Job = require('../../../job/job')

const SurveyManager = require('../manager/surveyManager')

class SurveyIndexGeneratorJob extends Job {

  constructor (params) {
    super(SurveyIndexGeneratorJob.type, params)
  }

  async execute (tx) {
    const surveyIndex = await SurveyManager.fetchIndex(this.getSurveyId(), tx)

    this.setContext({ [Job.keysContext.surveyIndex]: surveyIndex })
  }

}

SurveyIndexGeneratorJob.type = 'SurveyIndexGeneratorJob'

module.exports = SurveyIndexGeneratorJob