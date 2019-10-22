const R = require('ramda')

const Survey = require('@core/survey/survey')

const Job = require('@server/job/job')

const SurveyManager = require('../../../../survey/manager/surveyManager')

const CollectSurvey = require('../model/collectSurvey')

class SurveyCreatorJob extends Job {

  constructor (params) {
    super('SurveyCreatorJob', params)
  }

  async execute (tx) {
    const { collectSurvey } = this.context

    const collectUri = CollectSurvey.getChildElementText('uri')(collectSurvey)

    const name = R.pipe(R.split('/'), R.last)(collectUri)

    const languages = R.pipe(
      CollectSurvey.getElementsByName('language'),
      R.map(CollectSurvey.getText)
    )(collectSurvey)

    const defaultLanguage = languages[0]

    const collectProjectLabels = CollectSurvey.getElementsByName('project')(collectSurvey)
    const label = CollectSurvey.toLabels(collectProjectLabels, defaultLanguage)[defaultLanguage]

    const survey = await SurveyManager.createSurvey(this.user, {
      name,
      label,
      lang: defaultLanguage,
      collectUri
    }, false, tx)

    const surveyId = Survey.getId(survey)

    await SurveyManager.updateSurveyProp(this.user, surveyId, Survey.infoKeys.languages, languages, tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}

module.exports = SurveyCreatorJob