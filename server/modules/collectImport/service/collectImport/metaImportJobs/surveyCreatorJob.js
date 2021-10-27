import * as R from 'ramda'

import { SRSs } from '@openforis/arena-core'

import * as Survey from '../../../../../../core/survey/survey'
import * as Srs from '../../../../../../core/geo/srs'
import * as User from '../../../../../../core/user/user'

import * as ActivityLog from '../../../../../../common/activityLog/activityLog'

import Job from '../../../../../job/job'

import * as ActivityLogManager from '../../../../activityLog/manager/activityLogManager'

import * as SurveyManager from '../../../../survey/manager/surveyManager'

import * as CollectSurvey from '../model/collectSurvey'
import * as SurveyUniqueNameGenerator from '../../../../survey/service/surveyUniqueNameGenerator'

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

    await SRSs.init()

    const srsElements = CollectSurvey.getElementsByPath(['spatialReferenceSystems', 'spatialReferenceSystem'])(
      collectSurvey
    )
    return srsElements.reduce((srsAcc, srsEl) => {
      const srsId = CollectSurvey.getAttribute('srid')(srsEl)
      let srs = SRSs.getSRSByCode(srsId)
      if (!srs && srsId.startsWith(SRS_ID_PREFIX)) {
        srs = SRSs.getSRSByCode(srsId.substring(SRS_ID_PREFIX.length))
      }
      if (!srs) return srsAcc
      return [...srsAcc, R.omit([Srs.keys.wkt], srs)]
    }, [])
  }
}
