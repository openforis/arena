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

    const uri = CollectIdmlParseUtils.getElementText('uri')(collectSurvey)

    const name = R.pipe(R.split('/'), R.last)(uri)

    const languages = R.pipe(
      CollectIdmlParseUtils.getElementsByName('language'),
      R.map(CollectIdmlParseUtils.getText)
    )(collectSurvey)

    const defaultLanguage = languages[0]

    const collectProjectLabels = CollectIdmlParseUtils.getElementsByName('project')(collectSurvey)
    const label = CollectIdmlParseUtils.toLabels(collectProjectLabels, defaultLanguage)[defaultLanguage]

    const survey = await SurveyManager.createSurvey(this.getUser(), { name, label, lang: defaultLanguage }, false, tx)

    const surveyId = Survey.getId(survey)

    await SurveyManager.updateSurveyProp(this.getUser(), surveyId, Survey.infoKeys.languages, languages, tx)

    this.setContext({ surveyId, defaultLanguage })
  }
}

module.exports = SurveyCreatorJob