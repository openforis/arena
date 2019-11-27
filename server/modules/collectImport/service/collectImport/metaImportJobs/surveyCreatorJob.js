import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as CollectSurvey from '../model/collectSurvey'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute(tx) {
    const { collectSurvey } = this.context

    const collectUri = CollectSurvey.getChildElementText('uri')(collectSurvey)

    const name = R.pipe(R.split('/'), R.last)(collectUri)

    const languages = R.pipe(
      CollectSurvey.getElementsByName('language'),
      R.map(CollectSurvey.getText),
    )(collectSurvey)

    const defaultLanguage = languages[0]

    const label = R.pipe(
      CollectSurvey.toLabels('project', defaultLanguage),
      R.prop(defaultLanguage),
    )(collectSurvey)

    const survey = await SurveyManager.createSurvey(
      this.user,
      {
        name,
        label,
        languages,
        collectUri,
      },
      false,
      true,
      tx,
    )

    const surveyId = Survey.getId(survey)

    await ActivityLogManager.insert(
      this.user,
      surveyId,
      ActivityLog.type.surveyCollectImport,
      null,
      false,
      this.tx,
    )

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
