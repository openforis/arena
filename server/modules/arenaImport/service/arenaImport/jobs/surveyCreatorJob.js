import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'
import * as User from '@core/user/user'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const isTemplate = ({ backup = true, surveyInfoArenaSurvey, surveyInfoTarget = null }) => {
  if (backup) return Survey.isTemplate(surveyInfoArenaSurvey)
  if (surveyInfoTarget) return Survey.isTemplate(surveyInfoTarget)
  return false
}

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute() {
    const { arenaSurvey, backup, surveyInfoTarget } = this.context

    const surveyInfoArenaSurvey = Survey.getSurveyInfo(arenaSurvey)
    // merge survey info props with draft props (Arena survey backup file could have only draft props)
    surveyInfoArenaSurvey.props = { ...surveyInfoArenaSurvey.props, ...surveyInfoArenaSurvey.propsDraft }

    const name = backup
      ? `${Survey.getName(surveyInfoArenaSurvey)}-import-${DateUtils.nowFormatDefault()}`
      : Survey.getName(surveyInfoTarget) || `clone_${Survey.getName(surveyInfoArenaSurvey)}`

    const defaultLanguage = Survey.getDefaultLanguage(surveyInfoArenaSurvey)

    // always import as draft when not backup
    const published = backup ? Survey.isPublished(surveyInfoArenaSurvey) : false
    const draft = !published
    const template = isTemplate({ backup, surveyInfoArenaSurvey, surveyInfoTarget })

    const newSurveyInfo = Survey.newSurvey({
      ...surveyInfoArenaSurvey.props,
      [Survey.infoKeys.ownerUuid]: User.getUuid(this.user),
      [Survey.infoKeys.name]: name,
      [Survey.infoKeys.published]: published,
      [Survey.infoKeys.draft]: draft,
      [Survey.infoKeys.template]: template,
      [Survey.infoKeys.temporary]: true,
    })

    // do not insert survey in transaction to avoid survey table lock: insert it as temporary survey
    const survey = await SurveyManager.importSurvey({
      user: this.user,
      surveyInfo: newSurveyInfo,
      authGroups: Survey.getAuthGroups(surveyInfoArenaSurvey),
      backup,
    })

    const surveyId = Survey.getId(survey)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
