const Job = require('../../../job/job')

const Survey = require('../../../../common/survey/survey')

const SurveyManager = require('../manager/surveyManager')

class SurveyIndexGeneratorJob extends Job {

  constructor (params) {
    super(SurveyIndexGeneratorJob.type, params)
  }

  async execute (tx) {
    const survey = this.getContextSurvey()
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyIndex = await SurveyManager.fetchIndex(this.getSurveyId(), Survey.isDraft(surveyInfo), tx)

    this.setContext({ [Job.keysContext.surveyIndex]: surveyIndex })
  }

}

SurveyIndexGeneratorJob.type = 'SurveyIndexGeneratorJob'

module.exports = SurveyIndexGeneratorJob