import * as R from 'ramda'

import * as Survey from '../../../../../../core/survey/survey'
import * as Srs from '../../../../../../core/geo/srs'
import * as User from '../../../../../../core/user/user'

import * as ActivityLog from '../../../../../../common/activityLog/activityLog'

import Job from '../../../../../job/job'

import * as ActivityLogManager from '../../../../activityLog/manager/activityLogManager'

import * as SurveyUniqueNameGenerator from '../../../../survey/service/surveyUniqueNameGenerator'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as SrsManager from '../../../../geo/manager/srsManager'

import * as CollectSurvey from '../model/collectSurvey'

const SRS_ID_PREFIX = 'EPSG:'

export default class SurveyCreatorJob extends Job {
  constructor(params) {
    super('SurveyCreatorJob', params)
  }

  async execute() {
    const { collectSurvey, newSurvey: newSurveyParam } = this.context

    const collectUri = CollectSurvey.getUri(collectSurvey)

    const startingName = newSurveyParam.name || R.pipe(R.split('/'), R.last)(collectUri)
    const name = await SurveyUniqueNameGenerator.findUniqueSurveyName({ startingName })

    const languages = R.pipe(CollectSurvey.getElementsByName('language'), R.map(CollectSurvey.getText))(collectSurvey)

    const defaultLanguage = languages[0]

    const labels = CollectSurvey.toLabels('project', defaultLanguage)(collectSurvey)
    const label = R.prop(defaultLanguage, labels)

    const descriptions = CollectSurvey.toLabels('description', defaultLanguage)(collectSurvey)

    const srss = await this.extractSrss()

    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(this.user),
      name,
      label,
      languages,
      [Survey.infoKeys.collectUri]: collectUri,
      [Survey.infoKeys.descriptions]: descriptions,
      [Survey.infoKeys.labels]: labels,
      [Survey.infoKeys.srs]: srss,
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

    await ActivityLogManager.insert(this.user, surveyId, ActivityLog.type.surveyCollectImport, null, false, this.tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }

  async extractSrss() {
    const { collectSurvey } = this.context

    const srsElements = CollectSurvey.getElementsByPath(['spatialReferenceSystems', 'spatialReferenceSystem'])(
      collectSurvey
    )
    const srsCodes = srsElements.map((srsEl) => {
      const srsId = CollectSurvey.getAttribute('srid')(srsEl)
      return srsId.startsWith(SRS_ID_PREFIX) ? srsId.substring(SRS_ID_PREFIX.length) : srsId
    })
    const srss = await SrsManager.fetchSrssByCodes({ srsCodes }, this.tx)
    return srss.map(R.omit([Srs.keys.wkt]))
  }
}
