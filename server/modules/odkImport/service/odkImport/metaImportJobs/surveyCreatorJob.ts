import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'

import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as SurveyUniqueNameGenerator from '@server/modules/survey/service/surveyUniqueNameGenerator'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as XForm from '../model/xform'

/**
 * Creates the (temporary, draft) Arena survey shell from the XForm's title and resolved languages -
 * NodeDefs/Categories are added by the jobs that follow. Mirrors collectImport's SurveyCreatorJob.
 */
export default class SurveyCreatorJob extends Job {
  static readonly type = 'SurveyCreatorJob'

  constructor(params?: any) {
    super(SurveyCreatorJob.type, params)
  }

  async execute() {
    const context: any = this.context
    const { xform, languages, defaultLanguage, newSurvey: newSurveyParam } = context

    const formTitle = XForm.getFormTitle(xform)
    // Arena survey names must be identifier-shaped (StringUtils.normalizeName is the same sanitizer
    // the survey-create webapp form applies to user-typed names) - the XForm title is free text
    // ("Verify Odk Import"), not already a valid name the way Collect's URI-derived name is.
    const startingName = StringUtils.normalizeName(newSurveyParam?.name || formTitle || 'odk_form')
    const name = await SurveyUniqueNameGenerator.findUniqueSurveyName({ startingName })

    const label = formTitle ?? name

    const primaryInstanceRoot = XForm.getPrimaryInstanceRoot(xform)
    const odkFormId = XForm.getAttribute('id')(primaryInstanceRoot) ?? name

    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(this.user),
      name,
      label,
      languages,
      [Survey.infoKeys.odkFormId]: odkFormId,
    })

    // insert survey out of transaction to avoid lock and do not update user prefs for the same reason
    const survey = await SurveyManager.insertSurvey({
      user: this.user,
      surveyInfo,
      createRootEntityDef: false,
      system: true,
      updateUserPrefs: false,
      temporary: true,
    })

    const surveyId = Survey.getId(survey)

    this.logDebug(`survey ${surveyId} created`)

    await ActivityLogManager.insert(this.user, surveyId, ActivityLog.type.surveyOdkImport, null, false, this.tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
