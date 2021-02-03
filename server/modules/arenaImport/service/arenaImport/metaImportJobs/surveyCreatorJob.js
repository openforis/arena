import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute() {
    const { arenaSurvey, arenaSurveyFileZip } = this.context

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

    const survey = await SurveyManager.importSurvey(
      { user: this.user, surveyInfo: newSurveyInfo, authGroups: Survey.getAuthGroups(surveyInfo) },
      this.tx
    )

    const surveyId = Survey.getId(survey)

    const activities = await ArenaSurveyFileZip.getActivities(arenaSurveyFileZip)

    await ActivityLogManager.insertManyBatch(this.user, surveyId, activities, this.tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
