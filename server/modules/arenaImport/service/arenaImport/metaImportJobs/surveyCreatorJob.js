import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

// import * as ActivityLogManager from '../../../../activityLog/manager/activityLogManager'
// import * as ActivityLog from '../../../../../../common/activityLog/activityLog'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute() {
    const { arenaSurvey } = this.context

    const surveyInfo = Survey.getSurveyInfo(arenaSurvey)
    const surveyName = Survey.getName(surveyInfo)
    const name = `${surveyName}-import-${DateUtils.nowFormatDefault()}`

    const languages = Survey.getLanguages(surveyInfo)
    const defaultLanguage = Survey.getDefaultLanguage(surveyInfo)

    const labels = Survey.getLabels(surveyInfo)
    const label = Survey.getLabel(surveyInfo, defaultLanguage)

    const descriptions = Survey.getDescriptions(surveyInfo)
    const ownerUuid = Survey.getOwnerUuid(surveyInfo)

    const newSurveyInfo = Survey.newSurvey({
      [Survey.infoKeys.ownerUuid]: ownerUuid,
      [Survey.infoKeys.name]: name,
      [Survey.infoKeys.languages]: languages,
      [Survey.infoKeys.descriptions]: descriptions,
      [Survey.infoKeys.labels]: labels,
      [Survey.infoKeys.label]: label,
    })

    const survey = await SurveyManager.insertSurvey(
      { user: this.user, surveyInfo: newSurveyInfo, createRootEntityDef: false, system: true },
      this.tx
    )

    const surveyId = Survey.getId(survey)

    // await ActivityLogManager.insert(this.user, surveyId, ActivityLog.type.surveyCollectImport, null, false, this.tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
