import * as R from 'ramda'

import * as Survey from '../../../../../../core/survey/survey'
import * as User from '../../../../../../core/user/user'

import * as ActivityLog from '../../../../../../common/activityLog/activityLog'

import Job from '../../../../../job/job'

import * as ActivityLogManager from '../../../../activityLog/manager/activityLogManager'

import * as SurveyManager from '../../../../survey/manager/surveyManager'

import * as CollectSurvey from '../model/collectSurvey'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute() {
    const { collectSurvey } = this.context

    const collectUri = CollectSurvey.getChildElementText('uri')(collectSurvey)

    const name = R.pipe(R.split('/'), R.last)(collectUri)

    const languages = R.pipe(CollectSurvey.getElementsByName('language'), R.map(CollectSurvey.getText))(collectSurvey)

    const defaultLanguage = languages[0]

    const labels = CollectSurvey.toLabels('project', defaultLanguage)(collectSurvey)
    const label = R.prop(defaultLanguage, labels)

    const descriptions = CollectSurvey.toLabels('description', defaultLanguage)(collectSurvey)

    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(this.user),
      name,
      label,
      languages,
      [Survey.infoKeys.collectUri]: collectUri,
      [Survey.infoKeys.descriptions]: descriptions,
      [Survey.infoKeys.labels]: labels,
    })

    const survey = await SurveyManager.insertSurvey(
      { user: this.user, surveyInfo, createRootEntityDef: false, system: true },
      this.tx
    )

    const surveyId = Survey.getId(survey)

    await ActivityLogManager.insert(this.user, surveyId, ActivityLog.type.surveyCollectImport, null, false, this.tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
