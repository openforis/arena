const R = require('ramda')

const Survey = require('../../../../../../common/survey/survey')

const Job = require('../../../../../job/job')

const SurveyManager = require('../../../persistence/surveyManager')

const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

class SurveyCreatorJob extends Job {

  constructor (params) {
    super('SurveyCreatorJob', params)
  }

  async execute (tx) {
    const { collectSurvey } = this.context

    const uri = collectSurvey.uri
    const name = R.pipe(R.split('/'), R.last)(uri)
    const languages = CollectIdmlParseUtils.toList(collectSurvey.language)
    const defaultLanguage = languages[0]
    const label = CollectIdmlParseUtils.toLabels(collectSurvey.project, defaultLanguage)[defaultLanguage]

    const survey = await SurveyManager.createSurvey(this.getUser(), { name, label, lang: defaultLanguage }, false, tx)

    const surveyId = Survey.getId(survey)

    await SurveyManager.updateSurveyProp(surveyId, Survey.infoKeys.languages, languages, this.getUser(), tx)

    this.setContext({ surveyId, defaultLanguage })
  }
}

module.exports = SurveyCreatorJob