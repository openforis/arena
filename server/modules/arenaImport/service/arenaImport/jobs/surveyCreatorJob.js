import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyUniqueNameGenerator from '@server/modules/survey/service/surveyUniqueNameGenerator'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

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
    const { arenaSurvey, backup, surveyInfoTarget, arenaSurveyFileZip } = this.context

    const surveyInfoArenaSurvey = Survey.getSurveyInfo(arenaSurvey)

    // merge survey info props with draft props (Arena survey backup file could have only draft props)
    surveyInfoArenaSurvey.props = { ...surveyInfoArenaSurvey.props, ...surveyInfoArenaSurvey.propsDraft }

    // skip collect report
    const {
      collectUri,
      collectNodeDefsInfoByPath,
      // eslint-disable-next-line no-unused-vars
      collectReport, // always ignore Collect import report when survey is imported or cloned
      ...propsToImport
    } = surveyInfoArenaSurvey.props

    const surveySourceName = Survey.getName(surveyInfoArenaSurvey)
    const surveyTargetName = Survey.getName(surveyInfoTarget)

    const startingName = surveyTargetName || (backup ? surveySourceName : `clone_${surveySourceName}`)

    const name = await SurveyUniqueNameGenerator.findUniqueSurveyName({ startingName })

    const defaultLanguage = Survey.getDefaultLanguage(surveyInfoArenaSurvey)

    // import survey as published only if it has records and if the survey being imported is published already
    const published =
      (await ArenaSurveyFileZip.hasRecords(arenaSurveyFileZip)) && Survey.isPublished(surveyInfoArenaSurvey)
    const draft = !published
    const template = isTemplate({ backup, surveyInfoArenaSurvey, surveyInfoTarget })
    const collectProps = collectUri && !template ? { collectUri, collectNodeDefsInfoByPath } : {}

    const newSurveyInfo = Survey.newSurvey({
      ...propsToImport,
      ...(backup ? collectProps : {}), // ignore Collect survey properties when cloning a survey
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
