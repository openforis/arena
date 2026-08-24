import { db } from '@server/db/db'
import * as JobRepository from '@server/job/jobRepository'
import { getContextUser } from '../config/context'

describe('jobRepository.getAll', () => {
  let userUuid
  let surveyId

  beforeAll(async () => {
    const user = getContextUser()
    userUuid = user.uuid

    const survey = await db.one(`INSERT INTO survey (owner_uuid, props) VALUES ($1, $2) RETURNING id`, [
      userUuid,
      JSON.stringify({ name: 'job_monitor_test_survey' }),
    ])
    surveyId = survey.id
  })

  afterAll(async () => {
    await db.none('DELETE FROM job WHERE survey_id = $1 OR user_uuid = $2', [surveyId, userUuid])
    await db.none('DELETE FROM survey WHERE id = $1', [surveyId])
  })

  test('joins user and survey info, and handles a global (null survey_id) job', async () => {
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status) VALUES ($1, $2, $3, 'SurveyJob', 'running')`,
      ['11111111-1111-1111-1111-111111111111', userUuid, surveyId]
    )
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status) VALUES ($1, $2, NULL, 'GlobalJob', 'pending')`,
      ['22222222-2222-2222-2222-222222222222', userUuid]
    )

    const rows = await JobRepository.getAll({ limit: 10 })
    const surveyJobRow = rows.find((row) => row.uuid === '11111111-1111-1111-1111-111111111111')
    const globalJobRow = rows.find((row) => row.uuid === '22222222-2222-2222-2222-222222222222')

    expect(surveyJobRow).toMatchObject({
      type: 'SurveyJob',
      status: 'running',
      userUuid,
      userEmail: 'admin@openforis.org',
      surveyId,
      surveyName: 'job_monitor_test_survey',
    })
    expect(globalJobRow).toMatchObject({
      type: 'GlobalJob',
      status: 'pending',
      surveyId: null,
      surveyName: null,
    })
  })

  test('orders by date_created descending and respects limit', async () => {
    const rows = await JobRepository.getAll({ limit: 1 })
    expect(rows).toHaveLength(1)
  })
})
