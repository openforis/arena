import { uuidv4 } from '../../../../core/uuid'
import * as Survey from '../../../../core/survey/survey'
import * as User from '../../../../core/user/user'

import * as SurveyManager from '../../../../server/modules/survey/manager/surveyManager'
import { setContextSurvey, getContextUser } from '../../config/context'

export const createSurveyTest = async () => {
  const user = getContextUser()

  const surveyInfoTest = Survey.newSurvey({
    ownerUuid: User.getUuid(user),
    name: `do_not_use__test_survey_${uuidv4()}`,
    label: 'DO NOT USE! Test Survey',
    languages: ['en'],
  })
  const survey = await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTest })
  setContextSurvey(survey)

  const surveyInfo = Survey.getSurveyInfo(survey)

  expect(Survey.getName(surveyInfo)).toEqual(Survey.getName(surveyInfoTest))
  const expectedDefaultLanguage = Survey.getDefaultLanguage(surveyInfoTest)
  expect(Survey.getDefaultLanguage(surveyInfo)).toEqual(expectedDefaultLanguage)
  expect(Survey.getDefaultLabel(surveyInfo)).toEqual(Survey.getDefaultLabel(surveyInfoTest))
}

// Regression test: SurveyManager.insertSurvey used to hold a db transaction open while
// DBMigrator.migrateSurveySchema acquired another connection from the same pool; concurrent survey
// creations could then exhaust the pool and hang the whole server (no connectionTimeoutMillis is set).
export const createSurveysConcurrentlyTest = async () => {
  const user = getContextUser()

  const newSurveyInfo = () =>
    Survey.newSurvey({
      ownerUuid: User.getUuid(user),
      name: `do_not_use__test_survey_concurrent_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey (concurrent)',
      languages: ['en'],
    })

  const [surveyA, surveyB] = await Promise.all([
    SurveyManager.insertSurvey({ user, surveyInfo: newSurveyInfo() }),
    SurveyManager.insertSurvey({ user, surveyInfo: newSurveyInfo() }),
  ])

  expect(Survey.getId(surveyA)).not.toEqual(Survey.getId(surveyB))
}

// Regression test: SurveyManager.importSurvey (used when restoring an Arena backup file, and when
// cloning a survey) had the same transaction-held-open-during-migration bug as insertSurvey above.
export const importSurveysConcurrentlyTest = async () => {
  const user = getContextUser()

  const newSurveyInfo = () =>
    Survey.newSurvey({
      ownerUuid: User.getUuid(user),
      name: `do_not_use__test_survey_import_concurrent_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey (import concurrent)',
      languages: ['en'],
    })

  const [surveyA, surveyB] = await Promise.all([
    SurveyManager.importSurvey({ user, surveyInfo: newSurveyInfo(), backup: true }),
    SurveyManager.importSurvey({ user, surveyInfo: newSurveyInfo(), backup: true }),
  ])

  expect(Survey.getId(surveyA)).not.toEqual(Survey.getId(surveyB))
}

export const fetchUserSurveysInfoDbSizeTest = async () => {
  const user = getContextUser()

  const surveyName = `do_not_use__test_survey_dbsize_${uuidv4()}`
  const surveyInfoTest = Survey.newSurvey({
    ownerUuid: User.getUuid(user),
    name: surveyName,
    label: 'DO NOT USE! Test Survey (db size)',
    languages: ['en'],
  })
  const survey = await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTest })
  const surveyId = Survey.getId(survey)

  try {
    const [itemWithDbSize] = await SurveyManager.fetchUserSurveysInfo({
      user,
      draft: true,
      search: surveyName,
      onlyOwn: true,
      includeCounts: true,
      includeDbSize: true,
    })

    expect(itemWithDbSize).toBeDefined()
    expect(typeof itemWithDbSize.dbSize).toBe('number')
    expect(itemWithDbSize.dbSize).toBeGreaterThan(0)
    // RDB/data schema isn't created until the survey is published, so it should resolve to 0, not throw.
    expect(itemWithDbSize.dbDataSize).toBe(0)

    const [itemWithoutDbSize] = await SurveyManager.fetchUserSurveysInfo({
      user,
      draft: true,
      search: surveyName,
      onlyOwn: true,
      includeCounts: true,
    })

    expect(itemWithoutDbSize).toBeDefined()
    expect(itemWithoutDbSize.dbSize).toBeUndefined()
    expect(itemWithoutDbSize.dbDataSize).toBeUndefined()
  } finally {
    await SurveyManager.deleteSurvey(surveyId)
  }
}
