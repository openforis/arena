const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const SurveyInfo = require('../../../../common/survey/_internal/surveyInfo')

const Job = require('../../../job/job')

const SurveyManager = require('../../surveyManager')

const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

class SurveyCreatorJob extends Job {

  constructor (params) {
    super('SurveyCreatorJob', params)
  }

  async execute (tx) {
    const surveySource = this.context.surveySource

    const uri = surveySource.uri
    const name = R.pipe(R.split('/'), R.last)(uri)
    const languages = CollectIdmlParseUtils.getList(surveySource.language)
    const lang = languages[0]
    const label = CollectIdmlParseUtils.toLabels(surveySource.project, lang)[lang]

    const survey = await SurveyManager.createSurvey(this.user, { name, label, lang }, false)

    const surveyId = Survey.getId(survey)

    await SurveyManager.updateSurveyProp(surveyId, SurveyInfo.keys.languages, languages, this.user)

    this.setContext({surveyId, defaultLanguage: lang})
  }
}

module.exports = SurveyCreatorJob