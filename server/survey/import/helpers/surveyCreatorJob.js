const R = require('ramda')

const Survey = require('../../../../common/survey/survey')

const Job = require('../../../job/job')

const SurveyManager = require('../../surveyManager')

class SurveyCreatorJob extends Job {

  constructor (params) {
    super('SurveyCreatorJob', params)
  }

  async execute (tx) {
    const surveySource = this.context.surveySource

    const uri = surveySource.uri._text
    const name = R.pipe(R.split('/'), R.last)(uri)
    const language = surveySource.language._text
    const label = surveySource.project._text

    const survey = await SurveyManager.createSurvey(this.user, { name, label, language }, false)

    this.context.surveyId = Survey.getId(survey)
  }
}

module.exports = SurveyCreatorJob