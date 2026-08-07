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
