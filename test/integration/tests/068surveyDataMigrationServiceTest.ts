import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { SurveyDataMigrationServiceArena } from '@server/modules/survey/service/dataMigration/surveyDataMigrationService'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

// used by arena-server (login with includeSurvey) to keep the current survey pref while the data migration is pending
describe('Survey data migration service', () => {
  let surveyId: number = null

  beforeAll(async () => {
    const survey = await SB.survey(
      getContextUser(),
      SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()
    surveyId = Survey.getId(survey)
  })

  afterAll(async () => {
    if (surveyId) {
      await SurveyManager.deleteSurvey(surveyId)
    }
  })

  it('a migrated survey is not pending', async () => {
    expect(await SurveyDataMigrationServiceArena.isPending({ surveyId })).toBe(false)
  })

  it('a survey with an old app version is pending', async () => {
    await db.none(`UPDATE survey SET app_version = '0.0.1' WHERE id = $1`, [surveyId])
    expect(await SurveyDataMigrationServiceArena.isPending({ surveyId })).toBe(true)
  })

  it('a survey that does not exist is not pending', async () => {
    expect(await SurveyDataMigrationServiceArena.isPending({ surveyId: -1 })).toBe(false)
  })
})
