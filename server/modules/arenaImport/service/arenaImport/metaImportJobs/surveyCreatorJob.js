import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'
import * as User from '@core/user/user'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute() {
    const { arenaSurvey, cloning, surveyInfoTarget } = this.context

    const surveyInfoArenaSurvey = Survey.getSurveyInfo(arenaSurvey)

    const name = cloning
      ? Survey.getName(surveyInfoTarget) || `clone_${Survey.getName(surveyInfoArenaSurvey)}`
      : `${Survey.getName(surveyInfoArenaSurvey)}-import-${DateUtils.nowFormatDefault()}`

    const languages = Survey.getLanguages(surveyInfoArenaSurvey)
    const defaultLanguage = Survey.getDefaultLanguage(surveyInfoArenaSurvey)

    const labels = surveyInfoTarget ? Survey.getLabels(surveyInfoTarget) : Survey.getLabels(surveyInfoArenaSurvey)
    const descriptions = Survey.getDescriptions(surveyInfoTarget)

    // always import as draft when cloning
    const published = cloning ? false : Survey.isPublished(surveyInfoArenaSurvey)
    const draft = cloning ? true : Survey.isDraft(surveyInfoArenaSurvey)

    const template = cloning ? Survey.isTemplate(surveyInfoTarget) : Survey.isTemplate(surveyInfoArenaSurvey)

    const newSurveyInfo = Survey.newSurvey({
      [Survey.infoKeys.ownerUuid]: User.getUuid(this.user),
      [Survey.infoKeys.name]: name,
      [Survey.infoKeys.languages]: languages,
      [Survey.infoKeys.descriptions]: descriptions,
      [Survey.infoKeys.labels]: labels,
      [Survey.infoKeys.published]: published,
      [Survey.infoKeys.draft]: draft,
      [Survey.infoKeys.template]: template,
    })

    const survey = await SurveyManager.importSurvey(
      { user: this.user, surveyInfo: newSurveyInfo, authGroups: Survey.getAuthGroups(surveyInfoArenaSurvey) },
      this.tx
    )

    const surveyId = Survey.getId(survey)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
