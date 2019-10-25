const R = require('ramda')

const Survey = require('@core/survey/survey')

const Job = require('@server/job/job')

const ActivityLog = require('@server/modules/activityLog/activityLogger')

const SurveyManager = require('@server/modules/survey/manager/surveyManager')

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

    const label = R.pipe(
      CollectSurvey.toLabels('project', defaultLanguage),
      R.prop(defaultLanguage)
    )(collectSurvey)

    const survey = await SurveyManager.createSurvey(
      this.user,
      {
        name,
        label,
        languages,
        collectUri
      },
      false,
      true,
      tx
    )

    const surveyId = Survey.getId(survey)

    await ActivityLog.log(this.user, surveyId, ActivityLog.type.surveyCollectImport, null, false, this.tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}

module.exports = SurveyCreatorJob